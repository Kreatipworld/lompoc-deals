/**
 * db/regeocode-businesses.ts
 *
 * Re-geocodes businesses using the Mapbox Geocoding API, cross-checking the
 * address stored in the DB against the coordinates. Fixes cases where the
 * Apify Google Places scraper imported coordinates that don't match the
 * business's actual street address.
 *
 * Only updates when the geocoded location differs by >~11m AND Mapbox returns
 * a high-relevance result (relevance >= 0.9).
 *
 * Usage:
 *   npx tsx db/regeocode-businesses.ts                 # fix all
 *   npx tsx db/regeocode-businesses.ts --dry-run       # preview, no writes
 *   npx tsx db/regeocode-businesses.ts --id 154        # single business by id
 *
 * Env required:
 *   NEXT_PUBLIC_MAPBOX_TOKEN  — Mapbox access token
 *   DATABASE_URL              — Neon connection string
 */

// Load .env.local before anything else
import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local") })

import { db } from "./client"
import { businesses } from "./schema"
import { eq, isNotNull } from "drizzle-orm"

const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const SINGLE_ID = (() => {
  const idx = args.indexOf("--id")
  return idx !== -1 ? parseInt(args[idx + 1], 10) : null
})()
const THRESHOLD_M = (() => {
  const idx = args.indexOf("--threshold")
  const parsed = idx !== -1 ? parseInt(args[idx + 1], 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30
})()

// Rate limit: stay under 600 req/min (Mapbox free tier)
const DELAY_MS = 120

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Returns true if the address has a street number (not just city/zip) */
function isStreetAddress(address: string): boolean {
  return /^\d/.test(address.trim()) || /\b(st|ave|blvd|dr|rd|ln|ct|way|hwy|ca-\d)\b/i.test(address)
}

interface MapboxFeature {
  center: [number, number] // [lng, lat]
  relevance: number
  place_name: string
}

interface MapboxGeocodingResponse {
  features: MapboxFeature[]
}

async function geocodeMapbox(
  address: string,
  token: string,
): Promise<{ lat: number; lng: number; relevance: number; placeName: string } | null> {
  const encoded = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1&country=US&types=address`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as MapboxGeocodingResponse
    if (!data.features?.length) return null
    const f = data.features[0]
    return {
      lng: f.center[0],
      lat: f.center[1],
      relevance: f.relevance,
      placeName: f.place_name,
    }
  } catch {
    return null
  }
}

async function main() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!mapboxToken) {
    console.error("❌  NEXT_PUBLIC_MAPBOX_TOKEN is not set")
    process.exit(1)
  }

  console.log(
    `🔍 Re-geocoding businesses via Mapbox${DRY_RUN ? " (DRY RUN)" : ""}${SINGLE_ID ? ` (id=${SINGLE_ID})` : ""}`,
  )
  console.log(`   threshold: ${THRESHOLD_M}m (report moves > this)`)
  console.log()

  const allBusinesses = await db.query.businesses.findMany({
    where: isNotNull(businesses.address),
    columns: { id: true, name: true, address: true, lat: true, lng: true },
  })

  const toProcess = allBusinesses.filter((b) => {
    if (SINGLE_ID !== null && b.id !== SINGLE_ID) return false
    if (!b.address) return false
    if (!isStreetAddress(b.address)) return false
    return true
  })

  console.log(`Processing ${toProcess.length} businesses with street addresses\n`)

  let updated = 0
  let skipped = 0
  let errors = 0
  let unchanged = 0

  type Discrepancy = {
    id: number
    name: string
    address: string
    oldLat: number | null
    oldLng: number | null
    newLat: number
    newLng: number
    distanceM: number
    relevance: number
    placeName: string
  }
  const discrepancies: Discrepancy[] = []
  const lowRelevance: Array<{ id: number; name: string; address: string; relevance: number }> = []

  for (const biz of toProcess) {
    await sleep(DELAY_MS)

    const result = await geocodeMapbox(biz.address!, mapboxToken)
    if (!result) {
      console.log(`  ✗ no result: "${biz.name}" — ${biz.address}`)
      errors++
      continue
    }

    // Only trust high-relevance Mapbox results
    if (result.relevance < 0.9) {
      console.log(`  ~ low relevance (${result.relevance.toFixed(2)}): "${biz.name}"`)
      lowRelevance.push({ id: biz.id, name: biz.name, address: biz.address!, relevance: result.relevance })
      skipped++
      continue
    }

    const distanceM =
      biz.lat != null && biz.lng != null
        ? haversineMetres(biz.lat, biz.lng, result.lat, result.lng)
        : Infinity

    if (distanceM <= THRESHOLD_M) {
      unchanged++
      continue
    }

    discrepancies.push({
      id: biz.id,
      name: biz.name,
      address: biz.address!,
      oldLat: biz.lat,
      oldLng: biz.lng,
      newLat: result.lat,
      newLng: result.lng,
      distanceM: Math.round(distanceM),
      relevance: result.relevance,
      placeName: result.placeName,
    })

    console.log(`  ⚠ [${biz.id}] "${biz.name}" Δ${Math.round(distanceM)}m`)

    if (!DRY_RUN) {
      await db
        .update(businesses)
        .set({ lat: result.lat, lng: result.lng })
        .where(eq(businesses.id, biz.id))
    }
    updated++
  }

  // ─── Discrepancy report ───────────────────────────────────────────────────
  discrepancies.sort((a, b) => b.distanceM - a.distanceM)

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`DISCREPANCIES > ${THRESHOLD_M}m  (sorted by distance, biggest first)`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  if (discrepancies.length === 0) {
    console.log("  (none)")
  } else {
    for (const d of discrepancies) {
      console.log(`\n  [${d.id}] ${d.name}`)
      console.log(`    address : ${d.address}`)
      console.log(`    mapbox  : ${d.placeName} (relevance ${d.relevance.toFixed(2)})`)
      console.log(`    old     : (${d.oldLat?.toFixed(5) ?? "null"}, ${d.oldLng?.toFixed(5) ?? "null"})`)
      console.log(`    new     : (${d.newLat.toFixed(5)}, ${d.newLng.toFixed(5)})`)
      console.log(`    distance: ${d.distanceM}m`)
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("SUMMARY")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`  processed       : ${toProcess.length}`)
  console.log(`  discrepancies   : ${discrepancies.length}  (> ${THRESHOLD_M}m)`)
  console.log(`  within threshold: ${unchanged}`)
  console.log(`  low-relevance   : ${lowRelevance.length}  (Mapbox <0.9)`)
  console.log(`  no result       : ${errors}`)
  console.log(DRY_RUN ? `  mode            : DRY RUN — no writes` : `  mode            : LIVE — ${updated} rows updated`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
