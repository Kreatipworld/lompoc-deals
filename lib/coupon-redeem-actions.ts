"use server"

import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { couponClaims, deals, users } from "@/db/schema"
import { getMyBusiness } from "@/lib/biz-actions"
import { normalizeCouponCode } from "@/lib/coupon-code"

export type CouponLookup =
  | {
      ok: true
      claimId: number
      code: string
      dealTitle: string
      discountText: string | null
      customerName: string | null
      claimedAt: Date
      status: "claimed" | "redeemed" | "void"
      redeemedAt: Date | null
      expired: boolean
    }
  | { ok: false; reason: "auth" | "not_found" }

/**
 * `getMyBusiness()` throws ("Not authorized") for anyone who isn't a signed-in
 * business user, rather than returning null — only a business user with no
 * owned business row yields null. Both cases mean "no business scope for this
 * caller," so both collapse to a caught null here, keeping lookupCoupon and
 * redeemCoupon true to their documented signatures (typed results, never a
 * thrown exception reaching the caller).
 */
async function resolveBiz() {
  try {
    return await getMyBusiness()
  } catch (e) {
    console.error("resolveBiz: failed to get business context", { cause: e })
    return null
  }
}

/** Look up a code, scoped strictly to the signed-in business's own deals. */
export async function lookupCoupon(rawCode: string): Promise<CouponLookup> {
  const biz = await resolveBiz()
  if (!biz) return { ok: false, reason: "auth" }

  const code = normalizeCouponCode(rawCode)
  if (!code) return { ok: false, reason: "not_found" }

  type CouponRow = {
    claimId: number
    code: string
    status: "claimed" | "redeemed" | "void"
    claimedAt: Date
    redeemedAt: Date | null
    dealTitle: string
    discountText: string | null
    expiresAt: Date
    customerName: string | null
  }
  let row: CouponRow | undefined
  try {
    const result = await db
      .select({
        claimId: couponClaims.id,
        code: couponClaims.code,
        status: couponClaims.status,
        claimedAt: couponClaims.claimedAt,
        redeemedAt: couponClaims.redeemedAt,
        dealTitle: deals.title,
        discountText: deals.discountText,
        expiresAt: deals.expiresAt,
        customerName: users.name,
      })
      .from(couponClaims)
      .innerJoin(deals, eq(deals.id, couponClaims.dealId))
      .leftJoin(users, eq(users.id, couponClaims.userId))
      // Ownership scope: a code from another business is indistinguishable from
      // one that does not exist. Do not leak its existence.
      .where(and(eq(couponClaims.code, code), eq(deals.businessId, biz.id)))
      .limit(1)
    row = result[0]
  } catch (e) {
    console.error("lookupCoupon: query failed", { cause: e })
    return { ok: false, reason: "not_found" }
  }

  if (!row) return { ok: false, reason: "not_found" }

  return {
    ok: true,
    claimId: row.claimId,
    code: row.code,
    dealTitle: row.dealTitle,
    discountText: row.discountText,
    customerName: row.customerName ?? null,
    claimedAt: row.claimedAt,
    status: row.status,
    redeemedAt: row.redeemedAt,
    expired: row.expiresAt.getTime() <= Date.now(),
  }
}

/**
 * Confirm a coupon at the counter. Idempotent: redeeming an already-redeemed
 * claim reports it rather than counting a second redemption.
 */
export async function redeemCoupon(
  claimId: number
): Promise<{ ok: true; alreadyRedeemed: boolean } | { ok: false; reason: "auth" | "not_found" | "expired" | "error" }> {
  const biz = await resolveBiz()
  if (!biz) return { ok: false, reason: "auth" }

  // biz being non-null (via getMyBusiness -> requireBusinessUser) guarantees a
  // valid, business-role session, so session.user.id is present here.
  const session = await auth()
  const staffId = session?.user?.id ? Number(session.user.id) : null
  if (!staffId || !Number.isFinite(staffId)) return { ok: false, reason: "auth" }

  type RedeemRow = {
    id: number
    status: "claimed" | "redeemed" | "void"
    expiresAt: Date
  }
  let row: RedeemRow | undefined
  try {
    const result = await db
      .select({
        id: couponClaims.id,
        status: couponClaims.status,
        expiresAt: deals.expiresAt,
      })
      .from(couponClaims)
      .innerJoin(deals, eq(deals.id, couponClaims.dealId))
      // Ownership scope: same guarantee as lookupCoupon — a claim id belonging
      // to another business is indistinguishable from a nonexistent one.
      .where(and(eq(couponClaims.id, claimId), eq(deals.businessId, biz.id)))
      .limit(1)
    row = result[0]
  } catch (e) {
    console.error("redeemCoupon: query failed", { cause: e })
    return { ok: false, reason: "error" }
  }

  if (!row) return { ok: false, reason: "not_found" }
  if (row.status === "redeemed") return { ok: true, alreadyRedeemed: true }
  // A voided claim (e.g. flagged fraudulent) must never report ok:true — that
  // would misrepresent it as a real or already-completed redemption.
  if (row.status === "void") return { ok: false, reason: "not_found" }
  // Time passes between claim and counter, so expiry is re-checked here too.
  if (row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" }

  try {
    // Conditional update: only a still-"claimed" row flips, so two staff
    // submitting at once cannot both count a redemption.
    const updated = await db
      .update(couponClaims)
      .set({ status: "redeemed", redeemedAt: new Date(), redeemedBy: staffId })
      .where(and(eq(couponClaims.id, claimId), eq(couponClaims.status, "claimed")))
      .returning({ id: couponClaims.id })
    return { ok: true, alreadyRedeemed: updated.length === 0 }
  } catch {
    return { ok: false, reason: "error" }
  }
}
