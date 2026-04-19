/**
 * db/fix-business-images.ts
 *
 * Replaces placeholder/hotlinked images with owned Vercel Blob copies.
 * Uses Google Places API to find each business and fetch real photos.
 * Optionally sources logos from Clearbit when the business has a website.
 *
 * Usage:
 *   npx tsx db/fix-business-images.ts               # process all
 *   npx tsx db/fix-business-images.ts --dry-run      # preview, no writes
 *   npx tsx db/fix-business-images.ts --id 42        # single business
 *   npx tsx db/fix-business-images.ts --limit 20     # cap at N businesses
 *   npx tsx db/fix-business-images.ts --covers-only  # skip logo fetch
 *
 * Env required:
 *   GOOGLE_MAPS_API_KEY   — Google Maps / Places API key
 *   BLOB_READ_WRITE_TOKEN — Vercel Blob write token
 *   DATABASE_URL          — Neon connection string
 *
 * Idempotency:
 *   Skips any business whose cover_url already contains "vercel-storage.com".
 *   Re-run safely at any time; previously uploaded assets are never re-uploaded.
 */

// Load .env.local before anything else
import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local") })

import { db } from "./client"
import { businesses } from "./schema"
import { eq } from "drizzle-orm"
import { put } from "@vercel/blob"

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const COVERS_ONLY = args.includes("--covers-only")

const SINGLE_ID = (() => {
  const idx = args.indexOf("--id")
  return idx !== -1 ? parseInt(args[idx + 1], 10) : null
})()

const LIMIT = (() => {
  const idx = args.indexOf("--limit")
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()

// ── Config ───────────────────────────────────────────────────────────────────

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const MAX_PHOTOS_JSON = 4  // additional photos beyond the cover to store
const COVER_MAX_WIDTH = 1200
const DELAY_MS = 600  // ~1.5 req/s — well under Google's 100 QPS limit

// ── Types ────────────────────────────────────────────────────────────────────

interface PlaceCandidate {
  place_id: string
  name: string
}

interface PlacePhoto {
  photo_reference: string
  height: number
  width: number
}

interface PlaceDetails {
  photos?: PlacePhoto[]
  icon?: string
}

// ── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Returns true when the URL is already an owned Vercel Blob asset. */
function isVercelBlob(url: string | null | undefined): boolean {
  return !!url && url.includes("vercel-storage.com")
}

/** Uploads a Buffer to Vercel Blob and returns the public URL. */
async function uploadBuffer(
  buffer: Buffer,
  prefix: string,
  contentType = "image/jpeg",
): Promise<string> {
  const ext = contentType.split("/")[1] ?? "jpg"
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const blob = await put(key, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType,
  })
  return blob.url
}

/** Downloads a URL (follows redirects) and returns the raw buffer. */
async function downloadUrl(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow" })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    // Only accept image responses
    if (!contentType.startsWith("image/")) return null
    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer.byteLength < 100) return null  // suspiciously small
    return { buffer: Buffer.from(arrayBuffer), contentType }
  } catch {
    return null
  }
}

// ── Google Places API ─────────────────────────────────────────────────────────

/** Step 1 — find a place_id by searching "{name} Lompoc CA". */
async function findPlaceId(name: string): Promise<string | null> {
  const q = encodeURIComponent(`${name} Lompoc CA`)
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${q}&inputtype=textquery&fields=place_id,name&key=${GOOGLE_API_KEY}`

  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { status: string; candidates: PlaceCandidate[] }
  if (data.status !== "OK" || !data.candidates?.length) return null
  return data.candidates[0].place_id
}

/** Step 2 — get photo references (and icon) for a known place_id. */
async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=photos,icon&key=${GOOGLE_API_KEY}`

  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { status: string; result: PlaceDetails }
  if (data.status !== "OK") return null
  return data.result
}

/**
 * Step 3 — download a photo by its photo_reference.
 * The Places Photo endpoint returns a redirect to the actual image.
 */
async function downloadPlacePhoto(
  photoRef: string,
  maxWidth = COVER_MAX_WIDTH,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`
  return downloadUrl(url)
}

// ── Clearbit logo ─────────────────────────────────────────────────────────────

/** Try to fetch a logo from Clearbit using the business's website domain. */
async function fetchClearbitLogo(
  website: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const domain = new URL(website).hostname.replace(/^www\./, "")
    return downloadUrl(`https://logo.clearbit.com/${domain}?size=400`)
  } catch {
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Validate required env vars
  if (!GOOGLE_API_KEY) {
    console.error("❌  GOOGLE_MAPS_API_KEY is not set. Add it to .env.local.")
    process.exit(1)
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌  BLOB_READ_WRITE_TOKEN is not set. Add it to .env.local.")
    process.exit(1)
  }

  console.log(
    `🖼  fix-business-images` +
      (DRY_RUN ? " (DRY RUN)" : "") +
      (SINGLE_ID ? ` (id=${SINGLE_ID})` : "") +
      (LIMIT !== Infinity ? ` (limit=${LIMIT})` : "") +
      "\n",
  )

  // ── Load businesses that need image work ──────────────────────────────────

  const all = await db.query.businesses.findMany({
    columns: {
      id: true,
      name: true,
      coverUrl: true,
      logoUrl: true,
      website: true,
      status: true,
    },
  })

  // Filter to those that need processing
  let toProcess = all.filter((b) => {
    if (SINGLE_ID !== null) return b.id === SINGLE_ID
    // Skip if cover is already a Vercel Blob URL
    if (isVercelBlob(b.coverUrl)) return false
    return true
  })

  if (LIMIT !== Infinity) toProcess = toProcess.slice(0, LIMIT)

  // Stats
  const nPlaceholder = all.filter((b) => b.coverUrl?.includes("picsum.photos")).length
  const nHotlinked = all.filter(
    (b) => b.coverUrl && !isVercelBlob(b.coverUrl) && !b.coverUrl.includes("picsum.photos"),
  ).length
  const nMissing = all.filter((b) => !b.coverUrl).length
  const nAlready = all.filter((b) => isVercelBlob(b.coverUrl)).length

  console.log(`📊 Image breakdown across ${all.length} businesses:`)
  console.log(`   ✅  ${nAlready} already on Vercel Blob (will skip)`)
  console.log(`   🚫  ${nPlaceholder} picsum.photos placeholders`)
  console.log(`   🔗  ${nHotlinked} hotlinked (non-blob) URLs`)
  console.log(`   ❌  ${nMissing} with no cover image`)
  console.log(`\n🔄 Processing ${toProcess.length} businesses…\n`)

  // ── Process each business ─────────────────────────────────────────────────

  let coverUpdated = 0
  let logoUpdated = 0
  let photosUpdated = 0
  let notFound = 0
  let errors = 0

  for (const biz of toProcess) {
    console.log(`▸ [${biz.id}] ${biz.name}`)

    await sleep(DELAY_MS)

    try {
      // 1. Find the place on Google Maps
      const placeId = await findPlaceId(biz.name)
      if (!placeId) {
        console.log(`  ⚠  not found on Google Places — skipping`)
        notFound++
        continue
      }

      await sleep(DELAY_MS)

      // 2. Get place details (photos list)
      const details = await getPlaceDetails(placeId)
      if (!details?.photos?.length) {
        console.log(`  ⚠  no photos in Place Details — skipping`)
        notFound++
        continue
      }

      const photos = details.photos

      // 3. Download and upload cover photo (first photo)
      let coverBlobUrl: string | null = null
      const coverResult = await downloadPlacePhoto(photos[0].photo_reference)
      if (coverResult) {
        if (!DRY_RUN) {
          coverBlobUrl = await uploadBuffer(coverResult.buffer, "covers", coverResult.contentType)
        } else {
          coverBlobUrl = "https://vercel-storage.com/dry-run/cover.jpg"
        }
        console.log(`  ✓ cover uploaded`)
        coverUpdated++
      } else {
        console.log(`  ⚠  cover download failed`)
      }

      // 4. Download and upload additional photos → photos_json
      const additionalPhotoUrls: string[] = []
      const additionalPhotos = photos.slice(1, 1 + MAX_PHOTOS_JSON)

      for (const photo of additionalPhotos) {
        await sleep(200)
        const result = await downloadPlacePhoto(photo.photo_reference, 800)
        if (result) {
          if (!DRY_RUN) {
            const url = await uploadBuffer(result.buffer, "photos", result.contentType)
            additionalPhotoUrls.push(url)
          } else {
            additionalPhotoUrls.push("https://vercel-storage.com/dry-run/photo.jpg")
          }
        }
      }

      if (additionalPhotoUrls.length > 0) {
        console.log(`  ✓ ${additionalPhotoUrls.length} additional photo(s) uploaded`)
        photosUpdated++
      }

      // 5. Logo: try Clearbit first, fall back to Google Places icon
      let logoBlobUrl: string | null = null
      if (!COVERS_ONLY && !isVercelBlob(biz.logoUrl)) {
        await sleep(200)

        // 5a. Clearbit (requires working DNS to logo.clearbit.com)
        if (biz.website) {
          const logoResult = await fetchClearbitLogo(biz.website)
          if (logoResult) {
            if (!DRY_RUN) {
              logoBlobUrl = await uploadBuffer(logoResult.buffer, "logos", logoResult.contentType)
            } else {
              logoBlobUrl = "https://vercel-storage.com/dry-run/logo.jpg"
            }
            console.log(`  ✓ logo uploaded (Clearbit)`)
            logoUpdated++
          }
        }

        // 5b. Google Places icon as fallback when Clearbit fails
        if (!logoBlobUrl && details.icon) {
          await sleep(200)
          const iconResult = await downloadUrl(details.icon)
          if (iconResult) {
            if (!DRY_RUN) {
              logoBlobUrl = await uploadBuffer(iconResult.buffer, "logos", iconResult.contentType)
            } else {
              logoBlobUrl = "https://vercel-storage.com/dry-run/logo-icon.png"
            }
            console.log(`  ✓ logo uploaded (Google Places icon)`)
            logoUpdated++
          }
        }
      }

      // 6. Write updates to DB
      if (!DRY_RUN) {
        const updates: Record<string, unknown> = {}
        if (coverBlobUrl) updates.coverUrl = coverBlobUrl
        if (logoBlobUrl) updates.logoUrl = logoBlobUrl
        if (additionalPhotoUrls.length > 0) updates.photosJson = additionalPhotoUrls

        if (Object.keys(updates).length > 0) {
          await db.update(businesses).set(updates).where(eq(businesses.id, biz.id))
        }
      } else {
        console.log(`  ~ DRY RUN: would update cover=${!!coverBlobUrl} logo=${!!logoBlobUrl} photos=${additionalPhotoUrls.length}`)
      }
    } catch (err) {
      console.error(`  ✗ error: ${(err as Error).message}`)
      errors++
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n✅  Done.`)
  console.log(`   covers updated  : ${coverUpdated}`)
  console.log(`   logos updated   : ${logoUpdated}`)
  console.log(`   photos_json set : ${photosUpdated}`)
  console.log(`   not on Google   : ${notFound}`)
  console.log(`   errors          : ${errors}`)
  if (DRY_RUN) console.log("   (DRY RUN — no writes made)")

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
