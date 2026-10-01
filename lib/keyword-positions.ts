import { neon } from "@neondatabase/serverless"

/**
 * Read models over gsc_daily + tracked_keywords for /admin/seo (and, in phase
 * 2, the member dashboard). All windows end at today; GSC lags ~2 days, so the
 * last two days of any window are usually empty — that is Google, not us.
 *
 * Matching rule for a tracked keyword (the UI states it): a GSC query counts
 * when it equals the keyword OR contains it as a substring, both lower-cased.
 * "lompoc tires" therefore collects "lompoc tires", "lompoc tires shop" and
 * "best lompoc tires" — the family of searches, not one string.
 */

const sql = () => neon(process.env.DATABASE_URL!)

// ---------- pure helpers (lib/keyword-positions.test.ts) ----------

/** The canonical form a keyword is stored in: lower-case, single spaces, letters (Latin, accents included)/digits/&/' only. */
export function normalizeKeyword(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏ\s&']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** The matching rule, in one place. */
export function queryMatchesKeyword(query: string, keyword: string): boolean {
  const q = query.toLowerCase()
  const k = keyword.toLowerCase()
  return k.length > 0 && (q === k || q.includes(k))
}

/** Impression-weighted average position; null when nothing was shown. */
export function weightedPosition(rows: { impressions: number; position: number }[]): number | null {
  let imp = 0
  let acc = 0
  for (const r of rows) {
    if (r.impressions <= 0) continue
    imp += r.impressions
    acc += r.impressions * r.position
  }
  return imp > 0 ? acc / imp : null
}

/**
 * Δ position between two windows: negative = moved UP the page (good).
 * Returns null unless both windows have data.
 */
export function positionDelta(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null
  return current - previous
}

/** Percentage change, null when there is no baseline. */
export function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/** A page URL from GSC → the path we'd show (host and trailing slash dropped). */
export function pagePath(url: string): string {
  try {
    const u = new URL(url)
    const p = u.pathname.replace(/\/$/, "")
    return (p || "/") + u.search
  } catch {
    return url
  }
}

// ---------- read models ----------

export type Kpis = {
  clicks: number
  impressions: number
  position: number | null
  queries: number
}
export type KpiWindow = { days: number; current: Kpis; previous: Kpis }

export async function hasGscData(): Promise<boolean> {
  const [r] = await sql()`select exists(select 1 from gsc_daily) as present`
  return Boolean(r?.present)
}

export async function latestGscDate(): Promise<string | null> {
  const [r] = await sql()`select max(date)::text as d from gsc_daily`
  return (r?.d as string | null) ?? null
}

function kpiRow(r: Record<string, unknown> | undefined): Kpis {
  return {
    clicks: Number(r?.clicks ?? 0),
    impressions: Number(r?.impressions ?? 0),
    position: r?.position == null ? null : Number(r.position),
    queries: Number(r?.queries ?? 0),
  }
}

/** Clicks, impressions, weighted position and distinct queries — this window vs the previous one. */
export async function kpiWindow(days = 28): Promise<KpiWindow> {
  const q = sql()
  const [cur, prev] = await Promise.all([
    q`select coalesce(sum(clicks),0)::int as clicks, coalesce(sum(impressions),0)::int as impressions,
             case when sum(impressions) > 0 then sum(position*impressions)/sum(impressions) end as position,
             count(distinct query)::int as queries
      from gsc_daily where date > current_date - ${days}::int`,
    q`select coalesce(sum(clicks),0)::int as clicks, coalesce(sum(impressions),0)::int as impressions,
             case when sum(impressions) > 0 then sum(position*impressions)/sum(impressions) end as position,
             count(distinct query)::int as queries
      from gsc_daily where date > current_date - ${days * 2}::int and date <= current_date - ${days}::int`,
  ])
  return { days, current: kpiRow(cur[0]), previous: kpiRow(prev[0]) }
}

export type TrackedKeywordRow = {
  id: number
  keyword: string
  targetPath: string | null
  note: string | null
  business: { id: number; name: string; slug: string; logoUrl: string | null } | null
  bestPage: string | null
  position7d: number | null
  delta7d: number | null
  impressions28d: number
  clicks28d: number
  /** Last 28 days, oldest first; null on days without an impression. */
  daily: (number | null)[]
}

/**
 * Every tracked keyword with its family of matching queries aggregated:
 * best page (most impressions, 28 d), 7-day weighted position, Δ vs the 7 days
 * before, 28-day totals, and the daily position series for a sparkline.
 * Three queries regardless of how many keywords there are.
 */
export async function trackedKeywordRows(): Promise<TrackedKeywordRow[]> {
  const q = sql()
  const [keywords, daily, pages] = await Promise.all([
    q`select tk.id, tk.keyword, tk.target_path, tk.note,
             b.id as business_id, b.name as business_name, b.slug as business_slug, b.logo_url as business_logo
      from tracked_keywords tk
      left join businesses b on b.id = tk.business_id
      order by tk.business_id nulls first, tk.keyword`,
    q`select tk.id, g.date::text as date, sum(g.impressions)::int as impressions, sum(g.clicks)::int as clicks,
             case when sum(g.impressions) > 0 then sum(g.position*g.impressions)/sum(g.impressions) end as position
      from tracked_keywords tk
      join gsc_daily g on position(tk.keyword in lower(g.query)) > 0
      where g.date > current_date - 28
      group by tk.id, g.date`,
    q`select distinct on (tk.id) tk.id, g.page, sum(g.impressions)::int as impressions
      from tracked_keywords tk
      join gsc_daily g on position(tk.keyword in lower(g.query)) > 0
      where g.date > current_date - 28
      group by tk.id, g.page
      order by tk.id, sum(g.impressions) desc`,
  ])

  const dayKeys: string[] = []
  const today = new Date()
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
    dayKeys.push(d.toISOString().slice(0, 10))
  }
  const cutoff7 = dayKeys[21]
  const cutoff14 = dayKeys[14]

  const byKeyword = new Map<number, { date: string; impressions: number; clicks: number; position: number | null }[]>()
  for (const r of daily) {
    const id = Number(r.id)
    const list = byKeyword.get(id) ?? []
    list.push({
      date: String(r.date),
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      position: r.position == null ? null : Number(r.position),
    })
    byKeyword.set(id, list)
  }
  const bestPage = new Map<number, string>()
  for (const r of pages) bestPage.set(Number(r.id), String(r.page))

  return keywords.map((k) => {
    const id = Number(k.id)
    const rows = byKeyword.get(id) ?? []
    const byDate = new Map(rows.map((r) => [r.date, r]))
    const withPos = (list: typeof rows) => list.filter((r) => r.position != null) as { impressions: number; position: number }[]
    const last7 = withPos(rows.filter((r) => r.date >= cutoff7))
    const prev7 = withPos(rows.filter((r) => r.date >= cutoff14 && r.date < cutoff7))
    const position7d = weightedPosition(last7)
    return {
      id,
      keyword: String(k.keyword),
      targetPath: (k.target_path as string | null) ?? null,
      note: (k.note as string | null) ?? null,
      business: k.business_id
        ? { id: Number(k.business_id), name: String(k.business_name), slug: String(k.business_slug), logoUrl: (k.business_logo as string | null) ?? null }
        : null,
      bestPage: bestPage.get(id) ?? null,
      position7d,
      delta7d: positionDelta(position7d, weightedPosition(prev7)),
      impressions28d: rows.reduce((s, r) => s + r.impressions, 0),
      clicks28d: rows.reduce((s, r) => s + r.clicks, 0),
      daily: dayKeys.map((d) => byDate.get(d)?.position ?? null),
    }
  })
}

export type Opportunity = { query: string; impressions: number; clicks: number; position: number; bestPage: string }

/**
 * Queries already on page 1–2 (weighted position 5–15) with real demand
 * (≥ 20 impressions in 28 d): the pages to strengthen next.
 */
export async function opportunities(limit = 40): Promise<Opportunity[]> {
  const rows = await sql()`
    with agg as (
      select query, sum(impressions)::int as impressions, sum(clicks)::int as clicks,
             sum(position*impressions)/sum(impressions) as position
      from gsc_daily where date > current_date - 28
      group by query having sum(impressions) >= 20
    ),
    best as (
      select distinct on (query) query, page
      from gsc_daily where date > current_date - 28
      group by query, page order by query, sum(impressions) desc
    )
    select a.query, a.impressions, a.clicks, a.position, b.page
    from agg a join best b on b.query = a.query
    where a.position between 5 and 15
    order by a.impressions desc limit ${limit}`
  return rows.map((r) => ({
    query: String(r.query),
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    position: Number(r.position),
    bestPage: String(r.page),
  }))
}

export type TopQuery = { query: string; impressions: number; clicks: number; position: number }
export type TopPage = { page: string; impressions: number; clicks: number; position: number }

export async function topQueries(days = 28, limit = 25): Promise<TopQuery[]> {
  const rows = await sql()`
    select query, sum(impressions)::int as impressions, sum(clicks)::int as clicks,
           sum(position*impressions)/nullif(sum(impressions),0) as position
    from gsc_daily where date > current_date - ${days}::int
    group by query order by sum(clicks) desc, sum(impressions) desc limit ${limit}`
  return rows.map((r) => ({ query: String(r.query), impressions: Number(r.impressions), clicks: Number(r.clicks), position: Number(r.position ?? 0) }))
}

export async function topPages(days = 28, limit = 25): Promise<TopPage[]> {
  const rows = await sql()`
    select page, sum(impressions)::int as impressions, sum(clicks)::int as clicks,
           sum(position*impressions)/nullif(sum(impressions),0) as position
    from gsc_daily where date > current_date - ${days}::int
    group by page order by sum(clicks) desc, sum(impressions) desc limit ${limit}`
  return rows.map((r) => ({ page: String(r.page), impressions: Number(r.impressions), clicks: Number(r.clicks), position: Number(r.position ?? 0) }))
}

/** For the overview tile: 28-day clicks + how many keywords we watch. Cheap. */
export async function seoTileStats(): Promise<{ clicks28d: number; tracked: number; hasData: boolean }> {
  const q = sql()
  const [[c], [k]] = await Promise.all([
    q`select coalesce(sum(clicks),0)::int as clicks, count(*)::int as n from gsc_daily where date > current_date - 28`,
    q`select count(*)::int as n from tracked_keywords`,
  ])
  return { clicks28d: Number(c?.clicks ?? 0), tracked: Number(k?.n ?? 0), hasData: Number(c?.n ?? 0) > 0 }
}

/** Members (Growth/Plus, paid or comped) for the add-keyword business picker. */
export async function memberBusinessOptions(): Promise<{ id: number; name: string; slug: string }[]> {
  const rows = await sql()`
    select distinct b.id, b.name, b.slug
    from businesses b
    left join subscriptions s on s.user_id = b.owner_user_id and s.status in ('active','trialing') and s.tier in ('standard','premium')
    where b.status = 'approved' and (b.plan_override in ('standard','premium') or s.id is not null)
    order by b.name`
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name), slug: String(r.slug) }))
}
