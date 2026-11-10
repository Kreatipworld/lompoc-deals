#!/usr/bin/env node
/**
 * Monday scoreboard → Orchestra page `lompoc-locals-scoreboard` (Nov 10 2026, Joda gate "Key metrics
 * tracked every week"; owner: "check and improve our platform ... know what we're doing").
 *
 * One row per finished week (Mon–Sun, Pacific), baseline week of Oct 12. Every number is rebuilt
 * from what the site already stores, so a missed Monday never leaves a hole:
 *   Google  — gsc_daily (clicks, impressions, CTR, queries averaging page 1)
 *   Site    — engaged sessions only (2+ events, honest-numbers rule); visits from Instagram /
 *             Facebook / TikTok (utm src first, else referrer host)
 *   Members — paying count from that week's Monday learning report (cron_runs 'weekly-learning'),
 *             real-world actions (call / directions / website) on paying members' pages, claims
 *
 *   node --env-file=.env.local scripts/scoreboard.mjs          # write the page
 *   node --env-file=.env.local scripts/scoreboard.mjs --dry    # print the markdown only
 *
 * Runs on the bot box every Monday 8:20 AM PT (crontab, after the 8 AM learning report).
 */
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const BASELINE = "2026-10-12"
const SLUG = "lompoc-locals-scoreboard"
const ACTIONS = ["phone_click", "directions_click", "website_click"]

const weeks = await sql`
  WITH w AS (
    SELECT generate_series(${BASELINE}::date, (date_trunc('week', now() AT TIME ZONE 'America/Los_Angeles') - interval '7 days')::date, interval '7 days')::date AS wk
  )
  SELECT wk FROM w ORDER BY wk`

const gsc = new Map(
  (await sql`
    WITH t AS (
      SELECT date_trunc('week', date)::date AS wk, SUM(clicks)::int AS clicks, SUM(impressions)::int AS imps
      FROM gsc_daily WHERE date >= ${BASELINE} GROUP BY 1
    ),
    p AS (
      SELECT wk, COUNT(*)::int AS page1 FROM (
        SELECT date_trunc('week', date)::date AS wk, query FROM gsc_daily
        WHERE date >= ${BASELINE} AND query IS NOT NULL GROUP BY 1, 2 HAVING AVG(position) <= 10) q
      GROUP BY wk
    )
    SELECT t.*, COALESCE(p.page1, 0) AS page1 FROM t LEFT JOIN p USING (wk)`).map((r) => [iso(r.wk), r])
)

const site = new Map(
  (await sql`
    WITH ev AS (
      SELECT e.*, date_trunc('week', e.created_at AT TIME ZONE 'America/Los_Angeles')::date AS wk
      FROM analytics_events e
      WHERE e.created_at >= ${BASELINE}::date AND e.session_id IS NOT NULL
    ),
    eng AS (SELECT session_id FROM ev GROUP BY session_id HAVING COUNT(*) > 1),
    first AS (
      SELECT DISTINCT ON (session_id) session_id, wk,
        lower(coalesce(props->>'src', '')) AS src, lower(coalesce(props->>'referrer', '')) AS ref
      FROM ev WHERE session_id IN (SELECT session_id FROM eng)
      ORDER BY session_id, created_at
    )
    SELECT wk, COUNT(*)::int AS engaged,
      COUNT(*) FILTER (WHERE src LIKE 'ig%' OR src LIKE 'instagram%' OR (src = '' AND ref LIKE '%instagram.com%'))::int AS ig,
      COUNT(*) FILTER (WHERE src IN ('fb', 'facebook', 'meta') OR (src = '' AND (ref LIKE '%facebook.com%' OR ref LIKE '%fb.com%')))::int AS fb,
      COUNT(*) FILTER (WHERE src IN ('tt', 'tiktok') OR (src = '' AND ref LIKE '%tiktok.com%'))::int AS tt
    FROM first GROUP BY wk`).map((r) => [iso(r.wk), r])
)

const actions = new Map(
  (await sql`
    WITH paying AS (
      SELECT b.id FROM businesses b JOIN subscriptions s ON s.user_id = b.owner_user_id
      WHERE s.status IN ('active', 'trialing', 'past_due') AND s.tier IN ('standard', 'premium')
    )
    SELECT date_trunc('week', created_at AT TIME ZONE 'America/Los_Angeles')::date AS wk, COUNT(*)::int AS n
    FROM analytics_events
    WHERE created_at >= ${BASELINE}::date AND event_name = ANY(${ACTIONS})
      AND target_id IN (SELECT id FROM paying)
    GROUP BY 1`).map((r) => [iso(r.wk), r.n])
)

const claims = new Map(
  (await sql`
    SELECT date_trunc('week', created_at AT TIME ZONE 'America/Los_Angeles')::date AS wk, COUNT(*)::int AS n
    FROM business_claims WHERE created_at >= ${BASELINE}::date AND status = 'approved' GROUP BY 1`).map((r) => [iso(r.wk), r.n])
)

// Paying members as counted by the Monday learning report that closed each week (it runs Monday 8 AM PT).
const paying = await sql`
  SELECT created_at, (result->>'paying')::int AS paying FROM cron_runs
  WHERE name = 'weekly-learning' AND ok = true AND result ? 'paying' ORDER BY created_at`
function payingAfter(weekStart) {
  const close = new Date(new Date(weekStart).getTime() + 7 * 86400000)
  const hit = paying.find((p) => new Date(p.created_at) >= close)
  return hit ? hit.paying : null
}

const [now] = await sql`
  SELECT COUNT(*)::int AS n, COALESCE(SUM(CASE WHEN tier = 'premium' THEN 99.99 ELSE 39.99 END), 0)::numeric(10,2) AS mrr
  FROM subscriptions WHERE status IN ('active', 'trialing') AND tier IN ('standard', 'premium')`

function iso(d) {
  return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10)
}
const fmt = (n) => (n === null || n === undefined ? "–" : Number(n).toLocaleString("en-US"))
const label = (wk) => new Date(`${wk}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

const rows = weeks.map(({ wk }) => {
  const k = iso(wk)
  const g = gsc.get(k) ?? {}
  const s = site.get(k) ?? {}
  return {
    week: label(k),
    clicks: g.clicks ?? 0,
    imps: g.imps ?? 0,
    ctr: g.imps ? `${((100 * g.clicks) / g.imps).toFixed(2)}%` : "–",
    page1: g.page1 ?? 0,
    engaged: s.engaged ?? 0,
    ig: s.ig ?? 0,
    fb: s.fb ?? 0,
    tt: s.tt ?? 0,
    paying: payingAfter(k),
    actions: actions.get(k) ?? 0,
    claims: claims.get(k) ?? 0,
  }
})

const last = rows[rows.length - 1]
const prev = rows[rows.length - 2]
const delta = (a, b) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / (b || 1)) * 100)}%` : "")
const perMember = last && now.n ? (last.actions / now.n).toFixed(1) : "0"

const md = `# Lompoc Locals — Weekly scoreboard

_Rebuilt every Monday 8:20 AM PT by \`scripts/scoreboard.mjs\` (bot box crontab). Weeks run Mon–Sun, Pacific.
Baseline: week of Oct 12 2026. Engaged visits only (2+ events per session), so bots never count._

## Right now
- **Paying members:** ${now.n} · **MRR:** $${now.mrr}
- **Last week (${last?.week ?? "–"}):** ${fmt(last?.clicks)} Google clicks (${delta(last?.clicks, prev?.clicks)}), ${fmt(last?.imps)} impressions (${delta(last?.imps, prev?.imps)}), ${fmt(last?.engaged)} engaged visits (${delta(last?.engaged, prev?.engaged)})
- **Member value:** ${fmt(last?.actions)} calls/directions/website taps on paying members' pages = ${perMember} per member

## Week by week
| Week of | Google clicks | Impressions | CTR | Page-1 queries | Engaged visits | From IG | From FB | From TikTok | Paying | Member actions | Claims |
|---|---|---|---|---|---|---|---|---|---|---|---|
${rows
  .slice()
  .reverse()
  .map((r) => `| ${r.week} | ${fmt(r.clicks)} | ${fmt(r.imps)} | ${r.ctr} | ${fmt(r.page1)} | ${fmt(r.engaged)} | ${fmt(r.ig)} | ${fmt(r.fb)} | ${fmt(r.tt)} | ${fmt(r.paying)} | ${fmt(r.actions)} | ${fmt(r.claims)} |`)
  .join("\n")}

## What each number is for
- **Google clicks / impressions / page-1 queries:** is search growing? (goal: #1 in Lompoc)
- **From IG / FB / TikTok:** do our videos bring people to the site? Story link stickers should lift IG.
- **Member actions:** what paying members actually get. Low numbers here are churn risk.
- Social video views live in Buffer / Post Bridge analytics; they are not in this table yet.
`

if (process.argv.includes("--dry")) {
  console.log(md)
  process.exit(0)
}

const secrets = join(homedir(), "Projects", "Orchestra", "dashboard", ".secrets")
const url = (process.env.ORCHESTRA_URL || readFileSync(join(secrets, "prod-url.txt"), "utf8")).trim().replace(/\/$/, "")
const token = (process.env.ORCHESTRA_INGEST_TOKEN || readFileSync(join(secrets, "ingest-token.txt"), "utf8")).trim()
const res = await fetch(`${url}/api/bot/pages/${SLUG}`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Lompoc Locals — Weekly scoreboard",
    section: "ventures",
    venture: "lompoc-locals",
    content_md: md,
    source_bot: "lompoc-locals-lead",
  }),
})
if (!res.ok) {
  console.error(`Orchestra ${res.status}: ${await res.text()}`)
  process.exit(1)
}
console.log(`Scoreboard written: ${rows.length} weeks, last = ${last?.week}`)
