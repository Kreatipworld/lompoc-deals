"use server"

import { and, eq, sql, type SQL } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { couponClaims, deals } from "@/db/schema"
import { generateCouponCode } from "@/lib/coupon-code"
import { evaluateClaim } from "@/lib/coupon-limits"

export type ClaimResult =
  | { ok: true; code: string; alreadyHad: boolean }
  | {
      ok: false
      reason: "auth" | "not_found" | "expired" | "paused" | "sold_out" | "daily_limit" | "error"
    }

/**
 * Drizzle wraps every driver error in DrizzleQueryError, whose `.message` is a
 * hardcoded "Failed query: ..." string — it never contains the Postgres
 * constraint name. The real NeonDbError (with a structured `.constraint`
 * field) lives on `.cause`, possibly a few levels deep. Walk the chain.
 */
function violatedConstraint(e: unknown): string | null {
  let cur: unknown = e
  for (let i = 0; i < 5 && cur; i++) {
    const c = cur as { constraint?: string; code?: string; cause?: unknown }
    if (typeof c.constraint === "string" && c.constraint) return c.constraint
    cur = c.cause
  }
  return null
}

/** Current claim counts for a deal, used both for the cheap pre-check and to
 * explain a cap that was hit in the race window around the atomic insert. */
async function fetchCounts(dealId: number): Promise<{ total: number; today: number }> {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      today: sql<number>`count(*) filter (
        where (${couponClaims.claimedAt} at time zone 'America/Los_Angeles')::date
            = (now() at time zone 'America/Los_Angeles')::date
      )::int`,
    })
    .from(couponClaims)
    .where(eq(couponClaims.dealId, dealId))
  return { total: counts?.total ?? 0, today: counts?.today ?? 0 }
}

/**
 * Issue this customer their own single-use code for a coupon.
 *
 * Idempotent by design: a customer who already claimed gets the SAME code back
 * rather than an error, so re-opening the page is never a dead end. The unique
 * (deal_id, user_id) index makes that safe even if two taps race.
 */
export async function claimCoupon(dealId: number): Promise<ClaimResult> {
  const session = await auth()
  const userId = session?.user?.id ? Number(session.user.id) : null
  if (!userId || !Number.isFinite(userId)) return { ok: false, reason: "auth" }

  const deal = await db.query.deals.findFirst({ where: eq(deals.id, dealId) })
  if (!deal) return { ok: false, reason: "not_found" }

  // Already claimed? Hand back the existing code.
  const existing = await db.query.couponClaims.findFirst({
    where: and(eq(couponClaims.dealId, dealId), eq(couponClaims.userId, userId)),
  })
  if (existing) return { ok: true, code: existing.code, alreadyHad: true }

  // Caps are counted at claim time. Day boundary is Lompoc's, not UTC. This
  // pre-check is a cheap way to surface the *specific* block reason in the
  // common (uncontended) case; the insert below is what actually enforces it.
  const counts = await fetchCounts(dealId)
  const block = evaluateClaim({
    paused: deal.paused,
    expiresAt: deal.expiresAt,
    maxRedemptions: deal.maxRedemptions,
    maxPerDay: deal.maxPerDay,
    totalClaims: counts.total,
    claimsToday: counts.today,
    now: new Date(),
  })
  if (block) return { ok: false, reason: block }

  // neon-http has no interactive transactions, and a bare COUNT(*) predicate
  // does not serialize concurrent statements under READ COMMITTED: two claims
  // arriving milliseconds apart each take their own MVCC snapshot, both read
  // the same pre-insert count, and both pass. Locking the parent `deals` row
  // with FOR UPDATE inside the same statement (via a CTE) makes concurrent
  // claims for the same deal queue behind each other, so the second
  // statement's count subquery sees the first one's committed row.
  const capConditions: SQL[] = []
  if (deal.maxRedemptions !== null) {
    capConditions.push(
      sql`(SELECT count(*) FROM ${couponClaims} WHERE ${couponClaims.dealId} = ${dealId}) < ${deal.maxRedemptions}`
    )
  }
  if (deal.maxPerDay !== null) {
    capConditions.push(
      sql`(SELECT count(*) FROM ${couponClaims}
           WHERE ${couponClaims.dealId} = ${dealId}
             AND (${couponClaims.claimedAt} AT TIME ZONE 'America/Los_Angeles')::date
               = (now() AT TIME ZONE 'America/Los_Angeles')::date) < ${deal.maxPerDay}`
    )
  }
  const capWhere = capConditions.length > 0 ? sql`AND ${sql.join(capConditions, sql` AND `)}` : sql``

  // Retry on the astronomically-unlikely code collision; the unique index is the
  // real guarantee, this loop just turns a collision into a retry instead of a 500.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCouponCode()
    try {
      const result = await db.execute(sql`
        WITH locked AS (SELECT id FROM ${deals} WHERE ${deals.id} = ${dealId} FOR UPDATE)
        INSERT INTO coupon_claims (deal_id, user_id, code)
        SELECT ${dealId}, ${userId}, ${code} FROM locked
        WHERE true
        ${capWhere}
        RETURNING code
      `)
      const rows =
        (result as unknown as { rows?: Array<{ code: string }> }).rows ??
        (result as unknown as Array<{ code: string }>)
      if (rows?.[0]) return { ok: true, code: rows[0].code, alreadyHad: false }

      // Zero rows: a cap was hit in the race window between the pre-check
      // and this insert. Re-read counts and explain the block precisely.
      const raceCounts = await fetchCounts(dealId)
      const raceBlock = evaluateClaim({
        paused: deal.paused,
        expiresAt: deal.expiresAt,
        maxRedemptions: deal.maxRedemptions,
        maxPerDay: deal.maxPerDay,
        totalClaims: raceCounts.total,
        claimsToday: raceCounts.today,
        now: new Date(),
      })
      return { ok: false, reason: raceBlock ?? "sold_out" }
    } catch (e) {
      const constraint = violatedConstraint(e)
      // Lost a race on (deal_id, user_id) — the other insert won, return its code.
      if (constraint === "coupon_claims_deal_user_unique") {
        const raced = await db.query.couponClaims.findFirst({
          where: and(eq(couponClaims.dealId, dealId), eq(couponClaims.userId, userId)),
        })
        if (raced) return { ok: true, code: raced.code, alreadyHad: true }
      }
      if (constraint !== "coupon_claims_code_unique") {
        console.error("claimCoupon: insert failed", { dealId, constraint, cause: e })
        return { ok: false, reason: "error" }
      }
      // else: code collision, loop and generate another
    }
  }
  console.error("claimCoupon: exhausted retries generating a unique code", { dealId })
  return { ok: false, reason: "error" }
}
