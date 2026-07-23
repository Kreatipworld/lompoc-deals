import { NextRequest, NextResponse } from "next/server"

// Proxies Google Places Autocomplete so the API key stays server-side.
// Biased hard to the Lompoc valley — this platform only serves 93436/37/38.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 3) return NextResponse.json({ suggestions: [] })

  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) return NextResponse.json({ suggestions: [] })

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json")
  url.searchParams.set("input", q)
  url.searchParams.set("types", "address")
  url.searchParams.set("components", "country:us")
  // Circle bias centered on Lompoc, ~15 km radius (covers Vandenberg + Mission Hills).
  url.searchParams.set("locationbias", "circle:15000@34.6392,-120.4579")
  url.searchParams.set("key", key)

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const data = await res.json()
    const suggestions: string[] = (data.predictions ?? [])
      .map((p: { description?: string }) => p.description)
      .filter(Boolean)
      .slice(0, 5)
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
