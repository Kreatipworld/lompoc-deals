/**
 * Curated "find" pages — one indexable landing page per word people actually
 * search for on the site (search_run analytics: pizza, tacos, coffee, …).
 *
 * Each page runs the same word matcher as /search, shows Growth/Plus members
 * first, and carries a short intro in our own voice. This is how a search word
 * becomes a page that ranks and earns links instead of a throwaway results URL.
 * Add a term here when the admin "Words people search" card shows a word with
 * no page yet.
 */

export type FindTerm = {
  /** URL segment: /find/<slug> */
  slug: string
  /** Words fed to the site search matcher (English — the matcher runs on English text). */
  query: string
  /** Other spellings people type; matched against lowercased search input. */
  aliases: string[]
  /** "businesses" lists matching places; "events" lists upcoming events instead. */
  kind: "businesses" | "events"
  /** Business slugs the matcher pulls in but that don't belong (curated by hand). */
  exclude?: string[]
  /** Business slugs we know belong even if the words never appear in their listing. */
  include?: string[]
  /** events only: restrict to one feed (e.g. "launch-library" for rocket launches). */
  eventSource?: string
  /** events only: how far ahead to look (default 7 days). */
  eventWindowDays?: number
  /** Optional category chip to offer under the results. */
  category?: string
  title: { en: string; es: string }
  intro: { en: string; es: string }
}

export const FIND_TERMS: FindTerm[] = [
  {
    slug: "pizza",
    query: "pizza",
    aliases: ["pizzas", "pizzeria", "pizza near downtown", "pizza near me"],
    kind: "businesses",
    category: "food-drink",
    title: { en: "Pizza in Lompoc", es: "Pizza en Lompoc" },
    intro: {
      en: "Pizza is the most searched word on Lompoc Locals, and the town has more than one answer: wood-fired pies, family pizzerias, delivery on a Friday night, and a slice on the way home. Every place below is in Lompoc, with its own hours, phone, and current deals.",
      es: "Pizza es la palabra más buscada en Lompoc Locals, y el pueblo tiene más de una respuesta: pizzas a la leña, pizzerías familiares, entrega un viernes por la noche y una rebanada camino a casa. Cada lugar de abajo está en Lompoc, con sus horarios, teléfono y ofertas actuales.",
    },
  },
  {
    slug: "tacos",
    query: "tacos",
    aliases: ["taco", "taqueria", "taquería", "street tacos"],
    kind: "businesses",
    category: "food-drink",
    title: { en: "Tacos in Lompoc", es: "Tacos en Lompoc" },
    intro: {
      en: "Lompoc takes its tacos seriously, from taquerías on H Street to trucks that locals follow by name. These are the places in town that make them, with hours, addresses, and whatever specials they are running this week.",
      es: "En Lompoc los tacos se toman en serio, desde las taquerías de la calle H hasta los trocas que la gente sigue por nombre. Estos son los lugares del pueblo que los preparan, con horarios, direcciones y las promociones de esta semana.",
    },
  },
  {
    slug: "coffee",
    query: "coffee",
    aliases: ["cafe", "café", "coffee shop", "espresso", "latte"],
    kind: "businesses",
    category: "food-drink",
    title: { en: "Coffee in Lompoc", es: "Café en Lompoc" },
    intro: {
      en: "Morning in Lompoc runs on coffee. Independent cafés, drive-through espresso, and bakeries that pour a good cup all sit within a few minutes of each other. Here is where locals get theirs, with hours so you know who opens early.",
      es: "Las mañanas en Lompoc funcionan con café. Cafeterías independientes, espresso para llevar y panaderías con buen café están a pocos minutos entre sí. Aquí es donde la gente del pueblo toma el suyo, con horarios para saber quién abre temprano.",
    },
  },
  {
    slug: "mexican-food",
    query: "mexican",
    aliases: ["mexican food", "comida mexicana", "burrito", "burritos", "carnitas"],
    kind: "businesses",
    category: "food-drink",
    title: { en: "Mexican Food in Lompoc", es: "Comida mexicana en Lompoc" },
    intro: {
      en: "Mexican food is the heart of eating out in Lompoc: family restaurants, taquerías, panaderías, and markets with a hot counter. This page gathers the places in town that make it, so you can compare hours and deals in one look.",
      es: "La comida mexicana es el corazón de salir a comer en Lompoc: restaurantes familiares, taquerías, panaderías y mercados con comida caliente. Esta página reúne los lugares del pueblo que la preparan, para comparar horarios y ofertas de un vistazo.",
    },
  },
  {
    slug: "asian-food",
    query: "asian",
    aliases: ["asian food", "thai", "chinese", "sushi", "japanese", "pho", "vietnamese", "ramen"],
    kind: "businesses",
    category: "food-drink",
    title: { en: "Asian Food in Lompoc", es: "Comida asiática en Lompoc" },
    intro: {
      en: "Thai curry, sushi, noodle bowls, and Chinese takeout are all here in Lompoc, most of them family-run and a short drive from anywhere in town. These are the Asian restaurants locals search for, with hours and current specials.",
      es: "Curry tailandés, sushi, tazones de fideos y comida china para llevar están aquí en Lompoc, casi todos negocios familiares a pocos minutos de cualquier punto del pueblo. Estos son los restaurantes asiáticos que la gente busca, con horarios y promociones actuales.",
    },
  },
  {
    slug: "plumbing",
    query: "plumbing",
    aliases: ["plumber", "plumbers", "plomero", "plomería", "water heater", "drain"],
    kind: "businesses",
    category: "services",
    title: { en: "Plumbers in Lompoc", es: "Plomeros en Lompoc" },
    intro: {
      en: "Hard water, old pipes, and a water heater that quits on a cold morning: Lompoc keeps its plumbers busy. These are local plumbing companies that serve Lompoc and Vandenberg Village, with phone numbers you can call today.",
      es: "Agua dura, tuberías viejas y un calentador que falla en una mañana fría: Lompoc mantiene ocupados a sus plomeros. Estas son empresas locales de plomería que atienden Lompoc y Vandenberg Village, con teléfonos para llamar hoy mismo.",
    },
  },
  {
    slug: "pest-control",
    query: "pest control",
    aliases: ["pest", "exterminator", "termites", "ants", "control de plagas", "fumigación"],
    kind: "businesses",
    category: "services",
    title: { en: "Pest Control in Lompoc", es: "Control de plagas en Lompoc" },
    intro: {
      en: "Ants after the first rain, termites in older homes, gophers in the yard: pest problems in Lompoc are seasonal and local. Here are the pest control companies that work in town, with contact details so you can get a quote quickly.",
      es: "Hormigas después de la primera lluvia, termitas en casas antiguas, tuzas en el patio: las plagas en Lompoc son cosa de temporada y del lugar. Aquí están las empresas de control de plagas que trabajan en el pueblo, con datos de contacto para pedir cotización rápido.",
    },
  },
  {
    slug: "hair-and-barber",
    query: "barber",
    aliases: ["barbershop", "barber shop", "haircut", "hair salon", "salon", "hair", "barbería", "peluquería", "corte de pelo"],
    kind: "businesses",
    category: "health-beauty",
    title: { en: "Barbers & Hair Salons in Lompoc", es: "Barberías y salones en Lompoc" },
    intro: {
      en: "A good cut in Lompoc is a neighborhood thing: barbershops where the chairs are always full, salons that book out on weekends, and stylists people follow from shop to shop. These are the barbers and hair salons in town, with hours and booking details.",
      es: "Un buen corte en Lompoc es cosa de barrio: barberías con las sillas siempre llenas, salones que se llenan los fines de semana y estilistas que la gente sigue de local en local. Estas son las barberías y salones del pueblo, con horarios y datos para reservar.",
    },
  },
  {
    slug: "auto-repair",
    query: "auto repair",
    aliases: ["mechanic", "mechanics", "auto shop", "car repair", "tires", "tire shop", "smog", "oil change", "mecánico", "taller"],
    kind: "businesses",
    category: "auto",
    title: { en: "Auto Repair in Lompoc", es: "Talleres mecánicos en Lompoc" },
    intro: {
      en: "Between the commute to Vandenberg and trips over the hill, Lompoc cars work hard. These are the local mechanics, tire shops, and smog stations in town, with phone numbers and hours so you can get back on the road.",
      es: "Entre el viaje diario a Vandenberg y las salidas por la carretera, los carros de Lompoc trabajan duro. Estos son los mecánicos, llanteras y centros de smog del pueblo, con teléfonos y horarios para volver al camino.",
    },
  },
  {
    slug: "notary",
    query: "notary",
    aliases: ["notary public", "notario", "notaría", "mobile notary"],
    kind: "businesses",
    category: "services",
    title: { en: "Notary Services in Lompoc", es: "Notarios en Lompoc" },
    intro: {
      en: "Closing on a house, signing a power of attorney, or sending papers abroad usually needs a notary the same day. These are the notary services available in Lompoc, including businesses that offer notarization alongside other services.",
      es: "Cerrar la compra de una casa, firmar un poder o enviar papeles al extranjero casi siempre requiere un notario el mismo día. Estos son los servicios de notario disponibles en Lompoc, incluidos negocios que notarizan junto con otros servicios.",
    },
  },
  {
    slug: "wine-tasting",
    query: "wine",
    aliases: ["wine tasting", "winery", "wineries", "tasting room", "wine ghetto", "vino", "cata de vinos"],
    kind: "businesses",
    category: "wineries",
    title: { en: "Wine Tasting in Lompoc", es: "Cata de vinos en Lompoc" },
    intro: {
      en: "Lompoc's tasting rooms sit in an industrial park locals call the Wine Ghetto, where winemakers pour Sta. Rita Hills Pinot Noir and Chardonnay a few steps from the barrels. These are the wineries and tasting rooms in town, with hours for a weekend afternoon.",
      es: "Las salas de cata de Lompoc están en un parque industrial que la gente llama el Wine Ghetto, donde los productores sirven Pinot Noir y Chardonnay de Sta. Rita Hills a pasos de las barricas. Estas son las vinícolas y salas de cata del pueblo, con horarios para una tarde de fin de semana.",
    },
  },
  {
    slug: "things-to-do-tonight",
    query: "tonight",
    aliases: ["things to do", "things to do tonight", "tonight", "what to do", "events tonight", "this weekend", "qué hacer", "esta noche"],
    kind: "events",
    title: { en: "Things to Do in Lompoc Tonight", es: "Qué hacer en Lompoc esta noche" },
    intro: {
      en: "Live music, a home game, a gallery opening, a rocket launch you can watch from the driveway: something is usually happening in Lompoc tonight. This page lists what is on this week, pulled from the same calendar as This Week, and it updates on its own.",
      es: "Música en vivo, un partido en casa, una inauguración en la galería, un lanzamiento de cohete que se ve desde la entrada de la casa: casi siempre hay algo en Lompoc esta noche. Esta página muestra lo que hay esta semana, del mismo calendario que Esta semana, y se actualiza sola.",
    },
  },
  {
    slug: "waxing",
    query: "waxing",
    aliases: ["wax", "brazilian wax", "eyebrow waxing", "body waxing", "depilación", "cera"],
    kind: "businesses",
    exclude: ["franks-mobile-detailing", "jeffrey-s-mobile-detailing", "lompoc-car-wash-detail"],
    category: "health-beauty",
    title: { en: "Waxing in Lompoc", es: "Depilación con cera en Lompoc" },
    intro: {
      en: "Brows, lips, legs, or a full body wax before a trip: Lompoc has estheticians and salons that book by appointment and take walk-ins when the chair is free. These are the local places that offer waxing, with hours and phone numbers so you can check availability before you drive over.",
      es: "Cejas, labio, piernas o cuerpo completo antes de un viaje: en Lompoc hay esteticistas y salones que atienden con cita y reciben sin cita cuando hay espacio. Estos son los lugares locales que ofrecen depilación con cera, con horarios y teléfonos para confirmar antes de ir.",
    },
  },
  {
    slug: "window-replacement",
    query: "windows glass",
    aliases: ["window replacement", "window replacements", "windows", "glass", "window repair", "glass repair", "ventanas", "vidrios"],
    kind: "businesses",
    category: "services",
    exclude: ["valley-autoglass", "kaizen-collision-center"],
    title: { en: "Window Replacement in Lompoc", es: "Reemplazo de ventanas en Lompoc" },
    intro: {
      en: "Fog between the panes, a cracked slider, or single-pane windows that let the Lompoc wind straight in: replacing them is one of the few home projects that pays back on the utility bill. These are the local glass and window companies that measure, replace, and repair, with numbers to call for a quote.",
      es: "Vaho entre los vidrios, una corredera rota o ventanas de un solo panel que dejan pasar el viento de Lompoc: cambiarlas es de los pocos proyectos de casa que se recuperan en la factura de luz. Estas son las empresas locales de vidrio y ventanas que miden, reemplazan y reparan, con teléfonos para pedir presupuesto.",
    },
  },
  {
    slug: "charcuterie",
    query: "charcuterie cheese board",
    aliases: ["charcuterie board", "charcuterie boards", "cheese board", "grazing board", "grazing table", "tabla de quesos", "tabla de embutidos"],
    kind: "businesses",
    category: "food-drink",
    include: ["cat-s-market-deli", "spencers-fresh-market-lompoc", "vons-lompoc"],
    title: { en: "Charcuterie Boards in Lompoc", es: "Tablas de quesos y embutidos en Lompoc" },
    intro: {
      en: "A wine night in the Wine Ghetto, a baby shower, a game-day spread: charcuterie has become the Lompoc way to feed a crowd without cooking. These are the local makers, markets, and shops where you can order a board or pick up the cheeses and cured meats to build your own.",
      es: "Una noche de vino en el Wine Ghetto, un baby shower, una tarde de partido: la tabla de quesos y embutidos se volvió la forma lompocana de alimentar a un grupo sin cocinar. Estos son los negocios locales donde puedes encargar una tabla o comprar los quesos y embutidos para armar la tuya.",
    },
  },
  {
    slug: "rocket-launch",
    query: "rocket launch",
    aliases: ["rocket launch", "rocket launches", "launch", "launches", "vandenberg launch", "spacex", "falcon 9", "starlink", "lanzamiento", "lanzamiento de cohete", "cohete"],
    kind: "events",
    eventSource: "launch-library",
    eventWindowDays: 60,
    title: { en: "Rocket Launches from Vandenberg", es: "Lanzamientos de cohetes desde Vandenberg" },
    intro: {
      en: "Lompoc is the closest town to Vandenberg Space Force Base, which is why a rumble in the evening usually means a Falcon 9 heading to orbit. This page lists the upcoming launches on the calendar with their current windows. Times shift often, so check back the day of and step outside a few minutes early.",
      es: "Lompoc es el pueblo más cercano a la Base de la Fuerza Espacial Vandenberg, por eso un retumbo en la tarde casi siempre es un Falcon 9 rumbo a órbita. Esta página muestra los próximos lanzamientos del calendario con sus ventanas actuales. Los horarios cambian seguido, así que revisa el mismo día y sal unos minutos antes.",
    },
  },
]

export function findTermBySlug(slug: string): FindTerm | undefined {
  return FIND_TERMS.find((t) => t.slug === slug)
}

/** Match a raw search query to a curated page (slug, query, or alias — case/whitespace-blind). */
export function findTermForQuery(q: string | null | undefined): FindTerm | undefined {
  const n = (q ?? "").toLowerCase().replace(/\s+/g, " ").trim()
  if (n.length < 2) return undefined
  return FIND_TERMS.find(
    (t) => t.slug === n || t.query === n || t.aliases.includes(n) || t.slug.replace(/-/g, " ") === n
  )
}
