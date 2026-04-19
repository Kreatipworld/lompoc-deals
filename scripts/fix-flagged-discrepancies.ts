/**
 * scripts/fix-flagged-discrepancies.ts
 *
 * Fixes businesses flagged by batch-regeocode.ts as having >100m discrepancies.
 *
 * Strategy:
 *   - Re-geocodes all businesses with addresses via Google Maps
 *   - Applies fixes for high-confidence (ROOFTOP, RANGE_INTERPOLATED) results
 *     regardless of distance, as Google's rooftop geocode beats our stale data
 *   - Skips APPROXIMATE / GEOMETRIC_CENTER results (not precise enough to trust)
 *   - Never overwrites with a city-level approximation
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/fix-flagged-discrepancies.ts
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/fix-flagged-discrepancies.ts --dry-run
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/fix-flagged-discrepancies.ts --id 171
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq, isNotNull } from "drizzle-orm"
import * as schema from "../db/schema"
import { geocodeAddressFull } from "../lib/geocode"

const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const SINGLE_ID = (() => {
  const idx = args.indexOf("--id")
  return idx !== -1 ? parseInt(args[idx + 1], 10) : null
})()

// These are the IDs that batch-regeocode flagged as >100m discrepancy
// We re-check them here to apply precise fixes where Google has high confidence
const FLAGGED_IDS = [
  24, 27, 28, 29, 30, 31, 32, 33, 57, 58, 73, 77, 83, 88, 90, 96, 99, 101,
  102, 109, 113, 119, 120, 122, 151, 152, 157, 159, 160, 161, 162, 163, 164,
  165, 166, 171, 177, 183, 190, 193, 233, 244, 247, 250, 251, 255, 263, 298,
  301, 322, 324, 336, 337, 349, 359, 375, 379, 408, 413, 414, 419, 420, 438,
  489, 508, 517, 527, 534,
]

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Confidence threshold — only trust these precise geocode types
const HIGH_CONFIDENCE_TYPES = new Set(["ROOFTOP", "RANGE_INTERPOLATED"])

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("GOOGLE_MAPS_API_KEY is not set")
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql, { schema })

  // Fetch the flagged businesses
  const allBusinesses = await db
    .select({
      id: schema.businesses.id,
      name: schema.businesses.name,
      address: schema.businesses.address,
      lat: schema.businesses.lat,
      lng: schema.businesses.lng,
    })
    .from(schema.businesses)
    .where(isNotNull(schema.businesses.address))

  const toProcess = allBusinesses.filter((b) => {
    if (SINGLE_ID !== null) return b.id === SINGLE_ID
    return FLAGGED_IDS.includes(b.id)
  })

  console.log(`\nFix flagged discrepancies${DRY_RUN ? " (DRY RUN)" : ""}`)
  console.log(`Processing ${toProcess.length} flagged businesses\n`)

  let fixed = 0
  let skipped = 0
  let unchanged = 0
  let noResult = 0

  const fixedLog: Array<{ id: number; name: string; oldLat?: number; oldLng?: number; newLat: number; newLng: number; distanceM: number; locationType: string }> = []
  const skippedLog: Array<{ id: number; name: string; reason: string }> = []

  for (const biz of toProcess) {
    await sleep(50) // stay under Google's 50 QPS

    if (!biz.address?.trim()) {
      skippedLog.push({ id: biz.id, name: biz.name, reason: "no address" })
      skipped++
      continue
    }

    const result = await geocodeAddressFull(biz.address)

    if (!result) {
      noResult++
      console.log(`  ✗ no result: [${biz.id}] ${biz.name}`)
      skippedLog.push({ id: biz.id, name: biz.name, reason: "no geocode result" })
      continue
    }

    const isHighConf = HIGH_CONFIDENCE_TYPES.has(result.locationType)

    if (!isHighConf) {
      // Don't trust imprecise geocodes for overwriting existing data
      skipped++
      const distanceM =
        biz.lat != null && biz.lng != null
          ? Math.round(haversineMetres(biz.lat, biz.lng, result.lat, result.lng))
          : null
      console.log(`  ~ skip [${result.locationType}]: [${biz.id}] ${biz.name}${distanceM !== null ? ` Δ${distanceM}m` : ""}`)
      skippedLog.push({ id: biz.id, name: biz.name, reason: `low confidence: ${result.locationType}` })
      continue
    }

    const distanceM =
      biz.lat != null && biz.lng != null
        ? Math.round(haversineMetres(biz.lat, biz.lng, result.lat, result.lng))
        : null

    const hasChanged = distanceM === null || distanceM > 5 // >5m = actually different

    if (!hasChanged) {
      unchanged++
      continue
    }

    console.log(`  ✓ fix [${biz.id}] ${biz.name}`)
    console.log(`    old: (${biz.lat?.toFixed(5)}, ${biz.lng?.toFixed(5)})`)
    console.log(`    new: (${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}) [${result.locationType}]${distanceM !== null ? ` Δ${distanceM}m` : ""}`)
    console.log(`    addr: ${result.formattedAddress}`)

    if (!DRY_RUN) {
      await db
        .update(schema.businesses)
        .set({ lat: result.lat, lng: result.lng })
        .where(eq(schema.businesses.id, biz.id))
    }

    fixed++
    fixedLog.push({
      id: biz.id,
      name: biz.name,
      oldLat: biz.lat ?? undefined,
      oldLng: biz.lng ?? undefined,
      newLat: result.lat,
      newLng: result.lng,
      distanceM: distanceM ?? 0,
      locationType: result.locationType,
    })
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("FIX FLAGGED DISCREPANCIES SUMMARY")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Processed  : ${toProcess.length}`)
  console.log(`Fixed      : ${fixed}${DRY_RUN ? " (dry run — not written)" : ""}`)
  console.log(`Unchanged  : ${unchanged}`)
  console.log(`Skipped    : ${skipped}`)
  console.log(`No result  : ${noResult}`)

  if (skippedLog.length > 0) {
    console.log("\n─── Skipped (low confidence or no address) ───")
    for (const s of skippedLog) {
      console.log(`  [${s.id}] ${s.name}: ${s.reason}`)
    }
  }

  console.log("\nDone.\n")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
