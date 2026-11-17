import { inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { DAY_KEYS, formatHoursLine, parseHours, type Hours } from "@/lib/hours"

/**
 * Route pages (Nov 17 2026): a /find term with `route.stops` lists specific places in driving
 * order, with today's hours and a map — the page behind a Route video (Taco Tuesday Route,
 * Nov 10: 4,774 views, 22 comments, ~0 site visits because it linked nowhere specific).
 * One asset for search ("taco tuesday lompoc", "panaderia lompoc") and for social.
 */
export type RouteStop = {
  id: number
  slug: string
  address: string | null
  phone: string | null
  lat: number | null
  lng: number | null
  hoursJson: unknown
}

export async function routeStopDetails(slugs: string[]): Promise<Map<number, RouteStop>> {
  if (slugs.length === 0) return new Map()
  const rows = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      address: businesses.address,
      phone: businesses.phone,
      lat: businesses.lat,
      lng: businesses.lng,
      hoursJson: businesses.hoursJson,
    })
    .from(businesses)
    .where(inArray(businesses.slug, slugs))
  return new Map(rows.map((r) => [r.id, r]))
}

/** Lompoc's weekday right now, as a key into Hours. */
export function todayKey(): keyof Hours {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date()).toLowerCase().slice(0, 3)
  return (DAY_KEYS as readonly string[]).includes(wd) ? (wd as keyof Hours) : "mon"
}

/** "5:00 AM – 6:00 PM" for today, `closed` when the day is closed, null when hours are unknown. */
export function todayHoursLine(hoursJson: unknown, closed: string): string | null {
  const h = parseHours(hoursJson)
  if (DAY_KEYS.every((k) => h[k] === null)) return null
  return formatHoursLine(h[todayKey()], closed)
}

/** "123 N H St, Lompoc, CA 93436" → "123 N H St" (the page is about Lompoc; the street is the news). */
export function streetOnly(address: string | null): string | null {
  if (!address) return null
  return address.split(",")[0].trim() || null
}

/**
 * Mapbox Static Images URL with one numbered pin per stop, members in brand gold, auto-fitted.
 * Plain <img>, no JS: the page stays ISR and the map is one cached request.
 */
export function routeMapUrl(stops: { lat: number | null; lng: number | null; member: boolean }[]): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null
  // Stops that share a block (Don Tacho 1133 and Foster's 1145 N H St) would stack and hide a
  // number: nudge a pin ~80 m east for every earlier pin it would cover, same idea as category-map.
  const placed: { lat: number; lng: number }[] = []
  const pins = stops
    .map((s, i) => {
      if (s.lat === null || s.lng === null) return null
      let lng = s.lng
      for (const p of placed) if (Math.abs(p.lat - s.lat) < 0.0015 && Math.abs(p.lng - lng) < 0.0015) lng += 0.0012
      placed.push({ lat: s.lat, lng })
      return `pin-l-${i + 1}+${s.member ? "EFC618" : "650C75"}(${lng.toFixed(5)},${s.lat.toFixed(5)})`
    })
    .filter(Boolean)
  if (pins.length === 0) return null
  // light-v11: streets without every other restaurant's label competing with the route.
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pins.join(",")}/auto/1200x640@2x?padding=72&access_token=${token}`
}
