// Static hotel data for Lompoc, CA.
// This will be replaced by CMO-curated DB content once KRE-262 is complete.

export type Hotel = {
  slug: string
  name: string
  category: "budget" | "mid-range" | "boutique"
  tagline: string
  description: string
  address: string
  phone: string
  website: string | null
  amenities: string[]
  priceRange: "$" | "$$" | "$$$"
  rating: number // out of 5
  coverUrl: string | null
}

export const HOTELS: Hotel[] = [
  {
    slug: "quality-inn-lompoc",
    name: "Quality Inn Lompoc",
    category: "budget",
    tagline: "Comfortable stays at honest prices",
    description:
      "A reliable, well-maintained hotel conveniently located on N H Street near dining, shopping, and the heart of Lompoc. Great for travelers visiting Vandenberg Space Force Base or exploring the Central Coast wine country.",
    address: "1621 N H St, Lompoc, CA 93436",
    phone: "(805) 735-8555",
    website: "https://www.choicehotels.com",
    amenities: ["Free Wi-Fi", "Free Parking", "Outdoor Pool", "Pet-Friendly", "Continental Breakfast"],
    priceRange: "$",
    rating: 3.5,
    coverUrl: null,
  },
  {
    slug: "holiday-inn-express-lompoc",
    name: "Holiday Inn Express & Suites Lompoc",
    category: "mid-range",
    tagline: "Smart stays in the Flower Capital",
    description:
      "Modern comfort in the heart of Lompoc. Spacious rooms, a complimentary hot breakfast, and easy access to wine tasting rooms and the historic downtown make this a top pick for families and business travelers alike.",
    address: "1417 N H St, Lompoc, CA 93436",
    phone: "(805) 735-8720",
    website: "https://www.ihg.com",
    amenities: ["Free Wi-Fi", "Hot Breakfast", "Indoor Pool", "Fitness Center", "Business Center", "Free Parking"],
    priceRange: "$$",
    rating: 4.0,
    coverUrl: null,
  },
  {
    slug: "hampton-inn-lompoc",
    name: "Hampton Inn & Suites Lompoc",
    category: "mid-range",
    tagline: "Hampton's 100% satisfaction guarantee",
    description:
      "Hilton's trusted Hampton brand brings clean, consistent hospitality to Lompoc. Whether you're here for the Santa Rita Hills wine trail, a Vandenberg visit, or the annual Flower Festival, Hampton delivers the reliability you expect.",
    address: "1201 N H St, Lompoc, CA 93436",
    phone: "(805) 735-0777",
    website: "https://www.hilton.com",
    amenities: ["Free Wi-Fi", "Hot Breakfast", "Pool", "Fitness Center", "Free Parking", "24-hr Front Desk"],
    priceRange: "$$",
    rating: 4.2,
    coverUrl: null,
  },
  {
    slug: "cabrillo-inn-lompoc",
    name: "Cabrillo Inn",
    category: "budget",
    tagline: "Local roots, friendly rates",
    description:
      "A locally owned motel offering simple, affordable accommodations. Centrally located and steps from Ocean Avenue, the Cabrillo Inn is a no-fuss option for budget-conscious travelers who want to be close to Lompoc's local dining and shops.",
    address: "1107 E Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 735-6777",
    website: null,
    amenities: ["Free Wi-Fi", "Free Parking", "Pet-Friendly", "Microwave & Fridge in rooms"],
    priceRange: "$",
    rating: 3.2,
    coverUrl: null,
  },
]

export function getHotelBySlug(slug: string): Hotel | undefined {
  return HOTELS.find((h) => h.slug === slug)
}
