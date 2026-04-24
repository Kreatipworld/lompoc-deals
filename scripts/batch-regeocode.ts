/**
 * Batch re-geocode all businesses using Google Maps Geocoding API.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/batch-regeocode.ts
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/batch-regeocode.ts --dry-run
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/batch-regeocode.ts --dry-run --threshold 30
 *
 * What it does:
 *   - Fetches all businesses with a non-empty address
 *   - Calls Google Maps Geocoding API for each address
 *   - Auto-updates high-confidence results (ROOFTOP / RANGE_INTERPOLATED)
 *     when distance from current coords is ≤ threshold (or no coords exist yet)
 *   - Flags discrepancies > threshold for manual review
 *   - Prints a summary report at the end
 *   - With --dry-run, no DB writes are performed
 *
 * Requires: GOOGLE_MAPS_API_KEY and DATABASE_URL in env
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq, isNotNull, ne } from "drizzle-orm"
import * as schema from "../db/schema"
import { geocodeAddressFull, isHighConfidence } from "../lib/geocode"

// ─── CLI args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const THRESHOLD_M = (() => {
  const idx = args.indexOf("--threshold")
  const parsed = idx !== -1 ? parseInt(args[idx + 1], 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100
})()

// ─── Haversine distance (metres) ────────────────────────────────────────────

function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000 // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Sleep helper (rate-limit Google API) ────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Main ────────────────────────────────────────────────────────────────────

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

  // Fetch all businesses with a non-empty address
  const businesses = await db
    .select({
      id: schema.businesses.id,
      name: schema.businesses.name,
      address: schema.businesses.address,
      lat: schema.businesses.lat,
      lng: schema.businesses.lng,
    })
    .from(schema.businesses)
    .where(isNotNull(schema.businesses.address))

  console.log(`\nFound ${businesses.length} businesses with addresses.`)
  console.log(`Mode: ${DRY_RUN ? "DRY RUN — no writes" : "LIVE — writes enabled"}`)
  console.log(`Discrepancy threshold: ${THRESHOLD_M}m\n`)

  const DISTANCE_THRESHOLD_M = THRESHOLD_M

  type Report = {
    id: number
    name: string
    address: string
    action: "updated" | "skipped_low_confidence" | "discrepancy" | "no_result" | "no_address"
    oldCoords?: { lat: number; lng: number }
    newCoords?: { lat: number; lng: number }
    distanceM?: number
    locationType?: string
    formattedAddress?: string
    note?: string
  }

  const report: Report[] = []
  let updatedCount = 0
  let skippedCount = 0
  let discrepancyCount = 0
  let noResultCount = 0

  for (const biz of businesses) {
    if (!biz.address?.trim()) {
      report.push({ id: biz.id, name: biz.name, address: biz.address ?? "", action: "no_address" })
      continue
    }

    // Rate limit: stay well under Google's 50 QPS free tier limit
    await sleep(50)

    const result = await geocodeAddressFull(biz.address)

    if (!result) {
      noResultCount++
      report.push({
        id: biz.id,
        name: biz.name,
        address: biz.address,
        action: "no_result",
        oldCoords: biz.lat != null && biz.lng != null ? { lat: biz.lat, lng: biz.lng } : undefined,
        note: "Google Maps returned no result",
      })
      continue
    }

    const newCoords = { lat: result.lat, lng: result.lng }
    const oldCoords = biz.lat != null && biz.lng != null ? { lat: biz.lat, lng: biz.lng } : null

    // Calculate distance from current coords (if any)
    const distanceM = oldCoords
      ? haversineMetres(oldCoords.lat, oldCoords.lng, newCoords.lat, newCoords.lng)
      : null

    const highConf = isHighConfidence(result.locationType)
    const largeDiscrepancy = distanceM !== null && distanceM > DISTANCE_THRESHOLD_M

    if (largeDiscrepancy) {
      // Existing coords differ significantly — flag for manual review regardless of confidence
      discrepancyCount++
      report.push({
        id: biz.id,
        name: biz.name,
        address: biz.address,
        action: "discrepancy",
        oldCoords: oldCoords ?? undefined,
        newCoords,
        distanceM: Math.round(distanceM!),
        locationType: result.locationType,
        formattedAddress: result.formattedAddress,
        note: `Diff ${Math.round(distanceM!)}m — manual review needed`,
      })
      continue
    }

    if (!highConf && oldCoords !== null) {
      // Low confidence and existing coords look fine — skip to preserve current data
      skippedCount++
      report.push({
        id: biz.id,
        name: biz.name,
        address: biz.address,
        action: "skipped_low_confidence",
        oldCoords,
        newCoords,
        distanceM: distanceM !== null ? Math.round(distanceM) : undefined,
        locationType: result.locationType,
        formattedAddress: result.formattedAddress,
        note: "Low confidence, coords within threshold — keeping existing",
      })
      continue
    }

    // Auto-update: either high-confidence, within threshold, or no existing coords
    if (!DRY_RUN) {
      await db
        .update(schema.businesses)
        .set({ lat: newCoords.lat, lng: newCoords.lng })
        .where(eq(schema.businesses.id, biz.id))
    }

    updatedCount++
    report.push({
      id: biz.id,
      name: biz.name,
      address: biz.address,
      action: "updated",
      oldCoords: oldCoords ?? undefined,
      newCoords,
      distanceM: distanceM !== null ? Math.round(distanceM) : undefined,
      locationType: result.locationType,
      formattedAddress: result.formattedAddress,
    })

    console.log(
      `  ✓ [${biz.id}] ${biz.name} → (${newCoords.lat.toFixed(5)}, ${newCoords.lng.toFixed(5)}) [${result.locationType}]${distanceM !== null ? ` Δ${Math.round(distanceM)}m` : " (no prior coords)"}`
    )
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("BATCH RE-GEOCODE SUMMARY")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Mode                        : ${DRY_RUN ? "DRY RUN" : "LIVE"}`)
  console.log(`Total businesses processed  : ${businesses.length}`)
  console.log(`Updated${DRY_RUN ? " (would update)" : " (auto)       "}      : ${updatedCount}`)
  console.log(`Skipped (low confidence)    : ${skippedCount}`)
  console.log(`Flagged (discrepancy >${DISTANCE_THRESHOLD_M}m)${" ".repeat(Math.max(0, 3 - String(DISTANCE_THRESHOLD_M).length))}: ${discrepancyCount}`)
  console.log(`No result from Google       : ${noResultCount}`)

  if (discrepancyCount > 0) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("MANUAL REVIEW REQUIRED — Discrepancies > 100m")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    for (const r of report.filter((r) => r.action === "discrepancy")) {
      console.log(`\n  Business: ${r.name} (id=${r.id})`)
      console.log(`  Address : ${r.address}`)
      console.log(`  Google  : ${r.formattedAddress} [${r.locationType}]`)
      console.log(`  Old     : (${r.oldCoords?.lat?.toFixed(5)}, ${r.oldCoords?.lng?.toFixed(5)})`)
      console.log(`  New     : (${r.newCoords?.lat?.toFixed(5)}, ${r.newCoords?.lng?.toFixed(5)})`)
      console.log(`  Diff    : ${r.distanceM}m`)
    }
  }

  if (noResultCount > 0) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("NO GEOCODE RESULT — Addresses to fix")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    for (const r of report.filter((r) => r.action === "no_result")) {
      console.log(`  [${r.id}] ${r.name}: "${r.address}"`)
    }
  }

  console.log("\nDone.\n")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
