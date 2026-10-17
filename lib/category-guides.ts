/**
 * Guide copy for the category pages Google shows most but ranks deep
 * (Search Console, Oct 17 2026: /category/food-drink ~#40, /category/auto ~#29).
 * Our own words, facts only; the page adds a Q&A computed from its own list.
 */
export type CategoryGuide = {
  /** <title> — the words people actually search ("Restaurants in Lompoc, CA"). */
  title: { en: string; es: string }
  /** Page heading. */
  h1: { en: string; es: string }
  description: { en: string; es: string }
  intro?: { en: string; es: string }
  /** What the listed places are called, for the computed Q&A. */
  noun?: { en: string; es: string }
}

export const CATEGORY_GUIDES: Record<string, CategoryGuide> = {
  "food-drink": {
    title: { en: "Restaurants in Lompoc, CA: Food, Hours & Deals", es: "Restaurantes en Lompoc, CA: comida, horarios y ofertas" },
    h1: { en: "Restaurants in Lompoc, CA", es: "Restaurantes en Lompoc, CA" },
    description: {
      en: "Every restaurant, taquería, bakery and café in Lompoc, CA in one place, with hours, photos, phone numbers and this week's deals. Local members first.",
      es: "Todos los restaurantes, taquerías, panaderías y cafés de Lompoc, CA en un solo lugar, con horarios, fotos, teléfonos y las ofertas de la semana. Primero los miembros locales.",
    },
    intro: {
      en: "Where to eat in Lompoc, from family taquerías on H Street to burger grills, sushi, Thai, bakeries and brunch spots. Members are listed first. Tap any place for hours, photos, directions and current deals, or jump to a guide below.",
      es: "Dónde comer en Lompoc, desde las taquerías familiares de la calle H hasta hamburgueserías, sushi, comida tailandesa, panaderías y lugares de brunch. Los miembros aparecen primero. Toca cualquier lugar para ver horario, fotos, cómo llegar y ofertas, o ve a una guía abajo.",
    },
    noun: { en: "places to eat", es: "lugares para comer" },
  },
  auto: {
    title: { en: "Auto Repair, Tires & Smog in Lompoc, CA", es: "Talleres, llantas y smog en Lompoc, CA" },
    h1: { en: "Auto Repair & Car Care in Lompoc, CA", es: "Talleres y cuidado del carro en Lompoc, CA" },
    description: {
      en: "Mechanics, tire shops, oil changes, smog checks and car care in Lompoc, CA, with phone numbers, hours, directions and current deals. Local members first.",
      es: "Mecánicos, llanteras, cambios de aceite, smog y cuidado del carro en Lompoc, CA, con teléfonos, horarios, cómo llegar y ofertas actuales. Primero los miembros locales.",
    },
    intro: {
      en: "Car trouble in Lompoc, sorted: the local mechanics, tire shops, smog stations, glass and tint shops in town. Members are listed first. Each page has the phone number and hours so you can call ahead.",
      es: "Problemas con el carro en Lompoc, resueltos: los mecánicos, llanteras, centros de smog y talleres de vidrios y polarizado del pueblo. Los miembros aparecen primero. Cada página tiene teléfono y horario para llamar antes.",
    },
    noun: { en: "auto businesses", es: "negocios de autos" },
  },
  retail: {
    title: { en: "Shops & Stores in Lompoc, CA: Hours & Deals", es: "Tiendas en Lompoc, CA: horarios y ofertas" },
    h1: { en: "Shops & Stores in Lompoc, CA", es: "Tiendas en Lompoc, CA" },
    description: {
      en: "Local shops, boutiques, florists, grocery stores and everyday stores in Lompoc, CA, with hours, phone numbers, directions and current deals. Local members first.",
      es: "Tiendas locales, boutiques, florerías, supermercados y tiendas de todos los días en Lompoc, CA, con horarios, teléfonos, cómo llegar y ofertas. Primero los miembros locales.",
    },
  },
  "health-beauty": {
    title: { en: "Salons, Barbers, Spas & Health in Lompoc, CA", es: "Salones, barberías, spas y salud en Lompoc, CA" },
    h1: { en: "Health & Beauty in Lompoc, CA", es: "Salud y belleza en Lompoc, CA" },
    description: {
      en: "Hair salons, barbershops, waxing, spas, fitness and wellness in Lompoc, CA, with hours, booking details, phone numbers and current deals. Local members first.",
      es: "Salones, barberías, depilación, spas, gimnasios y bienestar en Lompoc, CA, con horarios, citas, teléfonos y ofertas actuales. Primero los miembros locales.",
    },
  },
  services: {
    title: { en: "Local Services in Lompoc, CA: Pros Near You", es: "Servicios locales en Lompoc, CA" },
    h1: { en: "Local Services in Lompoc, CA", es: "Servicios locales en Lompoc, CA" },
    description: {
      en: "Plumbers, pest control, insurance, notaries, cleaners and other local pros in Lompoc, CA, with phone numbers, hours and reviews links. Local members first.",
      es: "Plomeros, control de plagas, seguros, notarios, limpieza y otros profesionales locales en Lompoc, CA, con teléfonos, horarios y reseñas. Primero los miembros locales.",
    },
  },
  construction: {
    title: { en: "Contractors & Builders in Lompoc, CA", es: "Contratistas y constructores en Lompoc, CA" },
    h1: { en: "Contractors & Builders in Lompoc, CA", es: "Contratistas y constructores en Lompoc, CA" },
    description: {
      en: "General contractors, builders, painters, glass, landscaping and home improvement pros in Lompoc, CA, with phone numbers and service areas. Local members first.",
      es: "Contratistas generales, constructores, pintores, vidrios, jardinería y remodelación en Lompoc, CA, con teléfonos y zonas de servicio. Primero los miembros locales.",
    },
  },
}
