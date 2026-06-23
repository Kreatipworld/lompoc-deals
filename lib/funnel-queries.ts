import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { analyticsEvents, deals } from "@/db/schema"

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

  const bizDeals = await db
    .select({ id: deals.id, title: deals.title, viewCount: deals.viewCount, clickCount: deals.clickCount })
    .from(deals)
    .where(eq(deals.businessId, businessId))

  if (bizDeals.length === 0) return []
  const dealIds = bizDeals.map((d) => d.id)

  // Count events per deal per type from analytics_events (windowed or all-time).
  const eventRows = await db
    .select({
      dealId: analyticsEvents.targetId,
      eventName: analyticsEvents.eventName,
      n: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.targetId, dealIds),
        inArray(analyticsEvents.eventName, ["deal_view", "deal_click", "deal_claim", "deal_redeem"]),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )
    .groupBy(analyticsEvents.targetId, analyticsEvents.eventName)

  const counts = new Map<number, { views: number; clicks: number; claims: number; redeems: number }>()
  for (const d of bizDeals) counts.set(d.id, { views: 0, clicks: 0, claims: 0, redeems: 0 })
  for (const e of eventRows) {
    if (e.dealId == null) continue
    const c = counts.get(e.dealId)
    if (!c) continue
    if (e.eventName === "deal_view") c.views = e.n
    else if (e.eventName === "deal_click") c.clicks = e.n
    else if (e.eventName === "deal_claim") c.claims = e.n
    else if (e.eventName === "deal_redeem") c.redeems = e.n
  }

  return bizDeals.map((d) => {
    const c = counts.get(d.id)!
    // For all-time, prefer the denormalized counters (complete history pre-analytics_events).
    const views = window === "all" ? d.viewCount : c.views
    const clicks = window === "all" ? d.clickCount : c.clicks
    const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0
    const claimRate = clicks > 0 ? Math.round((c.claims / clicks) * 1000) / 10 : 0
    const redeemRate = c.claims > 0 ? Math.round((c.redeems / c.claims) * 1000) / 10 : 0
    return {
      dealId: d.id,
      dealTitle: d.title,
      views,
      clicks,
      claims: c.claims,
      redeems: c.redeems,
      ctr,
      claimRate,
      redeemRate,
    }
  })
}
