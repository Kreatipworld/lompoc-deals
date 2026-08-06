#!/usr/bin/env node
// Member check-in — how we treat the people who pay us.
// Audits EVERY paying member end-to-end: billing health, profile completeness,
// and the partner surfaces they're entitled to (badge, slides, map, digest).
// Run after any deploy that touches members, and before any sales conversation:
//   node --env-file=.env.local scripts/check-members.mjs
// Exits non-zero if any member is being shortchanged.
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const SITE = "https://www.lompoclocals.com"
const g = (s) => `\x1b[32m${s}\x1b[0m`
const r = (s) => `\x1b[31m${s}\x1b[0m`
const y = (s) => `\x1b[33m${s}\x1b[0m`

let failures = 0
let warnings = 0
const ok = (msg) => console.log(`  ${g("✓")} ${msg}`)
const bad = (msg) => { failures++; console.log(`  ${r("✗")} ${msg}`) }
const warn = (msg) => { warnings++; console.log(`  ${y("⚠")} ${msg}`) }

// ── Who pays us? Real subscriptions only; overrides are comps, listed after.
const members = await sql.query(`
  select b.id, b.name, b.slug, b.email as biz_email, b.logo_url, b.cover_url,
         b.about, b.hours_json, b.instagram_url, b.facebook_url, b.plan_override,
         b.photos_json, b.status as biz_status, b.lat, b.lng,
         u.email as owner_email,
         s.tier, s.status as sub_status, s.current_period_end, s.stripe_subscription_id
  from subscriptions s
  join users u on u.id = s.user_id
  join businesses b on b.owner_user_id = u.id
  where s.status in ('active','trialing') and s.tier in ('standard','premium')
  order by b.name`)

const comps = await sql.query(`
  select b.name, b.slug, b.plan_override from businesses b
  left join subscriptions s on s.user_id = b.owner_user_id
    and s.status in ('active','trialing') and s.tier in ('standard','premium')
  where b.plan_override in ('standard','premium') and s.id is null
  order by b.name`)

console.log(`\nPaying members: ${members.length}`)
if (members.length === 0) { bad("no paying members found — that can't be right"); process.exit(1) }

const [pois, homepage, subscribers, suppressions] = await Promise.all([
  fetch(`${SITE}/api/map-pois`).then((res) => res.json()),
  fetch(`${SITE}/en`).then((res) => res.text()),
  sql.query(`select email from subscribers where confirmed_at is not null`),
  sql.query(`select email from email_suppressions`),
])
const subscriberSet = new Set(subscribers.map((s) => s.email.toLowerCase()))
const suppressedSet = new Set(suppressions.map((s) => s.email.toLowerCase()))
const htmlEsc = (s) => s.replace(/&/g, "&amp;").replace(/'/g, "&#x27;")

for (const m of members) {
  console.log(`\n${m.name} — ${m.tier === "premium" ? "Plus" : "Growth"} (${m.owner_email})`)

  // Billing
  if (m.sub_status === "active" || m.sub_status === "trialing") {
    const end = new Date(m.current_period_end)
    if (end.getTime() > Date.now()) ok(`subscription ${m.sub_status}, renews ${end.toISOString().slice(0, 10)}`)
    else bad(`subscription ${m.sub_status} but period ended ${end.toISOString().slice(0, 10)} — webhook drift?`)
  }
  if (!m.stripe_subscription_id?.includes("Glg4SBRCBh"))
    bad(`subscription ${m.stripe_subscription_id} is NOT on the Lompoc Stripe account`)
  if (m.plan_override) warn(`plan_override='${m.plan_override}' still set — masks real billing state, revoke it`)

  // Listing state
  if (m.biz_status !== "approved") bad(`listing status is '${m.biz_status}', not approved`)
  const photos = Array.isArray(m.photos_json) ? m.photos_json.length : 0
  if (!m.cover_url) bad("no cover photo")
  if (!m.logo_url) warn("no logo")
  if (!m.about) warn("no about text — enrich it")
  if (photos < 3) warn(`only ${photos} photos`)
  if (!m.hours_json) warn("no hours")
  if (!m.instagram_url && !m.facebook_url) warn("no social links")

  // Surfaces they pay for
  const page = await fetch(`${SITE}/en/biz/${m.slug}`)
  if (!page.ok) bad(`business page HTTP ${page.status}`)
  else {
    const html = await page.text()
    if (html.includes("Official Partner")) ok("Official Partner badge live")
    else bad("badge missing on business page")
  }
  const poi = pois.find((p) => p.slug === m.slug)
  if (m.lat == null || m.lng == null) ok("service-area member — no map pin expected")
  else if (poi?.partner) ok("partner marker on the map")
  else bad("no partner marker on the map")
  if (homepage.includes(htmlEsc(m.name))) ok("on the homepage partner slides")
  else warn("not in this render of the homepage slides (rotation or gap — re-check)")

  // Communication
  const emails = [m.owner_email, m.biz_email].filter(Boolean).map((e) => e.toLowerCase())
  if (emails.some((e) => subscriberSet.has(e))) ok("subscribed to the Saturday digest")
  else warn("not on the digest — every member should see the edition they can appear in")
  for (const e of emails) if (suppressedSet.has(e)) bad(`${e} is in email_suppressions — our mail can't reach them`)
}

if (comps.length) {
  console.log(`\nComped (override, no real subscription): ${comps.length}`)
  for (const c of comps) console.log(`  · ${c.name} (${c.plan_override})`)
}

const mrr = members.reduce((n, m) => n + (m.tier === "premium" ? 99.99 : 39.99), 0)
console.log(`\nMRR from real members: $${mrr.toFixed(2)}`)
console.log(failures ? r(`\n${failures} failure(s), ${warnings} warning(s).`) : g(`\nAll members in good standing. ${warnings} warning(s).`))
process.exit(failures ? 1 : 0)
