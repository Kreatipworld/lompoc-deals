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
