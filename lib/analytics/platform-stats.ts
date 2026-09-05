import { db } from "@/db/client"
import { sql, type SQL } from "drizzle-orm"
import { classifySource, type SourceKey } from "@/lib/referrer"
import { OUTBOUND_EVENTS } from "@/lib/analytics/events"
import type { FunnelWindow } from "@/lib/funnel-queries"
import type { DailyPoint, OutboundAction } from "@/lib/analytics/business-stats"

/**
 * Platform-wide analytics for the admin pro dashboard. Same honesty rules as
 * the member dashboard: traffic counts engaged sessions (2+ events) only, and
 * sources come from classifySource (in-site surfaces + UTM + external).
 */

function rows<T>(r: unknown): T[] {
  return Array.isArray(r) ? (r as T[]) : ((r as { rows: T[] }).rows ?? [])
}

export function windowDays(window: FunnelWindow): number | null {
  return window === "7d" ? 7 : window === "30d" ? 30 : null
}

/** `created_at > <cutoff>` or TRUE for all-time. */
function since(days: number | null, col: SQL = sql`created_at`): SQL {
  return days === null ? sql`TRUE` : sql`${col} > now() - make_interval(days => ${days})`
}

/** Set of engaged session ids in the window. */
function engagedIds(days: number | null): SQL {
  return sql`(
    SELECT session_id FROM analytics_events
    WHERE session_id IS NOT NULL AND ${since(days)}
    GROUP BY 1 HAVING COUNT(*) > 1
  )`
}

export interface PlatformKpis {
  engagedVisits: number
  rawSessions: number
  /** Page views (business pages + every other public page) from engaged sessions. */
  siteViews: number
  dealViews: number
  actions: number
  claims: number
  redeems: number
  signups: number
}

export async function platformKpis(window: FunnelWindow): Promise<PlatformKpis> {
  const d = windowDays(window)
  const [r] = rows<Record<string, number>>(
    await db.execute(sql`
      WITH eng AS (
        SELECT session_id FROM analytics_events
        WHERE session_id IS NOT NULL AND ${since(d)}
        GROUP BY 1 HAVING COUNT(*) > 1
      )
      SELECT
        (SELECT COUNT(*)::int FROM eng) AS engaged_visits,
        (SELECT COUNT(DISTINCT session_id)::int FROM analytics_events WHERE session_id IS NOT NULL AND ${since(d)}) AS raw_sessions,
        (SELECT COUNT(*)::int FROM analytics_events WHERE event_name IN ('business_page_viewed','page_viewed') AND ${since(d)} AND session_id IN (SELECT session_id FROM eng)) AS site_views,
        (SELECT COUNT(*)::int FROM analytics_events WHERE event_name = 'deal_view' AND ${since(d)} AND session_id IN (SELECT session_id FROM eng)) AS deal_views,
        (SELECT COUNT(*)::int FROM analytics_events WHERE event_name = ANY(${sql.raw(`ARRAY[${OUTBOUND_EVENTS.map((e) => `'${e}'`).join(",")}]`)}) AND ${since(d)}) AS actions,
        (SELECT COUNT(*)::int FROM analytics_events WHERE event_name = 'deal_claim' AND ${since(d)}) AS claims,
        (SELECT COUNT(*)::int FROM coupon_claims WHERE status = 'redeemed' AND ${since(d, sql`redeemed_at`)}) AS redeems,
        (SELECT COUNT(*)::int FROM users WHERE ${since(d)}) AS signups
    `)
  )
  return {
    engagedVisits: Number(r?.engaged_visits ?? 0),
    rawSessions: Number(r?.raw_sessions ?? 0),
    siteViews: Number(r?.site_views ?? 0),
    dealViews: Number(r?.deal_views ?? 0),
    actions: Number(r?.actions ?? 0),
    claims: Number(r?.claims ?? 0),
    redeems: Number(r?.redeems ?? 0),
    signups: Number(r?.signups ?? 0),
  }
}

/** Daily engaged visits + engaged deal views, zero-filled, oldest first. */
export async function platformDaily(window: FunnelWindow): Promise<DailyPoint[]> {
  const d = windowDays(window)
  const r = rows<{ day: string; visits: number; deal_views: number }>(
    await db.execute(sql`
      WITH eng AS (
        SELECT session_id, MIN(created_at)::date AS first_day
        FROM analytics_events
        WHERE session_id IS NOT NULL AND ${since(d)}
        GROUP BY 1 HAVING COUNT(*) > 1
      ),
      bounds AS (
        SELECT ${d === null ? sql`(SELECT MIN(created_at)::date FROM analytics_events)` : sql`(now() - make_interval(days => ${d - 1}))::date`} AS start
      ),
      series AS (
        SELECT generate_series((SELECT start FROM bounds), now()::date, '1 day')::date AS day
      ),
      visits AS (SELECT first_day AS day, COUNT(*)::int AS n FROM eng GROUP BY 1),
      dv AS (
        SELECT created_at::date AS day, COUNT(*)::int AS n
        FROM analytics_events
        WHERE event_name = 'deal_view' AND ${since(d)} AND session_id IN (SELECT session_id FROM eng)
        GROUP BY 1
      )
      SELECT s.day::text AS day, COALESCE(v.n, 0)::int AS visits, COALESCE(dv.n, 0)::int AS deal_views
      FROM series s
      LEFT JOIN visits v ON v.day = s.day
      LEFT JOIN dv ON dv.day = s.day
      ORDER BY s.day
    `)
  )
  return r.map((x) => ({ date: x.day, profileViews: Number(x.visits), dealViews: Number(x.deal_views) }))
}

export type SourceRow = { source: SourceKey; count: number; pct: number }

/** Where engaged visitors to any page (business pages + every other public page) came from. */
export async function platformSources(window: FunnelWindow): Promise<SourceRow[]> {
  const d = windowDays(window)
  const r = rows<{ referrer: string | null; src: string | null; med: string | null; n: number }>(
    await db.execute(sql`
      SELECT props->>'referrer' AS referrer, props->>'src' AS src, props->>'med' AS med, COUNT(*)::int AS n
      FROM analytics_events
      WHERE event_name IN ('business_page_viewed', 'page_viewed') AND ${since(d)}
        AND session_id IN ${engagedIds(d)}
      GROUP BY 1, 2, 3
    `)
  )
  const tally = new Map<SourceKey, number>()
  let total = 0
  for (const x of r) {
    const key = classifySource({ referrer: x.referrer, utmSrc: x.src, utmMed: x.med })
    tally.set(key, (tally.get(key) ?? 0) + Number(x.n))
    total += Number(x.n)
  }
  const denom = total || 1
  return Array.from(tally.entries())
    .map(([source, count]) => ({ source, count, pct: Math.round((count / denom) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export type ActionRow = { action: OutboundAction; count: number }

/** Real-world actions platform-wide, by type. */
export async function platformActions(window: FunnelWindow): Promise<{ total: number; rows: ActionRow[] }> {
  const d = windowDays(window)
  const r = rows<{ action: OutboundAction; n: number }>(
    await db.execute(sql`
      SELECT event_name AS action, COUNT(*)::int AS n
      FROM analytics_events
      WHERE event_name = ANY(${sql.raw(`ARRAY[${OUTBOUND_EVENTS.map((e) => `'${e}'`).join(",")}]`)}) AND ${since(d)}
      GROUP BY 1
    `)
  )
  const by = new Map(r.map((x) => [x.action, Number(x.n)]))
  const out = OUTBOUND_EVENTS.map((action) => ({ action, count: by.get(action) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
  return { total: out.reduce((s, x) => s + x.count, 0), rows: out }
}

export type BusinessActionsRow = {
  id: number
  name: string
  slug: string
  membership: "paying" | "comped" | "pending" | "none"
  total: number
  website: number
  phone: number
  directions: number
  other: number
}

/** Which businesses got the calls, website visits and directions — sales proof. */
export async function actionsByBusiness(window: FunnelWindow, limit = 20): Promise<BusinessActionsRow[]> {
  const d = windowDays(window)
  const r = rows<{
    id: number; name: string; slug: string; membership: string
    total: number; website: number; phone: number; directions: number; other: number
  }>(
    await db.execute(sql`
      SELECT b.id, b.name, b.slug,
        CASE
          WHEN EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = b.owner_user_id
                       AND s.status IN ('active','trialing') AND s.tier IN ('standard','premium')) THEN 'paying'
          WHEN b.plan_override IN ('standard','premium') THEN 'comped'
          WHEN EXISTS (SELECT 1 FROM business_claims bc WHERE bc.business_id = b.id AND bc.status = 'pending') THEN 'pending'
          ELSE 'none'
        END AS membership,
        COUNT(e.id)::int AS total,
        COUNT(e.id) FILTER (WHERE e.event_name = 'website_click')::int AS website,
        COUNT(e.id) FILTER (WHERE e.event_name = 'phone_click')::int AS phone,
        COUNT(e.id) FILTER (WHERE e.event_name = 'directions_click')::int AS directions,
        COUNT(e.id) FILTER (WHERE e.event_name NOT IN ('website_click','phone_click','directions_click'))::int AS other
      FROM businesses b
      JOIN analytics_events e ON e.target_type = 'business' AND e.target_id = b.id
        AND e.event_name = ANY(${sql.raw(`ARRAY[${OUTBOUND_EVENTS.map((e) => `'${e}'`).join(",")}]`)})
        AND ${since(d, sql`e.created_at`)}
      GROUP BY b.id, b.name, b.slug, b.owner_user_id, b.plan_override
      ORDER BY total DESC, b.name
      LIMIT ${limit}
    `)
  )
  return r.map((x) => ({
    id: x.id,
    name: x.name,
    slug: x.slug,
    membership: (["paying", "comped", "pending"].includes(x.membership) ? x.membership : "none") as BusinessActionsRow["membership"],
    total: Number(x.total),
    website: Number(x.website),
    phone: Number(x.phone),
    directions: Number(x.directions),
    other: Number(x.other),
  }))
}

export type TopPageRow = { path: string; views: number; sessions: number }

/**
 * Most-viewed pages, engaged sessions only. `page_viewed` rows carry the path in props; business
 * pages fire `business_page_viewed` with the business id instead, so they are folded in as
 * /biz/<slug> to give one honest list of what people actually open.
 */
export async function topPages(window: FunnelWindow, limit = 15): Promise<TopPageRow[]> {
  const d = windowDays(window)
  const r = rows<{ path: string; views: number; sessions: number }>(
    await db.execute(sql`
      WITH eng AS (
        SELECT session_id FROM analytics_events
        WHERE session_id IS NOT NULL AND ${since(d)}
        GROUP BY 1 HAVING COUNT(*) > 1
      ),
      hits AS (
        SELECT e.props->>'path' AS path, e.session_id
        FROM analytics_events e
        WHERE e.event_name = 'page_viewed' AND ${since(d, sql`e.created_at`)}
          AND e.session_id IN (SELECT session_id FROM eng)
          AND e.props->>'path' IS NOT NULL
        UNION ALL
        SELECT '/biz/' || b.slug AS path, e.session_id
        FROM analytics_events e
        JOIN businesses b ON b.id = e.target_id
        WHERE e.event_name = 'business_page_viewed' AND e.target_type = 'business' AND ${since(d, sql`e.created_at`)}
          AND e.session_id IN (SELECT session_id FROM eng)
      )
      SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT session_id)::int AS sessions
      FROM hits
      GROUP BY path
      ORDER BY views DESC, sessions DESC, path
      LIMIT ${limit}
    `)
  )
  return r.map((x) => ({ path: x.path, views: Number(x.views), sessions: Number(x.sessions) }))
}

export type SearchWordRow = { query: string; count: number; avgResults: number; zero: boolean }

/**
 * Words people type into site search in the window. Junk filtered in SQL:
 * Google's sitelinks template "{search_term_string}", blanks, 1-char strings.
 * Case/whitespace folded so "Pizza" and "pizza " are one word.
 */
export async function searchWords(window: FunnelWindow, limit = 15): Promise<SearchWordRow[]> {
  const d = windowDays(window)
  const r = rows<{ query: string; count: number; avg_results: number; zero: boolean }>(
    await db.execute(sql`
      SELECT q AS query, COUNT(*)::int AS count,
             ROUND(AVG(results))::int AS avg_results,
             BOOL_AND(results = 0) AS zero
      FROM (
        SELECT lower(regexp_replace(trim(props->>'query'), '\\s+', ' ', 'g')) AS q,
               COALESCE((props->>'resultCount')::int, 0) AS results
        FROM analytics_events
        WHERE event_name = 'search_run' AND ${since(d)}
      ) s
      WHERE q IS NOT NULL AND length(q) >= 2 AND q NOT LIKE '{%'
      GROUP BY q
      ORDER BY count DESC, q
      LIMIT ${limit}
    `)
  )
  return r.map((x) => ({ query: x.query, count: Number(x.count), avgResults: Number(x.avg_results), zero: Boolean(x.zero) }))
}
