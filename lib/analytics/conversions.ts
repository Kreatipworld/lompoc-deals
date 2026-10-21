import { db } from "@/db/client"
import { sql } from "drizzle-orm"

/**
 * Conversion-funnel queries for /admin/conversions.
 * Honest-numbers rule (lib/analytics/engaged.ts): everything here counts ENGAGED
 * sessions only (2+ events) — raw traffic is dominated by crawlers.
 * UTM attribution is first-touch, folded into every event's `props` as short keys
 * (src/med/cmp/con) by lib/analytics/track.ts, so source = props->>'src'.
 */

export type FunnelWindow = "7d" | "30d" | "all"
export function windowDays(w: FunnelWindow): number | null {
  return w === "7d" ? 7 : w === "30d" ? 30 : null
}

// neon-http db.execute() returns either an array or { rows } depending on the call site.
function rows<T>(r: unknown): T[] {
  return Array.isArray(r) ? (r as T[]) : ((r as { rows?: T[] })?.rows ?? [])
}

function since(days: number | null) {
  return days == null ? sql`TRUE` : sql`created_at >= now() - make_interval(days => ${days})`
}

// sessions with 2+ events in the window (engaged)
function engagedSessions(days: number | null) {
  return sql`
    SELECT session_id FROM analytics_events
    WHERE ${since(days)} AND session_id IS NOT NULL
    GROUP BY session_id HAVING COUNT(*) > 1`
}

const SIGNUP_EVENTS = sql`('business_signup','business_claim_submitted')`

export type ConversionFunnel = {
  visitors: number
  offerViews: number
  signups: number
  paid: number
}

export async function getConversionFunnel(days: number | null): Promise<ConversionFunnel> {
  const [visitors, offerViews, signups, paid] = await Promise.all([
    db.execute<{ c: number }>(sql`SELECT COUNT(*)::int AS c FROM (${engagedSessions(days)}) e`),
    db.execute<{ c: number }>(sql`
      SELECT COUNT(DISTINCT session_id)::int AS c FROM analytics_events
      WHERE ${since(days)} AND event_name = 'page_viewed'
        AND (props->>'path' = '/for-businesses' OR props->>'path' LIKE '/for-businesses/%' OR props->>'path' = '/partners')
        AND session_id IN (${engagedSessions(days)})`),
    db.execute<{ c: number }>(sql`
      SELECT COUNT(*)::int AS c FROM analytics_events
      WHERE ${since(days)} AND event_name IN ${SIGNUP_EVENTS}`),
    db.execute<{ c: number }>(sql`
      SELECT COUNT(*)::int AS c FROM analytics_events
      WHERE ${since(days)} AND event_name = 'paid_upgrade'`),
  ])
  return {
    visitors: rows<{ c: number }>(visitors)[0]?.c ?? 0,
    offerViews: rows<{ c: number }>(offerViews)[0]?.c ?? 0,
    signups: rows<{ c: number }>(signups)[0]?.c ?? 0,
    paid: rows<{ c: number }>(paid)[0]?.c ?? 0,
  }
}

export type SourceRow = {
  src: string
  sessions: number
  signups: number
  paid: number
}

export async function getConversionsBySource(days: number | null): Promise<SourceRow[]> {
  // engaged sessions per first-touch source
  const sess = rows<{ src: string; sessions: number }>(
    await db.execute<{ src: string; sessions: number }>(sql`
      SELECT COALESCE(NULLIF(props->>'src',''), 'direct / organic') AS src, COUNT(DISTINCT session_id)::int AS sessions
      FROM analytics_events
      WHERE ${since(days)} AND session_id IN (${engagedSessions(days)})
      GROUP BY 1`),
  )
  // conversions per first-touch source. Sign-ups carry the campaign cookie's src directly, but
  // paid_upgrade is emitted by the Stripe webhook (no cookie, no src) — so fall back to the
  // member's own earliest tagged event, or every paid member reads as "direct / organic".
  const conv = rows<{ src: string; signups: number; paid: number }>(
    await db.execute<{ src: string; signups: number; paid: number }>(sql`
      WITH firsttouch AS (
        SELECT DISTINCT ON (user_id) user_id, props->>'src' AS src
        FROM analytics_events
        WHERE user_id IS NOT NULL AND COALESCE(props->>'src','') <> ''
        ORDER BY user_id, created_at
      )
      SELECT COALESCE(NULLIF(e.props->>'src',''), f.src, 'direct / organic') AS src,
        COUNT(*) FILTER (WHERE e.event_name IN ${SIGNUP_EVENTS})::int AS signups,
        COUNT(*) FILTER (WHERE e.event_name = 'paid_upgrade')::int AS paid
      FROM analytics_events e
      LEFT JOIN firsttouch f ON f.user_id = e.user_id
      WHERE ${days == null ? sql`TRUE` : sql`e.created_at >= now() - make_interval(days => ${days})`} AND e.event_name IN ('business_signup','business_claim_submitted','paid_upgrade')
      GROUP BY 1`),
  )
  const map = new Map<string, SourceRow>()
  for (const s of sess) map.set(s.src, { src: s.src, sessions: s.sessions, signups: 0, paid: 0 })
  for (const c of conv) {
    const row = map.get(c.src) ?? { src: c.src, sessions: 0, signups: 0, paid: 0 }
    row.signups = c.signups
    row.paid = c.paid
    map.set(c.src, row)
  }
  return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions || b.paid - a.paid).slice(0, 15)
}

// current paying members snapshot (live, not windowed) — same definition as getMemberHealth
export async function getPayingSnapshot(): Promise<{ paying: number; mrr: number }> {
  const r = rows<{ paying: number; mrr: number }>(
    await db.execute<{ paying: number; mrr: number }>(sql`
      SELECT COUNT(*) FILTER (WHERE status IN ('active','trialing') AND tier IN ('standard','premium'))::int AS paying,
        COALESCE(SUM(CASE WHEN status IN ('active','trialing') AND tier = 'standard' THEN 39.99
                          WHEN status IN ('active','trialing') AND tier = 'premium' THEN 99.99 ELSE 0 END), 0)::float AS mrr
      FROM subscriptions`),
  )
  return { paying: r[0]?.paying ?? 0, mrr: r[0]?.mrr ?? 0 }
}
