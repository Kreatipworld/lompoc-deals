import { db } from "@/db/client"
import { businessClaims, businesses, users } from "@/db/schema"
import { sql, eq, desc, type SQL } from "drizzle-orm"
import { sessionCounts, engagedSessionsByDay, engagedSessionIds } from "@/lib/analytics/engaged"

/**
 * Admin insight queries. Every windowed query takes `days` (null = all time).
 * Traffic figures count engaged sessions only — see lib/analytics/engaged.ts.
 */

const ALL_TIME_DAYS = 36500

/** `created_at > now() - N days`, or TRUE for all time. */
function since(days: number | null, col: SQL = sql`created_at`): SQL {
  return days === null ? sql`TRUE` : sql`${col} > now() - make_interval(days => ${days})`
}

function daysOrAll(days: number | null): number {
  return days ?? ALL_TIME_DAYS
}

// ──────────────────────────────────────────────────────────────────────────────
// FUNNELS

export interface FunnelStep {
  /** i18n key suffix: adminAnalytics.step_<key> */
  key: string
  count: number
}

async function countEvent(eventName: string, days: number | null): Promise<number> {
  const result = await db.execute<{ c: number }>(sql`
    SELECT COUNT(*)::int AS c FROM analytics_events
    WHERE event_name = ${eventName} AND ${since(days)}
  `)
  return result.rows[0]?.c ?? 0
}

async function countDistinctUsersWithEvent(eventName: string, days: number | null): Promise<number> {
  const result = await db.execute<{ c: number }>(sql`
    SELECT COUNT(DISTINCT user_id)::int AS c FROM analytics_events
    WHERE user_id IS NOT NULL AND event_name = ${eventName} AND ${since(days)}
  `)
  return result.rows[0]?.c ?? 0
}

async function countDistinctSessionsWithEvent(eventName: string, days: number | null): Promise<number> {
  const result = await db.execute<{ c: number }>(sql`
    SELECT COUNT(DISTINCT session_id)::int AS c FROM analytics_events
    WHERE session_id IS NOT NULL AND event_name = ${eventName} AND ${since(days)}
  `)
  return result.rows[0]?.c ?? 0
}

/** Local funnel: engaged sessions → local_signup (distinct users) → deal_claim (distinct sessions). */
export async function localFunnel(days: number | null = 30): Promise<FunnelStep[]> {
  const [{ engaged }, signups, claimed] = await Promise.all([
    sessionCounts(daysOrAll(days)),
    countDistinctUsersWithEvent("local_signup", days),
    countDistinctSessionsWithEvent("deal_claim", days),
  ])
  return [
    { key: "visitors", count: engaged },
    { key: "signed_up", count: signups },
    { key: "claimed_deal", count: claimed },
  ]
}

/** Business funnel: engaged sessions → business_signup → profile_saved → first_deal_posted → paid_upgrade. */
export async function businessFunnel(days: number | null = 30): Promise<FunnelStep[]> {
  const [{ engaged }, bizSignups, profiles, firstDeals, paid] = await Promise.all([
    sessionCounts(daysOrAll(days)),
    countEvent("business_signup", days),
    countEvent("business_profile_saved", days),
    countEvent("first_deal_posted", days),
    countEvent("paid_upgrade", days),
  ])
  return [
    { key: "sessions", count: engaged },
    { key: "business_signups", count: bizSignups },
    { key: "profile_saved", count: profiles },
    { key: "first_deal", count: firstDeals },
    { key: "paid", count: paid },
  ]
}

// ──────────────────────────────────────────────────────────────────────────────
// CLAIMS

export interface ClaimRow {
  id: number
  businessName: string
  businessSlug: string
  userEmail: string | null
  status: string
  submittedAt: Date
}

export async function recentClaims(): Promise<ClaimRow[]> {
  const rows = await db
    .select({
      id: businessClaims.id,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      userEmail: users.email,
      status: businessClaims.status,
      submittedAt: businessClaims.createdAt,
    })
    .from(businessClaims)
    .leftJoin(businesses, eq(businessClaims.businessId, businesses.id))
    .leftJoin(users, eq(businessClaims.userId, users.id))
    .orderBy(desc(businessClaims.createdAt))
    .limit(20)
  return rows.map((r) => ({
    ...r,
    businessName: r.businessName ?? "—",
    businessSlug: r.businessSlug ?? "",
  }))
}

export async function claimSummary(days: number | null = 30): Promise<{ pending: number; approvedInWindow: number }> {
  const pendingResult = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM business_claims WHERE status = 'pending'`
  )
  const approvedResult = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM business_claims WHERE status = 'approved' AND ${since(days)}`
  )
  return {
    pending: pendingResult.rows[0]?.c ?? 0,
    approvedInWindow: approvedResult.rows[0]?.c ?? 0,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SEARCH GAPS

export interface SearchGap {
  query: string
  count: number
}

export async function topZeroResultSearches(days: number | null = 30): Promise<SearchGap[]> {
  const result = await db.execute<{ query: string; count: number }>(sql`
    SELECT (props->>'query') AS query, COUNT(*)::int AS count
    FROM analytics_events
    WHERE event_name = 'search_run'
      AND (props->>'resultCount')::int = 0
      AND ${since(days)}
    GROUP BY props->>'query'
    ORDER BY count DESC
    LIMIT 20
  `)
  return result.rows.filter((r) => r.query)
}

// ──────────────────────────────────────────────────────────────────────────────
// TOP BUSINESSES BY INTEREST

export interface TopBusiness {
  id: number
  name: string
  slug: string
  viewCount: number
  /** paying = real subscription · comped = plan_override only · pending = claim waiting · none */
  membership: "paying" | "comped" | "pending" | "none"
}

export async function topBusinessesByInterest(days: number | null = 30): Promise<TopBusiness[]> {
  const result = await db.execute<{
    id: number
    name: string
    slug: string
    view_count: number
    membership: string
  }>(sql`
    SELECT b.id, b.name, b.slug,
           COUNT(e.id)::int AS view_count,
           CASE
             WHEN EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = b.owner_user_id
                          AND s.status IN ('active','trialing') AND s.tier IN ('standard','premium')) THEN 'paying'
             WHEN b.plan_override IN ('standard','premium') THEN 'comped'
             WHEN EXISTS (SELECT 1 FROM business_claims bc WHERE bc.business_id = b.id AND bc.status = 'pending') THEN 'pending'
             ELSE 'none'
           END AS membership
    FROM businesses b
    JOIN analytics_events e ON e.target_type = 'business' AND e.target_id = b.id
                            AND e.event_name = 'business_page_viewed'
                            AND ${since(days, sql`e.created_at`)}
                            AND e.session_id IN ${engagedSessionIds(daysOrAll(days))}
    GROUP BY b.id, b.name, b.slug
    ORDER BY view_count DESC
    LIMIT 20
  `)
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    viewCount: r.view_count,
    membership: (["paying", "comped", "pending"].includes(r.membership) ? r.membership : "none") as TopBusiness["membership"],
  }))
}

// ──────────────────────────────────────────────────────────────────────────────
// DAILY METRICS (one number per day, fills missing days with 0)

export interface DailySeries {
  /** i18n key suffix: adminAnalytics.series_<key> */
  key: string
  points: number[]
}

/** Daily series length: 7 / 30 points for windows; all-time is capped at 90 so it stays readable. */
function seriesDays(days: number | null): number {
  return days === null ? 90 : days
}

async function dailyCount(eventName: string, days: number): Promise<number[]> {
  const result = await db.execute<{ day: string; c: number }>(sql`
    WITH series AS (
      SELECT generate_series(
        date_trunc('day', now() - make_interval(days => ${days - 1})),
        date_trunc('day', now()), '1 day')::date AS day
    ),
    counts AS (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS c
      FROM analytics_events
      WHERE event_name = ${eventName} AND created_at > now() - make_interval(days => ${days})
      GROUP BY 1
    )
    SELECT s.day::text AS day, COALESCE(c.c, 0)::int AS c
    FROM series s
    LEFT JOIN counts c ON c.day = s.day
    ORDER BY s.day
  `)
  return result.rows.map((r) => r.c)
}

export async function dailyMetrics(days: number | null = 30): Promise<DailySeries[]> {
  const n = seriesDays(days)
  const [sessions, locals, biz, claims, dealsPosted, paid] = await Promise.all([
    engagedSessionsByDay(n),
    dailyCount("local_signup", n),
    dailyCount("business_signup", n),
    dailyCount("business_claim_submitted", n),
    dailyCount("first_deal_posted", n),
    dailyCount("paid_upgrade", n),
  ])
  return [
    { key: "sessions", points: sessions },
    { key: "local_signups", points: locals },
    { key: "business_signups", points: biz },
    { key: "claims", points: claims },
    { key: "deals", points: dealsPosted },
    { key: "paid", points: paid },
  ]
}
