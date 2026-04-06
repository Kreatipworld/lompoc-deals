type NominatimResult = {
  lat: string
  lon: string
  display_name: string
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", address)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "us")

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a real User-Agent
        "User-Agent": "LompocDeals/1.0 (lompocdeals.local)",
      },
      // cache for an hour to avoid hammering Nominatim
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as NominatimResult[]
    if (!data.length) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch {
    return null
  }
}
