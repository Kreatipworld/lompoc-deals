// Static directory of Lompoc lodging shown on /hotels and /hotels/[slug].
//
// Every property below was verified against Google Places (2026-07-06):
// name, address, phone, website, rating, and coordinates come from the live
// place record, and each coverUrl is that property's own Places photo hosted
// on our Vercel Blob. Refresh pipeline: scripts/fetch-hotel-photos.ts.
export type Hotel = {
  slug: string
  name: string
  category: "budget" | "mid-range" | "boutique"
  tagline: string
  description: string
  address: string
  avenue?: string // Street/avenue context for tourists
  neighborhood?: string // Area description
  phone: string
  website: string | null
  amenities: string[]
  priceRange: "$" | "$$" | "$$$"
  rating: number // Google rating, out of 5
  coverUrl: string | null
  lat: number
  lng: number
}

const BLOB = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/hotels"

export const HOTELS: Hotel[] = [
  // ── Upscale / $$$
  {
    slug: "embassy-suites-lompoc",
    name: "Embassy Suites by Hilton Lompoc",
    category: "boutique",
    tagline: "All-suite stays with complimentary reception",
    description:
      "Hilton's all-suite Embassy brand in Lompoc. Every room is a two-room suite, and guests enjoy the complimentary evening reception with drinks and snacks — perfect after a day of wine tasting in the Santa Rita Hills.",
    address: "1117 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near major dining and shopping",
    phone: "(805) 735-8311",
    website: "https://www.hilton.com/en/hotels/lomcaes-embassy-suites-lompoc-central-coast/",
    amenities: ["Free Wi-Fi", "Free Breakfast", "Evening Reception", "Indoor Pool", "Fitness Center", "Free Parking"],
    priceRange: "$$$",
    rating: 4.0,
    coverUrl: `${BLOB}/v2-embassy-suites-lompoc.jpeg`,
    lat: 34.6558767,
    lng: -120.4587404,
  },
  {
    slug: "hilton-garden-inn-lompoc",
    name: "Hilton Garden Inn Lompoc",
    category: "mid-range",
    tagline: "Modern comfort in the heart of Lompoc",
    description:
      "A contemporary Hilton Garden Inn with an on-site restaurant, outdoor pool, and well-appointed rooms. Ideal for business travelers visiting Vandenberg Space Force Base and leisure guests exploring the Central Coast wine region.",
    address: "1201 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — walkable to restaurants and shops",
    phone: "(805) 735-1880",
    website: "https://www.hilton.com/en/hotels/lpcnhgi-hilton-garden-inn-lompoc/",
    amenities: ["Free Wi-Fi", "On-Site Restaurant", "Outdoor Pool", "Fitness Center", "Free Parking", "24-hr Front Desk"],
    priceRange: "$$$",
    rating: 4.5,
    coverUrl: `${BLOB}/v2-hilton-garden-inn-lompoc.jpeg`,
    lat: 34.6574784,
    lng: -120.4584883,
  },

  // ── Mid-range / $$
  {
    slug: "holiday-inn-express-lompoc",
    name: "Holiday Inn Express Lompoc",
    category: "mid-range",
    tagline: "Smart stays in the Lompoc Valley",
    description:
      "Modern comfort in the heart of Lompoc. Spacious rooms, a complimentary hot breakfast, and easy access to wine tasting rooms and the historic downtown make this a top pick for families and business travelers alike.",
    address: "1417 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — walkable to restaurants, 3 blocks from Ocean Ave",
    phone: "(805) 736-2391",
    website: "https://www.ihg.com/holidayinnexpress/hotels/us/en/lompoc/lpcca/hoteldetail",
    amenities: ["Free Wi-Fi", "Hot Breakfast", "Indoor Pool", "Fitness Center", "Business Center", "Free Parking"],
    priceRange: "$$",
    rating: 4.3,
    coverUrl: `${BLOB}/v2-holiday-inn-express-lompoc.jpeg`,
    lat: 34.6625023,
    lng: -120.4584662,
  },
  {
    slug: "ocairns-inn-lompoc",
    name: "O'Cairns Inn & Suites",
    category: "mid-range",
    tagline: "Lompoc's highest-rated stay, family-run",
    description:
      "A beloved locally owned inn on East Ocean Avenue and the highest-rated lodging in Lompoc. Personalized service sets O'Cairns apart — a great base for exploring Old Town murals, the Wine Ghetto, and nearby flower fields.",
    address: "940 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "Central Lompoc — on the main commercial boulevard",
    phone: "(805) 735-7731",
    website: "https://www.ocairnsinnandsuites.com/",
    amenities: ["Free Wi-Fi", "Free Parking", "Continental Breakfast"],
    priceRange: "$$",
    rating: 4.6,
    coverUrl: `${BLOB}/v2-ocairns-inn-lompoc.jpeg`,
    lat: 34.6382585,
    lng: -120.446835,
  },
  {
    slug: "inn-at-highway-1",
    name: "Inn at Highway 1",
    category: "boutique",
    tagline: "Independent boutique rooms on the hotel corridor",
    description:
      "An independently run inn with a boutique feel, directly on the N H Street hotel corridor across from the big chains. Well-reviewed rooms and a personal touch — a solid alternative for travelers who prefer independents.",
    address: "1200 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near major dining and shopping",
    phone: "(805) 735-3737",
    website: "http://www.innathighway1.com/",
    amenities: ["Free Wi-Fi", "Free Parking"],
    priceRange: "$$",
    rating: 4.1,
    coverUrl: `${BLOB}/v2-inn-at-highway-1.jpeg`,
    lat: 34.6573958,
    lng: -120.4573313,
  },
  {
    slug: "lompoc-valley-inn-suites",
    name: "Lompoc Valley Inn & Suites",
    category: "mid-range",
    tagline: "Value rooms at the north end of the corridor",
    description:
      "A straightforward value hotel at the north end of the H Street hotel corridor, minutes from the Vandenberg gate. Practical rooms and suites for families and crews staying more than a night.",
    address: "1621 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — 10 min to Vandenberg Gate",
    phone: "(805) 735-8555",
    website: "http://www.lompocvalleyinnandsuites.com/",
    amenities: ["Free Wi-Fi", "Free Parking"],
    priceRange: "$$",
    rating: 3.7,
    coverUrl: `${BLOB}/v2-lompoc-valley-inn-suites.jpeg`,
    lat: 34.6636886,
    lng: -120.4590988,
  },

  // ── Budget / $
  {
    slug: "budget-inn-lompoc",
    name: "Budget Inn Lompoc",
    category: "budget",
    tagline: "Family-run and well-reviewed for the price",
    description:
      "A small, family-run motel on H Street that consistently outscores bigger budget chains in guest ratings. Clean rooms, friendly owners, and honest prices a short drive from downtown and the flower fields.",
    address: "817 N H St, Lompoc, CA 93436",
    avenue: "N H Street",
    neighborhood: "Central Lompoc — a few blocks north of Old Town",
    phone: "(805) 736-1241",
    website: "https://www.thebudgetinnlompoc.com/",
    amenities: ["Free Wi-Fi", "Free Parking"],
    priceRange: "$",
    rating: 3.9,
    coverUrl: `${BLOB}/v2-budget-inn-lompoc.jpeg`,
    lat: 34.6508615,
    lng: -120.4582728,
  },
  {
    slug: "village-inn-lompoc",
    name: "Village Inn",
    category: "budget",
    tagline: "Quiet stays in Vandenberg Village",
    description:
      "A well-rated independent inn up in Vandenberg Village, about ten minutes north of downtown Lompoc and the closest lodging to the Vandenberg Space Force Base area — popular with launch watchers and base visitors.",
    address: "3955 Apollo Way, Lompoc, CA 93436",
    avenue: "Apollo Way (Vandenberg Village)",
    neighborhood: "Vandenberg Village — 10 min north of downtown",
    phone: "(805) 972-0999",
    website: "https://www.villageinnca.com/",
    amenities: ["Free Wi-Fi", "Free Parking"],
    priceRange: "$",
    rating: 4.2,
    coverUrl: `${BLOB}/v2-village-inn-lompoc.jpeg`,
    lat: 34.6990273,
    lng: -120.4666493,
  },
  {
    slug: "motel-6-lompoc",
    name: "Motel 6 Lompoc",
    category: "budget",
    tagline: "Affordable, pet-friendly — we'll leave the light on",
    description:
      "America's most recognized budget chain. Motel 6 Lompoc is clean, reliable, and welcoming to pets. Free parking and easy highway access make it the go-to for road-trippers and budget-conscious travelers.",
    address: "1521 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near the highway",
    phone: "(805) 362-4139",
    website: "https://www.motel6.com/en/home/motels.ca.lompoc.html",
    amenities: ["Free Wi-Fi", "Free Parking", "Pet-Friendly", "Outdoor Pool"],
    priceRange: "$",
    rating: 3.5,
    coverUrl: `${BLOB}/v2-motel-6-lompoc.jpeg`,
    lat: 34.6631786,
    lng: -120.4587194,
  },
  {
    slug: "red-roof-inn-lompoc",
    name: "Red Roof Inn Lompoc",
    category: "budget",
    tagline: "No-frills comfort, free parking, pet-friendly",
    description:
      "Red Roof Inn delivers dependable, budget-friendly stays with free parking and a pet-friendly policy. On East Ocean Avenue close to central Lompoc — a solid base for Vandenberg visitors who want straightforward accommodations.",
    address: "1020 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "Central Lompoc — on the main commercial boulevard",
    phone: "(805) 735-6444",
    website: "https://www.redroof.com/property/ca/lompoc/RRI774",
    amenities: ["Free Wi-Fi", "Free Parking", "Pet-Friendly"],
    priceRange: "$",
    rating: 3.2,
    coverUrl: `${BLOB}/v2-red-roof-inn-lompoc.jpeg`,
    lat: 34.6387046,
    lng: -120.446034,
  },
  {
    slug: "lotus-of-lompoc",
    name: "Lotus of Lompoc",
    category: "budget",
    tagline: "Independent inn on East Ocean Avenue",
    description:
      "A small, independently operated inn on the east side of town. The Lotus of Lompoc offers simple rooms with personalized, attentive service that chain hotels can't match — a practical pick for budget travelers.",
    address: "1415 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "East Lompoc — on the main commercial boulevard",
    phone: "(805) 736-6514",
    website: "http://www.lotusoflompocagreathospitalityinn.us/",
    amenities: ["Free Wi-Fi", "Free Parking", "Microwave & Fridge in rooms"],
    priceRange: "$",
    rating: 3.4,
    coverUrl: `${BLOB}/v2-lotus-of-lompoc.jpeg`,
    lat: 34.63934,
    lng: -120.4410947,
  },
  {
    slug: "inn-of-lompoc",
    name: "Inn of Lompoc",
    category: "budget",
    tagline: "Budget-friendly stays with outdoor pool",
    description:
      "A classic roadside inn offering clean, affordable accommodations with an outdoor pool, right on the H Street corridor. A practical choice for travelers passing through or staying near Vandenberg.",
    address: "1122 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near major dining and shopping",
    phone: "(805) 735-7744",
    website: "https://www.innlompoc.com/",
    amenities: ["Free Wi-Fi", "Free Parking", "Outdoor Pool"],
    priceRange: "$",
    rating: 3.1,
    coverUrl: `${BLOB}/v2-inn-of-lompoc.jpeg`,
    lat: 34.6563436,
    lng: -120.4565108,
  },
  {
    slug: "star-motel-lompoc",
    name: "Star Motel",
    category: "budget",
    tagline: "Small independent motel near Old Town",
    description:
      "A small independent motel on Ocean Avenue, the closest lodging to Lompoc's Old Town core — steps from the murals, local cafés, and the Friday farmers market.",
    address: "216 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "Downtown Lompoc — walking distance to Old Town",
    phone: "(805) 736-8144",
    website: null,
    amenities: ["Free Parking"],
    priceRange: "$",
    rating: 3.4,
    coverUrl: `${BLOB}/v2-star-motel-lompoc.jpeg`,
    lat: 34.6387756,
    lng: -120.4556971,
  },
]

export function getHotelBySlug(slug: string): Hotel | undefined {
  return HOTELS.find((h) => h.slug === slug)
}
