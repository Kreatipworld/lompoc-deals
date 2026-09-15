#!/usr/bin/env node
/**
 * Post-deploy smoke check: does the live site still do the things we believe it does?
 *
 * Written after two features were found doing nothing at all. Outbound click tracking wrote to
 * Vercel and nowhere else for weeks, so the one question a paying business asks — how many people
 * did my listing send me — had no answer. And a wood-fired pizzeria never appeared in a search for
 * "pizza" until its owner asked us why. Both looked correct in the code. Both passed every test we
 * had, because every test we had ran against fixtures.
 *
 * So this runs against production, over HTTP, the way a resident does.
 *
 *   node --env-file=.env.local scripts/check-production.mjs
 *   node --env-file=.env.local scripts/check-production.mjs --base=https://lompoc-deals-xxx.vercel.app
 *
 * Exits non-zero on any failure. scripts/ship.sh runs it against the preview
 * deployment before production is touched, then again against production.
 */
import { neon } from "@neondatabase/serverless"

// --base=https://lompoc-deals-xxx.vercel.app  → check a preview before it is promoted (scripts/ship.sh)
const baseArg = process.argv.find((a) => a.startsWith("--base="))
const SITE = (baseArg ? baseArg.slice(7) : process.env.SITE || "https://www.lompoclocals.com").replace(/\/$/, "")
const sql = neon(process.env.DATABASE_URL)

// Preview deployments are SSO-protected. With a "Protection Bypass for Automation"
// secret in the env (scripts/vercel-gate.mjs bypass), every request to the target
// carries the bypass header so the preview answers like production would.
//
// And a hard rule: a request to the target must be ANSWERED by the target. A
// preview once proxied every English page to production through a redirect
// (AUTH_URL on preview = the production alias), so the gate "passed" while
// reading www. Any response that ends up on another origin is a failure.
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const ORIGIN = new URL(SITE).origin
const IS_PROD = new URL(SITE).hostname === "www.lompoclocals.com"
{
  const rawFetch = globalThis.fetch
  globalThis.fetch = async (input, init = {}) => {
    const u = typeof input === "string" ? input : input.url
    if (!u.startsWith(ORIGIN)) return rawFetch(input, init)
    if (BYPASS) init = { ...init, headers: { ...(init.headers || {}), "x-vercel-protection-bypass": BYPASS } }
    const res = await rawFetch(input, init)
    if (res.url && new URL(res.url).origin !== ORIGIN) {
      throw new Error(`left ${ORIGIN} — answered by ${res.url} (the check would be reading another deployment)`)
    }
    return res
  }
}

// The error boundary answers 200. Its text is useless as a signal (it sits in
// every English payload as a translation string); its DOM attribute is not.
// Mirrors lib/uptime.ts — keep the two in step.
const ERROR_BOUNDARY_MARKER = 'data-error-boundary="root"'
const BENIGN_DIGESTS = /^(BAILOUT_TO_CLIENT_SIDE_RENDERING|NEXT_NOT_FOUND|NEXT_REDIRECT|DYNAMIC_SERVER_USAGE)/
const errorDigests = (html) => {
  const out = new Set()
  for (const m of html.matchAll(/data-dgst="([^"]*)"/g)) if (!BENIGN_DIGESTS.test(m[1])) out.add(m[1])
  for (const m of html.matchAll(/E\{\\"digest\\":\\"([^"\\]*)\\"/g)) if (!BENIGN_DIGESTS.test(m[1])) out.add(m[1])
  return [...out]
}

let failures = 0
const pass = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const fail = (m) => {
  failures++
  console.log(`  \x1b[31m✗ ${m}\x1b[0m`)
}

const api = async (path) => {
  const res = await fetch(`${SITE}${path}`, { headers: { "user-agent": "lompoc-locals-healthcheck" } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
const names = (r) => (r.businesses ?? []).map((b) => b.name)

/**
 * Searches that must keep working, each with the business that proves it.
 *
 * The anchors are deliberately businesses whose NAME does not contain the query — those are the
 * ones a ranking regression silently drops, and the only ones worth asserting. A search for "pizza"
 * returning six places called Pizza proves nothing.
 */
const ANCHORS = [
  { q: "pizza", must: "Eye on I", why: "wood-fired pizzeria; the regression that started this" },
  { q: "js glass", must: "J's Glass Co", why: "apostrophe in the name; four residents searched this and got nothing" },
]

/**
 * Structural guarantees that don't depend on any one business staying in the directory.
 * A named anchor rots; these don't.
 */
const RESERVED_SEAT = ["pizza", "coffee", "tacos"]

/** The searches people actually type, pulled live so this check follows real usage, not our guesses. */
async function realQueries(limit = 12) {
  const rows = await sql`
    select lower(trim(props->>'query')) q, count(*)::int n
    from analytics_events
    where event_name = 'search_run' and coalesce(props->>'query','') <> ''
    group by 1 having length(lower(trim(props->>'query'))) >= 3
    order by 2 desc limit ${limit}`
  return rows.map((r) => r.q)
}

console.log(`\nChecking ${SITE}\n`)

// ── 1. pages that must not break — and must actually RENDER ──────────────────
// Status alone lies: the error boundary answers 200 while showing "Something
// went wrong" (a malformed photos_json row 500'd the homepage on Aug 14 and
// the status check waved it through). So every page is read like a resident:
// no error boundary text, and a page-specific marker where one is stable.
console.log("Pages")
// The boundary's fallback text is inlined in EVERY page's payload as a dormant
// template, so "does the error string appear" is useless. The reliable signal
// is positive: each page's own h1/content marker must be present in the HTML.
// Sep 14 2026: commit c5a36aa 500'd every /category/* page and nothing here
// covered a category page. One representative page per section, always.
const PAGES = [
  { p: "/en", marker: "All of Lompoc" },
  { p: "/es", marker: "Todo Lompoc" },
  { p: "/en/businesses", marker: "Lompoc Business Directory" },
  { p: "/category/food-drink", marker: "Lompoc Food &amp; Drink" },
  { p: "/es/category/food-drink", marker: "Comida y bebida en Lompoc" },
  { p: "/en/events", marker: "Events in Lompoc" },
  { p: "/this-week", marker: "This Week in Lompoc" },
  { p: "/en/map", marker: "Businesses on the map" },
  { p: "/en/partners", marker: "Get found by the locals" },
  { p: "/en/deals", marker: "Deals &amp; Coupons" },
  { p: "/homes", marker: "Homes in Lompoc" },
  { p: "/listings/50", marker: 'data-lead="showing"' },
  { p: "/football", marker: "Lompoc Football" },
  { p: "/biz/empire-real-estate-group-maressa-the-realtor", marker: "Empire Real Estate Group" },
  { p: "/en/search?q=tacos", marker: "Taco" },
  { p: "/en/signup/business", marker: "claim your existing page" },
  { p: "/en/news", marker: "Lompoc News" },
  { p: "/sitemap.xml", marker: "<urlset" },
]
for (const { p, marker } of PAGES) {
  try {
    const res = await fetch(`${SITE}${p}`, { headers: { "user-agent": "lompoc-locals-healthcheck" }, redirect: "follow", cache: "no-store" })
    const body = await res.text()
    if (!res.ok) { fail(`${p} → ${res.status}: "${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)}"`); continue }
    if (body.includes(ERROR_BOUNDARY_MARKER)) {
      fail(`${p} → 200 but the error boundary is showing — "Something went wrong" for residents`)
    } else if (!body.includes(marker)) {
      const digests = errorDigests(body)
      fail(`${p} → 200 but missing "${marker}"${digests.length ? ` (server error digest ${digests.join(", ")})` : ""} — the page is down for residents`)
    } else {
      pass(`${p} → ${res.status}, renders`)
    }
  } catch (e) {
    fail(`${p} → ${e.message}`)
  }
}

// ── 1b. deal images must be alive and on OUR storage ─────────────────────────
// Google place-photo URLs expire silently (all 9 deal cards went blank on
// Aug 17). Deal images must live on the blob store, and answer 200.
console.log("\nDeal images")
try {
  const rows = await sql`select d.id, d.image_url from deals d where d.image_url is not null and (d.expires_at is null or d.expires_at > now())`
  let offsite = 0, dead = 0
  for (const r of rows) {
    if (!/blob\.vercel-storage\.com/.test(r.image_url)) { offsite++; continue }
    const res = await fetch(r.image_url, { method: "HEAD" }).catch(() => null)
    if (!res || !res.ok) dead++
  }
  offsite === 0 ? pass(`${rows.length} deal image(s) all on our storage`) : fail(`${offsite} deal image(s) hosted off-site — they WILL expire`)
  dead === 0 ? pass("all deal images answer 200") : fail(`${dead} deal image(s) dead`)
} catch (e) { fail(`deal image check: ${e.message}`) }

// ── 2. search returns something for what people type ──────────────────────────
console.log("\nSearch — the terms residents actually use")
let queries = []
try {
  // Crawlers hit the JSON-LD SearchAction template literally ("{search_term_string}");
  // those land in analytics but are not resident searches — never test them.
  queries = (await realQueries()).filter((q) => !/[{}<>$]/.test(q))
} catch (e) {
  fail(`could not read real queries from analytics: ${e.message}`)
}
if (!queries.length) console.log("  (no searches recorded yet — anchors below still run)")
for (const q of queries) {
  try {
    const d = await api(`/api/search/autocomplete?q=${encodeURIComponent(q)}`)
    const hits = names(d).length + (d.categories ?? []).length
    hits > 0 ? pass(`"${q}" → ${names(d).length} business(es), ${(d.categories ?? []).length} category`) : fail(`"${q}" → NOTHING. A resident searching this gets an empty box.`)
  } catch (e) {
    fail(`"${q}" → ${e.message}`)
  }
}

// ── 3. the businesses a ranking change would silently drop ────────────────────
console.log("\nSearch — anchors (businesses whose name doesn't contain the query)")
for (const { q, must, why } of ANCHORS) {
  try {
    const found = names(await api(`/api/search/autocomplete?q=${encodeURIComponent(q)}`))
    found.includes(must)
      ? pass(`"${q}" still surfaces ${must}`)
      : fail(`"${q}" NO LONGER surfaces ${must} (${why}). Got: ${found.join(", ") || "nothing"}`)
  } catch (e) {
    fail(`"${q}" → ${e.message}`)
  }
}

// ── 3b. a word match always gets its seat ────────────────────────────────────
console.log("\nSearch — a business whose name lacks the term still gets a seat")
for (const q of RESERVED_SEAT) {
  try {
    const found = names(await api(`/api/search/autocomplete?q=${encodeURIComponent(q)}`))
    const wordMatch = found.find((n) => !n.toLowerCase().includes(q.toLowerCase()))
    wordMatch
      ? pass(`"${q}" seats ${wordMatch}`)
      : fail(`"${q}" returned only name matches — the reserved seat is gone, and places that don't name what they sell are invisible again`)
  } catch (e) {
    fail(`"${q}" → ${e.message}`)
  }
}

// ── 4. the town comes first ───────────────────────────────────────────────────
console.log("\nSearch — chains must not lead a generic browse")
try {
  const { isChain } = await import("../lib/chains.ts").catch(() => ({ isChain: null }))
  const first = names(await api("/api/search/autocomplete?q=pizza"))[0]
  if (!first) fail(`"pizza" returned no businesses at all`)
  else if (isChain && isChain(first)) fail(`"pizza" now leads with ${first}, a national chain`)
  else pass(`"pizza" leads with ${first}`)
} catch {
  // chains.ts is TypeScript and only imports under tsx; skip rather than fail the whole run.
  console.log("  – chain check skipped (run under tsx to enable)")
}

// ── 5. tracking actually records ──────────────────────────────────────────────
console.log("\nTracking — an outbound click must reach our database")
const probeSlug = `__healthcheck_${Date.now()}`
try {
  const res = await fetch(`${SITE}/api/track/event`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `lompoc_sid=healthcheck-${Date.now()}` },
    body: JSON.stringify({ name: "website_click", targetType: "business", targetId: 0, props: { slug: probeSlug } }),
  })
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`)
  await new Promise((r) => setTimeout(r, 3000))
  const rows = await sql`select id from analytics_events where props->>'slug' = ${probeSlug}`
  if (rows.length) {
    pass(`click recorded (#${rows[0].id})`)
    const del = await sql`delete from analytics_events where props->>'slug' = ${probeSlug} returning id`
    pass(`probe cleaned up (${del.length} row)`)
  } else {
    fail(`click accepted but NOT recorded — the dual-write is broken again`)
  }
} catch (e) {
  fail(`tracking probe: ${e.message}`)
}

// ── 6. the weekly email has something to say ──────────────────────────────────
console.log("\nSaturday email")
try {
  const [events] = await sql`select count(*)::int n from events where status='approved' and starts_at > now()`
  const [food] = await sql`
    select count(*)::int n from businesses b join categories c on c.id=b.category_id
    where b.status='approved' and c.slug='food-drink'
      and b.about is not null and length(b.about) > 40
      and jsonb_array_length(coalesce(b.photos_json,'[]'::jsonb)) >= 1`
  events.n > 0 ? pass(`${events.n} upcoming events to print`) : fail(`no upcoming events — the calendar section will be empty`)
  food.n >= 3 ? pass(`${food.n} restaurants eligible for "Where to Eat"`) : fail(`only ${food.n} eligible restaurants — the section needs 3`)
} catch (e) {
  fail(`digest content: ${e.message}`)
}

// ── 7. an owner's chosen cover is what neighbors see ──────────────────────────
// Members uploaded new covers and the old first gallery photo kept showing on
// their page and every card. The cover the owner picked must lead everywhere.
console.log("\nPhotos — the owner's cover is what neighbors see")
try {
  const owners = await sql`
    select b.slug, b.cover_url, c.slug as category_slug
    from businesses b join users u on u.id = b.owner_user_id
    left join categories c on c.id = b.category_id
    where u.role = 'business' and u.email not like '%lompocdeals%' and u.email not like '%lompoc-locals%'
      and b.status = 'approved' and b.cover_url like '%/covers/%'
    order by b.id desc limit 3`
  if (owners.length === 0) pass("no owner-uploaded covers to verify yet")
  for (const o of owners) {
    const html = await fetch(`${SITE}/biz/${o.slug}`, { cache: "no-store" }).then((r) => r.text())
    const gallery = html.indexOf("/photos/")
    const cover = html.indexOf(o.cover_url)
    if (cover === -1) fail(`${o.slug}: uploaded cover missing from the profile page`)
    else if (gallery !== -1 && gallery < cover) fail(`${o.slug}: a gallery photo still leads the profile — cover should come first`)
    else pass(`${o.slug}: owner's cover leads the profile`)
    if (o.category_slug) {
      const cat = await fetch(`${SITE}/category/${o.category_slug}`, { cache: "no-store" }).then((r) => r.text())
      cat.includes(o.cover_url) ? pass(`${o.slug}: cover on the ${o.category_slug} category card`) : fail(`${o.slug}: category card does not show the owner's cover`)
    }
  }
} catch (e) {
  fail(`owner covers: ${e.message}`)
}

console.log("\nMissing pages answer 404 — a loading.tsx above a notFound() route turns these into 200")
for (const p of ["/biz/no-such-business-xyz", "/es/biz/no-such-business-xyz", "/category/bogus-xyz", "/events/999999", "/es/activities/bogus-xyz", "/es/blog/bogus-xyz"]) {
  try {
    const res = await fetch(`${SITE}${p}`, { headers: { "user-agent": "lompoc-locals-healthcheck" }, redirect: "manual", cache: "no-store" })
    res.status === 404 ? pass(`${p} → 404`) : fail(`${p} → ${res.status} (soft 404 — Google will index the mistyped URL)`)
  } catch (e) { fail(`${p} → ${e.message}`) }
}

console.log("\nSpanish — /es must read Spanish, not English wearing a prefix")
try {
  const home = await fetch(`${SITE}/es`, { cache: "no-store" }).then((r) => r.text())
  home.includes('og:locale" content="es_US"') ? pass("/es og:locale es_US") : fail("/es og:locale is not es_US")
  const langEs = /<html[^>]*lang="es"/.test(home)
  langEs ? pass("/es html lang=es") : fail("/es html lang is not es")
  const biz = await fetch(`${SITE}/es/biz/lompoc-tires`, { cache: "no-store" }).then((r) => r.text())
  const bizText = biz.replace(/<[^>]*>/g, " ")
  const hoursEs = /\b(Lun|Cerrado)\b/.test(bizText) && !/\bMon \d/.test(bizText)
  hoursEs ? pass("/es/biz hours read Lun…Dom / Cerrado") : fail("/es/biz hours still English (Mon…Sun / Closed)")
  const deals = await fetch(`${SITE}/es/deals`, { cache: "no-store" }).then((r) => r.text()).then((h) => h.replace(/<[^>]*>/g, " "))
  const expiryEn = /Vence en \d+ (month|day)s?\b/.test(deals)
  expiryEn ? fail("/es/deals expiry uses English units (Vence en 2 months)") : pass("/es/deals expiry is Spanish")
  const sitemap = await fetch(`${SITE}/sitemap.xml`, { cache: "no-store" }).then((r) => r.text())
  const esAlt = (sitemap.match(/hreflang="es"/g) || []).length
  esAlt > 50 ? pass(`sitemap carries ${esAlt} es alternates`) : fail(`sitemap has only ${esAlt} es alternates`)
} catch (e) { fail(`spanish: ${e.message}`) }

// ── 9. the card is charged what the page says ────────────────────────────────
// Plus became self-serve on Sep 10 2026. The display price lives in code, the
// charged price in Stripe; the two drift silently. Needs CRON_SECRET in env.
console.log("\n9. Stripe prices match the plans on the page")
if (!process.env.CRON_SECRET) {
  console.log("  – skipped (set CRON_SECRET to check the live Stripe prices)")
} else {
  try {
    const res = await fetch(`${SITE}/api/admin/stripe-prices`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      cache: "no-store",
    })
    const prices = await res.json()
    const expect = { standard: 3999, premium: 9999 }
    for (const [tier, cents] of Object.entries(expect)) {
      const p = prices[tier] ?? {}
      const label = tier === "standard" ? "Growth" : "Plus"
      if (p.error && !IS_PROD && /not configured/i.test(p.error)) console.log(`  – ${label}: skipped on preview (Stripe env is production-only; checked again after promotion)`)
      else if (p.error) fail(`${label}: ${p.error}`)
      else if (p.unit_amount !== cents) fail(`${label} charges $${(p.unit_amount ?? 0) / 100} but the page says $${cents / 100}`)
      else if (!p.active) fail(`${label} price ${p.id} is inactive in Stripe`)
      else if (!p.livemode) fail(`${label} price ${p.id} is a TEST price`)
      else if (p.interval !== "month") fail(`${label} price ${p.id} bills per ${p.interval}, not monthly`)
      else pass(`${label} charges $${cents / 100}/month (live, ${p.id})`)
    }
  } catch (err) {
    fail(`stripe price check failed: ${err.message}`)
  }
}

// ── 10. the listing page owns the buyer ──────────────────────────────────────
// Sep 11 2026: tour/contact requests are counted leads (listing_leads) and Plus
// real-estate members are featured. Listing 50 is the first realtor's home.
console.log("\n10. Home page: lead form + featured agent")
try {
  const html = await fetch(`${SITE}/listings/50`, { cache: "no-store" }).then((r) => r.text())
  html.includes('data-lead="showing"') ? pass("/listings/50 has the Request a tour lead button") : fail("/listings/50 is missing the tour lead button (data-lead=showing)")
  html.includes('data-lead="contact"') ? pass("/listings/50 has the Contact agent lead button") : fail("/listings/50 is missing the contact lead button")
  html.includes('data-featured="agent"') ? pass("/listings/50 shows the Featured agent chip") : fail("/listings/50 has no Featured agent chip (Plus real-estate member expected)")
  const homes = await fetch(`${SITE}/homes`, { cache: "no-store" }).then((r) => r.text())
  homes.includes('data-featured="rail"') ? pass("/homes shows the Featured agents rail") : fail("/homes has no Featured agents rail")
} catch (e) { fail(`leads/featured: ${e.message}`) }

// ── 11. Lompoc Football hub ───────────────────────────────────────────────────
// Sep 11 2026: /football is the ESPN-style page for both programs, fed by the
// MaxPreps sync (football_games). A missing game row means the cron broke.
console.log("\n11. Lompoc Football hub")
try {
  const r = await fetch(`${SITE}/football`, { cache: "no-store" })
  const html = await r.text()
  r.status === 200 ? pass("/football answers 200") : fail(`/football answered ${r.status}`)
  html.includes("Lompoc Braves") && html.includes("Cabrillo Conquistadores") ? pass("/football names both schools") : fail("/football is missing a school name")
  html.includes('data-football="game"') ? pass("/football has at least one game row") : fail("/football has no game rows (sync-football cron?)")
} catch (e) { fail(`football hub: ${e.message}`) }

// ── 12. No HEIC/HEIF photos on any listing ────────────────────────────────────
// Sep 13 2026: two iPhone HEIC uploads rendered as broken images on the first
// realtor's listing. The uploader now re-encodes to JPEG and the action rejects
// HEIC URLs; this catches anything that slips through another path.
console.log("\n12. Listing photos are browser-displayable (no HEIC/HEIF)")
try {
  const rows = await sql`
    select id, image_url, coalesce(photos_json, '[]'::jsonb) as photos
    from property_listings
    where status <> 'archived'`
  const bad = []
  for (const r of rows) {
    const urls = [r.image_url, ...(Array.isArray(r.photos) ? r.photos : [])].filter(Boolean)
    for (const u of urls) if (/\.(heic|heif)(\?|#|$)/i.test(String(u))) bad.push(`listing ${r.id}: ${u}`)
  }
  bad.length === 0
    ? pass(`no HEIC/HEIF photo URLs across ${rows.length} listing(s)`)
    : fail(`HEIC/HEIF photo URLs found — convert to JPEG: ${bad.join(" | ")}`)
} catch (e) { fail(`listing photo scan: ${e.message}`) }

// ── 13. Homes on the main map ─────────────────────────────────────────────────
// Sep 14 2026: live listings with a street address ride /api/map-pois as
// kind "home" so /map shows businesses and homes together.
console.log("\n13. Homes for sale & rent on the main map")
try {
  const live = await sql`
    select count(*)::int as n from property_listings l
    join businesses b on b.id = l.business_id
    where l.status = 'active' and (l.expires_at is null or l.expires_at > now())
      and b.status = 'approved' and l.lat is not null and l.lng is not null
      and l.address ~ '^\\s*[0-9]+[A-Za-z]?\\s+\\S'
      and l.lat between 34.45 and 34.8 and l.lng between -120.65 and -120.25`
  const n = live[0]?.n ?? 0
  const res = await fetch(`${SITE}/api/map-pois`, { cache: "no-store" })
  const pois = await res.json()
  const homes = Array.isArray(pois) ? pois.filter((p) => p.kind === "home") : []
  if (n === 0) pass("no live listing with a street address yet — nothing to pin")
  else if (homes.length >= 1) pass(`${homes.length} home pin(s) on /api/map-pois (${n} live with a street address)`)
  else fail(`/api/map-pois carries no kind:"home" pins but ${n} live listing(s) have a street address`)
} catch (e) { fail(`homes on map: ${e.message}`) }

console.log("\n14. Directory wayfinding — every link works, tile counts match category pages (owner: 'make sure all the links work', 'the guidance has to be perfect')")
try {
  const seen = new Map()
  const extract = (html) => Array.from(html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)).map((m) => m[1]).filter((h) => !h.startsWith("/api/") && !h.startsWith("/_next") && !/\.(png|jpg|jpeg|svg|ico|xml|txt|webmanifest)$/.test(h))
  const pages = ["/businesses", "/es/businesses"]
  const cats = await sql`select c.slug, count(b.id)::int as n from categories c join businesses b on b.category_id = c.id and b.status = 'approved' group by c.slug having count(b.id) > 0`
  for (const c of cats) pages.push(`/category/${c.slug}`, `/es/category/${c.slug}`)
  const hrefs = new Set()
  for (const p of pages) {
    const html = await fetch(`${SITE}${p}`, { cache: "no-store" }).then((r) => r.text())
    for (const h of extract(html)) hrefs.add(h)
    if (p.startsWith("/category/")) {
      const slug = p.split("/").pop()
      const row = cats.find((c) => c.slug === slug)
      const flat = html.replace(/<!-- -->/g, "")
      if (slug === "real-estate") {
        /\d+ listings? in Lompoc/.test(flat) ? pass(`${p}: shows the live listing count`) : fail(`${p}: no listing count in the header`)
      } else {
        const m = flat.match(/(\d+) businesses? in Lompoc/)
        if (!m) fail(`${p}: no business count in the header`)
        else if (Number(m[1]) !== row.n) fail(`${p}: header says ${m[1]} businesses, directory tile/DB says ${row.n}`)
        else pass(`${p}: ${row.n} businesses — matches the directory tile`)
      }
    }
  }
  let bad = 0, checked = 0
  for (const h of hrefs) {
    if (seen.has(h)) continue
    const res = await fetch(`${SITE}${h}`, { method: "GET", redirect: "follow", cache: "no-store", headers: { "user-agent": "lompoc-locals-healthcheck" } })
    seen.set(h, res.status); checked++
    if (res.status !== 200) { bad++; fail(`${h} → ${res.status}`) }
  }
  bad === 0 ? pass(`directory links: ${checked} unique internal links on ${pages.length} pages all return 200`) : fail(`directory links: ${bad} of ${checked} broken`)
} catch (e) {
  fail(`directory wayfinding: ${e.message}`)
}

console.log(
  failures === 0
    ? `\n\x1b[32mAll checks passed.\x1b[0m\n`
    : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`
)
process.exit(failures ? 1 : 0)
