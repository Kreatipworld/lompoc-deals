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
  /** "home" = a property listing pin (category "homes"); absent/"business" = a business. */
  kind?: "business" | "home"
  listingId?: number
  listingType?: "for-sale" | "for-rent"
  imageUrl?: string | null
  address?: string | null
  /** "3 bd | 2 ba | 1,496 sqft" */
  facts?: string
  /** Listing agent / brokerage name */
  agent?: string
}
