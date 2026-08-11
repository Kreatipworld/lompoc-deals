#!/usr/bin/env node
// Dead-URL sweep over photos_json for approved businesses.
// A URL is dead only if it fails twice (retry with backoff) with a hard
// signal: network error, HTTP >= 400, or a sub-2000-byte body.
// Dry run by default; --apply writes with a compare-and-swap so a row that
// changed under us is skipped, not clobbered. Backup written before updates.
import { neon } from "@neondatabase/serverless"
import fs from "node:fs"

const APPLY = process.argv.includes("--apply")
const sql = neon(process.env.DATABASE_URL)

async function check(u, attempt = 0) {
  try {
    const res = await fetch(u, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 2000) throw new Error(`${buf.length} bytes`)
    const type = res.headers.get("content-type") || ""
    if (!type.startsWith("image/")) throw new Error(`not an image: ${type}`)
    return { ok: true }
  } catch (e) {
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 2000))
      return check(u, attempt + 1)
    }
    return { ok: false, why: e.message || String(e) }
  }
}

const rows = await sql`
  select id, name, slug, photos_json
  from businesses
  where status='approved'
    and jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) > 0
  order by id`

console.log(`${rows.length} businesses with photos${APPLY ? "" : " (dry run)"}`)

const cache = new Map()
const dirty = []
let urlsChecked = 0

for (const b of rows) {
  const photos = b.photos_json
  const dead = []
  for (const u of photos) {
    if (!cache.has(u)) {
      cache.set(u, await check(u))
      urlsChecked++
    }
    const r = cache.get(u)
    if (!r.ok) dead.push({ url: u, why: r.why })
  }
  if (dead.length) dirty.push({ ...b, dead, keep: photos.filter((u) => cache.get(u).ok) })
}

console.log(`${urlsChecked} unique urls checked · ${dirty.length} business(es) with dead entries\n`)
for (const d of dirty) {
  console.log(`  #${d.id} ${d.name} — ${d.dead.length} dead of ${d.photos_json.length}`)
  for (const x of d.dead) console.log(`      ${x.why.padEnd(14)} ${x.url.slice(0, 90)}`)
}

if (APPLY && dirty.length) {
  fs.writeFileSync(
    `sweep-backup-${Date.now()}.json`,
    JSON.stringify(dirty.map(({ id, slug, photos_json }) => ({ id, slug, photos_json })), null, 2)
  )
  for (const d of dirty) {
    const res = await sql`
      update businesses
         set photos_json = ${JSON.stringify(d.keep)}::jsonb
       where id = ${d.id}
         and photos_json = ${JSON.stringify(d.photos_json)}::jsonb
       returning id`
    console.log(res.length ? `  ✓ #${d.id} ${d.slug}: ${d.photos_json.length} → ${d.keep.length}` : `  ! #${d.id} ${d.slug}: row changed underneath, skipped`)
  }
}
if (!APPLY) console.log("\ndry run — re-run with --apply to write")
