"use server"

import { and, eq, sql } from "drizzle-orm"
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

  // Caps are counted at claim time. Day boundary is Lompoc's, not UTC.
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

  const block = evaluateClaim({
    paused: deal.paused,
    expiresAt: deal.expiresAt,
    maxRedemptions: deal.maxRedemptions,
    maxPerDay: deal.maxPerDay,
    totalClaims: counts?.total ?? 0,
    claimsToday: counts?.today ?? 0,
    now: new Date(),
  })
  if (block) return { ok: false, reason: block }

  // Retry on the astronomically-unlikely code collision; the unique index is the
  // real guarantee, this loop just turns a collision into a retry instead of a 500.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await db
        .insert(couponClaims)
        .values({ dealId, userId, code: generateCouponCode() })
        .returning({ code: couponClaims.code })
      if (row) return { ok: true, code: row.code, alreadyHad: false }
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      // Lost a race on (deal_id, user_id) — the other insert won, return its code.
      if (msg.includes("coupon_claims_deal_user_unique")) {
        const raced = await db.query.couponClaims.findFirst({
          where: and(eq(couponClaims.dealId, dealId), eq(couponClaims.userId, userId)),
        })
        if (raced) return { ok: true, code: raced.code, alreadyHad: true }
      }
      if (!msg.includes("coupon_claims_code_unique")) return { ok: false, reason: "error" }
      // else: code collision, loop and generate another
    }
  }
  return { ok: false, reason: "error" }
}
