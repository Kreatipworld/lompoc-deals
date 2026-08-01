#!/usr/bin/env node
/**
 * Promotes the best photo a business already has to be its cover.
 *
 * The audit found 70 businesses whose cover loads fine and shows nothing. Most of them are not
 * missing a good picture — they have one, it just isn't the one on the card. This scores every
 * photo a business owns with the same detector the audit uses (scripts/lib/photo-health.mjs, so
 * the two can't disagree) and moves the best clean one to the front.
 *
 * A business is left alone when none of its photos is clean — promoting a second bad cover would
 * only move the problem. Those are the ones a human has to chase the owner about.
 *
 * Dry run by default; nothing is written without --apply.
 *
 * Usage:
 *   node --env-file=.env.local scripts/fix-covers.mjs
 *   node --env-file=.env.local scripts/fix-covers.mjs --apply
 */
import { neon } from "@neondatabase/serverless"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { evaluate, coverScore } from "./lib/photo-health.mjs"

const APPLY = process.argv.includes("--apply")
const url = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(url)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "fix-covers-"))

const rows = await sql`
  select id, name, slug, cover_url, photos_json
  from businesses
  where status='approved' and cover_url is not null
    and jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 2
  order by name`

console.log(`${rows.length} businesses have a cover and at least two photos${APPLY ? "" : "  (dry run)"}\n`)

const urlOf = (p) => (typeof p === "string" ? p : p?.url || p?.src || null)

async function grab(u, name) {
  const file = path.join(TMP, name)
  try {
    const res = await fetch(u, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 2000) return null
    fs.writeFileSync(file, buf)
    return file
  } catch {
    return null
  }
}

const fixed = []
const stuck = []
let untouched = 0

for (const b of rows) {
  const photos = (Array.isArray(b.photos_json) ? b.photos_json : []).map(urlOf).filter(Boolean)
  if (photos.length < 2) continue

  // Score the current cover first — if it's already clean, there is nothing to do here.
  const coverFile = await grab(b.cover_url, `${b.id}-cover.img`)
  const coverEval = coverFile ? evaluate(coverFile, TMP) : { size: null, issues: [{ issue: "dead", detail: "unreachable" }], detail: 0 }
  if (coverEval.issues.length === 0) {
    untouched++
    continue
  }

  const scored = []
  for (let i = 0; i < photos.length; i++) {
    const f = await grab(photos[i], `${b.id}-${i}.img`)
    if (!f) continue
    const ev = evaluate(f, TMP)
    scored.push({ url: photos[i], score: coverScore(ev), ev })
    fs.rmSync(f, { force: true })
  }
  // Only photos with no issues at all are eligible; among those, the highest score wins.
  const best = scored.filter((s) => s.score >= 0).sort((x, y) => y.score - x.score)[0]
  if (!best) {
    stuck.push({ ...b, why: coverEval.issues.map((i) => i.issue).join("+") })
    continue
  }
  if (best.url === b.cover_url) {
    untouched++
    continue
  }

  fixed.push({
    id: b.id, name: b.name, slug: b.slug,
    from: coverEval.issues.map((i) => `${i.issue} ${i.detail}`).join(", "),
    to: `${best.ev.size ? `${best.ev.size.w}x${best.ev.size.h}` : "?"} detail ${Math.round(best.ev.detail)}`,
    newCover: best.url,
    photos,
  })
}

console.log(`${fixed.length} to promote · ${stuck.length} have no clean photo · ${untouched} already fine\n`)
for (const f of fixed) {
  console.log(`  ${f.name.slice(0, 40).padEnd(42)} ${f.from.slice(0, 34).padEnd(36)} → ${f.to}`)
}

if (APPLY && fixed.length) {
  console.log("\napplying…")
  for (const f of fixed) {
    // Cover leads the gallery too, so the card and the profile agree on what the best shot is.
    const reordered = [f.newCover, ...f.photos.filter((p) => p !== f.newCover)]
    await sql`
      update businesses
         set cover_url = ${f.newCover}, photos_json = ${JSON.stringify(reordered)}::jsonb
       where id = ${f.id}`
    console.log(`  ✓ ${f.name}`)
  }
}

if (stuck.length) {
  console.log(`\n${stuck.length} business(es) with no usable photo — the owner has to supply one:`)
  for (const s of stuck) console.log(`  ! ${s.name.padEnd(40)} cover is ${s.why}  /biz/${s.slug}`)
}

fs.rmSync(TMP, { recursive: true, force: true })
if (!APPLY) console.log(`\ndry run — re-run with --apply to write`)
