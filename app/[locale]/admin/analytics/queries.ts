import { db } from "@/db/client"
import { businessClaims, businesses, users } from "@/db/schema"
import { sql, eq, desc } from "drizzle-orm"

const THIRTY_DAYS = sql`now() - interval '30 days'`

// ──────────────────────────────────────────────────────────────────────────────
// FUNNELS

export interface FunnelStep {
  name: string
  count: number
}

async function countWhere(predicate: string): Promise<number> {
  const result = await db.execute<{ c: number }>(
    sql.raw(
      `SELECT COUNT(*)::int AS c FROM analytics_events WHERE ${predicate} AND created_at > now() - interval '30 days'`
    )
  )
  return result.rows[0]?.c ?? 0
}

async function countDistinctSessionsWhere(predicate: string): Promise<number> {
  const result = await db.execute<{ c: number }>(
    sql.raw(
      `SELECT COUNT(DISTINCT session_id)::int AS c FROM analytics_events WHERE session_id IS NOT NULL AND ${predicate} AND created_at > now() - interval '30 days'`
    )
  )
  return result.rows[0]?.c ?? 0
}

async function countDistinctUsersWhere(predicate: string): Promise<number> {
  const result = await db.execute<{ c: number }>(
    sql.raw(
      `SELECT COUNT(DISTINCT user_id)::int AS c FROM analytics_events WHERE user_id IS NOT NULL AND ${predicate} AND created_at > now() - interval '30 days'`
    )
  )
  return result.rows[0]?.c ?? 0
}

/** Local funnel: unique sessions w/ a business page view → local_signup → favorite_added. */
export async function localFunnel(): Promise<FunnelStep[]> {
  const pageViews = await countDistinctSessionsWhere(`event_name = 'business_page_viewed'`)
  const signups = await countDistinctUsersWhere(`event_name = 'local_signup'`)
  const favorites = await countDistinctUsersWhere(`event_name = 'favorite_added'`)
  return [
    { name: "Visitors", count: pageViews },
    { name: "Signed up", count: signups },
    { name: "Favorited a deal", count: favorites },
  ]
}

/** Business funnel: sessions → business_signup → profile_saved → first_deal_posted → paid_upgrade. */
export async function businessFunnel(): Promise<FunnelStep[]> {
  const sessionsResult = await db.execute<{ c: number }>(
    sql`SELECT COUNT(DISTINCT session_id)::int AS c FROM analytics_events WHERE session_id IS NOT NULL AND created_at > ${THIRTY_DAYS}`
  )
  const sessions = sessionsResult.rows[0]?.c ?? 0

  const bizSignups = await countWhere(`event_name = 'business_signup'`)
  const profiles = await countWhere(`event_name = 'business_profile_saved'`)
  const firstDeals = await countWhere(`event_name = 'first_deal_posted'`)
  const paid = await countWhere(`event_name = 'paid_upgrade'`)

  return [
    { name: "All sessions", count: sessions },
    { name: "Business signups", count: bizSignups },
    { name: "Profile completed", count: profiles },
    { name: "First deal posted", count: firstDeals },
    { name: "Paid upgrade", count: paid },
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

export async function claimSummary(): Promise<{ pending: number; approvedThisMonth: number }> {
  const pendingResult = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM business_claims WHERE status = 'pending'`
  )
  const approvedResult = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM business_claims WHERE status = 'approved' AND created_at > ${THIRTY_DAYS}`
  )
  return {
    pending: pendingResult.rows[0]?.c ?? 0,
    approvedThisMonth: approvedResult.rows[0]?.c ?? 0,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SEARCH GAPS

export interface SearchGap {
  query: string
  count: number
}

export async function topZeroResultSearches(): Promise<SearchGap[]> {
  const result = await db.execute<{ query: string; count: number }>(sql`
    SELECT (props->>'query') AS query, COUNT(*)::int AS count
    FROM analytics_events
    WHERE event_name = 'search_run'
      AND (props->>'resultCount')::int = 0
      AND created_at > ${THIRTY_DAYS}
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
  claimStatus: "claimed" | "pending" | "unclaimed"
}

export async function topBusinessesByInterest(): Promise<TopBusiness[]> {
  const result = await db.execute<{
    id: number
    name: string
    slug: string
    view_count: number
    claim_status: string | null
  }>(sql`
    SELECT b.id, b.name, b.slug,
           COUNT(e.id)::int AS view_count,
           COALESCE(
             (SELECT bc.status FROM business_claims bc
              WHERE bc.business_id = b.id
              ORDER BY bc.created_at DESC LIMIT 1),
             'unclaimed'
           ) AS claim_status
    FROM businesses b
    JOIN analytics_events e ON e.target_type = 'business' AND e.target_id = b.id
                            AND e.event_name = 'business_page_viewed'
                            AND e.created_at > ${THIRTY_DAYS}
    GROUP BY b.id, b.name, b.slug
    ORDER BY view_count DESC
    LIMIT 20
  `)
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    viewCount: r.view_count,
    claimStatus:
      r.claim_status === "approved"
        ? "claimed"
        : r.claim_status === "pending"
          ? "pending"
          : "unclaimed",
  }))
}

// ──────────────────────────────────────────────────────────────────────────────
// DAILY METRICS (last 30 days, one number per day, fills missing days with 0)

export interface DailySeries {
  label: string
  points: number[]
}

async function dailyCount(eventName: string): Promise<number[]> {
  const result = await db.execute<{ day: string; c: number }>(sql`
    WITH series AS (
      SELECT generate_series(date_trunc('day', now() - interval '29 days'), date_trunc('day', now()), '1 day')::date AS day
    ),
    counts AS (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS c
      FROM analytics_events
      WHERE event_name = ${eventName} AND created_at > now() - interval '30 days'
      GROUP BY 1
    )
    SELECT s.day::text AS day, COALESCE(c.c, 0)::int AS c
    FROM series s
    LEFT JOIN counts c ON c.day = s.day
    ORDER BY s.day
  `)
  return result.rows.map((r) => r.c)
}

async function dailySessions(): Promise<number[]> {
  const result = await db.execute<{ day: string; c: number }>(sql`
    WITH series AS (
      SELECT generate_series(date_trunc('day', now() - interval '29 days'), date_trunc('day', now()), '1 day')::date AS day
    ),
    counts AS (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(DISTINCT session_id)::int AS c
      FROM analytics_events
      WHERE created_at > now() - interval '30 days' AND session_id IS NOT NULL
      GROUP BY 1
    )
    SELECT s.day::text AS day, COALESCE(c.c, 0)::int AS c
    FROM series s
    LEFT JOIN counts c ON c.day = s.day
    ORDER BY s.day
  `)
  return result.rows.map((r) => r.c)
}

export async function dailyMetrics(): Promise<DailySeries[]> {
  const [sessions, locals, biz, claims, dealsPosted, paid] = await Promise.all([
    dailySessions(),
    dailyCount("local_signup"),
    dailyCount("business_signup"),
    dailyCount("business_claim_submitted"),
    dailyCount("first_deal_posted"),
    dailyCount("paid_upgrade"),
  ])
  return [
    { label: "Sessions", points: sessions },
    { label: "Local signups", points: locals },
    { label: "Business signups", points: biz },
    { label: "Claims submitted", points: claims },
    { label: "Deals posted", points: dealsPosted },
    { label: "Paid upgrades", points: paid },
  ]
}
