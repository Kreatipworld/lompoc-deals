import { and, eq, gte, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { dealEvents, deals } from "@/db/schema"

export type FunnelWindow = "7d" | "30d" | "all"

export type DealFunnelRow = {
  dealId: number
  dealTitle: string
  views: number
  clicks: number
  claims: number
  redeems: number
  ctr: number
  claimRate: number
  redeemRate: number
}

function windowCutoff(window: FunnelWindow): Date | null {
  if (window === "all") return null
  const days = window === "7d" ? 7 : 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export async function getDealFunnel(
  businessId: number,
  window: FunnelWindow = "30d"
): Promise<DealFunnelRow[]> {
  const cutoff = windowCutoff(window)

  // Aggregate event counts per deal from deal_events
  const eventCounts = await db
    .select({
      dealId: dealEvents.dealId,
      eventType: dealEvents.eventType,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(dealEvents)
    .innerJoin(deals, eq(dealEvents.dealId, deals.id))
    .where(
      and(
        eq(deals.businessId, businessId),
        cutoff ? gte(dealEvents.createdAt, cutoff) : undefined
      )
    )
    .groupBy(dealEvents.dealId, dealEvents.eventType)

  // Also load deals for this business to include view/click counts
  const bizDeals = await db.query.deals.findMany({
    where: (d, { eq: e }) => e(d.businessId, businessId),
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  })

  // Build a map: dealId -> { views, clicks, claims, redeems }
  const map = new Map<
    number,
    { views: number; clicks: number; claims: number; redeems: number }
  >()

  for (const d of bizDeals) {
    // For view/click, use the aggregate columns (not event table) when window is "all"
    // For windowed queries, use event table counts
    map.set(d.id, {
      views: window === "all" ? (d.viewCount ?? 0) : 0,
      clicks: window === "all" ? (d.clickCount ?? 0) : 0,
      claims: 0,
      redeems: 0,
    })
  }

  for (const row of eventCounts) {
    const entry = map.get(row.dealId)
    if (!entry) continue
    if (row.eventType === "view") entry.views = row.count
    else if (row.eventType === "click") entry.clicks = row.count
    else if (row.eventType === "claim") entry.claims = row.count
    else if (row.eventType === "redeem") entry.redeems = row.count
  }

  return bizDeals.map((d) => {
    const counts = map.get(d.id) ?? { views: 0, clicks: 0, claims: 0, redeems: 0 }
    const ctr = counts.views > 0 ? Math.round((counts.clicks / counts.views) * 100) : 0
    const claimRate =
      counts.clicks > 0 ? Math.round((counts.claims / counts.clicks) * 100) : 0
    const redeemRate =
      counts.claims > 0 ? Math.round((counts.redeems / counts.claims) * 100) : 0
    return {
      dealId: d.id,
      dealTitle: d.title,
      views: counts.views,
      clicks: counts.clicks,
      claims: counts.claims,
      redeems: counts.redeems,
      ctr,
      claimRate,
      redeemRate,
    }
  })
}
