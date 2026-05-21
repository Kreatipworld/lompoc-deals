// Backfill hours + google_place_id for approved businesses that are missing hours.
// Uses Google Places API (Text Search + Place Details) to look up each business
// by name + address, then normalizes the opening_hours response into our canonical
// Hours shape via the existing normalizeGoogleHours().
//
// Usage:
//   npm run db:enrich-hours -- --dry-run     (preview, no DB writes, no API spend for Details)
//   npm run db:enrich-hours                  (apply)
//
// Cost note: Text Search ~$0.032/call, Details w/ opening_hours ~$0.020/call.
// 168 businesses worst case ≈ $8.74. The script also re-uses results when
// possible and skips businesses that already have hours.

import "dotenv/config"
import { db } from "./client"
import { businesses } from "./schema"
import { isNull, eq, ne, or, isNotNull, and } from "drizzle-orm"
import { normalizeGoogleHours } from "../lib/hours-normalizer"

const KEY = process.env.GOOGLE_MAPS_API_KEY
if (!KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY")
  process.exit(1)
}

const DRY_RUN = process.argv.includes("--dry-run")
const LIMIT_FLAG = process.argv.find((a) => a.startsWith("--limit="))
const LIMIT = LIMIT_FLAG ? parseInt(LIMIT_FLAG.split("=")[1], 10) : Infinity

interface TextSearchResult {
  status: string
  error_message?: string
  results?: Array<{
    place_id: string
    name: string
    formatted_address: string
    geometry?: { location: { lat: number; lng: number } }
  }>
}

interface PlaceDetailsResult {
  status: string
  error_message?: string
  result?: {
    place_id: string
    name: string
    formatted_address: string
    opening_hours?: {
      weekday_text?: string[] // ["Monday: 10:00 AM – 9:00 PM", ...]
    }
  }
}

async function textSearch(query: string): Promise<TextSearchResult> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${KEY}`
  const res = await fetch(url)
  return (await res.json()) as TextSearchResult
}

async function placeDetails(placeId: string): Promise<PlaceDetailsResult> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=place_id,name,formatted_address,opening_hours&key=${KEY}`
  const res = await fetch(url)
  return (await res.json()) as PlaceDetailsResult
}

/**
 * Convert Google's weekday_text (e.g. "Monday: 10:00 AM – 9:00 PM") into the
 * long-key string shape that normalizeGoogleHours() understands. Returns an
 * object with keys monday/tuesday/.../sunday and string values like
 * "10 AM to 9 PM" / "Closed" / "Open 24 hours".
 */
function weekdayTextToLongKeyShape(weekdayText: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of weekdayText) {
    // Examples:
    //   "Monday: 10:00 AM – 9:00 PM"
    //   "Sunday: Closed"
    //   "Tuesday: Open 24 hours"
    //   "Friday: 10:00 AM – 12:00 AM"     (cross-midnight close)
    //   "Wednesday: 8:00 AM – 1:00 PM, 1:30 – 9:00 PM"  (multi-range)
    const m = line.match(/^([A-Za-z]+):\s*(.+)$/)
    if (!m) continue
    const dayName = m[1].toLowerCase()
    let value = m[2].trim()
    // Normalize the en-dash to " to " so our existing parser handles it.
    value = value.replace(/\s*[–-]\s*/g, " to ")
    out[dayName] = value
  }
  return out
}

interface Stats {
  examined: number
  noResult: number
  noHours: number
  enriched: number
  errors: number
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "APPLY"}`)

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      address: businesses.address,
    })
    .from(businesses)
    .where(
      and(
        eq(businesses.status, "approved"),
        isNull(businesses.hoursJson),
        // Never touch owner-edited rows.
        or(isNull(businesses.hoursSource), ne(businesses.hoursSource, "owner"))
      )
    )

  console.log(`Found ${rows.length} candidate businesses with no hours.\n`)

  const stats: Stats = { examined: 0, noResult: 0, noHours: 0, enriched: 0, errors: 0 }
  const now = new Date()

  for (const biz of rows) {
    if (stats.examined >= LIMIT) break
    stats.examined++

    const query = `${biz.name} ${biz.address ?? "Lompoc CA"}`

    try {
      const search = await textSearch(query)
      if (search.status !== "OK" || !search.results?.length) {
        console.log(`  ?    #${biz.id} ${biz.name.padEnd(40)} no Places match`)
        stats.noResult++
        continue
      }

      const top = search.results[0]
      const details = await placeDetails(top.place_id)
      if (details.status !== "OK" || !details.result) {
        console.log(`  ?    #${biz.id} ${biz.name.padEnd(40)} Details failed`)
        stats.errors++
        continue
      }

      const wt = details.result.opening_hours?.weekday_text
      if (!wt || wt.length === 0) {
        console.log(`  -    #${biz.id} ${biz.name.padEnd(40)} no hours on Google`)
        stats.noHours++

        if (!DRY_RUN) {
          // Still capture place_id for future re-enrichment.
          try {
            await db
              .update(businesses)
              .set({ googlePlaceId: top.place_id })
              .where(eq(businesses.id, biz.id))
          } catch {
            // place_id already taken by another business — skip
          }
        }
        continue
      }

      const longKey = weekdayTextToLongKeyShape(wt)
      const normalized = normalizeGoogleHours(longKey)

      if (!DRY_RUN) {
        try {
          await db
            .update(businesses)
            .set({
              hoursJson: normalized,
              hoursSource: "google",
              hoursSyncedAt: now,
              googlePlaceId: top.place_id,
            })
            .where(eq(businesses.id, biz.id))
        } catch {
          // Most likely the unique constraint on google_place_id fired (Google's Text
          // Search returned a place_id that's already on another business — common for
          // mergers, look-alike names, or businesses in the same building). Retry
          // without place_id so we still get the hours saved.
          await db
            .update(businesses)
            .set({
              hoursJson: normalized,
              hoursSource: "google",
              hoursSyncedAt: now,
            })
            .where(eq(businesses.id, biz.id))
          console.log(`  DUP  #${biz.id} ${biz.name.padEnd(40)} (place_id collision, hours saved without place_id)`)
          stats.enriched++
          continue
        }
      }

      stats.enriched++
      console.log(`  ok   #${biz.id} ${biz.name.padEnd(40)} ${top.place_id}`)
    } catch (e) {
      console.log(`  ERR  #${biz.id} ${biz.name.padEnd(40)} ${String(e).slice(0, 80)}`)
      stats.errors++
    }
  }

  console.log("")
  console.log(`Examined:   ${stats.examined}`)
  console.log(`Enriched:   ${stats.enriched}${DRY_RUN ? " (would-be)" : ""}`)
  console.log(`No hours:   ${stats.noHours}`)
  console.log(`No result:  ${stats.noResult}`)
  console.log(`Errors:     ${stats.errors}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
