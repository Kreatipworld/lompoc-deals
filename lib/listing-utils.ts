/**
 * A listing only earns a map pin when its address has a street number.
 * "Lompoc CA" geocodes to the city center and would drop a pin on the wrong
 * block; "238 S J St, Lompoc, CA 93436" is a real place.
 */
export function hasStreetAddress(address: string | null | undefined): boolean {
  if (!address) return false
  return /^\s*\d+[A-Za-z]?\s+\S/.test(address)
}

export function formatListingPriceShort(priceCents: number, type: "for-sale" | "for-rent", intl = "en-US"): string {
  const s = `$${(priceCents / 100).toLocaleString(intl, { maximumFractionDigits: 0 })}`
  return type === "for-rent" ? `${s}/mo` : s
}

export function formatListingFacts(beds: number | null, baths: number | null, sqft: number | null): string {
  const parts: string[] = []
  if (beds != null) parts.push(`${beds} bd`)
  if (baths != null) parts.push(`${baths} ba`)
  if (sqft != null) parts.push(`${sqft.toLocaleString("en-US")} sqft`)
  return parts.join(" | ")
}

/**
 * Lompoc + Vandenberg service area (the same box the main map is clamped to).
 * A listing whose coordinates fall outside it was geocoded to the wrong place
 * (a street name that also exists in another state) — no pin until it's fixed.
 */
export function inLompocArea(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false
  return lat >= 34.45 && lat <= 34.8 && lng >= -120.65 && lng <= -120.25
}
