// Mirrors Google-hosted business photos (lh3.googleusercontent.com) to Vercel Blob
// so profiles never depend on Google's hotlink throttling.
// Usage:
//   node --env-file=.env.local scripts/mirror-photos-to-blob.mjs [--limit N] [--dry]
// Originals are backed up to scripts/mirror-backup-<timestamp>.json before any UPDATE.

import { neon } from "@neondatabase/serverless"
import { put } from "@vercel/blob"
import { createHash } from "node:crypto"
import { writeFileSync } from "node:fs"

const sql = neon(process.env.DATABASE_URL)
const DRY = process.argv.includes("--dry")
const limitIx = process.argv.indexOf("--limit")
const LIMIT = limitIx > -1 ? Number(process.argv[limitIx + 1]) : null

const isGoogle = (u) => typeof u === "string" && u.includes("googleusercontent.com")

async function fetchImage(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const type = res.headers.get("content-type") ?? "image/jpeg"
    if (!type.startsWith("image/")) throw new Error(`not an image: ${type}`)
    return { buf: Buffer.from(await res.arrayBuffer()), type }
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
      return fetchImage(url, attempt + 1)
    }
    throw e
  }
}

const rows = await sql`
  SELECT id, slug, cover_url, logo_url, photos_json
  FROM businesses
  WHERE status = 'approved' AND (
    cover_url LIKE '%googleusercontent%' OR
    logo_url LIKE '%googleusercontent%' OR
    photos_json::text LIKE '%googleusercontent%'
  )
  ORDER BY slug`

const targets = LIMIT ? rows.slice(0, LIMIT) : rows
console.log(`${rows.length} businesses need mirroring; processing ${targets.length}${DRY ? " (dry run)" : ""}`)

const backup = []
let uploaded = 0
let failed = 0

for (const biz of targets) {
  const urls = new Set()
  if (isGoogle(biz.cover_url)) urls.add(biz.cover_url)
  if (isGoogle(biz.logo_url)) urls.add(biz.logo_url)
  for (const u of biz.photos_json ?? []) if (isGoogle(u)) urls.add(u)

  const map = {}
  for (const u of urls) {
    const ext = "jpg"
    const key = `biz-photos/${biz.slug}/${createHash("sha1").update(u).digest("hex").slice(0, 10)}.${ext}`
    if (DRY) { map[u] = `(dry) ${key}`; continue }
    try {
      const { buf, type } = await fetchImage(u)
      const blob = await put(key, buf, { access: "public", contentType: type, addRandomSuffix: false, allowOverwrite: true })
      map[u] = blob.url
      uploaded++
    } catch (e) {
      console.error(`  FAIL ${biz.slug}: ${e.message} (${u.slice(0, 60)}...)`)
      failed++
    }
  }

  if (DRY) { console.log(biz.slug, Object.keys(map).length, "urls"); continue }

  const newCover = map[biz.cover_url] ?? biz.cover_url
  const newLogo = map[biz.logo_url] ?? biz.logo_url
  const newPhotos = (biz.photos_json ?? []).map((u) => map[u] ?? u)
    // Drop photos we could not mirror AND that are Google-hosted (they're the flaky ones).
    .filter((u) => !(isGoogle(u) && !map[u]))

  backup.push({ id: biz.id, slug: biz.slug, cover_url: biz.cover_url, logo_url: biz.logo_url, photos_json: biz.photos_json })
  await sql`
    UPDATE businesses SET
      cover_url = ${newCover},
      logo_url = ${newLogo},
      photos_json = ${JSON.stringify(newPhotos)}::jsonb
    WHERE id = ${biz.id}`
  console.log(`  ok ${biz.slug}: ${Object.keys(map).length} mirrored`)
}

if (!DRY && backup.length) {
  const file = `scripts/mirror-backup-${Date.now()}.json`
  writeFileSync(file, JSON.stringify(backup, null, 2))
  console.log(`backup written: ${file}`)
}
console.log(`done. uploaded=${uploaded} failed=${failed}`)
