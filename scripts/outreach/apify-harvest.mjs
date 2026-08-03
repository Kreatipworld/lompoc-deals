#!/usr/bin/env node
/**
 * Harvests contact emails for listings we cannot currently reach, using Apify's Contact Details
 * Scraper (a real browser, so it reads sites that render their contact details in JavaScript —
 * Squarespace, Wix, square.site, ez-qr.menu, and several others on this list that a plain fetch
 * cannot see).
 *
 * Targets are local businesses only: national chains and civic bodies are filtered out before the
 * run, because a corporate inbox for Applebee's and a county department are not claim prospects
 * and scraping them just spends credits on rows nobody will ever email.
 *
 * Writes nothing by default. `--apply` stores what it found on `businesses.email` with
 * email_source='website'. Sending is a separate, approval-gated step — this only makes people
 * reachable.
 *
 * Usage:
 *   node --env-file=.env.local scripts/outreach/apify-harvest.mjs --limit=5
 *   node --env-file=.env.local scripts/outreach/apify-harvest.mjs --apply
 */
import { neon } from "@neondatabase/serverless"
import fs from "node:fs"

const env = fs.readFileSync(".env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const TOKEN = pick("APIFY_API_TOKEN")
const sql = neon(pick("DATABASE_URL"))

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] ?? d
const LIMIT = Number(arg("limit", 0))
const APPLY = process.argv.includes("--apply")
const ACTOR = "vdrmota~contact-info-scraper"

const { isChain, isPublicBody } = await import("../lib/voice.mjs")

const rows = await sql`
  select b.id, b.name, b.slug, b.website
  from businesses b
  where b.status='approved' and b.email is null and b.website is not null
    and b.website !~* '(facebook|instagram|yelp|google|linktr)'
  order by b.name`
let targets = rows.filter((r) => !isChain(r.name) && !isPublicBody(r.name, r.website))
if (LIMIT) targets = targets.slice(0, LIMIT)

console.log(`${targets.length} target(s)${APPLY ? "" : "  (dry run — nothing will be written)"}\n`)
if (!targets.length) process.exit(0)

const normalise = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)

/**
 * Let the crawler follow links rather than seeding contact pages by hand.
 *
 * Seeding "/contact" and friends as start URLs seemed obviously better and was measurably worse:
 * it returned 0 emails from 48 pages, including from camarenastires.com, which the link-following
 * configuration had found. The emails live on pages reached by crawling, not on the paths I
 * guessed at. Verified by re-running the known-positive site both ways.
 *
 * Browser mode is not optional here either. Plain fetch found nothing across 51 contact pages —
 * these sites render their contact details in JavaScript.
 */
const input = {
  startUrls: targets.map((t) => ({ url: normalise(t.website) })),
  maxRequestsPerStartUrl: 6,
  maxDepth: 2,
  sameDomain: true,
  considerChildFrames: true,
  useBrowser: true,
  waitUntil: "networkidle",
}
console.log(`${targets.length} site(s) · browser mode · measured ~$0.04 per site`)

console.log("starting Apify run…")
const started = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${TOKEN}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(input),
}).then((r) => r.json())

const runId = started?.data?.id
if (!runId) {
  console.error("could not start run:", JSON.stringify(started).slice(0, 400))
  process.exit(1)
}
console.log(`run ${runId} — waiting…`)

let run
for (let i = 0; i < 720; i++) {
  await new Promise((r) => setTimeout(r, 5000))
  run = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`).then((r) => r.json())
  const s = run?.data?.status
  if (i % 6 === 0) console.log(`  ${s}…`)
  if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(s)) break
}

const status = run?.data?.status
const usd = run?.data?.usageTotalUsd
console.log(`\nrun ${status} · cost $${(usd ?? 0).toFixed(4)}`)
if (status !== "SUCCEEDED") process.exit(1)

const items = await fetch(
  `https://api.apify.com/v2/datasets/${run.data.defaultDatasetId}/items?token=${TOKEN}&clean=true`
).then((r) => r.json())

// Junk that shows up on any site but is never a business's own contact address.
// Vendor addresses belong to whoever built the site, not the business. carbaughs-deli.keeq.io
// returned addinfo@edan.io — the menu platform — which would have gone into a claim campaign as
// if it were the deli.
const JUNK = /no-?reply|donotreply|@sentry|wixpress|@example\.|@sentry\.io|\.png$|\.jpe?g$|@2x|godaddy|secureserver|@edan\.io|@keeq\.|@squarespace|@wix\.|@shopify|@square\.site|@mealage|@ez-qr|@groomore|@netlify|@readycube|@poi\.place|@jotform/i
const hostOf = (u) => { try { return new URL(normalise(u)).hostname.replace(/^www\./, "") } catch { return "" } }

const found = new Map()
for (const it of items) {
  // The actor labels the source URL differently depending on how the page was reached, and an
  // earlier version of this read only `url` — which printed blank rows and would have silently
  // dropped every match.
  const src = it.url || it.startUrl || it.originalStartUrl || it.domain || it.loadedUrl || ""
  const emails = (it.emails || []).filter((e) => !JUNK.test(e))
  if (!emails.length) continue
  const target = targets.find((t) => hostOf(t.website) && src.includes(hostOf(t.website)))
  if (!target || found.has(target.id)) continue
  // Prefer an address on the business's own domain over a gmail picked up from a footer credit.
  const own = emails.find((e) => e.split("@")[1]?.toLowerCase() === hostOf(target.website).toLowerCase())
  found.set(target.id, { ...target, email: (own || emails[0]).toLowerCase() })
}

console.log(`\n${found.size} of ${targets.length} now reachable:\n`)
for (const f of found.values()) console.log(`  ${f.name.slice(0, 34).padEnd(36)} ${f.email}`)

if (APPLY && found.size) {
  for (const f of found.values()) {
    await sql`update businesses set email=${f.email}, email_source='website' where id=${f.id} and email is null`
  }
  console.log(`\n✓ wrote ${found.size} email(s)`)
} else if (found.size) {
  console.log(`\ndry run — re-run with --apply to store these`)
}
