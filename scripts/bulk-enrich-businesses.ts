// Bulk-enrich approved businesses from Google Places: photos, verified phone,
// website, and editorial summary. Fills ONLY missing/thin fields — rows already
// hand-curated (about_source set, 3+ photos) keep their curated data.
//
// Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/bulk-enrich-businesses.ts
import { eq, and, isNotNull } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"

const KEY = process.env.GOOGLE_MAPS_API_KEY
const MAX_PHOTOS = 6
const CONCURRENCY = 4

interface PlaceDetails {
  photos?: { photo_reference: string }[]
  website?: string
  formatted_phone_number?: string
  editorial_summary?: { overview?: string }
}

async function fetchDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,website,formatted_phone_number,editorial_summary&key=${KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { status: string; result?: PlaceDetails }
  return data.status === "OK" ? (data.result ?? null) : null
}

// Resolve a photo reference to its permanent lh3 URL (never store key-bearing URLs)
async function resolvePhotoUrl(ref: string): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${ref}&key=${KEY}`
  const res = await fetch(url, { redirect: "manual" })
  const loc = res.headers.get("location")
  return loc && loc.includes("googleusercontent") ? loc : null
}

async function enrichOne(biz: {
  id: number
  name: string
  googlePlaceId: string | null
  phone: string | null
  website: string | null
  about: string | null
  description: string | null
  photosJson: unknown
}): Promise<string> {
  if (!biz.googlePlaceId) return "skip:no-place-id"
  const details = await fetchDetails(biz.googlePlaceId)
  if (!details) return "skip:no-details"

  const updates: Record<string, unknown> = {}
  const currentPhotos = Array.isArray(biz.photosJson) ? biz.photosJson.length : 0

  if (currentPhotos < 3 && details.photos?.length) {
    const urls: string[] = []
    for (const p of details.photos.slice(0, MAX_PHOTOS)) {
      const u = await resolvePhotoUrl(p.photo_reference)
      if (u) urls.push(u)
    }
    if (urls.length) {
      updates.photosJson = urls
      updates.coverUrl = urls[0]
    }
  }

  if (!biz.website && details.website) {
    updates.website = details.website.slice(0, 500)
  }

  if (details.formatted_phone_number && biz.phone !== details.formatted_phone_number) {
    updates.phone = details.formatted_phone_number
  }

  const overview = details.editorial_summary?.overview
  if (overview) {
    if (!biz.about) {
      updates.about = overview.slice(0, 2000)
      updates.aboutSource = "google"
    }
    if (!biz.description) {
      updates.description =
        overview.length <= 200
          ? overview
          : overview.slice(0, 200).replace(/\s+\S*$/, "") + "…"
    }
  }

  if (Object.keys(updates).length === 0) return "skip:nothing-to-fill"
  await db.update(businesses).set(updates).where(eq(businesses.id, biz.id))
  return `updated:${Object.keys(updates).join(",")}`
}

async function main() {
  if (!KEY) throw new Error("GOOGLE_MAPS_API_KEY missing")
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      googlePlaceId: businesses.googlePlaceId,
      phone: businesses.phone,
      website: businesses.website,
      about: businesses.about,
      description: businesses.description,
      photosJson: businesses.photosJson,
    })
    .from(businesses)
    .where(
      and(eq(businesses.status, "approved"), isNotNull(businesses.googlePlaceId))
    )

  console.log(`enriching ${rows.length} businesses…`)
  let done = 0
  const counts: Record<string, number> = {}

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map((b) =>
        enrichOne(b).catch((e) => `error:${e instanceof Error ? e.message : e}`)
      )
    )
    results.forEach((r, j) => {
      const key = r.split(":")[0]
      counts[key] = (counts[key] ?? 0) + 1
      if (key === "error") console.log(`  ! ${batch[j].name}: ${r}`)
    })
    done += batch.length
    if (done % 40 === 0) console.log(`  …${done}/${rows.length}`, counts)
  }

  console.log("DONE", counts)
  process.exit(0)
}

main()
