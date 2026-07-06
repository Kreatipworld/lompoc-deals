/**
 * Fetch Google Places photos for the verified Lompoc hotels and host them on
 * Vercel Blob. Photo #1 per hotel already lives at hotels/v2-<slug>.jpeg
 * (the card cover); this script adds up to 5 more as v2-<slug>-2..6.jpeg for
 * the detail-page gallery and prints the slug → photos[] map.
 *
 * Place IDs were verified against the live Google records on 2026-07-06
 * (see lib/hotels-data.ts header).
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/fetch-hotel-photos.ts
 */
import { put } from "@vercel/blob"

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const MAX_PHOTOS = 6
const PHOTO_MAX_WIDTH = 1200
const DELAY_MS = 400
const BLOB_BASE = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/hotels"

const PLACE_IDS: Record<string, string> = {
  "motel-6-lompoc": "ChIJHZtgWLUe7IARGgL-ZzP42fs",
  "embassy-suites-lompoc": "ChIJ_TTT17ce7IARX5wkAXTxJiU",
  "red-roof-inn-lompoc": "ChIJ7U9Ik5oe7IARk8QA-c6UeAE",
  "lompoc-valley-inn-suites": "ChIJx7eMqkoZ7IAR_eCyNk3RfVo",
  "hilton-garden-inn-lompoc": "ChIJyXBkO7Ye7IARBMpzPYOslfw",
  "inn-at-highway-1": "ChIJb-1_SLYe7IARpXGmHVr4efA",
  "holiday-inn-express-lompoc": "ChIJEa4umrUe7IAR39uRx5o8TwA",
  "ocairns-inn-lompoc": "ChIJk0Finpoe7IARp2qFAU3FdMM",
  "lotus-of-lompoc": "ChIJkXUjpJwe7IAR1OHb52BXyZA",
  "inn-of-lompoc": "ChIJbV6xr7ce7IARmHZtMbwzIeo",
  "budget-inn-lompoc": "ChIJN5zckbge7IARtMD4R6eglgk",
  "village-inn-lompoc": "ChIJy1aQi4YZ7IARtUlbhwfhFN4",
  "star-motel-lompoc": "ChIJ4wQCnZMe7IARZOAMgQE9ucg",
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getPhotoReferences(placeId: string): Promise<string[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as {
    status: string
    result: { photos?: Array<{ photo_reference: string }> }
  }
  if (data.status !== "OK") return []
  return (data.result.photos ?? []).slice(0, MAX_PHOTOS).map((p) => p.photo_reference)
}

async function downloadPhoto(ref: string): Promise<Buffer | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=${PHOTO_MAX_WIDTH}&photo_reference=${ref}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) return null
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) return null
  const buf = Buffer.from(await res.arrayBuffer())
  return buf.byteLength > 100 ? buf : null
}

async function main() {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY missing")
  const out: Record<string, string[]> = {}

  for (const [slug, placeId] of Object.entries(PLACE_IDS)) {
    const refs = await getPhotoReferences(placeId)
    await sleep(DELAY_MS)
    // Photo #1 already exists as the card cover.
    const photos = [`${BLOB_BASE}/v2-${slug}.jpeg`]
    for (let i = 1; i < refs.length; i++) {
      const buf = await downloadPhoto(refs[i])
      await sleep(DELAY_MS)
      if (!buf) continue
      const blob = await put(`hotels/v2-${slug}-${i + 1}.jpeg`, buf, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/jpeg",
      })
      photos.push(blob.url)
    }
    out[slug] = photos
    console.log(`${slug}: ${photos.length} photos`)
  }

  console.log("\n// slug → photos map:")
  console.log(JSON.stringify(out, null, 2))
}

main().then(() => process.exit(0))
