/**
 * Extra "Plan your visit" facts for activity pages, keyed by activity slug.
 *
 * Activity rows (db/seed-activities.ts → `activities` table) carry one description
 * and one tips line. When a blog post that duplicated an activity is folded into it
 * (lib/blog-redirects.ts), the facts that post added live here, in our own words,
 * so the canonical page holds the depth without a DB write. Facts only: no verdict
 * words, nothing a reader can't check on the county's own pages.
 */

export type GuideSection = {
  heading: string
  body: string
  link?: { href: string; label: string }
}

type Guide = { en: GuideSection[]; es: GuideSection[] }

export const ACTIVITY_GUIDES: Record<string, Guide> = {
  "jalama-beach": {
    en: [
      {
        heading: "Getting there",
        body: "Jalama Beach County Park sits at the end of Jalama Road, about 14 miles off Highway 1 south of Lompoc. The road is paved but narrow and winds through working ranch land, and cell service drops out for most of the drive, so download directions before you leave town.",
      },
      {
        heading: "Camping",
        body: "The county campground is right behind the beach, with tent and RV sites and a small number of cabins, plus restrooms and showers. Reservations go through Santa Barbara County Parks; summer weekends book up months ahead, and weekdays are easier to get.",
      },
      {
        heading: "The store and grill",
        body: "The Jalama Beach Store & Grill near the campground serves burgers, including the Jalama Burger, along with snacks and camp basics. It is the only food at the beach, so pack anything else you need.",
      },
      {
        heading: "Surf and water",
        body: "Jalama faces open Pacific swell near Point Conception. The shore break is strong, currents pull, and the water stays cold, in the low-to-high 50s °F most of the year. There are no surf rentals on site, so bring your own board and wetsuit.",
        link: { href: "/blog/surfing-jalama-beach", label: "Surfing at Jalama Beach" },
      },
      {
        heading: "Wildlife",
        body: "Gray whales pass offshore during their migration, roughly December through April. Harbor seals haul out on the rocks, and tide pools show at the north end of the beach at low tide.",
      },
      {
        heading: "Before you go",
        body: "Wind is constant here: bring windproof layers and stakes for any shade or tent. There is a day-use fee at the gate, and connectivity is unreliable, so carry some cash as a backup.",
      },
    ],
    es: [
      {
        heading: "Cómo llegar",
        body: "El parque del condado Jalama Beach está al final de Jalama Road, a unas 14 millas de la Highway 1 al sur de Lompoc. El camino está pavimentado pero es angosto y cruza tierras de rancho, y casi no hay señal de celular durante el trayecto, así que descarga las indicaciones antes de salir.",
      },
      {
        heading: "Campamento",
        body: "El campamento del condado está justo detrás de la playa, con espacios para tiendas y casas rodantes, algunas cabañas, baños y regaderas. Las reservaciones se hacen con Santa Barbara County Parks; los fines de semana de verano se llenan con meses de anticipación y entre semana hay más disponibilidad.",
      },
      {
        heading: "La tienda y el grill",
        body: "Jalama Beach Store & Grill, junto al campamento, sirve hamburguesas, entre ellas la Jalama Burger, además de botanas y artículos básicos. Es la única comida en la playa, así que lleva todo lo demás que necesites.",
      },
      {
        heading: "Surf y agua",
        body: "Jalama recibe el oleaje abierto del Pacífico cerca de Point Conception. La rompiente en la orilla es fuerte, hay corrientes y el agua es fría, entre los 50 °F bajos y altos casi todo el año. No se rentan tablas en el lugar, así que trae tu propia tabla y traje de neopreno.",
        link: { href: "/blog/surfing-jalama-beach", label: "Surf en Jalama Beach" },
      },
      {
        heading: "Vida silvestre",
        body: "Las ballenas grises pasan frente a la costa durante su migración, más o menos de diciembre a abril. Las focas descansan en las rocas, y en marea baja aparecen pozas de marea en el extremo norte de la playa.",
      },
      {
        heading: "Antes de ir",
        body: "Aquí el viento no para: lleva capas contra el viento y estacas para cualquier toldo o tienda. Hay una cuota de uso diurno en la entrada y la conexión no es confiable, así que lleva algo de efectivo por si acaso.",
      },
    ],
  },
}

export const GUIDE_HEADING = { en: "Plan your visit", es: "Planea tu visita" }

export function activityGuide(slug: string, locale: string): GuideSection[] {
  const g = ACTIVITY_GUIDES[slug]
  if (!g) return []
  return locale === "es" ? g.es : g.en
}
