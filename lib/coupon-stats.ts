import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { couponClaims, deals } from "@/db/schema"

export type CouponStatsWindow = "7d" | "30d" | "all"

export type CouponStatsRow = {
  dealId: number
  dealTitle: string
  claims: number
  redemptions: number
  redeemRate: number
  newCustomers: number
  repeatCustomers: number
  medianHoursToRedeem: number | null
}

function windowCutoff(window: CouponStatsWindow): Date | null {
  if (window === "all") return null
  const days = window === "7d" ? 7 : 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const midValue = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  return Math.round(midValue)
}

/**
 * Pure aggregation over coupon_claims-shaped rows for one business's deals.
 * `priorCustomerIds` is the set of userIds already known to have claimed at this
 * business before the window began (the caller determines that scope); this
 * function only tallies within the rows it's given. Counts and rates only —
 * never dollar figures.
 */
export function summarizeClaims(
  rows: Array<{ dealId: number; userId: number; status: string; claimedAt: Date; redeemedAt: Date | null }>,
  priorCustomerIds: Set<number>
): Map<number, Omit<CouponStatsRow, "dealTitle">> {
  const byDeal = new Map<number, typeof rows>()
  for (const row of rows) {
    const list = byDeal.get(row.dealId)
    if (list) list.push(row)
    else byDeal.set(row.dealId, [row])
  }

  const out = new Map<number, Omit<CouponStatsRow, "dealTitle">>()
  for (const [dealId, dealRows] of Array.from(byDeal.entries())) {
    const claims = dealRows.length
    const redeemedRows = dealRows.filter(
      (r): r is typeof r & { redeemedAt: Date } => r.status === "redeemed" && r.redeemedAt !== null
    )
    const redemptions = redeemedRows.length
    const redeemRate = claims > 0 ? redemptions / claims : 0

    const seenUsers = new Set<number>()
    let newCustomers = 0
    let repeatCustomers = 0
    for (const r of dealRows) {
      if (seenUsers.has(r.userId)) continue
      seenUsers.add(r.userId)
      if (priorCustomerIds.has(r.userId)) repeatCustomers++
      else newCustomers++
    }

    const hoursToRedeem = redeemedRows.map(
      (r) => (r.redeemedAt.getTime() - r.claimedAt.getTime()) / (1000 * 60 * 60)
    )
    const medianHoursToRedeem = median(hoursToRedeem)

    out.set(dealId, {
      dealId,
      claims,
      redemptions,
      redeemRate,
      newCustomers,
      repeatCustomers,
      medianHoursToRedeem,
    })
  }
  return out
}

/**
 * Counter-verified coupon stats for a business's deals. Redemptions come from
 * coupon_claims rows a staff member confirmed at the counter (status = 'redeemed'),
 * not self-reported events — counts and rates only, no dollar figures.
 */
export async function getCouponStats(
  businessId: number,
  window: CouponStatsWindow
): Promise<CouponStatsRow[]> {
  const bizDeals = await db
    .select({ id: deals.id, title: deals.title })
    .from(deals)
    .where(eq(deals.businessId, businessId))

  if (bizDeals.length === 0) return []
  const dealIds = bizDeals.map((d) => d.id)

  const cutoff = windowCutoff(window)

  // A "repeat" customer is someone who already had a claim at this business
  // before the window began. There's no "before" an all-time window, so
  // priorCustomerIds is empty when window === "all" and everyone counts as new.
  const priorRows = cutoff
    ? await db
        .select({ userId: couponClaims.userId })
        .from(couponClaims)
        .where(and(inArray(couponClaims.dealId, dealIds), sql`${couponClaims.claimedAt} < ${cutoff}`))
    : []
  const priorCustomerIds = new Set(priorRows.map((r) => r.userId))

  const claimRows = await db
    .select({
      dealId: couponClaims.dealId,
      userId: couponClaims.userId,
      status: couponClaims.status,
      claimedAt: couponClaims.claimedAt,
      redeemedAt: couponClaims.redeemedAt,
    })
    .from(couponClaims)
    .where(
      and(
        inArray(couponClaims.dealId, dealIds),
        cutoff ? gte(couponClaims.claimedAt, cutoff) : undefined
      )
    )

  const summary = summarizeClaims(claimRows, priorCustomerIds)
  const dealTitleById = new Map(bizDeals.map((d) => [d.id, d.title]))

  return bizDeals.map((d) => {
    const s = summary.get(d.id)
    return {
      dealId: d.id,
      dealTitle: dealTitleById.get(d.id) ?? "",
      claims: s?.claims ?? 0,
      redemptions: s?.redemptions ?? 0,
      redeemRate: s?.redeemRate ?? 0,
      newCustomers: s?.newCustomers ?? 0,
      repeatCustomers: s?.repeatCustomers ?? 0,
      medianHoursToRedeem: s?.medianHoursToRedeem ?? null,
    }
  })
}
