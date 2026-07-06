/**
 * Fetch Google Places photos for the activities directory and host them on
 * Vercel Blob (activities/g-<slug>-<n>.jpeg), writing photos_json per row.
 *
 * Matching is looser than for hotels (activities are parks, roads, districts),
 * so each Places candidate is verified before its photos are trusted: the
 * candidate's address must be in the Lompoc area AND its name must share a
 * significant word with the activity title. Non-matches are skipped loudly.
 *
 * imageUrl handling: curated local images (/activities/*.jpg) stay as the
 * lead photo; Unsplash stock gets replaced by the first Places photo.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/fetch-activity-photos.ts
 */
import { db } from "@/db/client"
import { activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { put } from "@vercel/blob"

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const MAX_PHOTOS = 6
const PHOTO_MAX_WIDTH = 1600
const DELAY_MS = 400

// Words too generic to prove a name match on their own.
const STOP_WORDS = new Set([
  "the", "of", "and", "at", "in", "a", "an", "de", "la", "el",
  "lompoc", "valley", "park", "state", "county", "historic", "tour",
  "walking", "viewing", "scenic", "drive", "tasting",
])

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function significantWords(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  )
}

function namesOverlap(a: string, b: string): boolean {
  const wa = significantWords(a)
  const wb = significantWords(b)
  return Array.from(wa).some((w) => wb.has(w))
}

async function findPlace(query: string): Promise<{ placeId: string; name: string; address: string } | null> {
  const q = encodeURIComponent(query)
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${q}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_API_KEY}` +
    `&locationbias=circle:10000@34.6392,-120.4579`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    status: string
    candidates: Array<{ place_id: string; name: string; formatted_address?: string }>
  }
  if (data.status !== "OK" || !data.candidates?.length) return null
  const c = data.candidates[0]
  return { placeId: c.place_id, name: c.name, address: c.formatted_address ?? "" }
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
  const rows = await db
    .select({ id: activities.id, title: activities.title, slug: activities.slug, imageUrl: activities.imageUrl })
    .from(activities)

  for (const a of rows) {
    const place = await findPlace(`${a.title} Lompoc CA`)
    await sleep(DELAY_MS)
    if (!place) {
      console.log(`SKIP   ${a.slug} — no candidate`)
      continue
    }
    const areaOk = /Lompoc|Jalama|Purisima|Vandenberg/i.test(place.address) || /Lompoc|Jalama|Purisima|Vandenberg/i.test(place.name)
    const nameOk = namesOverlap(a.title, place.name)
    if (!areaOk || !nameOk) {
      console.log(`SKIP   ${a.slug} — weak match: "${place.name}" @ ${place.address} (areaOk=${areaOk} nameOk=${nameOk})`)
      continue
    }

    const refs = await getPhotoReferences(place.placeId)
    await sleep(DELAY_MS)
    if (refs.length === 0) {
      console.log(`SKIP   ${a.slug} — matched "${place.name}" but no photos`)
      continue
    }

    const uploaded: string[] = []
    for (let i = 0; i < refs.length; i++) {
      const buf = await downloadPhoto(refs[i])
      await sleep(DELAY_MS)
      if (!buf) continue
      const blob = await put(`activities/g-${a.slug}-${i + 1}.jpeg`, buf, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/jpeg",
      })
      uploaded.push(blob.url)
    }
    if (uploaded.length === 0) {
      console.log(`SKIP   ${a.slug} — all downloads failed`)
      continue
    }

    const keepCuratedLead = !!a.imageUrl && a.imageUrl.startsWith("/activities/")
    const photos = keepCuratedLead ? [a.imageUrl as string, ...uploaded] : uploaded
    const updates: { photosJson: string[]; imageUrl?: string } = { photosJson: photos }
    if (!keepCuratedLead) updates.imageUrl = uploaded[0] // replace Unsplash/missing lead

    await db.update(activities).set(updates).where(eq(activities.id, a.id))
    console.log(`ok     ${a.slug} — "${place.name}" — ${photos.length} photos${keepCuratedLead ? " (curated lead kept)" : " (lead replaced)"}`)
  }
}

main().then(() => process.exit(0))
