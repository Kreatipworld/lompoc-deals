import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { Resend } from "resend"
import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { logCronRun } from "@/lib/cron-log"
import { OUTBOUND_EVENTS } from "@/lib/analytics/events"
import {
  platformKpis,
  platformSources,
  actionsByBusiness,
  topPages,
  type PlatformKpis,
} from "@/lib/analytics/platform-stats"

export const dynamic = "force-dynamic"
export const maxDuration = 120

/**
 * Monday learning report — the self-sufficient half of the platform loop.
 * Last 7 days vs the 7 before, sources, top pages, real-world actions by
 * business, membership, and a rules-based "what to make next". Founder inbox
 * only. `?dry=1` returns the HTML without sending, `?debug=1` the numbers.
 */

function rows<T>(r: unknown): T[] {
  return Array.isArray(r) ? (r as T[]) : ((r as { rows: T[] }).rows ?? [])
}

const OUTBOUND_ARRAY = sql.raw(`ARRAY[${OUTBOUND_EVENTS.map((e) => `'${e}'`).join(",")}]`)

/** Same KPIs as platformKpis("7d"), but for the 7 days BEFORE that window. */
async function priorWeekKpis(): Promise<PlatformKpis> {
  const [r] = rows<Record<string, number>>(
    await db.execute(sql`
      WITH win AS (SELECT now() - interval '14 days' AS a, now() - interval '7 days' AS b),
      eng AS (
        SELECT session_id FROM analytics_events, win
        WHERE session_id IS NOT NULL AND created_at > win.a AND created_at <= win.b
        GROUP BY 1 HAVING COUNT(*) > 1
      )
      SELECT
        (SELECT COUNT(*)::int FROM eng) AS engaged_visits,
        (SELECT COUNT(DISTINCT session_id)::int FROM analytics_events, win WHERE session_id IS NOT NULL AND created_at > win.a AND created_at <= win.b) AS raw_sessions,
        (SELECT COUNT(*)::int FROM analytics_events, win WHERE event_name IN ('business_page_viewed','page_viewed') AND created_at > win.a AND created_at <= win.b AND session_id IN (SELECT session_id FROM eng)) AS site_views,
        (SELECT COUNT(*)::int FROM analytics_events, win WHERE event_name = 'deal_view' AND created_at > win.a AND created_at <= win.b AND session_id IN (SELECT session_id FROM eng)) AS deal_views,
        (SELECT COUNT(*)::int FROM analytics_events, win WHERE event_name = ANY(${OUTBOUND_ARRAY}) AND created_at > win.a AND created_at <= win.b) AS actions,
        (SELECT COUNT(*)::int FROM analytics_events, win WHERE event_name = 'deal_claim' AND created_at > win.a AND created_at <= win.b) AS claims,
        (SELECT COUNT(*)::int FROM coupon_claims, win WHERE status = 'redeemed' AND redeemed_at > win.a AND redeemed_at <= win.b) AS redeems,
        (SELECT COUNT(*)::int FROM users, win WHERE created_at > win.a AND created_at <= win.b) AS signups
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

/** Paying subscriptions created in a 7-day window ending `offsetDays` ago. */
async function newPayingMembers(offsetDays: number): Promise<number> {
  const [r] = rows<{ n: number }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS n FROM subscriptions
      WHERE status = 'active' AND tier IN ('standard','premium')
        AND created_at > now() - make_interval(days => ${7 + offsetDays})
        AND created_at <= now() - make_interval(days => ${offsetDays})`)
  )
  return Number(r?.n ?? 0)
}

async function membership() {
  const [m] = rows<{ paying: number; mrr: string }>(
    await db.execute(sql`
      SELECT COUNT(*) FILTER (WHERE s.status = 'active' AND s.tier <> 'free')::int AS paying,
             COALESCE(SUM(CASE WHEN s.status = 'active' AND s.tier = 'standard' THEN 39.99
                               WHEN s.status = 'active' AND s.tier = 'premium' THEN 99.99 ELSE 0 END), 0)::numeric(10,2) AS mrr
      FROM subscriptions s`)
  )
  const atRisk = rows<{ name: string }>(
    await db.execute(sql`
      SELECT b.name FROM subscriptions s JOIN businesses b ON b.owner_user_id = s.user_id
      WHERE s.status = 'past_due' ORDER BY b.name`)
  )
  const [claims] = rows<{ n: number }>(
    await db.execute(sql`SELECT COUNT(*)::int AS n FROM business_claims WHERE status = 'pending'`)
  )
  // Comped = plan_override with no real subscription; never counted as paying.
  const [comped] = rows<{ n: number }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS n FROM businesses b
      WHERE b.plan_override IS NOT NULL AND b.status = 'approved'
        AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = b.owner_user_id AND s.status IN ('active','trialing') AND s.tier <> 'free')`)
  )
  return {
    paying: Number(m?.paying ?? 0),
    mrr: Number(m?.mrr ?? 0),
    comped: Number(comped?.n ?? 0),
    atRisk: atRisk.map((r) => r.name),
    pendingClaims: Number(claims?.n ?? 0),
  }
}

/** 3+ real-world actions this week and no published story naming them in 14 days. */
async function spotlightCandidates() {
  return rows<{ name: string; slug: string; actions: number }>(
    await db.execute(sql`
      SELECT b.name, b.slug, COUNT(e.id)::int AS actions
      FROM businesses b
      JOIN analytics_events e ON e.target_type = 'business' AND e.target_id = b.id
        AND e.event_name = ANY(${OUTBOUND_ARRAY})
        AND e.created_at > now() - interval '7 days'
      WHERE b.status = 'approved'
        AND NOT EXISTS (
          SELECT 1 FROM blog_posts p
          WHERE p.status = 'published' AND p.published_at > now() - interval '14 days'
            AND (p.content ILIKE '%' || b.name || '%' OR p.title ILIKE '%' || b.name || '%'))
      GROUP BY b.id, b.name, b.slug
      HAVING COUNT(e.id) >= 3
      ORDER BY actions DESC LIMIT 8`)
  )
}

async function upcomingMoments() {
  const all = rows<{ id: number; title: string; starts_at: string; location: string | null }>(
    await db.execute(sql`
      SELECT id, title, starts_at::text, location FROM events
      WHERE status = 'approved' AND image_url IS NOT NULL
        AND starts_at > now() AND starts_at < now() + interval '7 days'
      ORDER BY starts_at LIMIT 24`)
  )
  // Recurring events (same title on consecutive days) collapse to their first date.
  const seen = new Set<string>()
  const unique: typeof all = []
  for (const m of all) {
    if (seen.has(m.title)) continue
    seen.add(m.title)
    unique.push(m)
  }
  return unique.slice(0, 8)
}

async function collect() {
  const [kpis, prior, sources, pages, actions, members, candidates, moments, newMembersNow, newMembersPrior] =
    await Promise.all([
      platformKpis("7d"),
      priorWeekKpis(),
      platformSources("7d"),
      topPages("7d", 10),
      actionsByBusiness("7d", 10),
      membership(),
      spotlightCandidates(),
      upcomingMoments(),
      newPayingMembers(0),
      newPayingMembers(7),
    ])
  return { kpis, prior, sources, pages, actions, members, candidates, moments, newMembersNow, newMembersPrior, generatedAt: new Date() }
}
type Report = Awaited<ReturnType<typeof collect>>

// ── rendering ───────────────────────────────────────────────────────────────

const PT = "America/Los_Angeles"
const PURPLE = "#650C75"
const GOLD = "#EFC618"
const MUTED = "#6b6b6b"

function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: PT, ...opts }).format(d)
}

function delta(now: number, before: number): string {
  if (before === 0) return now > 0 ? "▲ new" : "— flat"
  const pct = Math.round(((now - before) / before) * 100)
  if (pct === 0) return "= 0%"
  return `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}%`
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

const TD = "padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top"
const TD_R = `${TD};text-align:right`

function kpiCell(label: string, now: number, before: number): string {
  return `<td style="padding:10px 8px;border:1px solid #eee;vertical-align:top;width:33%">
    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">${label}</div>
    <div style="font-size:24px;font-weight:700;color:#1a1a1a">${now.toLocaleString()}</div>
    <div style="font-size:12px;color:${PURPLE}">${delta(now, before)} vs prior week</div></td>`
}

function dataTable(cols: string[], body: string, empty: string): string {
  if (!body) return `<p style="color:${MUTED};font-size:13px;margin:0">${empty}</p>`
  const head = cols
    .map((c, i) => `<th style="text-align:${i ? "right" : "left"};padding:6px 8px;border-bottom:2px solid ${PURPLE};font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED}">${c}</th>`)
    .join("")
  return `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function section(title: string, inner: string): string {
  return `<div style="margin:22px 0"><h2 style="font-size:15px;margin:0 0 8px;color:${PURPLE};letter-spacing:.02em">${title}</h2>${inner}</div>`
}

function membershipLabel(m: string): string {
  if (m === "paying") return "paying"
  if (m === "comped") return "comped"
  if (m === "pending") return "claim pending"
  return ""
}

function nextItems(d: Report): string[] {
  const items: string[] = []
  const lead = [
    ...d.pages.slice(0, 3).map((p) => `${p.path} (${p.views} views)`),
    ...d.sources.slice(0, 3).map((s) => `${s.source.replace("_", " ")} (${s.count})`),
  ]
  items.push(
    lead.length
      ? `<b>Ride the attention.</b> Top this week: ${esc(lead.join(" · "))}. The next post pays off the top page and goes where the top source lives.`
      : `<b>No engaged traffic recorded.</b> Check that the page-view beacon is firing before planning content.`
  )
  items.push(
    d.candidates.length
      ? `<b>Spotlight candidates</b> (3+ real-world actions, no story in 14 days): ${d.candidates.map((c) => `${esc(c.name)} (${c.actions})`).join(", ")}.`
      : `<b>No uncovered business crossed 3 real-world actions</b> — pick a paying member for the next spotlight.`
  )
  items.push(
    d.moments.length
      ? `<b>Moments to own</b> in the next 7 days: ${d.moments
          .map((m) => `${esc(m.title)} (${fmtDate(new Date(m.starts_at), { weekday: "short", month: "short", day: "numeric" })})`)
          .join(" · ")}. Trailer + story + event page for the biggest one.`
      : `<b>No covered events in the next 7 days</b> — add the week's events with covers before Thursday.`
  )
  items.push(`<b>Buffer post metrics are not pulled here yet</b> — pull them in the session (list_posts includeMetrics) and compare against these site numbers.`)
  return items
}

function renderHtml(d: Report): string {
  const { kpis, prior, members } = d
  const kpiRows = [
    [kpiCell("Engaged visits", kpis.engagedVisits, prior.engagedVisits), kpiCell("Site page views", kpis.siteViews, prior.siteViews), kpiCell("Deal views", kpis.dealViews, prior.dealViews)],
    [kpiCell("Real-world actions", kpis.actions, prior.actions), kpiCell("Deal claims", kpis.claims, prior.claims), kpiCell("New signups", kpis.signups, prior.signups)],
    [
      kpiCell("New paying members", d.newMembersNow, d.newMembersPrior),
      `<td colspan="2" style="padding:10px 8px;border:1px solid #eee;vertical-align:top"><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Raw sessions (mostly crawlers)</div><div style="font-size:16px;color:${MUTED};margin-top:6px">${kpis.rawSessions.toLocaleString()} this week · ${prior.rawSessions.toLocaleString()} prior</div></td>`,
    ],
  ]
  const srcRows = d.sources
    .slice(0, 10)
    .map((s) => `<tr><td style="${TD}">${esc(s.source.replace("_", " "))}</td><td style="${TD_R}">${s.count}</td><td style="${TD_R};color:${MUTED}">${s.pct}%</td></tr>`)
    .join("")
  const pageRows = d.pages
    .map((p) => `<tr><td style="${TD};word-break:break-all">${esc(p.path)}</td><td style="${TD_R}">${p.views}</td><td style="${TD_R};color:${MUTED}">${p.sessions}</td></tr>`)
    .join("")
  const actRows = d.actions
    .map((a) => `<tr><td style="${TD};word-break:break-word">${esc(a.name)} <span style="color:${MUTED};font-size:11px">${membershipLabel(a.membership)}</span></td><td style="${TD_R}">${a.total}</td><td style="${TD_R};color:${MUTED};white-space:nowrap">${a.website} · ${a.phone} · ${a.directions}</td></tr>`)
    .join("")
  const weekLabel = `${fmtDate(new Date(d.generatedAt.getTime() - 7 * 864e5), { month: "short", day: "numeric" })} – ${fmtDate(d.generatedAt, { month: "short", day: "numeric" })}`
  const membersLine =
    `${members.paying} paying · $${members.mrr.toFixed(2)} MRR · ${members.comped} comped · ${members.pendingClaims} claim${members.pendingClaims === 1 ? "" : "s"} pending` +
    (members.atRisk.length ? ` · <span style="color:#b45309">at risk: ${esc(members.atRisk.join(", "))}</span>` : " · no cards failing")

  return `<!doctype html><html><body style="margin:0;background:#f6f3f8;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a">
<div style="max-width:600px;margin:0 auto;padding:20px 14px">
  <div style="background:${PURPLE};color:#fff;padding:18px 16px;border-radius:12px 12px 0 0">
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${GOLD}">Lompoc Locals · weekly learning report</div>
    <div style="font-size:22px;font-weight:700;margin-top:4px">${weekLabel}</div>
    <div style="font-size:12px;opacity:.85;margin-top:2px">Engaged sessions only (2+ events). Raw sessions are mostly crawlers.</div>
  </div>
  <div style="background:#fff;padding:16px;border-radius:0 0 12px 12px;border:1px solid #e6dcec;border-top:0">
    <table role="presentation" style="width:100%;border-collapse:collapse;table-layout:fixed">${kpiRows.map((r) => `<tr>${r.join("")}</tr>`).join("")}</table>
    ${section("Where people found us", dataTable(["Source", "Visits", "Share"], srcRows, "No engaged visits recorded this week."))}
    ${section("Top pages", dataTable(["Page", "Views", "Sessions"], pageRows, "No page views recorded yet — the site-wide beacon shipped Sep 4."))}
    ${section("Real-world actions by business", dataTable(["Business", "Total", "web · call · dir"], actRows, "No outbound clicks this week."))}
    ${section("Members", `<p style="font-size:14px;margin:0">${membersLine}</p>`)}
    ${section("What to make next", `<ul style="padding-left:18px;margin:0;font-size:14px;line-height:1.5">${nextItems(d).map((i) => `<li style="margin-bottom:6px">${i}</li>`).join("")}</ul>`)}
    <p style="font-size:12px;color:${MUTED};margin:22px 0 0">Live numbers: <a href="https://www.lompoclocals.com/admin?window=7d" style="color:${PURPLE}">lompoclocals.com/admin</a> · generated ${fmtDate(d.generatedAt, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} PT</p>
  </div>
</div></body></html>`
}

// ── handler ─────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Crons must read the live database, never Next's fetch cache (Neon driver
  // goes through fetch, and GET handlers cache identical fetches).
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = new URL(request.url)
  const dry = url.searchParams.get("dry") === "1"
  const debug = url.searchParams.get("debug") === "1"

  const data = await collect()
  if (debug) return NextResponse.json({ ...data, generatedAt: data.generatedAt.toISOString() })

  const html = renderHtml(data)
  if (dry) return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: "Lompoc Locals <hello@lompoclocals.com>",
    to: "hello@lompoclocals.com",
    subject: `Lompoc Locals — weekly learning report (${fmtDate(data.generatedAt, { month: "short", day: "numeric" })})`,
    html,
  })
  const result = {
    sent: error ? 0 : 1,
    engagedVisits: data.kpis.engagedVisits,
    siteViews: data.kpis.siteViews,
    actions: data.kpis.actions,
    paying: data.members.paying,
    error: error?.message ?? null,
  }
  await logCronRun("weekly-learning", result, !error)
  return NextResponse.json(result)
}
