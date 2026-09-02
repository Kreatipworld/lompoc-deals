import { db } from "@/db/client"
import { analyticsEvents, deals } from "@/db/schema"
import { and, eq, gte, inArray, sql, type SQL } from "drizzle-orm"
import { classifySource, type SourceKey } from "@/lib/referrer"
import { OUTBOUND_EVENTS } from "@/lib/analytics/events"
import type { FunnelWindow } from "@/lib/funnel-queries"

export type TrafficSourceRow = { source: SourceKey; count: number; pct: number }
export type DailyPoint = { date: string; profileViews: number; dealViews: number }
export type OutboundAction = (typeof OUTBOUND_EVENTS)[number]
export type OutboundRow = { action: OutboundAction; count: number }

function cutoffFor(window: FunnelWindow): Date | null {
  if (window === "all") return null
  const days = window === "7d" ? 7 : 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

/**
 * Engaged-session filter: only count events from sessions with 2+ events in
 * the window. Crawlers fetch one page and leave; people click on. Same rule
 * as the admin dashboard (lib/analytics/engaged.ts) so owner and admin agree.
 */
function engagedOnly(cutoff: Date | null): SQL {
  return cutoff
    ? sql`${analyticsEvents.sessionId} IN (
        SELECT session_id FROM analytics_events
        WHERE session_id IS NOT NULL AND created_at >= ${cutoff}
        GROUP BY 1 HAVING COUNT(*) > 1)`
    : sql`${analyticsEvents.sessionId} IN (
        SELECT session_id FROM analytics_events
        WHERE session_id IS NOT NULL
        GROUP BY 1 HAVING COUNT(*) > 1)`
}

function profileViewWhere(businessId: number, cutoff: Date | null) {
  return and(
    eq(analyticsEvents.eventName, "business_page_viewed"),
    eq(analyticsEvents.targetType, "business"),
    eq(analyticsEvents.targetId, businessId),
    cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined,
    engagedOnly(cutoff)
  )
}

/** Profile visits from engaged sessions. */
export async function getProfileViews(businessId: number, window: FunnelWindow): Promise<number> {
  const cutoff = cutoffFor(window)
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(profileViewWhere(businessId, cutoff))
  return row?.n ?? 0
}

/** Deal views (feed + profile cards) from engaged sessions. */
export async function getDealViews(businessId: number, window: FunnelWindow): Promise<number> {
  const cutoff = cutoffFor(window)
  const bizDeals = await db.select({ id: deals.id }).from(deals).where(eq(deals.businessId, businessId))
  const dealIds = bizDeals.map((d) => d.id)
  if (dealIds.length === 0) return 0
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "deal_view"),
        inArray(analyticsEvents.targetId, dealIds),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined,
        engagedOnly(cutoff)
      )
    )
  return row?.n ?? 0
}

/** Where engaged visitors came from: in-site surfaces, campaigns (UTM), external referrers. */
export async function getTrafficSources(businessId: number, window: FunnelWindow): Promise<TrafficSourceRow[]> {
  const cutoff = cutoffFor(window)
  const rows = await db
    .select({
      referrer: sql<string | null>`${analyticsEvents.props}->>'referrer'`,
      utmSrc: sql<string | null>`${analyticsEvents.props}->>'src'`,
      utmMed: sql<string | null>`${analyticsEvents.props}->>'med'`,
    })
    .from(analyticsEvents)
    .where(profileViewWhere(businessId, cutoff))

  const tally = new Map<SourceKey, number>()
  for (const r of rows) {
    const src = classifySource(r)
    tally.set(src, (tally.get(src) ?? 0) + 1)
  }
  const total = rows.length || 1
  return Array.from(tally.entries())
    .map(([source, count]) => ({ source, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Real-world actions: website, call, directions, map, social, reviews clicks on
 * the listing. These are what an owner is buying — a visit that did its job.
 * Not engaged-filtered: a click is already a human act.
 */
export async function getOutboundActions(
  businessId: number,
  window: FunnelWindow
): Promise<{ total: number; rows: OutboundRow[] }> {
  const cutoff = cutoffFor(window)
  const rows = await db
    .select({ action: analyticsEvents.eventName, n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.eventName, [...OUTBOUND_EVENTS]),
        eq(analyticsEvents.targetType, "business"),
        eq(analyticsEvents.targetId, businessId),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )
    .groupBy(analyticsEvents.eventName)
  const byAction = new Map(rows.map((r) => [r.action, r.n]))
  const out = OUTBOUND_EVENTS.map((action) => ({ action, count: byAction.get(action) ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
  return { total: out.reduce((s, r) => s + r.count, 0), rows: out }
}

export async function getDailySeries(businessId: number, window: FunnelWindow): Promise<DailyPoint[]> {
  const cutoff = cutoffFor(window)

  const bizDeals = await db.select({ id: deals.id }).from(deals).where(eq(deals.businessId, businessId))
  const dealIds = bizDeals.map((d) => d.id)

  const dayExpr = sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`

  const profileRows = await db
    .select({ day: dayExpr, n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(profileViewWhere(businessId, cutoff))
    .groupBy(dayExpr)

  const dealRows = dealIds.length
    ? await db
        .select({ day: dayExpr, n: sql<number>`count(*)::int` })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventName, "deal_view"),
            inArray(analyticsEvents.targetId, dealIds),
            cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined,
            engagedOnly(cutoff)
          )
        )
        .groupBy(dayExpr)
    : []

  const profileByDay = new Map(profileRows.map((r) => [r.day, r.n]))
  const dealByDay = new Map(dealRows.map((r) => [r.day, r.n]))

  // Build a continuous, zero-filled axis. For "all", span from earliest event to today.
  const today = new Date()
  let start: Date
  if (cutoff) {
    start = cutoff
  } else {
    const allDays = [...Array.from(profileByDay.keys()), ...Array.from(dealByDay.keys())].sort()
    start = allDays.length ? new Date(allDays[0] + "T00:00:00Z") : today
  }

  const startMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const points: DailyPoint[] = []
  for (let ms = startMs; ms <= endMs; ms += 86400000) {
    const key = new Date(ms).toISOString().slice(0, 10)
    points.push({ date: key, profileViews: profileByDay.get(key) ?? 0, dealViews: dealByDay.get(key) ?? 0 })
  }
  return points
}
