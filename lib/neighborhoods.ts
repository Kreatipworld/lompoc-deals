/**
 * Approximate neighborhood zones for Lompoc + Vandenberg (v1).
 * Bounds are [south, west, north, east] lat/lng rectangles.
 * Ordered most-specific first — latLngToNeighborhood returns the FIRST match,
 * so small cores (Old Town) must precede the wider boxes that contain them.
 */
export type Neighborhood = {
  slug: string
  en: string
  es: string
  bounds: [number, number, number, number]
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { slug: "old-town", en: "Old Town", es: "Old Town", bounds: [34.635, -120.465, 34.652, -120.452] },
  { slug: "downtown", en: "Downtown", es: "Centro", bounds: [34.628, -120.468, 34.658, -120.44] },
  { slug: "northside", en: "Northside", es: "Northside", bounds: [34.658, -120.48, 34.678, -120.42] },
  { slug: "westside", en: "Westside", es: "Westside", bounds: [34.62, -120.5, 34.658, -120.465] },
  { slug: "southside", en: "Southside", es: "Southside", bounds: [34.6, -120.465, 34.628, -120.42] },
  { slug: "mesa-oaks", en: "Mesa Oaks", es: "Mesa Oaks", bounds: [34.685, -120.48, 34.7, -120.45] },
  { slug: "mission-hills", en: "Mission Hills", es: "Mission Hills", bounds: [34.67, -120.45, 34.7, -120.41] },
  { slug: "vandenberg-village", en: "Vandenberg Village", es: "Vandenberg Village", bounds: [34.7, -120.49, 34.725, -120.43] },
  { slug: "vsfb", en: "Vandenberg SFB", es: "Base Vandenberg", bounds: [34.58, -120.65, 34.8, -120.49] },
]

export function latLngToNeighborhood(lat: number, lng: number): string | null {
  for (const n of NEIGHBORHOODS) {
    const [s, w, no, e] = n.bounds
    if (lat >= s && lat <= no && lng >= w && lng <= e) return n.slug
  }
  return null
}

/** Display label for a slug; unknown slugs fall back to "Lompoc". */
export function neighborhoodLabel(slug: string, locale: string): string {
  const n = NEIGHBORHOODS.find((z) => z.slug === slug)
  if (!n) return "Lompoc"
  return locale === "es" ? n.es : n.en
}
