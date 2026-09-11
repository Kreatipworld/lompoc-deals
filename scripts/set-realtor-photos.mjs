// set-realtor-photos.mjs
// Uploads a cover + gallery of OUR OWN Lompoc photos for a realtor preview
// profile and points the row at them. House photos are never sourced from
// MLS/portals — the agent uploads those after claiming.
//
// Usage: node --env-file=.env.local scripts/set-realtor-photos.mjs <slug> <cover.png> <gallery1.jpg> [gallery2.jpg ...]

import { put } from "@vercel/blob"
import { readFileSync } from "fs"
import { basename, extname } from "path"
import { neon } from "@neondatabase/serverless"

// Optional: --logo <square.jpg> sets logo_url (header avatar + agent card avatar).
const argv = process.argv.slice(2)
let logoPath = null
const li = argv.indexOf("--logo")
if (li >= 0) { logoPath = argv[li + 1]; argv.splice(li, 2) }
const [slug, coverPath, ...gallery] = argv
if (!slug || !coverPath) {
  console.error("usage: node --env-file=.env.local scripts/set-realtor-photos.mjs <slug> <cover.png> [gallery...] [--logo square.jpg]")
  process.exit(1)
}
const sql = neon(process.env.DATABASE_URL)
const token = process.env.BLOB_READ_WRITE_TOKEN
const type = (p) => (extname(p).toLowerCase() === ".png" ? "image/png" : "image/jpeg")

const cover = await put(`biz-photos/${slug}/cover-v2.png`, readFileSync(coverPath), { access: "public", token, addRandomSuffix: false, contentType: "image/png" })
const urls = [cover.url]
for (const g of gallery) {
  const r = await put(`biz-photos/${slug}/${basename(g)}`, readFileSync(g), { access: "public", token, addRandomSuffix: false, contentType: type(g) })
  urls.push(r.url)
}
let logoUrl = null
if (logoPath) {
  const l = await put(`biz-photos/${slug}/avatar.jpg`, readFileSync(logoPath), { access: "public", token, addRandomSuffix: false, contentType: "image/jpeg" })
  logoUrl = l.url
}
const res = logoUrl
  ? await sql`update businesses set cover_url = ${cover.url}, photos_json = ${JSON.stringify(urls)}::jsonb, logo_url = ${logoUrl} where slug = ${slug} returning id`
  : await sql`update businesses set cover_url = ${cover.url}, photos_json = ${JSON.stringify(urls)}::jsonb where slug = ${slug} returning id`
console.log("updated", res[0]?.id, urls.length, "photos", logoUrl ? "+ avatar" : "")
console.log(urls.join("\n"))
