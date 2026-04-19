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
}
