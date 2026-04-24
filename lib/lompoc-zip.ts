/**
 * Shared "is this address in Lompoc?" validator.
 *
 * Used by business signup, dashboard profile save, and the Google Places
 * scraper to prevent non-Lompoc businesses from entering the directory.
 *
 * Scope: City of Lompoc + Vandenberg Space Force Base only.
 */

export const LOMPOC_ZIPS = new Set(["93436", "93437", "93438"])

export const LOMPOC_AREA_LABEL = "Lompoc or Vandenberg (ZIP 93436, 93437, or 93438)"

/**
 * Extracts the 5-digit US ZIP code from a free-form address string.
 * Returns null if no ZIP is found.
 */
export function extractZip(address: string): string | null {
  const trimmed = address.trim()
  // Preferred: ", CA 93436" style
  const stateZip = trimmed.match(/,\s*[A-Z]{2}\s+(\d{5})(?:-\d{4})?\b/)
  if (stateZip) return stateZip[1]
  // Fallback: any 5-digit run at the end (handles "..., California 93436")
  const tail = trimmed.match(/(\d{5})(?:-\d{4})?\s*(?:,\s*USA)?\s*$/i)
  return tail?.[1] ?? null
}

/** True when the address's ZIP is inside the Lompoc area. */
export function isLompocAddress(address: string | null | undefined): boolean {
  if (!address) return false
  const zip = extractZip(address)
  return zip !== null && LOMPOC_ZIPS.has(zip)
}

/**
 * Human-readable reason why an address is rejected, or null if it's accepted.
 * Good for form error messages.
 */
export function lompocAddressError(address: string | null | undefined): string | null {
  if (!address || !address.trim()) return "Address is required."
  const zip = extractZip(address)
  if (!zip) return `Address must include a ZIP code — we only serve ${LOMPOC_AREA_LABEL}.`
  if (!LOMPOC_ZIPS.has(zip)) {
    return `Sorry, we only serve ${LOMPOC_AREA_LABEL}. This address is in ZIP ${zip}.`
  }
  return null
}
