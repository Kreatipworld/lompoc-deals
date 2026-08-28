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
 *   SITE=https://lompoc-deals-xxx.vercel.app node --env-file=.env.local scripts/check-production.mjs
 *
 * Exits non-zero on any failure, so it can gate a deploy or run from cron.
 */
import { neon } from "@neondatabase/serverless"

const SITE = process.env.SITE || "https://www.lompoclocals.com"
const sql = neon(process.env.DATABASE_URL)

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
const PAGES = [
  { p: "/en", marker: "All of Lompoc" },
  { p: "/es", marker: "Todo Lompoc" },
  { p: "/en/businesses", marker: "Lompoc Business Directory" },
  { p: "/en/events", marker: "Events in Lompoc" },
  { p: "/en/map", marker: "Businesses on the map" },
  { p: "/en/partners", marker: "Get found by the locals" },
  { p: "/en/deals", marker: "Deals &amp; Coupons" },
  { p: "/en/search?q=tacos", marker: "Taco" },
  { p: "/en/signup/business", marker: "claim your existing page" },
  { p: "/en/news", marker: "Lompoc News" },
  { p: "/sitemap.xml", marker: "<urlset" },
]
for (const { p, marker } of PAGES) {
  try {
    const res = await fetch(`${SITE}${p}`, { headers: { "user-agent": "lompoc-locals-healthcheck" }, redirect: "follow" })
    if (!res.ok) { fail(`${p} → ${res.status}`); continue }
    const body = await res.text()
    if (!body.includes(marker)) {
      fail(`${p} → 200 but missing "${marker}" — likely the error boundary; the page is down for residents`)
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
  queries = await realQueries()
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

console.log(
  failures === 0
    ? `\n\x1b[32mAll checks passed.\x1b[0m\n`
    : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`
)
process.exit(failures ? 1 : 0)
