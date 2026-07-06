/**
 * Populate real cover photos for the static HOTELS list on /hotels.
 *
 * Source 1: the businesses table — the Google Places scrape already stored
 * blob-hosted covers for 9 of the 15 hotels; reuse those URLs directly.
 * Source 2: Google Places photo API (same pipeline as db/fix-business-images.ts)
 * for the rest, uploaded to Vercel Blob under hotels/.
 *
 * Prints a slug → url map to paste into lib/hotels-data.ts coverUrl fields.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/fetch-hotel-photos.ts
 */
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { ilike } from "drizzle-orm"
import { put } from "@vercel/blob"
import { HOTELS } from "@/lib/hotels-data"

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const COVER_MAX_WIDTH = 1200
const DELAY_MS = 600

// Hotel slug → business name pattern in the DB (verified matches with photos).
const DB_NAME_MATCH: Record<string, string> = {
  "embassy-suites-lompoc": "Embassy Suites by Hilton Lompoc%",
  "hilton-garden-inn-lompoc": "Hilton Garden Inn Lompoc",
  "holiday-inn-express-lompoc": "Holiday Inn Express Lompoc%",
  "inn-of-lompoc": "Inn of Lompoc",
  "lotus-of-lompoc": "Lotus Of Lompoc%",
  "motel-6-lompoc": "Motel 6 Lompoc%",
  "ocairns-inn-suites": "O'Cairns Inn & Suites",
  "red-roof-inn-lompoc": "Red Roof Inn Lompoc",
  "village-inn": "Village Inn",
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function findPlaceId(name: string): Promise<string | null> {
  const q = encodeURIComponent(`${name} Lompoc CA`)
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${q}&inputtype=textquery&fields=place_id,name&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { status: string; candidates: Array<{ place_id: string }> }
  if (data.status !== "OK" || !data.candidates?.length) return null
  return data.candidates[0].place_id
}

async function getPhotoReference(placeId: string): Promise<string | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    status: string
    result: { photos?: Array<{ photo_reference: string }> }
  }
  if (data.status !== "OK" || !data.result.photos?.length) return null
  return data.result.photos[0].photo_reference
}

async function downloadPhoto(ref: string): Promise<Buffer | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=${COVER_MAX_WIDTH}&photo_reference=${ref}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) return null
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) return null
  const buf = Buffer.from(await res.arrayBuffer())
  return buf.byteLength > 100 ? buf : null
}

async function main() {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY missing")
  const result: Record<string, string> = {}

  for (const hotel of HOTELS) {
    // Source 1: existing blob cover on the matching business row
    const pattern = DB_NAME_MATCH[hotel.slug]
    if (pattern) {
      const rows = await db
        .select({ coverUrl: businesses.coverUrl })
        .from(businesses)
        .where(ilike(businesses.name, pattern))
        .limit(1)
      const cover = rows[0]?.coverUrl
      if (cover && cover.includes("vercel-storage.com")) {
        result[hotel.slug] = cover
        console.log(`db     ${hotel.slug} → ${cover}`)
        continue
      }
    }

    // Source 2: Google Places photo → Vercel Blob
    const placeId = await findPlaceId(hotel.name)
    await sleep(DELAY_MS)
    if (!placeId) {
      console.log(`MISS   ${hotel.slug} — no place found`)
      continue
    }
    const ref = await getPhotoReference(placeId)
    await sleep(DELAY_MS)
    if (!ref) {
      console.log(`MISS   ${hotel.slug} — no photos on place`)
      continue
    }
    const buf = await downloadPhoto(ref)
    if (!buf) {
      console.log(`MISS   ${hotel.slug} — photo download failed`)
      continue
    }
    const blob = await put(`hotels/${hotel.slug}.jpeg`, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/jpeg",
    })
    result[hotel.slug] = blob.url
    console.log(`places ${hotel.slug} → ${blob.url}`)
    await sleep(DELAY_MS)
  }

  console.log("\n// slug → coverUrl map:")
  console.log(JSON.stringify(result, null, 2))
}

main().then(() => process.exit(0))
