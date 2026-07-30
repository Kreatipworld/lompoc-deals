#!/usr/bin/env node
// MASSIVE claim-outreach campaign for unclaimed Lompoc business listings.
// Queries the live DB for every reachable unclaimed, approved listing, then
// cleans the list (drops corporate/PR/vendor/gov/nonprofit inboxes, malformed
// addresses, already-contacted businesses), dedupes by email, and sends a
// personalized branded invite to each — with throttling to protect deliverability.
//
// EMAIL-APPROVAL RULE: dry-run by default. Nothing sends without SEND=1.
//
//   See the cleaned list:   node scripts/send-claim-campaign.mjs
//   Dump stacked preview:   DUMP=/path/out.html node scripts/send-claim-campaign.mjs
//   Preview N to hub:       PREVIEW=1 SEND=1 LIMIT=3 node scripts/send-claim-campaign.mjs
//   Send a wave:            SEND=1 LIMIT=40 node scripts/send-claim-campaign.mjs
//   Send next wave:         SEND=1 LIMIT=40 OFFSET=40 node scripts/send-claim-campaign.mjs
//   Send everything:        SEND=1 node scripts/send-claim-campaign.mjs
import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY")
const dbUrl = pick("DATABASE_URL")
const authSecret = pick("AUTH_SECRET") || ""
if (!key || !dbUrl) { console.error("missing RESEND_API_KEY or DATABASE_URL"); process.exit(1) }
if (!authSecret) console.warn("warning: AUTH_SECRET missing — unsubscribe tokens won't match the site")
const sql = neon(dbUrl)

// One-click unsubscribe URL, signed so it can't opt out arbitrary addresses.
// Must match app/api/unsubscribe/route.ts exactly.
const unsubToken = (email) =>
  crypto.createHmac("sha256", authSecret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (email) =>
  `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const SEND = process.env.SEND === "1"
const PREVIEW = process.env.PREVIEW === "1"
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null
const OFFSET = process.env.OFFSET ? Number(process.env.OFFSET) : 0
const SLEEP_MS = process.env.SLEEP_MS ? Number(process.env.SLEEP_MS) : 700
const SENT_LOG = process.env.SENT_LOG || "/Users/kreatip/Projects/lompoc-deals/scripts/data/campaign-sent.log"
const SUPPRESS_LOG = process.env.SUPPRESS_LOG || "/Users/kreatip/Projects/lompoc-deals/scripts/data/unsubscribed.log"
// CAN-SPAM requires a valid physical postal address on commercial email.
// TODO(owner): replace with the real Lompoc Locals mailing address / PO box.
const POSTAL = process.env.POSTAL || "Lompoc Locals, Lompoc, CA 93436"
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const GUIDE = "https://www.lompoclocals.com/partner-guide.html"

// Businesses already contacted (Wave 1 + Alfie's) and ones held back on purpose
// (nonprofits, a volunteer trail committee, a property-mgmt firm) — non-deal fit.
const EXCLUDE_IDS = new Set([
  630,224,200,497,404,197,159,368,305,148,515,321, // wave 1
  130,                                              // Alfie's (already sent)
  262,289,519,                                      // Achievement House, Bodger Trail, American Stages
])
// Corporate/PR/vendor/government inboxes — not the local owner; skip to protect
// sender reputation and avoid emailing a franchise HQ or a web vendor.
const EXCLUDE_EMAILS = new Set([
  "press@starbucks.com","custserv@bootbarn.com","digitalcare@dollargeneral.com",
  "press@compass.com","privacy@nva.com","support@evetsites.com","website_support@spoton.com",
  "info@company.co","recreation@ci.lompoc.ca.us","slo@california-west.com",
  "anaheim@kaizencollisioncenter.com","info@goodwillvsb.org","vtcinfo@vtc-sm.org",
])

// Category → tailored language.
const CAT = {
  "Food & Drink":   { deal: "&ldquo;Taco Tuesday, $2 off&rdquo; or &ldquo;$5 off your first online order&rdquo;", search: "somewhere to eat in Lompoc" },
  "Wineries":       { deal: "&ldquo;2-for-1 tasting flight this weekend&rdquo;", search: "a tasting room" },
  "Dispensaries":   { deal: "a first-visit offer for locals", search: "a dispensary" },
  "Auto":           { deal: "&ldquo;$15 off an oil change or smog check&rdquo;", search: "an auto shop" },
  "Services":       { deal: "&ldquo;$25 off your first service call&rdquo;", search: "help for a job around the house" },
  "Health & Beauty":{ deal: "&ldquo;20% off your first appointment&rdquo;", search: "a salon or studio" },
  "Retail":         { deal: "&ldquo;10% off for locals this weekend&rdquo;", search: "a local shop" },
  "Entertainment":  { deal: "a locals&rsquo; offer on your next event", search: "something to do in Lompoc" },
}
const catFor = (c) => CAT[c] || { deal: "a little something just for locals", search: "a local spot" }
const subjectFor = (b) => `Your ${b.name} page on Lompoc Locals — ready to claim (free)`

function htmlFor(b) {
  const c = catFor(b.category)
  const claimUrl = `https://www.lompoclocals.com/signup?claim=${b.slug}`
  const seen = b.views30 >= 10
    ? `it&rsquo;s already getting found: <strong>${b.views30} neighbors looked up ${b.name} here in the last month.</strong>`
    : `neighbors are already finding it here.`
  const lookups = b.views30 >= 10 ? `those ${b.views30} lookups` : "the neighbors already finding you"
  const freeBullets = [
    "Your page becomes yours to run — edit photos, your story, hours, and links any time.",
    `You show up in the directory, on the map, and in local search when neighbors look for ${c.search}.`,
    "Reply to this email any time — a real person here in Lompoc reads it.",
  ]
  const growthBullets = [
    `<strong>Post a deal &mdash; something like ${c.deal}</strong> &mdash; and it drops into the feed <em>and</em> our weekly email digest to locals' inboxes across Lompoc.`,
    `<strong>Show up first in your category</strong> &mdash; when a neighbor searches for ${c.search}, ${b.name} is a name they see.`,
    "<strong>See how many locals viewed your page each week</strong> &mdash; real numbers, so you know what's bringing people in.",
  ]
  return `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">${b.name} is on Lompoc Locals.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Hi there &mdash; we're <strong>Lompoc Locals</strong>, a community hub where neighbors find the local spots that make Lompoc, Lompoc. We built a page for ${b.name}, and ${seen}</p>
      <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:15px;">Claiming your page is free &mdash; and always will be.</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 22px; padding-left:20px;">
        ${freeBullets.map((x) => `<li style="margin-bottom:6px;">${x}</li>`).join("")}
      </ul>
      <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
        <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Turn lookups into regulars &mdash; try Growth</div>
        <p style="color:#444; line-height:1.6; margin:0 0 12px;">The attention&rsquo;s already there &mdash; Growth is how you turn ${lookups} into repeat customers:</p>
        <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
          ${growthBullets.map((x) => `<li style="margin-bottom:8px;">${x}</li>`).join("")}
        </ul>
        <p style="color:#1a1a1a; line-height:1.6; margin:0; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month &mdash; and your <strong>first 14 days are free</strong>. Cancel anytime; no long-term anything.</p>
      </div>
      <p style="margin:0 0 8px;">
        <a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim ${b.name} &amp; start your free trial</a>
      </p>
      <p style="color:#777; line-height:1.5; margin:0 0 22px; font-size:13px;">Claiming your page is always free &mdash; you&rsquo;ll see the option to start Growth free for 14 days right after. No charge to begin.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">And consider this a personal invitation: <a href="${GUIDE}" style="color:${P}; font-weight:700;">take a look at our partner guide</a> &mdash; it walks through everything Lompoc Locals does for neighborhood spots like yours. No pressure at all; claiming the page is free and yours to keep either way.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">We're just neighbors trying to help local spots get found. Reply any time; this reaches a real person here in Lompoc.</p>
      <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team</p>
      <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
        <div style="margin-bottom:8px;">
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#EFC618; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#0B992F; margin:0 3px;"></span>
        </div>
        <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
        <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
        <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">
          You're getting this because ${b.name} is listed on Lompoc Locals. <a href="${unsubUrl(b.email)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or just reply &ldquo;unsubscribe&rdquo; and we'll remove you right away.<br>${POSTAL}
        </div>
      </div>
    </div>
  </div>`
}

// --- Pull + clean the target list ---------------------------------------
const rows = await sql`
  WITH v AS (
    SELECT target_id, COUNT(*) views30 FROM analytics_events
    WHERE event_name='business_page_viewed' AND target_type='business' AND created_at > now() - interval '30 days'
    GROUP BY target_id
  )
  SELECT b.id, b.name, b.slug, lower(b.email) AS email, COALESCE(c.name,'Other') AS category, COALESCE(v.views30,0)::int AS views30
  FROM businesses b
  LEFT JOIN users u ON u.id=b.owner_user_id
  LEFT JOIN categories c ON c.id=b.category_id
  LEFT JOIN v ON v.target_id=b.id
  WHERE (u.email IN ('scraper@lompocdeals.system','seedowner@lompocdeals.internal','owner@lompocdeals.test','demo-deals@lompoc-locals.local') OR u.email IS NULL)
    AND b.email IS NOT NULL AND b.email <> '' AND b.status='approved'
    AND b.name !~* '(church|baptist|ministry|parish|chapel|congregation)'
  ORDER BY COALESCE(v.views30,0) DESC, b.name`

const loadLog = (p) => new Set(existsSync(p) ? readFileSync(p, "utf8").split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean) : [])
const alreadySent = loadLog(SENT_LOG)
const suppressed = loadLog(SUPPRESS_LOG)   // opted-out / bounced (file fallback)
// Authoritative opt-out list: everyone who used the one-click unsubscribe link.
const dbSuppressed = await sql`SELECT lower(email) AS email FROM email_suppressions`
for (const r of dbSuppressed) suppressed.add(r.email)
const validEmail = (e) => /^[^\s\\@]+@[^\s\\@]+\.[^\s\\@]+$/.test(e)
const seenEmail = new Set()
let dropped = { excludedId: 0, excludedEmail: 0, malformed: 0, dupe: 0, alreadySent: 0, suppressed: 0 }
const clean = []
for (const b of rows) {
  if (EXCLUDE_IDS.has(b.id)) { dropped.excludedId++; continue }
  if (EXCLUDE_EMAILS.has(b.email)) { dropped.excludedEmail++; continue }
  if (!validEmail(b.email)) { dropped.malformed++; continue }
  if (suppressed.has(b.email)) { dropped.suppressed++; continue }
  if (alreadySent.has(b.email)) { dropped.alreadySent++; continue }
  if (seenEmail.has(b.email)) { dropped.dupe++; continue }
  seenEmail.add(b.email)
  clean.push(b)
}

// Target one business precisely (one-off invites): ONLY_EMAIL=... or ONLY_ID=...
const ONLY_EMAIL = (process.env.ONLY_EMAIL || "").trim().toLowerCase()
const ONLY_ID = process.env.ONLY_ID ? Number(process.env.ONLY_ID) : null
let pool = clean
if (ONLY_EMAIL) pool = pool.filter((b) => b.email === ONLY_EMAIL)
if (ONLY_ID) pool = pool.filter((b) => b.id === ONLY_ID)
let list = pool.slice(OFFSET, LIMIT ? OFFSET + LIMIT : undefined)

if (process.env.DUMP) {
  const { writeFileSync } = await import("node:fs")
  const stacked = list.map((b) =>
    `<div style="margin-bottom:40px;"><div style="font:600 13px system-ui;color:#650C75;margin:0 0 6px;">to: ${b.email} &nbsp;·&nbsp; ${b.category} &nbsp;·&nbsp; ${b.views30} views</div>${htmlFor(b)}</div>`
  ).join("")
  writeFileSync(process.env.DUMP, `<!doctype html><html><body style="background:#f2f2f4;padding:24px;">${stacked}</body></html>`)
  console.log(`dumped ${list.length} emails to ${process.env.DUMP}`)
  process.exit(0)
}

console.log(`Cleaned pool: ${clean.length} not-yet-emailed businesses (from ${rows.length} raw; ${alreadySent.size} already emailed)`)
console.log(`Dropped → excluded-id:${dropped.excludedId} corporate/vendor:${dropped.excludedEmail} malformed:${dropped.malformed} duplicate-inbox:${dropped.dupe} already-sent:${dropped.alreadySent}`)
console.log(`This run: ${list.length} email(s)  [OFFSET ${OFFSET}${LIMIT ? `, LIMIT ${LIMIT}` : ""}]  mode=${SEND ? (PREVIEW ? "PREVIEW→hub" : "SEND") : "DRY RUN"}\n`)

let ok = 0, fail = 0
for (const b of list) {
  const to = PREVIEW ? "hello@lompoclocals.com" : b.email
  if (!SEND) { console.log(`  · ${b.name}  (${b.category}, ${b.views30}v)  →  ${to}`); continue }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to, reply_to: "hello@lompoclocals.com",
      subject: subjectFor(b), html: htmlFor(b),
      headers: {
        "List-Unsubscribe": `<${unsubUrl(b.email)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (res.ok) {
    ok++; console.log(`  ✓ ${b.name}  →  ${to}  (${body.id})`)
    if (!PREVIEW) { mkdirSync(dirname(SENT_LOG), { recursive: true }); appendFileSync(SENT_LOG, b.email + "\n") }
  } else { fail++; console.log(`  ✗ ${b.name}  →  ${to}  FAILED ${JSON.stringify(body)}`) }
  await new Promise((r) => setTimeout(r, SLEEP_MS))
}
if (SEND) console.log(`\nDone. sent:${ok} failed:${fail}`)
else console.log("\n(dry run — set SEND=1 to send; LIMIT/OFFSET to send in waves; PREVIEW=1 routes to hub)")
