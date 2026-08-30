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
  taglineEs: string // Spanish tagline for /es
  description: string
  descriptionEs: string // Spanish description for /es — render through hotelDescription()
  address: string
  avenue?: string // Street/avenue context for tourists
  neighborhood?: string // Area description
  neighborhoodEs?: string // Spanish area description — render through hotelNeighborhood()
  phone: string
  website: string | null
  amenities: AmenityKey[] // stable keys — render through amenityLabel()
  priceRange: "$" | "$$" | "$$$"
  rating: number // Google rating, out of 5
  coverUrl: string | null
  photos: string[] // gallery photos (photo #1 == coverUrl)
  lat: number
  lng: number
}

// Amenities are stable keys so the filter grid can match on them and every
// surface renders the reader's language via amenityLabel().
export const AMENITY_LABELS = {
  wifi: { en: "Free Wi-Fi", es: "Wi-Fi gratis" },
  breakfast: { en: "Free Breakfast", es: "Desayuno gratis" },
  hotBreakfast: { en: "Hot Breakfast", es: "Desayuno caliente" },
  continentalBreakfast: { en: "Continental Breakfast", es: "Desayuno continental" },
  eveningReception: { en: "Evening Reception", es: "Recepción vespertina" },
  indoorPool: { en: "Indoor Pool", es: "Alberca techada" },
  outdoorPool: { en: "Outdoor Pool", es: "Alberca al aire libre" },
  fitness: { en: "Fitness Center", es: "Gimnasio" },
  parking: { en: "Free Parking", es: "Estacionamiento gratis" },
  restaurant: { en: "On-Site Restaurant", es: "Restaurante en el hotel" },
  frontDesk24: { en: "24-hr Front Desk", es: "Recepción 24 horas" },
  businessCenter: { en: "Business Center", es: "Centro de negocios" },
  petFriendly: { en: "Pet-Friendly", es: "Acepta mascotas" },
  microwaveFridge: { en: "Microwave & Fridge in rooms", es: "Microondas y refrigerador en la habitación" },
} as const

export type AmenityKey = keyof typeof AMENITY_LABELS

export function amenityLabel(key: AmenityKey, locale: string): string {
  return locale === "es" ? AMENITY_LABELS[key].es : AMENITY_LABELS[key].en
}

export function hotelTagline(hotel: Pick<Hotel, "tagline" | "taglineEs">, locale: string): string {
  return locale === "es" ? hotel.taglineEs : hotel.tagline
}

export function hotelDescription(hotel: Pick<Hotel, "description" | "descriptionEs">, locale: string): string {
  return locale === "es" && hotel.descriptionEs ? hotel.descriptionEs : hotel.description
}

export function hotelNeighborhood(
  hotel: Pick<Hotel, "neighborhood" | "neighborhoodEs">,
  locale: string
): string | undefined {
  return locale === "es" && hotel.neighborhoodEs ? hotel.neighborhoodEs : hotel.neighborhood
}

/** The avenue line is a street name plus an English parenthetical; only the parenthetical translates. */
export function hotelAvenue(hotel: Pick<Hotel, "avenue">, locale: string): string | undefined {
  if (!hotel.avenue || locale !== "es") return hotel.avenue
  return hotel.avenue.replace("(Hotel Corridor)", "(corredor hotelero)")
}

const BLOB = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/hotels"

// Every verified hotel has 6 Places photos on blob: v2-<slug>.jpeg + v2-<slug>-2..6.jpeg
function hotelPhotos(slug: string): string[] {
  return [`${BLOB}/v2-${slug}.jpeg`, ...[2, 3, 4, 5, 6].map((n) => `${BLOB}/v2-${slug}-${n}.jpeg`)]
}

export const HOTELS: Hotel[] = [
  // ── Upscale / $$$
  {
    slug: "embassy-suites-lompoc",
    name: "Embassy Suites by Hilton Lompoc",
    category: "boutique",
    tagline: "All-suite stays with complimentary reception",
    taglineEs: "Suites completas con recepción de cortesía",
    description:
      "Hilton's all-suite Embassy brand in Lompoc. Every room is a two-room suite, and guests enjoy the complimentary evening reception with drinks and snacks — perfect after a day of wine tasting in the Santa Rita Hills.",
    descriptionEs:
      "La marca Embassy de Hilton, solo suites, en Lompoc. Cada habitación es una suite de dos ambientes, y los huéspedes disfrutan de la recepción vespertina de cortesía con bebidas y botanas — perfecta después de un día de cata de vinos en Santa Rita Hills.",
    address: "1117 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near major dining and shopping",
    neighborhoodEs: "Norte de Lompoc — cerca de los principales restaurantes y tiendas",
    phone: "(805) 735-8311",
    website: "https://www.hilton.com/en/hotels/lomcaes-embassy-suites-lompoc-central-coast/",
    amenities: ["wifi", "breakfast", "eveningReception", "indoorPool", "fitness", "parking"],
    priceRange: "$$$",
    rating: 4.0,
    coverUrl: `${BLOB}/v2-embassy-suites-lompoc.jpeg`,
    photos: hotelPhotos("embassy-suites-lompoc"),
    lat: 34.6558767,
    lng: -120.4587404,
  },
  {
    slug: "hilton-garden-inn-lompoc",
    name: "Hilton Garden Inn Lompoc",
    category: "mid-range",
    tagline: "Modern comfort in the heart of Lompoc",
    taglineEs: "Comodidad moderna en el corazón de Lompoc",
    description:
      "A contemporary Hilton Garden Inn with an on-site restaurant, outdoor pool, and well-appointed rooms. Ideal for business travelers visiting Vandenberg Space Force Base and leisure guests exploring the Central Coast wine region.",
    descriptionEs:
      "Un Hilton Garden Inn contemporáneo con restaurante en el hotel, alberca al aire libre y habitaciones bien equipadas. Ideal para viajeros de negocios que visitan la Base de la Fuerza Espacial Vandenberg y para quienes exploran la región vinícola de la Costa Central.",
    address: "1201 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — walkable to restaurants and shops",
    neighborhoodEs: "Norte de Lompoc — restaurantes y tiendas a pie",
    phone: "(805) 735-1880",
    website: "https://www.hilton.com/en/hotels/lpcnhgi-hilton-garden-inn-lompoc/",
    amenities: ["wifi", "restaurant", "outdoorPool", "fitness", "parking", "frontDesk24"],
    priceRange: "$$$",
    rating: 4.5,
    coverUrl: `${BLOB}/v2-hilton-garden-inn-lompoc.jpeg`,
    photos: hotelPhotos("hilton-garden-inn-lompoc"),
    lat: 34.6574784,
    lng: -120.4584883,
  },

  // ── Mid-range / $$
  {
    slug: "holiday-inn-express-lompoc",
    name: "Holiday Inn Express Lompoc",
    category: "mid-range",
    tagline: "Smart stays in the Lompoc Valley",
    taglineEs: "Estancias prácticas en el Valle de Lompoc",
    description:
      "Modern comfort in the heart of Lompoc. Spacious rooms, a complimentary hot breakfast, and easy access to wine tasting rooms and the historic downtown make this a top pick for families and business travelers alike.",
    descriptionEs:
      "Comodidad moderna en el corazón de Lompoc. Habitaciones amplias, desayuno caliente de cortesía y fácil acceso a las salas de cata y al centro histórico lo convierten en una de las mejores opciones tanto para familias como para viajeros de negocios.",
    address: "1417 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — walkable to restaurants, 3 blocks from Ocean Ave",
    neighborhoodEs: "Norte de Lompoc — restaurantes a pie, a 3 cuadras de Ocean Ave",
    phone: "(805) 736-2391",
    website: "https://www.ihg.com/holidayinnexpress/hotels/us/en/lompoc/lpcca/hoteldetail",
    amenities: ["wifi", "hotBreakfast", "indoorPool", "fitness", "businessCenter", "parking"],
    priceRange: "$$",
    rating: 4.3,
    coverUrl: `${BLOB}/v2-holiday-inn-express-lompoc.jpeg`,
    photos: hotelPhotos("holiday-inn-express-lompoc"),
    lat: 34.6625023,
    lng: -120.4584662,
  },
  {
    slug: "ocairns-inn-lompoc",
    name: "O'Cairns Inn & Suites",
    category: "mid-range",
    tagline: "Lompoc's highest-rated stay, family-run",
    taglineEs: "El hospedaje mejor calificado de Lompoc, de familia",
    description:
      "A beloved locally owned inn on East Ocean Avenue and the highest-rated lodging in Lompoc. Personalized service sets O'Cairns apart — a great base for exploring Old Town murals, the Wine Ghetto, and nearby flower fields.",
    descriptionEs:
      "Una querida posada de dueños locales en East Ocean Avenue y el hospedaje mejor calificado de Lompoc. El servicio personalizado distingue a O'Cairns — una excelente base para explorar los murales de Old Town, el Wine Ghetto y los campos de flores cercanos.",
    address: "940 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "Central Lompoc — on the main commercial boulevard",
    neighborhoodEs: "Centro de Lompoc — sobre el principal bulevar comercial",
    phone: "(805) 735-7731",
    website: "https://www.ocairnsinnandsuites.com/",
    amenities: ["wifi", "parking", "continentalBreakfast"],
    priceRange: "$$",
    rating: 4.6,
    coverUrl: `${BLOB}/v2-ocairns-inn-lompoc.jpeg`,
    photos: hotelPhotos("ocairns-inn-lompoc"),
    lat: 34.6382585,
    lng: -120.446835,
  },
  {
    slug: "inn-at-highway-1",
    name: "Inn at Highway 1",
    category: "boutique",
    tagline: "Independent boutique rooms on the hotel corridor",
    taglineEs: "Habitaciones boutique independientes en el corredor hotelero",
    description:
      "An independently run inn with a boutique feel, directly on the N H Street hotel corridor across from the big chains. Well-reviewed rooms and a personal touch — a solid alternative for travelers who prefer independents.",
    descriptionEs:
      "Una posada de administración independiente con aire boutique, justo en el corredor hotelero de N H Street, frente a las grandes cadenas. Habitaciones bien reseñadas y un toque personal — una buena alternativa para quienes prefieren hospedajes independientes.",
    address: "1200 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near major dining and shopping",
    neighborhoodEs: "Norte de Lompoc — cerca de los principales restaurantes y tiendas",
    phone: "(805) 735-3737",
    website: "http://www.innathighway1.com/",
    amenities: ["wifi", "parking"],
    priceRange: "$$",
    rating: 4.1,
    coverUrl: `${BLOB}/v2-inn-at-highway-1.jpeg`,
    photos: hotelPhotos("inn-at-highway-1"),
    lat: 34.6573958,
    lng: -120.4573313,
  },
  {
    slug: "lompoc-valley-inn-suites",
    name: "Lompoc Valley Inn & Suites",
    category: "mid-range",
    tagline: "Value rooms at the north end of the corridor",
    taglineEs: "Habitaciones económicas al norte del corredor",
    description:
      "A straightforward value hotel at the north end of the H Street hotel corridor, minutes from the Vandenberg gate. Practical rooms and suites for families and crews staying more than a night.",
    descriptionEs:
      "Un hotel económico y sin complicaciones en el extremo norte del corredor hotelero de H Street, a minutos de la entrada de Vandenberg. Habitaciones y suites prácticas para familias y cuadrillas de trabajo que se quedan más de una noche.",
    address: "1621 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — 10 min to Vandenberg Gate",
    neighborhoodEs: "Norte de Lompoc — a 10 min de la entrada de Vandenberg",
    phone: "(805) 735-8555",
    website: "http://www.lompocvalleyinnandsuites.com/",
    amenities: ["wifi", "parking"],
    priceRange: "$$",
    rating: 3.7,
    coverUrl: `${BLOB}/v2-lompoc-valley-inn-suites.jpeg`,
    photos: hotelPhotos("lompoc-valley-inn-suites"),
    lat: 34.6636886,
    lng: -120.4590988,
  },

  // ── Budget / $
  {
    slug: "budget-inn-lompoc",
    name: "Budget Inn Lompoc",
    category: "budget",
    tagline: "Family-run and well-reviewed for the price",
    taglineEs: "Familiar y bien calificado para su precio",
    description:
      "A small, family-run motel on H Street that consistently outscores bigger budget chains in guest ratings. Clean rooms, friendly owners, and honest prices a short drive from downtown and the flower fields.",
    descriptionEs:
      "Un motel pequeño y familiar en H Street que supera constantemente en calificaciones a las grandes cadenas económicas. Habitaciones limpias, dueños amables y precios honestos a un corto trayecto del centro y de los campos de flores.",
    address: "817 N H St, Lompoc, CA 93436",
    avenue: "N H Street",
    neighborhood: "Central Lompoc — a few blocks north of Old Town",
    neighborhoodEs: "Centro de Lompoc — a unas cuadras al norte de Old Town",
    phone: "(805) 736-1241",
    website: "https://www.thebudgetinnlompoc.com/",
    amenities: ["wifi", "parking"],
    priceRange: "$",
    rating: 3.9,
    coverUrl: `${BLOB}/v2-budget-inn-lompoc.jpeg`,
    photos: hotelPhotos("budget-inn-lompoc"),
    lat: 34.6508615,
    lng: -120.4582728,
  },
  {
    slug: "village-inn-lompoc",
    name: "Village Inn",
    category: "budget",
    tagline: "Quiet stays in Vandenberg Village",
    taglineEs: "Estancias tranquilas en Vandenberg Village",
    description:
      "A well-rated independent inn up in Vandenberg Village, about ten minutes north of downtown Lompoc and the closest lodging to the Vandenberg Space Force Base area — popular with launch watchers and base visitors.",
    descriptionEs:
      "Una posada independiente bien calificada en Vandenberg Village, a unos diez minutos al norte del centro de Lompoc y el hospedaje más cercano a la zona de la Base de la Fuerza Espacial Vandenberg — popular entre quienes vienen a ver lanzamientos y visitantes de la base.",
    address: "3955 Apollo Way, Lompoc, CA 93436",
    avenue: "Apollo Way (Vandenberg Village)",
    neighborhood: "Vandenberg Village — 10 min north of downtown",
    neighborhoodEs: "Vandenberg Village — a 10 min al norte del centro",
    phone: "(805) 972-0999",
    website: "https://www.villageinnca.com/",
    amenities: ["wifi", "parking"],
    priceRange: "$",
    rating: 4.2,
    coverUrl: `${BLOB}/v2-village-inn-lompoc.jpeg`,
    photos: hotelPhotos("village-inn-lompoc"),
    lat: 34.6990273,
    lng: -120.4666493,
  },
  {
    slug: "motel-6-lompoc",
    name: "Motel 6 Lompoc",
    category: "budget",
    tagline: "Affordable, pet-friendly — we'll leave the light on",
    taglineEs: "Económico y acepta mascotas — te dejamos la luz encendida",
    description:
      "America's most recognized budget chain. Motel 6 Lompoc is clean, reliable, and welcoming to pets. Free parking and easy highway access make it the go-to for road-trippers and budget-conscious travelers.",
    descriptionEs:
      "La cadena económica más reconocida de Estados Unidos. Motel 6 Lompoc es limpio, confiable y acepta mascotas. El estacionamiento gratis y el fácil acceso a la carretera lo hacen la opción ideal para viajeros en carretera y quienes cuidan su presupuesto.",
    address: "1521 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near the highway",
    neighborhoodEs: "Norte de Lompoc — cerca de la carretera",
    phone: "(805) 362-4139",
    website: "https://www.motel6.com/en/home/motels.ca.lompoc.html",
    amenities: ["wifi", "parking", "petFriendly", "outdoorPool"],
    priceRange: "$",
    rating: 3.5,
    coverUrl: `${BLOB}/v2-motel-6-lompoc.jpeg`,
    photos: hotelPhotos("motel-6-lompoc"),
    lat: 34.6631786,
    lng: -120.4587194,
  },
  {
    slug: "red-roof-inn-lompoc",
    name: "Red Roof Inn Lompoc",
    category: "budget",
    tagline: "No-frills comfort, free parking, pet-friendly",
    taglineEs: "Comodidad sin lujos, estacionamiento gratis, acepta mascotas",
    description:
      "Red Roof Inn delivers dependable, budget-friendly stays with free parking and a pet-friendly policy. On East Ocean Avenue close to central Lompoc — a solid base for Vandenberg visitors who want straightforward accommodations.",
    descriptionEs:
      "Red Roof Inn ofrece estancias confiables y económicas con estacionamiento gratis y política que acepta mascotas. En East Ocean Avenue, cerca del centro de Lompoc — una buena base para visitantes de Vandenberg que buscan un hospedaje sencillo.",
    address: "1020 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "Central Lompoc — on the main commercial boulevard",
    neighborhoodEs: "Centro de Lompoc — sobre el principal bulevar comercial",
    phone: "(805) 735-6444",
    website: "https://www.redroof.com/property/ca/lompoc/RRI774",
    amenities: ["wifi", "parking", "petFriendly"],
    priceRange: "$",
    rating: 3.2,
    coverUrl: `${BLOB}/v2-red-roof-inn-lompoc.jpeg`,
    photos: hotelPhotos("red-roof-inn-lompoc"),
    lat: 34.6387046,
    lng: -120.446034,
  },
  {
    slug: "lotus-of-lompoc",
    name: "Lotus of Lompoc",
    category: "budget",
    tagline: "Independent inn on East Ocean Avenue",
    taglineEs: "Hospedaje independiente en East Ocean Avenue",
    description:
      "A small, independently operated inn on the east side of town. The Lotus of Lompoc offers simple rooms with personalized, attentive service that chain hotels can't match — a practical pick for budget travelers.",
    descriptionEs:
      "Una posada pequeña de operación independiente en el lado este de la ciudad. Lotus of Lompoc ofrece habitaciones sencillas con un servicio personalizado y atento que las cadenas no igualan — una opción práctica para viajeros con presupuesto ajustado.",
    address: "1415 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "East Lompoc — on the main commercial boulevard",
    neighborhoodEs: "Este de Lompoc — sobre el principal bulevar comercial",
    phone: "(805) 736-6514",
    website: "http://www.lotusoflompocagreathospitalityinn.us/",
    amenities: ["wifi", "parking", "microwaveFridge"],
    priceRange: "$",
    rating: 3.4,
    coverUrl: `${BLOB}/v2-lotus-of-lompoc.jpeg`,
    photos: hotelPhotos("lotus-of-lompoc"),
    lat: 34.63934,
    lng: -120.4410947,
  },
  {
    slug: "inn-of-lompoc",
    name: "Inn of Lompoc",
    category: "budget",
    tagline: "Budget-friendly stays with outdoor pool",
    taglineEs: "Estancias económicas con alberca al aire libre",
    description:
      "A classic roadside inn offering clean, affordable accommodations with an outdoor pool, right on the H Street corridor. A practical choice for travelers passing through or staying near Vandenberg.",
    descriptionEs:
      "Una clásica posada de carretera con habitaciones limpias y económicas y alberca al aire libre, justo en el corredor de H Street. Una opción práctica para viajeros de paso o para quienes se hospedan cerca de Vandenberg.",
    address: "1122 N H St, Lompoc, CA 93436",
    avenue: "N H Street (Hotel Corridor)",
    neighborhood: "North Lompoc — near major dining and shopping",
    neighborhoodEs: "Norte de Lompoc — cerca de los principales restaurantes y tiendas",
    phone: "(805) 735-7744",
    website: "https://www.innlompoc.com/",
    amenities: ["wifi", "parking", "outdoorPool"],
    priceRange: "$",
    rating: 3.1,
    coverUrl: `${BLOB}/v2-inn-of-lompoc.jpeg`,
    photos: hotelPhotos("inn-of-lompoc"),
    lat: 34.6563436,
    lng: -120.4565108,
  },
  {
    slug: "star-motel-lompoc",
    name: "Star Motel",
    category: "budget",
    tagline: "Small independent motel near Old Town",
    taglineEs: "Pequeño motel independiente cerca de Old Town",
    description:
      "A small independent motel on Ocean Avenue, the closest lodging to Lompoc's Old Town core — steps from the murals, local cafés, and the Friday farmers market.",
    descriptionEs:
      "Un pequeño motel independiente en Ocean Avenue, el hospedaje más cercano al núcleo de Old Town en Lompoc — a pasos de los murales, los cafés locales y el mercado de agricultores de los viernes.",
    address: "216 E Ocean Ave, Lompoc, CA 93436",
    avenue: "E Ocean Avenue",
    neighborhood: "Downtown Lompoc — walking distance to Old Town",
    neighborhoodEs: "Centro de Lompoc — a distancia caminable de Old Town",
    phone: "(805) 736-8144",
    website: null,
    amenities: ["parking"],
    priceRange: "$",
    rating: 3.4,
    coverUrl: `${BLOB}/v2-star-motel-lompoc.jpeg`,
    photos: hotelPhotos("star-motel-lompoc"),
    lat: 34.6387756,
    lng: -120.4556971,
  },
]

export function getHotelBySlug(slug: string): Hotel | undefined {
  return HOTELS.find((h) => h.slug === slug)
}
