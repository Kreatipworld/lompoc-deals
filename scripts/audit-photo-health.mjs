#!/usr/bin/env node
/**
 * Finds business covers that are technically fine and visually useless.
 *
 * The existing safety net only catches dead URLs — SafeImage prunes a tile that fails to load.
 * But a cover can return HTTP 200 and still show nothing: Bowl & Soul's was a 640x639 crop whose
 * top third was a solid black band with the food running off the bottom edge, and it sat on the
 * landing page's partner card until a human noticed. Loading is not the bar.
 *
 * What it flags, in the order a person would care:
 *   dead        the cover URL doesn't resolve at all
 *   tiny        below MIN_EDGE on the short edge — it will be soft wherever it's shown
 *   blank       a wide band of near-uniform pixels (dead space, not a photograph)
 *   letterboxed solid bars top or bottom, which the card's badge and name plate then sit on
 *   lopsided    so far from the card's 4:5 that a centre crop throws most of it away
 *
 * Nothing is written. This reports; a human decides what to replace.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-photo-health.mjs [--limit N] [--json out.json]
 */
import { neon } from "@neondatabase/serverless"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const LIMIT = Number((process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0)
const JSON_OUT = (process.argv.find((a) => a.startsWith("--json=")) || "").split("=")[1] || ""

// Deliberately not the ideal — the ideal (≥1080 short edge, to fill a partner card without
// upscaling) would flag most of the directory, and a report that flags everything gets ignored.
// This is the "visibly soft even in a thumbnail" line.
const MIN_EDGE = 500
/**
 * Thresholds measured against a real failure, not guessed.
 *
 * The first cut tested each row's min/max spread and caught nothing — the Bowl & Soul band was a
 * dark *gradient*, so its range looked normal. Sampling the actual rows showed the real signal is
 * standard deviation: that band ran sd 6–9 across the top 8 rows of 24, while a good photograph of
 * the same subject never drops below sd 17 except for 3 rows of blurred counter at the bottom.
 */
const FLAT_SD = 12 // a row this uniform carries no detail
const EDGE_BAND_RATIO = 0.22 // a dead run this deep at the top or bottom is wasted frame
const BLANK_ROW_RATIO = 0.5 // mostly detail-less overall — an empty image, not a composed one
const TARGET_RATIO = 4 / 5

const url = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(url)

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "photo-health-"))

/** Decode to a tiny raw greyscale grid — enough to spot flat bands without decoding full frames. */
function sample(file, w = 24, h = 30) {
  const out = path.join(TMP, "s.gray")
  execFileSync(
    ffmpegPath,
    ["-y", "-i", file, "-vf", `scale=${w}:${h}`, "-pix_fmt", "gray", "-f", "rawvideo", out],
    { stdio: "ignore", timeout: 25_000 }
  )
  const buf = fs.readFileSync(out)
  const rows = []
  for (let y = 0; y < h; y++) rows.push([...buf.subarray(y * w, (y + 1) * w)])
  return rows
}

function dimensions(file) {
  const out = execFileSync(ffmpegPath, ["-i", file, "-hide_banner"], {
    stdio: ["ignore", "ignore", "pipe"], timeout: 25_000, encoding: "utf8",
  }).toString()
  return out
}

/** ffmpeg reports size on stderr and exits non-zero with no output file; parse either way. */
function probeSize(file) {
  try {
    dimensions(file)
  } catch (e) {
    const m = String(e.stderr || "").match(/,\s(\d{2,5})x(\d{2,5})[\s,]/)
    if (m) return { w: Number(m[1]), h: Number(m[2]) }
  }
  return null
}

function sd(row) {
  const mean = row.reduce((a, b) => a + b, 0) / row.length
  return Math.sqrt(row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length)
}
const flat = (row) => sd(row) <= FLAT_SD

function analyse(rows) {
  const flatRows = rows.filter(flat).length
  let topBand = 0
  while (topBand < rows.length && flat(rows[topBand])) topBand++
  let bottomBand = 0
  while (bottomBand < rows.length && flat(rows[rows.length - 1 - bottomBand])) bottomBand++
  return { blankRatio: flatRows / rows.length, topBand, bottomBand, total: rows.length }
}

const businesses = await sql`
  select id, name, slug, cover_url,
         jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) as photos
  from businesses
  where status='approved' and cover_url is not null
  order by id`

const pool = LIMIT ? businesses.slice(0, LIMIT) : businesses
console.log(`checking ${pool.length} approved businesses with a cover\n`)

const findings = []
let checked = 0

for (const b of pool) {
  const file = path.join(TMP, `${b.id}.img`)
  let res
  try {
    res = await fetch(b.cover_url, { signal: AbortSignal.timeout(20_000) })
  } catch {
    findings.push({ ...b, issue: "dead", detail: "request failed" })
    continue
  }
  if (!res.ok) {
    findings.push({ ...b, issue: "dead", detail: `HTTP ${res.status}` })
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 2000) {
    findings.push({ ...b, issue: "dead", detail: `${buf.length} bytes` })
    continue
  }
  fs.writeFileSync(file, buf)
  checked++

  const size = probeSize(file)
  const issues = []
  if (size) {
    const short = Math.min(size.w, size.h)
    if (short < MIN_EDGE) issues.push({ issue: "tiny", detail: `${size.w}x${size.h}` })
    // 16:9 is ordinary photography and centre-crops to 4:5 perfectly well, so the bar is set
    // beyond it: only panoramas and tall strips, where a centre crop discards most of the frame.
    const ratio = size.w / size.h
    if (ratio > 2.4 || ratio < 0.42) issues.push({ issue: "lopsided", detail: `${size.w}x${size.h}` })
  }

  try {
    const a = analyse(sample(file))
    if (a.blankRatio >= BLANK_ROW_RATIO)
      issues.push({ issue: "blank", detail: `${Math.round(a.blankRatio * 100)}% flat rows` })
    const band = Math.max(a.topBand, a.bottomBand)
    if (band / a.total >= EDGE_BAND_RATIO)
      issues.push({
        issue: "letterboxed",
        detail: `${a.topBand ? `${Math.round((a.topBand / a.total) * 100)}% top` : ""}${
          a.topBand && a.bottomBand ? " + " : ""
        }${a.bottomBand ? `${Math.round((a.bottomBand / a.total) * 100)}% bottom` : ""}`,
      })
  } catch {
    /* undecodable frame — the size check above already spoke, or it's a format ffmpeg won't read */
  }

  for (const i of issues) findings.push({ ...b, ...i })
  fs.rmSync(file, { force: true })
}

const RANK = { dead: 0, tiny: 1, blank: 2, letterboxed: 3, lopsided: 4 }
findings.sort((a, b) => RANK[a.issue] - RANK[b.issue] || a.name.localeCompare(b.name))

const byIssue = findings.reduce((m, f) => ((m[f.issue] = (m[f.issue] || 0) + 1), m), {})
console.log(`${checked} covers fetched · ${findings.length} finding(s) across ${new Set(findings.map((f) => f.id)).size} business(es)\n`)
for (const [k, v] of Object.entries(byIssue)) console.log(`  ${String(v).padStart(3)} ${k}`)

if (findings.length) {
  console.log("")
  for (const f of findings) {
    console.log(`  ${f.issue.padEnd(11)} ${f.name.slice(0, 38).padEnd(40)} ${String(f.detail).padEnd(18)} ${f.photos} photo(s)  /biz/${f.slug}`)
  }
  console.log(`\nA business with other photos can be fixed by promoting one; a business with 1 photo needs the owner.`)
}

if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(findings, null, 2) + "\n")
  console.log(`\njson → ${JSON_OUT}`)
}

fs.rmSync(TMP, { recursive: true, force: true })
