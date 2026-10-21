#!/usr/bin/env node
/**
 * Meta ads weekly readout — the "machine monitor" (memory: ad-performance-monitor).
 * Pulls ad-level insights from the Meta Marketing API for our campaign, computes the
 * KPIs we care about for an AWARENESS / Reach campaign, applies the kill/scale rules
 * from the ads skill, and prints a Monday readout (also saved as a dated .md).
 *
 *   node scripts/ads/meta-weekly.mjs                 # last 7 days, our campaign
 *   node scripts/ads/meta-weekly.mjs --days 14
 *   node scripts/ads/meta-weekly.mjs --since-launch  # lifetime (date_preset=maximum)
 *   node scripts/ads/meta-weekly.mjs --account        # whole ad account, not just our campaigns
 *   node scripts/ads/meta-weekly.mjs --campaign ID    # one campaign only
 *
 * Default scope = every campaign whose name starts with "LL_" (our naming convention), so
 * awareness + leads campaigns roll up together and client campaigns in the Kreatip account
 * never leak into the numbers. The "Spend vs return" section joins that spend to our own
 * analytics_events (DATABASE_URL from .env.local): sign-ups and paid members whose first
 * touch was Meta, valued at their real Stripe price.
 *
 * Credentials (never commit): put them in ~/.config/lompoc-locals/meta-ads.json
 *   { "access_token": "...", "ad_account_id": "1575790085794628",
 *     "campaign_id": "120249475838780250", "api_version": "v21.0" }
 * ...or set env META_ACCESS_TOKEN / META_AD_ACCOUNT_ID / META_CAMPAIGN_ID / META_API_VERSION
 * (env wins over the file). Get a token = System User in Kreatip Business Manager with the
 * `ads_read` permission on the ad account (see the script's --help output for steps).
 *
 * Dependency-free on purpose (node built-ins + global fetch, Node 18+).
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

// ── args ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const val = (f, d) => { const i = argv.indexOf(f); return i > -1 ? argv[i + 1] : d }
if (has("--help") || has("-h")) {
  console.log(`Meta weekly ads readout.

Usage:
  node scripts/ads/meta-weekly.mjs [--days N | --since-launch] [--account] [--out DIR]

Credentials — ~/.config/lompoc-locals/meta-ads.json (chmod 600) or env vars:
  META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_CAMPAIGN_ID (optional), META_API_VERSION (default v21.0)

Getting a token (one time):
  1. business.facebook.com -> Business settings -> Users -> System users -> Add (name it "ads-reader").
  2. Assign the Kreatip ad account (1575790085794628) to it with the "View performance" (ads_read) task.
  3. Generate a token for that system user with the  ads_read  scope. System-user tokens are long-lived.
  4. Save it:  mkdir -p ~/.config/lompoc-locals && \
     printf '{"access_token":"PASTE","ad_account_id":"1575790085794628","campaign_id":"120249475838780250"}' \
       > ~/.config/lompoc-locals/meta-ads.json && chmod 600 ~/.config/lompoc-locals/meta-ads.json
`)
  process.exit(0)
}

// ── credentials ─────────────────────────────────────────────────────────────
const CONFIG_PATH = join(homedir(), ".config", "lompoc-locals", "meta-ads.json")
let fileCfg = {}
try { fileCfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) } catch { /* file optional */ }

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || fileCfg.access_token
const RAW_ACCOUNT = process.env.META_AD_ACCOUNT_ID || fileCfg.ad_account_id || "1575790085794628"
const CAMPAIGN_ID = has("--account") ? null : (val("--campaign") || process.env.META_CAMPAIGN_ID || null)
const CAMPAIGN_PREFIX = has("--account") || CAMPAIGN_ID ? null : "LL_"
const API_VERSION = process.env.META_API_VERSION || fileCfg.api_version || "v21.0"
const ACCOUNT_ID = RAW_ACCOUNT.startsWith("act_") ? RAW_ACCOUNT : `act_${RAW_ACCOUNT}`

if (!ACCESS_TOKEN) {
  console.error(`Missing Meta access token.\nPut one in ${CONFIG_PATH} or set META_ACCESS_TOKEN.`)
  console.error(`Run  node scripts/ads/meta-weekly.mjs --help  for how to get a token.`)
  process.exit(1)
}

// ── window ───────────────────────────────────────────────────────────────────
const SINCE_LAUNCH = has("--since-launch")
const DAYS = Number.parseInt(val("--days", "7"), 10)
if (!SINCE_LAUNCH && (!Number.isFinite(DAYS) || DAYS < 1 || DAYS > 92)) {
  console.error("--days must be 1..92"); process.exit(1)
}
// Meta's last_Nd presets EXCLUDE today, so a same-day check read $0 — use an explicit range that ends today.
const datePreset = SINCE_LAUNCH ? "maximum" : null
const timeParams = datePreset
  ? { date_preset: datePreset }
  : (() => {
      const until = new Date(); const since = new Date(); since.setDate(since.getDate() - (DAYS - 1))
      const iso = (d) => d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }) // ad account runs on Pacific time; UTC flips to tomorrow at 5 PM
      return { time_range: JSON.stringify({ since: iso(since), until: iso(until) }) }
    })()

const FIELDS = [
  "campaign_name", "adset_name", "ad_name", "ad_id",
  "impressions", "reach", "frequency", "spend", "cpm", "cpp", "ctr",
  "inline_link_click_ctr", "clicks", "actions", "cost_per_action_type",
  "video_thruplay_watched_actions", "quality_ranking", "engagement_rate_ranking",
].join(",")

// ── fetch ────────────────────────────────────────────────────────────────────
function buildUrl() {
  const u = new URL(`https://graph.facebook.com/${API_VERSION}/${ACCOUNT_ID}/insights`)
  u.searchParams.set("level", "ad")
  u.searchParams.set("fields", FIELDS)
  u.searchParams.set("time_increment", "all_days")
  u.searchParams.set("limit", "200")
  for (const [k, v] of Object.entries(timeParams)) u.searchParams.set(k, v)
  if (CAMPAIGN_ID) u.searchParams.set("filtering", JSON.stringify([{ field: "campaign.id", operator: "IN", value: [CAMPAIGN_ID] }]))
  else if (CAMPAIGN_PREFIX) u.searchParams.set("filtering", JSON.stringify([{ field: "campaign.name", operator: "CONTAIN", value: CAMPAIGN_PREFIX }]))
  u.searchParams.set("access_token", ACCESS_TOKEN)
  return u
}

async function getAll() {
  const rows = []
  let url = buildUrl().toString()
  let guard = 0
  while (url && guard++ < 25) {
    const res = await fetch(url)
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.error) {
      const e = json.error || {}
      console.error(`Meta API error (${res.status}): ${e.message || res.statusText}`)
      if (e.code === 190) console.error("Token is invalid or expired — generate a fresh system-user token (see --help).")
      if (String(e.message || "").includes("version")) console.error(`Try a newer Graph version via META_API_VERSION (current: ${API_VERSION}).`)
      process.exit(1)
    }
    rows.push(...(json.data || []))
    url = json.paging?.next || null
  }
  return rows
}

// ── helpers ──────────────────────────────────────────────────────────────────
const num = (x) => { const n = Number.parseFloat(x); return Number.isFinite(n) ? n : 0 }
const sumActions = (list, type) => (list || []).filter((a) => a.action_type === type).reduce((s, a) => s + num(a.value), 0)
const anyActions = (list) => (list || []).reduce((s, a) => s + num(a.value), 0)
const money = (n) => `$${n.toFixed(2)}`
const pct = (n) => `${n.toFixed(2)}%`

// Kill/scale rules (ads skill + memory: ad-performance-monitor)
const KILL_SPEND = 15      // $ before an early kill check applies
const KILL_CTR = 0.8       // % link CTR below this (with spend >= KILL_SPEND) => kill candidate
const FATIGUE_FREQ = 2.5   // frequency above this => creative fatigue watch

function analyze(rows) {
  const ads = rows.map((r) => {
    const spend = num(r.spend)
    const reach = num(r.reach)
    const thruplays = anyActions(r.video_thruplay_watched_actions)
    const landingViews = sumActions(r.actions, "landing_page_view")
    const linkClicks = sumActions(r.actions, "link_click") || num(r.clicks)
    const leads = sumActions(r.actions, "lead")
    const linkCtr = num(r.inline_link_click_ctr)
    const flags = []
    if (spend >= KILL_SPEND && linkCtr > 0 && linkCtr < KILL_CTR) flags.push("KILL? low CTR")
    if (spend >= KILL_SPEND && landingViews === 0 && linkClicks === 0) flags.push("KILL? no clicks/LPV")
    if (num(r.frequency) > FATIGUE_FREQ) flags.push("FATIGUE")
    return {
      name: r.ad_name || r.ad_id,
      campaign: r.campaign_name || "",
      reach, impressions: num(r.impressions), frequency: num(r.frequency),
      spend, cpm: num(r.cpm), cpp: num(r.cpp), ctr: num(r.ctr), linkCtr,
      linkClicks, landingViews, thruplays,
      costPerThruPlay: thruplays ? spend / thruplays : 0,
      leads,
      quality: r.quality_ranking || "—", engagement: r.engagement_rate_ranking || "—",
      flags,
    }
  })
  // winner = cheapest cost per 1,000 reached (CPP) among ads with meaningful spend; tie-break reach
  const spent = ads.filter((a) => a.spend > 0.5)
  if (spent.length > 1) {
    const sorted = [...spent].sort((a, b) => (a.cpp || Infinity) - (b.cpp || Infinity))
    sorted[0].flags.unshift("WINNER (cheapest reach)")
    if (sorted[0].cpp > 0 && sorted.at(-1).cpp > sorted[0].cpp * 1.3) sorted.at(-1).flags.unshift("LAGGING")
  }
  return ads
}

function render(ads) {
  const totalSpend = ads.reduce((s, a) => s + a.spend, 0)
  const totalReach = ads.reduce((s, a) => s + a.reach, 0) // note: reach overlaps across ads; indicative only
  const totalThru = ads.reduce((s, a) => s + a.thruplays, 0)
  const L = []
  L.push(`# Meta weekly readout — ${CAMPAIGN_ID ? "campaign " + CAMPAIGN_ID : CAMPAIGN_PREFIX ? `all "${CAMPAIGN_PREFIX}" campaigns` : "account " + ACCOUNT_ID}`)
  L.push(`Window: ${SINCE_LAUNCH ? "since launch" : `last ${DAYS} days`}  ·  generated ${new Date().toISOString()}`)
  L.push("")
  if (!ads.length) {
    L.push("No delivery in this window — the campaign may still be a paused draft, or hasn't spent yet.")
    return L.join("\n")
  }
  L.push("| Campaign | Ad | Reach | Freq | Spend | CPM | Cost/1k reach | CTR | Link CTR | Clicks | LPV | ThruPlays | $/ThruPlay | Flags |")
  L.push("|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|")
  for (const a of ads) {
    L.push(`| ${a.campaign.replace(/^LL_/, "").split("_")[0]} | ${a.name} | ${a.reach.toLocaleString()} | ${a.frequency.toFixed(2)} | ${money(a.spend)} | ${money(a.cpm)} | ${money(a.cpp)} | ${pct(a.ctr)} | ${pct(a.linkCtr)} | ${a.linkClicks} | ${a.landingViews} | ${a.thruplays} | ${a.costPerThruPlay ? money(a.costPerThruPlay) : "—"} | ${a.flags.join("; ") || ""} |`)
  }
  L.push("")
  L.push(`**Totals:** spend ${money(totalSpend)} · ThruPlays ${totalThru} · reach (overlapping) ~${totalReach.toLocaleString()}`)
  L.push("")
  // Action suggestions
  const actions = []
  for (const a of ads) {
    if (a.flags.some((f) => f.startsWith("KILL"))) actions.push(`- Turn OFF **${a.name}** — ${a.flags.find((f) => f.startsWith("KILL"))} (spend ${money(a.spend)}).`)
    if (a.flags.includes("FATIGUE")) actions.push(`- **${a.name}** frequency ${a.frequency.toFixed(2)} — refresh creative or widen audience.`)
    if (a.flags.includes("WINNER (cheapest reach)")) actions.push(`- Scale **${a.name}** +20% (wait 3–5 days between bumps); clone it into 1–2 fresh variants.`)
  }
  if (totalSpend < KILL_SPEND) actions.unshift(`- Still in the learning phase (spend ${money(totalSpend)} < $${KILL_SPEND}) — watch only, don't react to noise yet.`)
  L.push("## Suggested actions")
  L.push(actions.length ? actions.join("\n") : "- Nothing to change yet — keep running.")
  L.push("")
  return L.join("\n")
}

// ── spend vs return ─────────────────────────────────────────────────────────
// First-touch sources that mean "came from a Meta ad" (utm_source=meta, or fbclid → facebook).
const META_SOURCES = ["meta", "facebook", "fb", "instagram", "ig"]
const MONTHS_KEPT = 12 // value a paid member at 12 months of their real price (owner's planning horizon)
const MAX_CAC = 80     // $ we are willing to pay per paid member (memory: ad-performance-monitor)

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    const env = readFileSync(join(process.cwd(), ".env.local"), "utf8")
    const m = env.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m)
    return m?.[1] || null
  } catch { return null }
}

async function getReturns() {
  const url = databaseUrl()
  if (!url) return null
  const { neon } = await import("@neondatabase/serverless")
  const q = neon(url)
  const days = SINCE_LAUNCH ? 3650 : DAYS
  // Sessions + sign-ups carry the campaign cookie directly. paid_upgrade comes from the Stripe
  // webhook (no cookie), so it is attributed through the member's own earlier events instead.
  const [r] = await q`
    WITH firsttouch AS (
      SELECT DISTINCT ON (user_id) user_id, props->>'src' AS src
      FROM analytics_events
      WHERE user_id IS NOT NULL AND COALESCE(props->>'src','') <> ''
      ORDER BY user_id, created_at
    ),
    win AS (SELECT * FROM analytics_events WHERE created_at >= now() - make_interval(days => ${days}))
    SELECT
      (SELECT COUNT(DISTINCT session_id) FROM win
        WHERE props->>'src' = ANY(${META_SOURCES}) AND session_id IN (
          SELECT session_id FROM win WHERE session_id IS NOT NULL GROUP BY session_id HAVING COUNT(*) > 1))::int AS visits,
      (SELECT COUNT(*) FROM win w LEFT JOIN firsttouch f ON f.user_id = w.user_id
        WHERE w.event_name IN ('business_signup','business_claim_submitted')
          AND COALESCE(NULLIF(w.props->>'src',''), f.src) = ANY(${META_SOURCES}))::int AS signups,
      (SELECT COUNT(*) FROM win w LEFT JOIN firsttouch f ON f.user_id = w.user_id
        WHERE w.event_name = 'paid_upgrade'
          AND COALESCE(NULLIF(w.props->>'src',''), f.src) = ANY(${META_SOURCES}))::int AS paid,
      (SELECT COALESCE(SUM((w.props->>'priceUsdCents')::int), 0) FROM win w LEFT JOIN firsttouch f ON f.user_id = w.user_id
        WHERE w.event_name = 'paid_upgrade'
          AND COALESCE(NULLIF(w.props->>'src',''), f.src) = ANY(${META_SOURCES}))::int AS mrr_cents`
  return r
}

function renderReturns(spend, r) {
  const L = ["## Spend vs return", ""]
  if (!r) {
    L.push("_No DATABASE_URL (.env.local) — run from the repo root to include sign-ups and revenue._")
    return L.join("\n")
  }
  const mrr = r.mrr_cents / 100
  const value = mrr * MONTHS_KEPT
  const per = (n) => (n ? money(spend / n) : "—")
  L.push("| Spent | Meta visits | Sign-ups | Paid members | New MRR | 12-month value | Return per $1 |")
  L.push("|--:|--:|--:|--:|--:|--:|--:|")
  L.push(`| ${money(spend)} | ${r.visits} | ${r.signups} | ${r.paid} | ${money(mrr)} | ${money(value)} | ${spend ? "$" + (value / spend).toFixed(2) : "—"} |`)
  L.push("")
  L.push(`Cost per visit ${per(r.visits)} · per sign-up ${per(r.signups)} · per paid member ${per(r.paid)} (cap ${money(MAX_CAC)})` +
    (mrr ? ` · ad spend paid back in ${(spend / mrr).toFixed(1)} months of their fees` : ""))
  if (r.paid && spend / r.paid > MAX_CAC) L.push(`- Over the cap: each paid member cost ${per(r.paid)} — change creative or audience before adding budget.`)
  else if (!r.paid && spend >= MAX_CAC) L.push(`- ${money(spend)} spent with no paid member yet — past the cap; rethink the angle before adding budget.`)
  L.push("")
  L.push("_First touch only: a member counts as Meta if their earliest tagged visit came from a Meta ad. Spend is every ad in scope (awareness included)._")
  return L.join("\n")
}

// ── run ──────────────────────────────────────────────────────────────────────
const rows = await getAll()
const ads = analyze(rows)
const returns = await getReturns().catch((e) => { console.error(`(spend vs return skipped: ${e.message})`); return null })
const report = render(ads) + "\n\n" + renderReturns(ads.reduce((t, a) => t + a.spend, 0), returns)
console.log("\n" + report + "\n")

// save a dated copy outside the repo (no repo churn)
try {
  const outDir = val("--out", join(homedir(), "Lompoc-Ad-Reports"))
  mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 10)
  const file = join(outDir, `meta-${stamp}.md`)
  writeFileSync(file, report + "\n")
  console.log(`Saved: ${file}`)
} catch (e) {
  console.error(`(could not save report file: ${e.message})`)
}
