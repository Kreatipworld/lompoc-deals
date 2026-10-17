import type { FaqItem } from "@/components/faq-section"

/**
 * Per-category intro + FAQ for /category/<slug>. Keys mirror CATEGORY_SLUGS in
 * lib/category-label.ts. Every category page used to share one template sentence,
 * which is why they averaged position ~30: this gives each one its own words.
 *
 * Rules for this copy: facts only, no business claims, no verdict words
 * (best/top/#1), never "explore"/"discover" (or explora/descubre), never "free",
 * no alcohol promotion (food-drink leads with food). Links point at pages that
 * exist: /find/<slug> from lib/find-terms.ts, /map, /deals, /events, /homes.
 */

type Copy = { intro: string; faqs: FaqItem[] }
type CategoryCopy = { en: Copy; es: Copy }

export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  auto: {
    en: {
      intro:
        "Auto lists the Lompoc shops that keep cars and trucks on the road: repair and maintenance, tires, smog checks, glass, body work and detailing. Each listing shows the address, phone and hours the business keeps, and any active auto deals appear below the list.",
      faqs: [
        {
          q: "Where can I get my car repaired in Lompoc?",
          a: "The repair shops in this category handle everything from oil changes and brakes to engine work. The Auto Repair in Lompoc page narrows the list to shops whose listings mention repair work.",
          links: [{ href: "/find/auto-repair", label: "Auto Repair in Lompoc" }],
        },
        {
          q: "Are there auto service deals in Lompoc right now?",
          a: "Active deals from auto businesses show at the bottom of this page. Every current deal in town, across all categories, is on the Deals page.",
          links: [{ href: "/deals", label: "Lompoc deals" }],
        },
        {
          q: "How do I find an auto shop near me?",
          a: "The map pins every Lompoc business with a street address, so you can see which shops are closest to home or work before you call.",
          links: [{ href: "/map", label: "Lompoc map" }],
        },
      ],
    },
    es: {
      intro:
        "Autos reúne los talleres de Lompoc que mantienen carros y camionetas en el camino: reparación y mantenimiento, llantas, smog, vidrios, hojalatería y detallado. Cada ficha muestra la dirección, el teléfono y el horario del negocio, y las ofertas activas de autos aparecen debajo de la lista.",
      faqs: [
        {
          q: "¿Dónde puedo reparar mi carro en Lompoc?",
          a: "Los talleres de esta categoría atienden desde cambios de aceite y frenos hasta trabajos de motor. La página Reparación de autos en Lompoc muestra solo los talleres cuyas fichas mencionan reparaciones.",
          links: [{ href: "/find/auto-repair", label: "Reparación de autos en Lompoc" }],
        },
        {
          q: "¿Hay ofertas de servicio para autos en Lompoc ahora?",
          a: "Las ofertas activas de negocios de autos aparecen al final de esta página. Todas las ofertas vigentes del pueblo, de todas las categorías, están en la página de Ofertas.",
          links: [{ href: "/deals", label: "Ofertas en Lompoc" }],
        },
        {
          q: "¿Cómo encuentro un taller cerca de mí?",
          a: "El mapa marca cada negocio de Lompoc con dirección, así puedes ver qué talleres quedan más cerca de tu casa o trabajo antes de llamar.",
          links: [{ href: "/map", label: "Mapa de Lompoc" }],
        },
      ],
    },
  },

  construction: {
    en: {
      intro:
        "Construction covers the Lompoc contractors and trades that build, repair and finish homes and businesses: general contractors, plumbers, electricians, painters, roofers, landscapers, window installers and more. Many of them work on site rather than from a storefront, so their listings lead with a phone number and service area.",
      faqs: [
        {
          q: "How do I find a plumber in Lompoc?",
          a: "Plumbers in Lompoc are listed on their own page, with phone numbers and the services each one lists.",
          links: [{ href: "/find/plumbing", label: "Plumbers in Lompoc" }],
        },
        {
          q: "Who does electrical work in Lompoc?",
          a: "The Electricians in Lompoc page lists the local electrical contractors. Before hiring any contractor, ask for their license number and look it up with the California Contractors State License Board.",
          links: [{ href: "/find/electrician", label: "Electricians in Lompoc" }],
        },
        {
          q: "Where can I get windows replaced in Lompoc?",
          a: "Window replacement businesses that serve Lompoc have their own page, separate from general contractors, so you can compare the ones that do this work.",
          links: [{ href: "/find/window-replacement", label: "Window Replacement in Lompoc" }],
        },
      ],
    },
    es: {
      intro:
        "Construcción reúne a los contratistas y oficios de Lompoc que construyen, reparan y terminan casas y negocios: contratistas generales, plomeros, electricistas, pintores, techadores, jardineros, instaladores de ventanas y más. Muchos trabajan en sitio y no tienen local, así que sus fichas empiezan con el teléfono y la zona que atienden.",
      faqs: [
        {
          q: "¿Cómo encuentro un plomero en Lompoc?",
          a: "Los plomeros de Lompoc tienen su propia página, con teléfonos y los servicios que ofrece cada uno.",
          links: [{ href: "/find/plumbing", label: "Plomeros en Lompoc" }],
        },
        {
          q: "¿Quién hace trabajos eléctricos en Lompoc?",
          a: "La página Electricistas en Lompoc reúne a los contratistas eléctricos locales. Antes de contratar a cualquier contratista, pide su número de licencia y verifícalo con el California Contractors State License Board.",
          links: [{ href: "/find/electrician", label: "Electricistas en Lompoc" }],
        },
        {
          q: "¿Dónde puedo cambiar ventanas en Lompoc?",
          a: "Los negocios de cambio de ventanas que atienden Lompoc tienen su propia página, aparte de los contratistas generales, para comparar a quienes hacen este trabajo.",
          links: [{ href: "/find/window-replacement", label: "Cambio de ventanas en Lompoc" }],
        },
      ],
    },
  },

  entertainment: {
    en: {
      intro:
        "Entertainment gathers the places in Lompoc to spend an evening or a weekend afternoon: theaters, recreation, venues, games and family outings. For dated happenings like concerts, festivals and Vandenberg rocket launches, the events calendar lists what is coming up.",
      faqs: [
        {
          q: "What is there to do in Lompoc tonight?",
          a: "Things to Do in Lompoc Tonight lists the events happening today around town, refreshed every day.",
          links: [{ href: "/find/things-to-do-tonight", label: "Things to do tonight" }],
        },
        {
          q: "Where can I see upcoming Lompoc events?",
          a: "The events page collects upcoming Lompoc events in one list, with a This Weekend section at the top and Vandenberg launches in their own row.",
          links: [{ href: "/events", label: "Lompoc events" }],
        },
        {
          q: "Can I watch a rocket launch from Lompoc?",
          a: "Yes. Launches from Vandenberg Space Force Base are often visible from around town on clear days and nights. The rocket launch page lists the next scheduled launches; times shift often, so check before heading out.",
          links: [{ href: "/find/rocket-launch", label: "Vandenberg rocket launches" }],
        },
      ],
    },
    es: {
      intro:
        "Entretenimiento reúne los lugares de Lompoc para pasar una tarde o un fin de semana: teatros, recreación, salones, juegos y salidas en familia. Para lo que tiene fecha, como conciertos, festivales y lanzamientos de cohetes de Vandenberg, el calendario de eventos muestra lo que viene.",
      faqs: [
        {
          q: "¿Qué hay para hacer en Lompoc esta noche?",
          a: "Qué hacer en Lompoc esta noche muestra los eventos de hoy en el pueblo, y se actualiza todos los días.",
          links: [{ href: "/find/things-to-do-tonight", label: "Qué hacer esta noche" }],
        },
        {
          q: "¿Dónde veo los próximos eventos de Lompoc?",
          a: "La página de eventos reúne los próximos eventos de Lompoc en una sola lista, con una sección de este fin de semana arriba y los lanzamientos de Vandenberg aparte.",
          links: [{ href: "/events", label: "Eventos en Lompoc" }],
        },
        {
          q: "¿Puedo ver un lanzamiento de cohete desde Lompoc?",
          a: "Sí. Los lanzamientos desde la Base de la Fuerza Espacial Vandenberg suelen verse desde el pueblo en días y noches despejados. La página de lanzamientos muestra los próximos programados; los horarios cambian seguido, así que verifica antes de salir.",
          links: [{ href: "/find/rocket-launch", label: "Lanzamientos de Vandenberg" }],
        },
      ],
    },
  },

  "food-drink": {
    en: {
      intro:
        "Food & Drink lists Lompoc's restaurants, taquerías, bakeries, cafés, coffee shops and food trucks, from early breakfast to dinner. Each listing has its hours, address and phone, and the Open now filter above shows who is serving right now.",
      faqs: [
        {
          q: "Where can I get tacos in Lompoc?",
          a: "Taquerías and taco trucks have their own page, and the Mexican Food page covers the wider menu: burritos, tortas, mariscos and more.",
          links: [
            { href: "/find/tacos", label: "Tacos in Lompoc" },
            { href: "/find/mexican-food", label: "Mexican food in Lompoc" },
          ],
        },
        {
          q: "Where can I get breakfast or coffee in Lompoc?",
          a: "The Breakfast page lists the places serving morning meals, and the Coffee page lists the cafés and coffee shops, each with opening hours.",
          links: [
            { href: "/find/breakfast", label: "Breakfast in Lompoc" },
            { href: "/find/coffee", label: "Coffee in Lompoc" },
          ],
        },
        {
          q: "Are there restaurant deals in Lompoc today?",
          a: "Active deals from food businesses appear at the bottom of this page, and every current deal in town is on the Deals page.",
          links: [{ href: "/deals", label: "Lompoc deals" }],
        },
      ],
    },
    es: {
      intro:
        "Comida y bebida reúne los restaurantes, taquerías, panaderías, cafés, cafeterías y food trucks de Lompoc, desde el desayuno temprano hasta la cena. Cada ficha tiene su horario, dirección y teléfono, y el filtro Abierto ahora de arriba muestra quién está atendiendo en este momento.",
      faqs: [
        {
          q: "¿Dónde hay tacos en Lompoc?",
          a: "Las taquerías y los camiones de tacos tienen su propia página, y la de Comida mexicana cubre el resto del menú: burritos, tortas, mariscos y más.",
          links: [
            { href: "/find/tacos", label: "Tacos en Lompoc" },
            { href: "/find/mexican-food", label: "Comida mexicana en Lompoc" },
          ],
        },
        {
          q: "¿Dónde puedo desayunar o tomar café en Lompoc?",
          a: "La página de Desayuno muestra los lugares que sirven por la mañana, y la de Café reúne cafés y cafeterías, cada uno con su horario.",
          links: [
            { href: "/find/breakfast", label: "Desayuno en Lompoc" },
            { href: "/find/coffee", label: "Café en Lompoc" },
          ],
        },
        {
          q: "¿Hay ofertas de restaurantes en Lompoc hoy?",
          a: "Las ofertas activas de negocios de comida aparecen al final de esta página, y todas las ofertas vigentes del pueblo están en la página de Ofertas.",
          links: [{ href: "/deals", label: "Ofertas en Lompoc" }],
        },
      ],
    },
  },

  "health-beauty": {
    en: {
      intro:
        "Health & Beauty lists Lompoc's barbershops, hair and nail salons, waxing and skin studios, spas, fitness and wellness businesses, and health providers. Listings show hours and contact details so you can book directly with the business.",
      faqs: [
        {
          q: "Where can I get a haircut in Lompoc?",
          a: "Barbershops and hair salons share one page, with each shop's hours and phone so you can check for walk-ins or book ahead.",
          links: [{ href: "/find/hair-and-barber", label: "Barbers & hair salons in Lompoc" }],
        },
        {
          q: "Where can I get waxing done in Lompoc?",
          a: "The Waxing page lists the studios and salons in town whose listings include waxing services.",
          links: [{ href: "/find/waxing", label: "Waxing in Lompoc" }],
        },
        {
          q: "Are there beauty or wellness deals right now?",
          a: "Active deals from health and beauty businesses show below the directory on this page, and all current Lompoc deals are on the Deals page.",
          links: [{ href: "/deals", label: "Lompoc deals" }],
        },
      ],
    },
    es: {
      intro:
        "Salud y belleza reúne las barberías, salones de cabello y uñas, estudios de depilación y piel, spas, negocios de ejercicio y bienestar, y proveedores de salud de Lompoc. Las fichas muestran horario y contacto para que hagas tu cita directo con el negocio.",
      faqs: [
        {
          q: "¿Dónde me corto el pelo en Lompoc?",
          a: "Las barberías y los salones de cabello están en una sola página, con el horario y teléfono de cada uno para que preguntes si atienden sin cita o reserves.",
          links: [{ href: "/find/hair-and-barber", label: "Barberías y salones en Lompoc" }],
        },
        {
          q: "¿Dónde puedo hacerme depilación con cera en Lompoc?",
          a: "La página de Depilación reúne los estudios y salones del pueblo cuyas fichas incluyen servicios de cera.",
          links: [{ href: "/find/waxing", label: "Depilación en Lompoc" }],
        },
        {
          q: "¿Hay ofertas de belleza o bienestar ahora?",
          a: "Las ofertas activas de negocios de salud y belleza aparecen debajo del directorio en esta página, y todas las ofertas vigentes de Lompoc están en la página de Ofertas.",
          links: [{ href: "/deals", label: "Ofertas en Lompoc" }],
        },
      ],
    },
  },

  other: {
    en: {
      intro:
        "Other holds the Lompoc businesses and organizations that do not fit neatly into one of the main categories. If a place is not here, the search bar above checks names, descriptions and services across every category at once.",
      faqs: [
        {
          q: "I can't find a business. Where else should I look?",
          a: "The business directory lists every approved Lompoc business by category. Search also matches the words in each listing's description, not just its name.",
          links: [{ href: "/businesses", label: "Lompoc business directory" }],
        },
        {
          q: "Can I see these businesses on a map?",
          a: "Yes. The map shows every Lompoc business with a street address, across all categories.",
          links: [{ href: "/map", label: "Lompoc map" }],
        },
        {
          q: "How do I add my business to Lompoc Locals?",
          a: "Business owners can list their business and manage its profile, hours and deals from the For Businesses page.",
          links: [{ href: "/partners", label: "List your business" }],
        },
      ],
    },
    es: {
      intro:
        "Otros reúne los negocios y organizaciones de Lompoc que no encajan en una de las categorías principales. Si un lugar no está aquí, la barra de búsqueda de arriba revisa nombres, descripciones y servicios en todas las categorías a la vez.",
      faqs: [
        {
          q: "No encuentro un negocio. ¿Dónde más busco?",
          a: "El directorio muestra todos los negocios aprobados de Lompoc por categoría. La búsqueda también revisa las palabras de la descripción de cada ficha, no solo el nombre.",
          links: [{ href: "/businesses", label: "Directorio de negocios de Lompoc" }],
        },
        {
          q: "¿Puedo ver estos negocios en un mapa?",
          a: "Sí. El mapa muestra cada negocio de Lompoc con dirección, de todas las categorías.",
          links: [{ href: "/map", label: "Mapa de Lompoc" }],
        },
        {
          q: "¿Cómo agrego mi negocio a Lompoc Locals?",
          a: "Los dueños pueden publicar su negocio y administrar su perfil, horario y ofertas desde la página Para negocios.",
          links: [{ href: "/partners", label: "Publica tu negocio" }],
        },
      ],
    },
  },

  "real-estate": {
    en: {
      intro:
        "Real Estate brings together Lompoc homes for sale and for rent with the local agents, brokers, property managers and lenders who work around Lompoc and Vandenberg. The tabs above switch between all listings, homes for sale and rentals.",
      faqs: [
        {
          q: "Where can I find rentals in Lompoc?",
          a: "The Rentals page lists the property managers and landlords who rent homes and apartments in Lompoc. The For Rent tab above shows rental listings posted here.",
          links: [{ href: "/find/rentals", label: "Rentals in Lompoc" }],
        },
        {
          q: "How do I find a local real estate agent?",
          a: "The realtors page lists the agents who work Lompoc, each with a profile and contact details, and the homes page shows the listings they post.",
          links: [
            { href: "/realtors", label: "Lompoc realtors" },
            { href: "/homes", label: "Lompoc homes" },
          ],
        },
        {
          q: "Who offers mortgages and home loans in Lompoc?",
          a: "Local lenders and mortgage brokers are listed on the Mortgages page, so you can talk to someone in town before you start shopping.",
          links: [{ href: "/find/mortgage", label: "Mortgages in Lompoc" }],
        },
      ],
    },
    es: {
      intro:
        "Bienes raíces reúne las casas en venta y en renta de Lompoc junto con los agentes, corredores, administradores de propiedades y prestamistas que trabajan en Lompoc y Vandenberg. Las pestañas de arriba cambian entre todas las propiedades, casas en venta y rentas.",
      faqs: [
        {
          q: "¿Dónde encuentro rentas en Lompoc?",
          a: "La página de Rentas muestra a los administradores y propietarios que rentan casas y departamentos en Lompoc. La pestaña En renta de arriba muestra las rentas publicadas aquí.",
          links: [{ href: "/find/rentals", label: "Rentas en Lompoc" }],
        },
        {
          q: "¿Cómo encuentro un agente de bienes raíces local?",
          a: "La página de agentes reúne a quienes trabajan en Lompoc, cada uno con su perfil y contacto, y la página de casas muestra las propiedades que publican.",
          links: [
            { href: "/realtors", label: "Agentes en Lompoc" },
            { href: "/homes", label: "Casas en Lompoc" },
          ],
        },
        {
          q: "¿Quién ofrece hipotecas y préstamos en Lompoc?",
          a: "Los prestamistas y corredores hipotecarios locales están en la página de Hipotecas, para que hables con alguien del pueblo antes de buscar casa.",
          links: [{ href: "/find/mortgage", label: "Hipotecas en Lompoc" }],
        },
      ],
    },
  },

  retail: {
    en: {
      intro:
        "Retail covers Lompoc's shops: clothing and gifts, hardware and home goods, florists, thrift and secondhand stores, specialty markets and more. Any active coupons from these stores are listed below the directory.",
      faqs: [
        {
          q: "Are there store coupons in Lompoc right now?",
          a: "Active retail deals show at the bottom of this page. The Deals page lists every current coupon and special in town.",
          links: [{ href: "/deals", label: "Lompoc deals" }],
        },
        {
          q: "Where can I find garage sales and secondhand items in Lompoc?",
          a: "Lompoc Sales lists garage sales, yard sales and items for sale from people in town, alongside the thrift stores in this category.",
          links: [{ href: "/sales", label: "Lompoc Sales" }],
        },
        {
          q: "How do I see which shops are near downtown?",
          a: "The map pins every Lompoc business with a street address, so you can plan a stop at several shops in one trip.",
          links: [{ href: "/map", label: "Lompoc map" }],
        },
      ],
    },
    es: {
      intro:
        "Tiendas reúne los comercios de Lompoc: ropa y regalos, ferretería y artículos para el hogar, florerías, tiendas de segunda mano, mercados especializados y más. Los cupones activos de estas tiendas aparecen debajo del directorio.",
      faqs: [
        {
          q: "¿Hay cupones de tiendas en Lompoc ahora?",
          a: "Las ofertas activas de tiendas aparecen al final de esta página. La página de Ofertas muestra todos los cupones y especiales vigentes del pueblo.",
          links: [{ href: "/deals", label: "Ofertas en Lompoc" }],
        },
        {
          q: "¿Dónde encuentro ventas de garaje y artículos usados en Lompoc?",
          a: "Lompoc Sales reúne ventas de garaje, ventas de patio y artículos en venta de gente del pueblo, además de las tiendas de segunda mano de esta categoría.",
          links: [{ href: "/sales", label: "Lompoc Sales" }],
        },
        {
          q: "¿Cómo veo qué tiendas quedan cerca del centro?",
          a: "El mapa marca cada negocio de Lompoc con dirección, para que planees pasar a varias tiendas en una sola vuelta.",
          links: [{ href: "/map", label: "Mapa de Lompoc" }],
        },
      ],
    },
  },

  services: {
    en: {
      intro:
        "Services lists the Lompoc businesses you call when something needs doing: pest control, notaries, cleaning, insurance, tax and legal help, moving, repairs and more. Every listing shows how to reach the business directly, by phone, email or website.",
      faqs: [
        {
          q: "Where can I find a notary in Lompoc?",
          a: "The Notary page lists the notaries and businesses in town that offer notary services, with phone numbers and hours.",
          links: [{ href: "/find/notary", label: "Notary services in Lompoc" }],
        },
        {
          q: "Who does pest control in Lompoc?",
          a: "Pest control companies serving Lompoc have their own page, with contact details and the services each one lists.",
          links: [{ href: "/find/pest-control", label: "Pest control in Lompoc" }],
        },
        {
          q: "Why don't some service businesses show an address?",
          a: "Many service businesses work at your home or office instead of a storefront, so their listings show a service area instead of a street address. They are still in the directory and can be reached by phone or email.",
          links: [{ href: "/businesses", label: "Lompoc business directory" }],
        },
      ],
    },
    es: {
      intro:
        "Servicios reúne los negocios de Lompoc a los que llamas cuando algo hay que hacer: control de plagas, notarios, limpieza, seguros, impuestos y ayuda legal, mudanzas, reparaciones y más. Cada ficha muestra cómo contactar al negocio directamente, por teléfono, correo o sitio web.",
      faqs: [
        {
          q: "¿Dónde encuentro un notario en Lompoc?",
          a: "La página de Notarios reúne a los notarios y negocios del pueblo que ofrecen servicios notariales, con teléfono y horario.",
          links: [{ href: "/find/notary", label: "Notarios en Lompoc" }],
        },
        {
          q: "¿Quién hace control de plagas en Lompoc?",
          a: "Las compañías de control de plagas que atienden Lompoc tienen su propia página, con contacto y los servicios que ofrece cada una.",
          links: [{ href: "/find/pest-control", label: "Control de plagas en Lompoc" }],
        },
        {
          q: "¿Por qué algunos negocios de servicios no muestran dirección?",
          a: "Muchos negocios de servicios trabajan en tu casa u oficina y no tienen local, así que sus fichas muestran la zona que atienden en vez de una dirección. Siguen en el directorio y puedes contactarlos por teléfono o correo.",
          links: [{ href: "/businesses", label: "Directorio de negocios de Lompoc" }],
        },
      ],
    },
  },

  wineries: {
    en: {
      intro:
        "Wineries lists the tasting rooms and wine producers in and around Lompoc, including the cluster of tasting rooms on East Chestnut Avenue known as the Lompoc Wine Ghetto and producers working the Sta. Rita Hills. The wineries map on this page pins every location with a street address.",
      faqs: [
        {
          q: "Where are the tasting rooms in Lompoc?",
          a: "Most Lompoc tasting rooms sit close together in the Wine Ghetto on the east side of town, a few minutes' walk apart. The map on this page shows each one.",
          links: [{ href: "/activities/lompoc-wine-ghetto", label: "Lompoc Wine Ghetto" }],
        },
        {
          q: "When are Lompoc tasting rooms open?",
          a: "Hours vary by winery, and many keep shorter weekday schedules, so check each listing's hours before you go. Wine tasting is for guests 21 and older.",
          links: [{ href: "/find/wine-tasting", label: "Wine tasting in Lompoc" }],
        },
        {
          q: "Where can I eat near the wineries?",
          a: "The Food & Drink category lists Lompoc's restaurants, cafés and food trucks with their hours, and the Lunch page narrows it to midday options.",
          links: [
            { href: "/category/food-drink", label: "Food & Drink in Lompoc" },
            { href: "/find/lunch", label: "Lunch in Lompoc" },
          ],
        },
      ],
    },
    es: {
      intro:
        "Vinícolas reúne las salas de cata y productores de vino de Lompoc y sus alrededores, incluido el grupo de salas de cata en East Chestnut Avenue conocido como Lompoc Wine Ghetto y los productores de Sta. Rita Hills. El mapa de vinícolas en esta página marca cada lugar con dirección.",
      faqs: [
        {
          q: "¿Dónde están las salas de cata en Lompoc?",
          a: "La mayoría de las salas de cata de Lompoc están juntas en el Wine Ghetto, al este del pueblo, a unos minutos a pie una de otra. El mapa de esta página muestra cada una.",
          links: [{ href: "/activities/lompoc-wine-ghetto", label: "Lompoc Wine Ghetto" }],
        },
        {
          q: "¿Qué horario tienen las salas de cata de Lompoc?",
          a: "El horario cambia según la vinícola, y muchas abren menos entre semana, así que revisa el horario de cada ficha antes de ir. La cata de vino es solo para mayores de 21 años.",
          links: [{ href: "/find/wine-tasting", label: "Cata de vino en Lompoc" }],
        },
        {
          q: "¿Dónde puedo comer cerca de las vinícolas?",
          a: "La categoría Comida y bebida reúne los restaurantes, cafés y food trucks de Lompoc con su horario, y la página de Almuerzo muestra opciones para el mediodía.",
          links: [
            { href: "/category/food-drink", label: "Comida y bebida en Lompoc" },
            { href: "/find/lunch", label: "Almuerzo en Lompoc" },
          ],
        },
      ],
    },
  },
}

export function categoryCopy(slug: string, locale: string): Copy | null {
  const c = CATEGORY_COPY[slug]
  if (!c) return null
  return locale === "es" ? c.es : c.en
}

export const CATEGORY_FAQ_HEADING = {
  en: (name: string) => `${name} in Lompoc: common questions`,
  es: (name: string) => `${name} en Lompoc: preguntas frecuentes`,
}
