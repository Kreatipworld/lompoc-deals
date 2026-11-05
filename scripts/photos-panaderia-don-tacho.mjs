// Panadería Don Tacho profile photos from Andres's Nov 4 footage (stills picked by pick_photos.py).
// Cover = pink conchas shelf; previous cover (logo card) kept as the last gallery photo.
// Run: node --env-file=.env.local scripts/photos-panaderia-don-tacho.mjs
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const dir = "content/social/video/out/panaderia-interview/photos"
const up = async (n) => (await put(`biz-photos/panaderia-don-tacho/${n}.jpg`, readFileSync(`${dir}/${n}.jpg`), { access: "public", contentType: "image/jpeg", addRandomSuffix: true })).url
const [b] = await sql`select cover_url, photos_json from businesses where id = 689`
console.log("before", JSON.stringify(b))
const cover = await up("cover")
const gallery = [cover]
for (const n of ["sign", "conchas2", "muffins", "puerquitos", "coffee"]) gallery.push(await up(n))
gallery.push(b.cover_url)
await sql`update businesses set cover_url = ${cover}, photos_json = ${JSON.stringify(gallery)}::jsonb where id = 689`
console.log("after", cover, gallery.length, "photos")
