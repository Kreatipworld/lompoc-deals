import { AMENITIES } from "./amenities"
import { DAY_KEYS, isCanonical, parseHours, type Hours } from "./hours"

export type JsonLdBusiness = {
  name: string
  slug: string
  about: string | null
  description: string | null
  phone: string | null
  address: string | null
  lat: number | null
  lng: number | null
  hoursJson: unknown
  instagramUrl: string | null
  facebookUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  yelpUrl: string | null
  googleBusinessUrl: string | null
}

// Schema.org day names indexed to match DAY_KEYS order (mon..sun).
const SCHEMA_DAYS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
}

const CATEGORY_TO_TYPE: Record<string, string> = {
  "food-drink": "Restaurant",
}

// English labels intentionally mirror messages/en.json > businesses.amenities; this pure builder cannot use next-intl, and schema.org names should stay canonical English regardless of page locale.
const AMENITY_LABEL: Record<string, string> = {
  wheelchair_accessible: "Wheelchair accessible",
  outdoor_seating: "Outdoor seating",
  dine_in: "Dine-in",
  takeout: "Takeout",
  delivery: "Delivery",
  accepts_cards: "Accepts cards",
  free_wifi: "Free Wi-Fi",
  parking: "Parking",
  family_friendly: "Family-friendly",
  pet_friendly: "Pet-friendly",
  restroom: "Restroom",
  reservations: "Reservations",
  good_for_groups: "Good for groups",
  lgbtq_friendly: "LGBTQ+ friendly",
}

function openingHoursSpec(hours: Hours): Array<Record<string, string>> {
  const out: Array<Record<string, string>> = []
  for (const day of DAY_KEYS) {
    const d = hours[day]
    if (isCanonical(d)) {
      out.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[day],
        opens: d.open,
        closes: d.close,
      })
    }
  }
  return out
}

export function buildLocalBusinessJsonLd(
  b: JsonLdBusiness,
  opts: { siteUrl: string; amenities: string[]; photos: string[]; categorySlug: string | null }
): Record<string, unknown> {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": (opts.categorySlug && CATEGORY_TO_TYPE[opts.categorySlug]) || "LocalBusiness",
    name: b.name,
    url: `${opts.siteUrl}/biz/${b.slug}`,
  }

  const desc = b.about?.trim() || b.description?.trim()
  if (desc) json.description = desc
  if (b.phone) json.telephone = b.phone
  if (opts.photos.length > 0) json.image = opts.photos

  if (b.address) {
    const zip = b.address.match(/\b\d{5}\b/)?.[0]
    json.address = {
      "@type": "PostalAddress",
      streetAddress: b.address,
      addressLocality: "Lompoc",
      addressRegion: "CA",
      addressCountry: "US",
      ...(zip ? { postalCode: zip } : {}),
    }
  }

  if (b.lat != null && b.lng != null) {
    json.geo = { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng }
  }

  const spec = openingHoursSpec(parseHours(b.hoursJson))
  if (spec.length > 0) json.openingHoursSpecification = spec

  const amenityFeature = AMENITIES.filter((a) => opts.amenities.includes(a.slug)).map((a) => ({
    "@type": "LocationFeatureSpecification",
    name: AMENITY_LABEL[a.slug] ?? a.slug,
    value: true,
  }))
  if (amenityFeature.length > 0) json.amenityFeature = amenityFeature

  const sameAs = [
    b.instagramUrl,
    b.facebookUrl,
    b.tiktokUrl,
    b.youtubeUrl,
    b.yelpUrl,
    b.googleBusinessUrl,
  ].filter((u): u is string => !!u)
  if (sameAs.length > 0) json.sameAs = sameAs

  return json
}
