import { db } from "@/db/client"
import { analyticsEvents, deals } from "@/db/schema"
import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { normalizeReferrer, type ReferrerSource } from "@/lib/referrer"
import type { FunnelWindow } from "@/lib/funnel-queries"

export type TrafficSourceRow = { source: ReferrerSource; count: number; pct: number }
export type DailyPoint = { date: string; profileViews: number; dealViews: number }

function cutoffFor(window: FunnelWindow): Date | null {
  if (window === "all") return null
  const days = window === "7d" ? 7 : 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export async function getProfileViews(businessId: number, window: FunnelWindow): Promise<number> {
  const cutoff = cutoffFor(window)
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "business_page_viewed"),
        eq(analyticsEvents.targetType, "business"),
        eq(analyticsEvents.targetId, businessId),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )
  return row?.n ?? 0
}

export async function getTrafficSources(businessId: number, window: FunnelWindow): Promise<TrafficSourceRow[]> {
  const cutoff = cutoffFor(window)
  const rows = await db
    .select({ referrer: sql<string | null>`${analyticsEvents.props}->>'referrer'` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "business_page_viewed"),
        eq(analyticsEvents.targetType, "business"),
        eq(analyticsEvents.targetId, businessId),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )

  const tally = new Map<ReferrerSource, number>()
  for (const r of rows) {
    const src = normalizeReferrer(r.referrer)
    tally.set(src, (tally.get(src) ?? 0) + 1)
  }
  const total = rows.length || 1
  return [...tally.entries()]
    .map(([source, count]) => ({ source, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export async function getDailySeries(businessId: number, window: FunnelWindow): Promise<DailyPoint[]> {
  const cutoff = cutoffFor(window)

  // Deal ids for this business (to count deal_view events).
  const bizDeals = await db.select({ id: deals.id }).from(deals).where(eq(deals.businessId, businessId))
  const dealIds = bizDeals.map((d) => d.id)

  const profileRows = await db
    .select({ day: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "business_page_viewed"),
        eq(analyticsEvents.targetType, "business"),
        eq(analyticsEvents.targetId, businessId),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )
    .groupBy(sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`)

  const dealRows = dealIds.length
    ? await db
        .select({ day: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventName, "deal_view"),
            inArray(analyticsEvents.targetId, dealIds),
            cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
          )
        )
        .groupBy(sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`)
    : []

  const profileByDay = new Map(profileRows.map((r) => [r.day, r.n]))
  const dealByDay = new Map(dealRows.map((r) => [r.day, r.n]))

  // Build a continuous, zero-filled axis. For "all", span from earliest event to today.
  const today = new Date()
  let start: Date
  if (cutoff) {
    start = cutoff
  } else {
    const allDays = [...profileByDay.keys(), ...dealByDay.keys()].sort()
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
