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
import { evaluate } from "./lib/photo-health.mjs"

const LIMIT = Number((process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0)
const JSON_OUT = (process.argv.find((a) => a.startsWith("--json=")) || "").split("=")[1] || ""

const url = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(url)

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "photo-health-"))

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

  const { size, issues } = evaluate(file, TMP)
  void size

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
