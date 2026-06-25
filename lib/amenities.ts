export type Amenity = { slug: string; icon: string; labelKey: string }

/**
 * Curated canonical amenity set. `icon` is a lucide-react icon name (resolved
 * in components/business-about.tsx). `labelKey` resolves under i18n
 * "businesses.amenities".
 */
export const AMENITIES: Amenity[] = [
  { slug: "wheelchair_accessible", icon: "Accessibility", labelKey: "wheelchair_accessible" },
  { slug: "outdoor_seating", icon: "Armchair", labelKey: "outdoor_seating" },
  { slug: "dine_in", icon: "Utensils", labelKey: "dine_in" },
  { slug: "takeout", icon: "ShoppingBag", labelKey: "takeout" },
  { slug: "delivery", icon: "Truck", labelKey: "delivery" },
  { slug: "accepts_cards", icon: "CreditCard", labelKey: "accepts_cards" },
  { slug: "free_wifi", icon: "Wifi", labelKey: "free_wifi" },
  { slug: "parking", icon: "SquareParking", labelKey: "parking" },
  { slug: "family_friendly", icon: "Baby", labelKey: "family_friendly" },
  { slug: "pet_friendly", icon: "PawPrint", labelKey: "pet_friendly" },
  { slug: "restroom", icon: "Toilet", labelKey: "restroom" },
  { slug: "reservations", icon: "CalendarCheck", labelKey: "reservations" },
  { slug: "good_for_groups", icon: "Users", labelKey: "good_for_groups" },
  { slug: "lgbtq_friendly", icon: "Heart", labelKey: "lgbtq_friendly" },
]

export const AMENITY_SLUGS: string[] = AMENITIES.map((a) => a.slug)

const SLUG_SET = new Set(AMENITY_SLUGS)
export function isAmenitySlug(s: string): boolean {
  return SLUG_SET.has(s)
}

/**
 * Lowercased Google/Apify label substrings → canonical slug.
 * Matched case-insensitively; the first substring found in a label wins.
 */
const LABEL_PATTERNS: Array<[needle: string, slug: string]> = [
  ["wheelchair", "wheelchair_accessible"],
  ["outdoor seating", "outdoor_seating"],
  ["dine-in", "dine_in"],
  ["dine in", "dine_in"],
  ["takeout", "takeout"],
  ["take-out", "takeout"],
  ["delivery", "delivery"],
  ["credit card", "accepts_cards"],
  ["debit card", "accepts_cards"],
  ["nfc mobile payment", "accepts_cards"],
  ["wi-fi", "free_wifi"],
  ["wifi", "free_wifi"],
  ["parking", "parking"],
  ["good for kids", "family_friendly"],
  ["family", "family_friendly"],
  ["dogs allowed", "pet_friendly"],
  ["pet", "pet_friendly"],
  ["restroom", "restroom"],
  ["reservation", "reservations"],
  ["good for groups", "good_for_groups"],
  ["groups", "good_for_groups"],
  ["lgbtq", "lgbtq_friendly"],
]

function labelToSlug(label: string): string | null {
  const l = label.toLowerCase()
  for (const [needle, slug] of LABEL_PATTERNS) {
    if (l.includes(needle)) return slug
  }
  return null
}

/**
 * Translate a Google/Apify `additionalInfo` object — shape:
 *   { [category: string]: Array<{ [label: string]: boolean }> }
 * — into our canonical amenity slugs. Only truthy labels count. Unknown
 * labels are dropped. Result is de-duplicated and ordered by AMENITIES.
 * Pure; defensive against malformed input.
 */
export function mapGoogleAdditionalInfo(additionalInfo: unknown): string[] {
  if (!additionalInfo || typeof additionalInfo !== "object") return []
  const found = new Set<string>()
  for (const group of Object.values(additionalInfo as Record<string, unknown>)) {
    if (!Array.isArray(group)) continue
    for (const entry of group) {
      if (!entry || typeof entry !== "object") continue
      for (const [label, value] of Object.entries(entry as Record<string, unknown>)) {
        if (value !== true) continue
        const slug = labelToSlug(label)
        if (slug) found.add(slug)
      }
    }
  }
  return AMENITY_SLUGS.filter((s) => found.has(s))
}
