// Cross-check every approved business against Google Places and report drift
// in phone / website / googleBusinessUrl / lat-lng. Safe-to-backfill fields are
// applied with --apply (filling NULLs and fixing >50m lat/lng drift). Name,
// address, and description are NEVER touched. Closed-permanently is flagged
// for manual review only.
//
// Usage:
//   npm run db:audit-businesses -- --dry-run    (preview, no writes)
//   npm run db:audit-businesses -- --apply      (write backfills + drift fixes)
//
// Cost: Place Details ~$0.020/call (Basic + Contact). Plus Text Search ~$0.032
// for businesses without an existing place_id. ~430 businesses ≈ $17.

import "dotenv/config"
import { db } from "./client"
import { businesses } from "./schema"
import { eq } from "drizzle-orm"

const KEY = process.env.GOOGLE_MAPS_API_KEY
if (!KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY")
  process.exit(1)
}

const DRY_RUN = process.argv.includes("--dry-run")
const APPLY = process.argv.includes("--apply")
if (!DRY_RUN && !APPLY) {
  console.error("Pass --dry-run or --apply.")
  process.exit(1)
}
const LIMIT_FLAG = process.argv.find((a) => a.startsWith("--limit="))
const LIMIT = LIMIT_FLAG ? parseInt(LIMIT_FLAG.split("=")[1], 10) : Infinity

interface TextSearchResult {
  status: string
  results?: Array<{ place_id: string }>
}

interface PlaceDetailsResult {
  status: string
  error_message?: string
  result?: {
    place_id: string
    name?: string
    formatted_address?: string
    formatted_phone_number?: string
    website?: string
    url?: string
    business_status?: string
    geometry?: { location: { lat: number; lng: number } }
  }
}

const DETAILS_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "formatted_phone_number",
  "website",
  "url",
  "business_status",
  "geometry/location",
].join(",")

async function textSearch(query: string): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${KEY}`
  const r = await fetch(url)
  const j = (await r.json()) as TextSearchResult
  return j.status === "OK" ? j.results?.[0]?.place_id ?? null : null
}

async function placeDetails(placeId: string): Promise<PlaceDetailsResult["result"] | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=${DETAILS_FIELDS}&key=${KEY}`
  const r = await fetch(url)
  const j = (await r.json()) as PlaceDetailsResult
  return j.status === "OK" ? j.result ?? null : null
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

interface Stats {
  examined: number
  unmatched: number
  phoneFilled: number
  websiteFilled: number
  googleUrlFilled: number
  placeIdCaptured: number
  coordsFixed: number
  closedFlagged: number
  errors: number
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`)

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      address: businesses.address,
      lat: businesses.lat,
      lng: businesses.lng,
      phone: businesses.phone,
      website: businesses.website,
      googleBusinessUrl: businesses.googleBusinessUrl,
      googlePlaceId: businesses.googlePlaceId,
    })
    .from(businesses)
    .where(eq(businesses.status, "approved"))

  console.log(`Examining ${Math.min(rows.length, LIMIT)} approved businesses (of ${rows.length}).\n`)

  const stats: Stats = {
    examined: 0,
    unmatched: 0,
    phoneFilled: 0,
    websiteFilled: 0,
    googleUrlFilled: 0,
    placeIdCaptured: 0,
    coordsFixed: 0,
    closedFlagged: 0,
    errors: 0,
  }

  const closedPermanently: string[] = []

  for (const biz of rows) {
    if (stats.examined >= LIMIT) break
    stats.examined++

    try {
      let placeId = biz.googlePlaceId
      if (!placeId) {
        const query = `${biz.name} ${biz.address ?? "Lompoc CA"}`
        placeId = await textSearch(query)
        if (!placeId) {
          stats.unmatched++
          console.log(`  ?    #${biz.id} ${biz.name.padEnd(45)} no Places match`)
          continue
        }
      }

      const details = await placeDetails(placeId)
      if (!details) {
        stats.errors++
        console.log(`  ERR  #${biz.id} ${biz.name.padEnd(45)} Details failed`)
        continue
      }

      const updates: Record<string, unknown> = {}
      const notes: string[] = []

      if (!biz.googlePlaceId) {
        updates.googlePlaceId = details.place_id
        stats.placeIdCaptured++
        notes.push("place_id")
      }

      if (!biz.phone && details.formatted_phone_number) {
        updates.phone = details.formatted_phone_number
        stats.phoneFilled++
        notes.push(`phone=${details.formatted_phone_number}`)
      }

      if (!biz.website && details.website) {
        updates.website = details.website
        stats.websiteFilled++
        notes.push(`website`)
      }

      if (!biz.googleBusinessUrl && details.url) {
        updates.googleBusinessUrl = details.url
        stats.googleUrlFilled++
        notes.push(`google_url`)
      }

      if (details.geometry?.location && biz.lat != null && biz.lng != null) {
        const drift = haversineMeters(
          { lat: biz.lat, lng: biz.lng },
          { lat: details.geometry.location.lat, lng: details.geometry.location.lng }
        )
        if (drift > 50) {
          updates.lat = details.geometry.location.lat
          updates.lng = details.geometry.location.lng
          stats.coordsFixed++
          notes.push(`coords ${drift.toFixed(0)}m`)
        }
      } else if (details.geometry?.location && (biz.lat == null || biz.lng == null)) {
        updates.lat = details.geometry.location.lat
        updates.lng = details.geometry.location.lng
        stats.coordsFixed++
        notes.push("coords (was NULL)")
      }

      if (details.business_status && details.business_status !== "OPERATIONAL") {
        closedPermanently.push(`#${biz.id} ${biz.name} — ${details.business_status}`)
        stats.closedFlagged++
        notes.push(`STATUS=${details.business_status}`)
      }

      if (Object.keys(updates).length === 0 && notes.length === 0) {
        // No drift; skip log line to reduce noise.
        continue
      }

      console.log(`  ok   #${String(biz.id).padEnd(4)} ${biz.name.padEnd(45)} ${notes.join(" · ")}`)

      if (APPLY && Object.keys(updates).length > 0) {
        try {
          await db.update(businesses).set(updates).where(eq(businesses.id, biz.id))
        } catch {
          // Most likely place_id unique-constraint collision. Retry without it.
          if ("googlePlaceId" in updates) {
            delete updates.googlePlaceId
            stats.placeIdCaptured--
            if (Object.keys(updates).length > 0) {
              await db.update(businesses).set(updates).where(eq(businesses.id, biz.id))
            }
          }
        }
      }
    } catch (e) {
      stats.errors++
      console.log(`  ERR  #${biz.id} ${biz.name.padEnd(45)} ${String(e).slice(0, 60)}`)
    }
  }

  console.log("")
  console.log(`── Summary ──────────────────────────────────`)
  console.log(`Examined:           ${stats.examined}`)
  console.log(`Phone backfilled:   ${stats.phoneFilled}`)
  console.log(`Website backfilled: ${stats.websiteFilled}`)
  console.log(`Maps URL filled:    ${stats.googleUrlFilled}`)
  console.log(`Place IDs captured: ${stats.placeIdCaptured}`)
  console.log(`Coords fixed:       ${stats.coordsFixed} (>50m drift)`)
  console.log(`Closed flagged:     ${stats.closedFlagged}`)
  console.log(`Unmatched:          ${stats.unmatched}`)
  console.log(`Errors:             ${stats.errors}`)

  if (closedPermanently.length > 0) {
    console.log("")
    console.log("── Businesses Google marks as CLOSED ─────────")
    for (const line of closedPermanently) console.log(`  ${line}`)
    console.log("(Review these manually — not auto-deactivated.)")
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
