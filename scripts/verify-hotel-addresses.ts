import { HOTELS } from "../lib/hotels-data"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
if (!TOKEN) {
  console.error("Missing NEXT_PUBLIC_MAPBOX_TOKEN")
  process.exit(1)
}

interface GeoResult {
  features?: Array<{
    center: [number, number]
    place_name: string
    relevance: number
  }>
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

async function geocode(query: string): Promise<{ lat: number; lng: number; placeName: string; relevance: number } | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&country=US&proximity=-120.4579,34.64&limit=1`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = (await res.json()) as GeoResult
  const feat = json.features?.[0]
  if (!feat) return null
  return { lng: feat.center[0], lat: feat.center[1], placeName: feat.place_name, relevance: feat.relevance }
}

async function main() {
  console.log(`Verifying ${HOTELS.length} hotel addresses...`)
  console.log("")

  const drifts: Array<{ slug: string; name: string; oldLat: number; oldLng: number; newLat: number; newLng: number; meters: number; placeName: string }> = []

  for (const h of HOTELS) {
    // Try address-first geocode (most accurate). Fall back to name + city.
    const a = await geocode(h.address)
    const candidate = a && a.relevance > 0.6 ? a : await geocode(`${h.name} Lompoc CA`)

    if (!candidate) {
      console.log(`  ?    ${h.slug.padEnd(36)} GEOCODE FAILED for "${h.address}"`)
      continue
    }

    const meters = haversineMeters({ lat: h.lat, lng: h.lng }, candidate)
    const flag = meters > 50 ? "DRIFT" : meters > 20 ? "minor" : "ok   "
    console.log(`  ${flag.padEnd(5)} ${h.slug.padEnd(36)} ${meters.toFixed(0).padStart(5)}m  ${candidate.placeName.slice(0, 80)}`)

    if (meters > 50) {
      drifts.push({
        slug: h.slug,
        name: h.name,
        oldLat: h.lat,
        oldLng: h.lng,
        newLat: candidate.lat,
        newLng: candidate.lng,
        meters,
        placeName: candidate.placeName,
      })
    }
  }

  console.log("")
  console.log(`Drifts (>50m): ${drifts.length}`)
  if (drifts.length) {
    console.log("")
    for (const d of drifts) {
      console.log(`  ${d.slug}`)
      console.log(`    name:      ${d.name}`)
      console.log(`    drift:     ${d.meters.toFixed(0)}m`)
      console.log(`    old:       ${d.oldLat}, ${d.oldLng}`)
      console.log(`    new:       ${d.newLat.toFixed(4)}, ${d.newLng.toFixed(4)}`)
      console.log(`    placeName: ${d.placeName}`)
      console.log("")
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
