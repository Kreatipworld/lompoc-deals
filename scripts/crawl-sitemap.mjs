#!/usr/bin/env node
/**
 * Crawls every URL in the sitemap and reports what a search engine would hold against us.
 *
 * Checks per page: HTTP status, redirect chains, <title>, meta description, canonical, a single
 * <h1>, og:image, indexability, and body word count. Duplicate titles and descriptions are found
 * across the whole set afterwards — those are the ones you cannot see one page at a time, and
 * they are what flattens a directory site in search.
 *
 * Read-only. It reports; nothing is changed.
 *
 * Usage:
 *   node scripts/crawl-sitemap.mjs [--limit=N] [--base=https://…] [--json=out.json]
 */
import fs from "node:fs"

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || d
const BASE = arg("base", "https://www.lompoclocals.com")
const LIMIT = Number(arg("limit", 0))
const JSON_OUT = arg("json", "")
const CONCURRENCY = 8

// Google truncates around these; well outside them is a real signal, not pedantry.
const TITLE_MIN = 15, TITLE_MAX = 65
const DESC_MIN = 70, DESC_MAX = 165
const THIN_WORDS = 120

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text()
let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
if (LIMIT) urls = urls.slice(0, LIMIT)
console.log(`crawling ${urls.length} urls from ${BASE}/sitemap.xml\n`)

const pick = (html, re) => (html.match(re) || [])[1]?.trim()
const decode = (s) =>
  String(s ?? "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, " ")

function analyse(url, status, redirectedTo, html, ms) {
  const title = decode(pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i))
  const desc = decode(
    pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      pick(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
  )
  const canonical = pick(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
  const robots = pick(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) || ""
  const ogImage = pick(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, "")).trim())

  // Strip script/style before counting words, or JSON-LD inflates every page.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
  const words = decode(text).split(/\s+/).filter((w) => w.length > 1).length

  const issues = []
  if (status >= 500) issues.push({ level: "error", issue: "server-error", detail: String(status) })
  else if (status >= 400) issues.push({ level: "error", issue: "not-found", detail: String(status) })
  else if (redirectedTo) issues.push({ level: "warn", issue: "redirects", detail: redirectedTo })

  if (status < 400) {
    if (!title) issues.push({ level: "error", issue: "no-title", detail: "" })
    else if (title.length < TITLE_MIN || title.length > TITLE_MAX)
      issues.push({ level: "warn", issue: "title-length", detail: `${title.length} chars` })
    if (!desc) issues.push({ level: "warn", issue: "no-description", detail: "" })
    else if (desc.length < DESC_MIN || desc.length > DESC_MAX)
      issues.push({ level: "info", issue: "description-length", detail: `${desc.length} chars` })
    if (!canonical) issues.push({ level: "warn", issue: "no-canonical", detail: "" })
    if (/noindex/i.test(robots)) issues.push({ level: "error", issue: "noindex", detail: robots })
    if (h1s.length === 0) issues.push({ level: "warn", issue: "no-h1", detail: "" })
    else if (h1s.length > 1) issues.push({ level: "info", issue: "multiple-h1", detail: `${h1s.length}` })
    if (!ogImage) issues.push({ level: "info", issue: "no-og-image", detail: "" })
    if (words < THIN_WORDS) issues.push({ level: "warn", issue: "thin", detail: `${words} words` })
  }

  return { url, status, redirectedTo, ms, title, desc, canonical, h1: h1s[0] || "", words, issues }
}

async function crawl(url) {
  const started = Date.now()
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) })
    const html = await res.text()
    const finalUrl = res.url.replace(/\/$/, "")
    return analyse(url, res.status, finalUrl !== url.replace(/\/$/, "") ? finalUrl : null, html, Date.now() - started)
  } catch (e) {
    return { url, status: 0, redirectedTo: null, ms: Date.now() - started, title: "", desc: "", canonical: "", h1: "", words: 0,
      issues: [{ level: "error", issue: "unreachable", detail: e.name }] }
  }
}

const results = []
let done = 0
const queue = [...urls]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const u = queue.shift()
      results.push(await crawl(u))
      if (++done % 50 === 0) process.stdout.write(`  ${done}/${urls.length}\n`)
    }
  })
)

// Duplicates only exist across the set, which is why they survive page-by-page review.
const groupBy = (key) => {
  const m = new Map()
  for (const r of results) {
    const v = (r[key] || "").trim()
    if (!v || r.status >= 400) continue
    if (!m.has(v)) m.set(v, [])
    m.get(v).push(r.url)
  }
  return [...m.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length)
}
const dupTitles = groupBy("title")
const dupDescs = groupBy("desc")

const counts = {}
for (const r of results) for (const i of r.issues) counts[i.issue] = (counts[i.issue] || 0) + 1

const slow = results.filter((r) => r.ms > 3000).sort((a, b) => b.ms - a.ms)
const ok = results.filter((r) => r.status >= 200 && r.status < 300).length

console.log(`\n${results.length} crawled · ${ok} OK · ${results.filter((r) => r.status >= 400 || r.status === 0).length} broken\n`)
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)} ${k}`)

const byLevel = (lvl) => results.flatMap((r) => r.issues.filter((i) => i.level === lvl).map((i) => ({ ...i, url: r.url })))
const errors = byLevel("error")
if (errors.length) {
  console.log(`\nERRORS (${errors.length})`)
  for (const e of errors.slice(0, 40)) console.log(`  ${e.issue.padEnd(14)} ${e.detail.padEnd(22)} ${e.url}`)
}

if (dupTitles.length) {
  console.log(`\nDUPLICATE TITLES (${dupTitles.length} groups)`)
  for (const [t, us] of dupTitles.slice(0, 12)) console.log(`  ${String(us.length).padStart(3)}×  "${t.slice(0, 70)}"`)
}
if (dupDescs.length) {
  console.log(`\nDUPLICATE DESCRIPTIONS (${dupDescs.length} groups)`)
  for (const [d, us] of dupDescs.slice(0, 12)) console.log(`  ${String(us.length).padStart(3)}×  "${d.slice(0, 70)}…"`)
}
if (slow.length) {
  console.log(`\nSLOW (>3s): ${slow.length}`)
  for (const s of slow.slice(0, 10)) console.log(`  ${String(Math.round(s.ms)).padStart(6)}ms  ${s.url}`)
}

const thin = results.filter((r) => r.issues.some((i) => i.issue === "thin")).sort((a, b) => a.words - b.words)
if (thin.length) {
  console.log(`\nTHIN PAGES (${thin.length}) — least content first`)
  for (const t of thin.slice(0, 15)) console.log(`  ${String(t.words).padStart(4)}w  ${t.url}`)
}

if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify({ results, dupTitles, dupDescs }, null, 2) + "\n")
  console.log(`\njson → ${JSON_OUT}`)
}
