#!/usr/bin/env node
/**
 * Guards the page-title contract, statically, before a push.
 *
 * `app/layout.tsx` applies `title.template: "%s | Lompoc Locals"`, so a page title that carries
 * the brand itself prints it twice. That went unnoticed across 546 of 586 pages until a full
 * sitemap crawl found it on 2026-07-31 — by which point every business, category, hotel and blog
 * result in Google was truncating before the city and the brand.
 *
 * There is exactly one exception: `title: { absolute: … }` bypasses the template, so those pages
 * must carry the brand themselves or they end up with none. This checks both directions.
 *
 * No network, no build — greps the source and the message catalogues, so it is fast enough to sit
 * in a pre-push hook. The crawler (scripts/crawl-sitemap.mjs) remains the end-to-end check.
 *
 * Usage: node scripts/check-title-metadata.mjs
 * Exit:  0 clean · 1 a title would print the brand twice, or an absolute title lost it
 */
import fs from "node:fs"
import path from "node:path"

const BRAND = "Lompoc Locals"
const APP = "app"
const failures = []
const notes = []

/* ---------- which i18n keys are rendered with `absolute` ---------- */

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(p, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(p)
  }
  return out
}

/**
 * `t("metaTitle")` is namespace-relative — the namespace comes from `getTranslations("eventsPage")`
 * earlier in the file. Resolving it matters: treating the bare key as global made this check claim
 * that every `*.metaTitle` in the catalogue renders through `absolute`, and it reported 87
 * problems of which almost none were real.
 */
const files = walkFiles(APP)
const absoluteKeys = new Set()
const templatedKeys = new Set()
const hardcoded = []

// og:title and twitter:title are separate fields that never go through the template, so they are
// allowed — and expected — to carry the brand.
const SOCIAL_BLOCK = /(openGraph|twitter)\s*:\s*\{[\s\S]*?\n\s{2,4}\}/g

for (const f of files) {
  const raw = fs.readFileSync(f, "utf8")
  // The root layout defines the template itself; its `default` must contain the brand.
  if (f === path.join("app", "layout.tsx")) continue
  const src = raw.replace(SOCIAL_BLOCK, "")

  const namespaces = [...src.matchAll(/getTranslations\(\s*\{?\s*[^)]*?["'`]([\w.]+)["'`]/g)].map((m) => m[1])
  const qualify = (key) => (namespaces.length ? namespaces.map((ns) => `${ns}.${key}`) : [key])

  for (const m of src.matchAll(/title:\s*\{\s*absolute:\s*t\(\s*["'`]([^"'`]+)["'`]/g))
    for (const k of qualify(m[1])) absoluteKeys.add(k)
  for (const m of src.matchAll(/title:\s*t\(\s*["'`]([^"'`]+)["'`]/g))
    for (const k of qualify(m[1])) templatedKeys.add(k)
  for (const m of src.matchAll(/title:\s*`[^`]*\$\{t\(\s*["'`]([^"'`]+)["'`]/g))
    for (const k of qualify(m[1])) templatedKeys.add(k)

  // A literal title that spells out the brand doubles it, whether or not the page is in the
  // sitemap — a signed-in owner still reads it in their browser tab.
  for (const m of src.matchAll(/title:\s*(`[^`]*`|"[^"]*"|'[^']*')/g)) {
    const before = src.slice(Math.max(0, m.index - 30), m.index)
    if (m[1].includes(BRAND) && !/absolute:\s*$/.test(before)) {
      hardcoded.push({ file: f, literal: m[1].trim().slice(0, 88) })
    }
  }
}

for (const h of hardcoded) {
  failures.push(`${h.file}: literal title repeats "${BRAND}" — the layout template already adds it\n      ${h.literal}`)
}

/* ---------- message catalogues ---------- */

const isTitleKey = (k) => /title|suffix/i.test(k)
const endsWithBrand = (v) => new RegExp(`[—|]\\s*${BRAND}\\s*$`).test(v)

for (const loc of ["en", "es"]) {
  const file = `messages/${loc}.json`
  if (!fs.existsSync(file)) continue
  const data = JSON.parse(fs.readFileSync(file, "utf8"))

  const flat = new Map()
  ;(function walk(o, p = "") {
    if (o && typeof o === "object" && !Array.isArray(o)) {
      for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k)
    } else if (typeof o === "string") flat.set(p, o)
  })(data)

  for (const [key, value] of flat) {
    const leaf = key.split(".").pop()
    if (!isTitleKey(leaf)) continue

    const usedAbsolute = [...absoluteKeys].some((k) => key === k || key.endsWith(`.${k}`) || k.endsWith(key))
    const usedTemplated = [...templatedKeys].some((k) => key === k || key.endsWith(`.${k}`) || k.endsWith(key))

    if (endsWithBrand(value) && usedTemplated && !usedAbsolute) {
      failures.push(`${file}: "${key}" ends with "${BRAND}" but is rendered through the title template — it will print twice\n      ${value}`)
    }
    if (usedAbsolute && !value.includes(BRAND)) {
      failures.push(`${file}: "${key}" renders with title.absolute, which skips the template, but no longer contains "${BRAND}" — that page would have no brand at all\n      ${value}`)
    }
    if (endsWithBrand(value) && !usedTemplated && !usedAbsolute) {
      notes.push(`${file}: "${key}" carries the brand and no usage was found — check how it is rendered`)
    }
  }
}

if (notes.length) {
  console.log(`[titles] ${notes.length} note(s):`)
  for (const n of notes.slice(0, 8)) console.log(`  · ${n}`)
}

if (failures.length) {
  console.error(`\n[titles] ✗ ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  ✗ ${f}\n`)
  console.error(`  The root layout adds "| ${BRAND}". Page titles should not repeat it.`)
  console.error(`  The exception is title: { absolute: … }, which skips the template and must keep it.\n`)
  process.exit(1)
}

console.log(`[titles] ✓ ${absoluteKeys.size} absolute title(s) keep the brand; no page repeats it`)
