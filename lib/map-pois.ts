import type { CategoryId } from "./map-categories"

export interface POI {
  id: string
  name: string
  lat: number
  lng: number
  category: CategoryId
  highlight: string
  slug: string
  rating?: number
  price?: string
  type?: string
  /** Official Partner (premium) — gets a distinct, prominent marker. */
  partner?: boolean
}
