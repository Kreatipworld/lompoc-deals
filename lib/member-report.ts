import { neon } from "@neondatabase/serverless"

/**
 * Monthly "your numbers" report for paying members (Oct 20 2026, owner: members keep paying
 * for what they can see working). Honest-numbers rule: only ENGAGED sessions (2+ events)
 * count, so crawler hits never inflate a member's report.
 */

export type MemberMonthStats = {
  businessId: number
  views: number
  calls: number
  directions: number
  website: number
  dealViews: number
  dealClaims: number
  prevViews: number
}

export type MemberRecipient = {
  businessId: number
  businessName: string
  slug: string
  ownerEmail: string
  ownerName: string
  hasActiveDeal: boolean
}

// Owner accounts created by our own tooling — never real members (same list as re-engage).
const PLACEHOLDER = [
  "system@lompocdeals.test",
  "scraper@lompocdeals.system",
  "seedowner@lompocdeals.internal",
  "owner@lompocdeals.test",
  "demo-deals@lompoc-locals.local",
]

/** Calendar month before `now`, in Pacific time: [start, end). */
export function previousMonthRange(now = new Date()): { start: Date; end: Date; prevStart: Date; label: string } {
  const pt = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
  const y = pt.getFullYear()
  const m = pt.getMonth() // current month index; report covers m-1
  const iso = (yy: number, mm: number) => {
    const d = new Date(Date.UTC(yy, mm, 1, 8)) // 08:00 UTC ≈ midnight PT (DST drift ≤1h is fine for monthly counts)
    return d
  }
  const start = iso(y, m - 1)
  const end = iso(y, m)
  const prevStart = iso(y, m - 2)
  const label = start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
  return { start, end, prevStart, label }
}

export async function getMemberRecipients(sql = neon(process.env.DATABASE_URL!)): Promise<MemberRecipient[]> {
  const rows = await sql`
    SELECT b.id, b.name, b.slug, u.email, COALESCE(b.owner_full_name, '') AS owner_name,
      EXISTS (SELECT 1 FROM deals d WHERE d.business_id = b.id AND d.paused = false AND d.expires_at > now()) AS has_deal
    FROM businesses b
    JOIN users u ON u.id = b.owner_user_id
    JOIN subscriptions s ON s.user_id = u.id
    WHERE b.status = 'approved'
      AND s.status IN ('active', 'trialing') AND s.tier IN ('standard', 'premium')
      AND u.email IS NOT NULL
      AND u.email <> ALL(${PLACEHOLDER})
      AND lower(u.email) NOT IN (SELECT lower(email) FROM email_suppressions)
    ORDER BY b.id`
  return rows.map((r) => ({
    businessId: r.id as number,
    businessName: r.name as string,
    slug: r.slug as string,
    ownerEmail: r.email as string,
    ownerName: (r.owner_name as string).trim(),
    hasActiveDeal: Boolean(r.has_deal),
  }))
}

export async function getMemberMonthStats(
  businessIds: number[],
  range: { start: Date; end: Date; prevStart: Date },
  sql = neon(process.env.DATABASE_URL!)
): Promise<Map<number, MemberMonthStats>> {
  const out = new Map<number, MemberMonthStats>()
  if (!businessIds.length) return out
  const rows = await sql`
    WITH eng AS (
      SELECT session_id FROM analytics_events
      WHERE created_at >= ${range.prevStart} AND created_at < ${range.end} AND session_id IS NOT NULL
      GROUP BY session_id HAVING COUNT(*) > 1
    ),
    ev AS (
      SELECT e.event_name, e.created_at,
        CASE WHEN e.target_type = 'deal' THEN d.business_id ELSE e.target_id END AS biz
      FROM analytics_events e
      LEFT JOIN deals d ON e.target_type = 'deal' AND d.id = e.target_id
      WHERE e.created_at >= ${range.prevStart} AND e.created_at < ${range.end}
        AND e.event_name IN ('business_page_viewed','phone_click','directions_click','website_click','deal_view','deal_claim')
        AND e.session_id IN (SELECT session_id FROM eng)
    )
    SELECT biz,
      COUNT(*) FILTER (WHERE event_name = 'business_page_viewed' AND created_at >= ${range.start})::int AS views,
      COUNT(*) FILTER (WHERE event_name = 'phone_click' AND created_at >= ${range.start})::int AS calls,
      COUNT(*) FILTER (WHERE event_name = 'directions_click' AND created_at >= ${range.start})::int AS directions,
      COUNT(*) FILTER (WHERE event_name = 'website_click' AND created_at >= ${range.start})::int AS website,
      COUNT(*) FILTER (WHERE event_name = 'deal_view' AND created_at >= ${range.start})::int AS deal_views,
      COUNT(*) FILTER (WHERE event_name = 'deal_claim' AND created_at >= ${range.start})::int AS deal_claims,
      COUNT(*) FILTER (WHERE event_name = 'business_page_viewed' AND created_at < ${range.start})::int AS prev_views
    FROM ev
    WHERE biz = ANY(${businessIds})
    GROUP BY biz`
  for (const r of rows) {
    out.set(r.biz as number, {
      businessId: r.biz as number,
      views: r.views as number,
      calls: r.calls as number,
      directions: r.directions as number,
      website: r.website as number,
      dealViews: r.deal_views as number,
      dealClaims: r.deal_claims as number,
      prevViews: r.prev_views as number,
    })
  }
  return out
}
