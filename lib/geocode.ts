type GoogleGeocodeResponse = {
  results: Array<{
    geometry: {
      location: { lat: number; lng: number }
      location_type: string
    }
    formatted_address: string
  }>
  status: string
  error_message?: string
}

export type GeocodeResult = {
  lat: number
  lng: number
  locationType: string
  formattedAddress: string
}

const HIGH_CONFIDENCE_TYPES = new Set(["ROOFTOP", "RANGE_INTERPOLATED"])

export function isHighConfidence(locationType: string): boolean {
  return HIGH_CONFIDENCE_TYPES.has(locationType)
}

/**
 * Geocodes an address using the Google Maps Geocoding API.
 * Returns full result including location_type for confidence scoring.
 * Requires GOOGLE_MAPS_API_KEY env var.
 */
export async function geocodeAddressFull(
  address: string
): Promise<GeocodeResult | null> {
  if (!address.trim()) return null

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY is not set")
    return null
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
  url.searchParams.set("address", address)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("components", "country:US")

  try {
    const res = await fetch(url.toString(), {
      // cache for 24h in Next.js edge/server contexts
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as GoogleGeocodeResponse
    if (data.status !== "OK" || !data.results.length) {
      if (data.status !== "ZERO_RESULTS") {
        console.error(`Geocode error for "${address}": ${data.status} — ${data.error_message ?? ""}`)
      }
      return null
    }
    const top = data.results[0]
    return {
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      locationType: top.geometry.location_type,
      formattedAddress: top.formatted_address,
    }
  } catch (err) {
    console.error(`Geocode fetch failed for "${address}":`, err)
    return null
  }
}

/**
 * Geocodes an address and returns only lat/lng.
 * Backwards-compatible with previous Nominatim-based signature.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const result = await geocodeAddressFull(address)
  if (!result) return null
  return { lat: result.lat, lng: result.lng }
}
