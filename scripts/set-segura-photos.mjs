// set-segura-photos.mjs — Phillip Segura (biz 685) photos, with his OK (Oct 19 2026, via Andres:
// "add his pictures… he approved"). Headshot → logo, branded cover with his face, and 12 curated
// photos per active listing (his own listings, mirrored to our Blob, never hotlinked).
// Usage: bash scripts/set-segura-photos.sh   (photos in ~/.cache/segura)
import { put } from "@vercel/blob"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { neon } from "@neondatabase/serverless"

const dir = process.argv[2]
const sql = neon(process.env.DATABASE_URL)
const BIZ = 685
const LISTINGS = { 26001214: 55, 26001417: 56, 26001899: 57, 26001880: 58 } // MLS# → property_listings.id
const up = async (path, file, type) =>
  (await put(path, readFileSync(join(dir, file)), { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN, addRandomSuffix: false, allowOverwrite: true, contentType: type })).url

const [biz] = await sql`select slug from businesses where id = ${BIZ}`
if (biz?.slug !== "phillip-segura-realtor") throw new Error("biz 685 is not Phillip Segura")

const logo = await up(`logos/phillip-segura-realtor-v2.jpg`, "logo.jpg", "image/jpeg")
const cover = await up(`biz-photos/phillip-segura-realtor/cover-v3-blue.png`, "cover.png", "image/png")
const fronts = []
for (const [mls, id] of Object.entries(LISTINGS)) {
  const files = readdirSync(dir).filter((f) => f.startsWith(mls + "-")).sort()
  const urls = []
  for (const f of files) urls.push(await up(`listings/${BIZ}/l${id}-${f.slice(mls.length + 1)}`, f, "image/jpeg"))
  await sql`update property_listings set image_url = ${urls[0]}, photos_json = ${JSON.stringify(urls)}::jsonb where id = ${id} and business_id = ${BIZ}`
  fronts.push(urls[0])
  console.log("listing", id, urls.length, "photos")
}
await sql`update businesses set logo_url = ${logo}, cover_url = ${cover}, photos_json = ${JSON.stringify([cover, ...fronts])}::jsonb where id = ${BIZ}`
console.log("biz 685 logo + cover + gallery set")
