/**
 * Spanish copy for every entry in the Things to Do directory.
 *
 * These are written translations, not machine output — the English is locals-first and
 * conversational, and the Spanish has to land the same way for the roughly half of Lompoc
 * that reads it. Where an English idiom doesn't carry ("the town's living room"), the
 * Spanish says the thing the idiom meant rather than the words it used.
 *
 * Terms deliberately left in English: place names (Surf Beach, Old Town, Wine Ghetto,
 * Lookout Point, H Street), because that's what they're called here in both languages.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/translate-activities-es.ts
 */
import { db } from "@/db/client"
import { activities } from "@/db/schema"
import { eq } from "drizzle-orm"

type Es = { seasonalityEs: string; descriptionEs: string; tipsEs: string }

const ES: Record<string, Es> = {
  // ─────────────────────────── wave 2 ───────────────────────────
  "surf-beach": {
    seasonalityEs: "Todo el año · secciones cerradas de marzo a septiembre",
    descriptionEs:
      "Maneja al oeste por Ocean Avenue hasta que se acaba el camino y llegas a Surf Beach — el océano más cercano a casi todas las casas de Lompoc, como a doce millas del centro. No hay malecón ni puesto de comida. Hay un estacionamiento, unas vías de tren y un tramo largo de costa abierta del Pacífico que la mayoría de los visitantes de la Costa Central nunca encuentra.\n\nLa playa está en terreno de la Base Vandenberg, y por eso se ve así: sin desarrollar, azotada por el viento y casi siempre vacía. La estación Surf de Amtrak está justo en el estacionamiento, y los trenes todavía paran aquí.\n\nEl chorlito nevado anida en las dunas, así que cada año se cierran secciones de la playa del 1 de marzo al 30 de septiembre para protegerlo. El tramo abierto sigue abierto, pero los límites cambian — y sí los hacen valer.",
    tipsEs:
      "Revisa los límites de cierre por los chorlitos antes de ir; cambian de año en año y las multas son reales. El horario es solo de día — la reja cierra al atardecer. El agua está fría y las corrientes de resaca son fuertes, así que esta es una playa para caminar y mirar mucho más que para nadar. Lleva chamarra aunque sea agosto.",
  },
  "ocean-beach-county-park": {
    seasonalityEs: "Todo el año · mejor para aves en invierno y primavera",
    descriptionEs:
      "Donde el río Santa Ynez por fin llega al Pacífico, el condado tiene un parque pequeño por el que casi todos en el pueblo han pasado sin parar. Es la última desviación antes de Surf Beach, y es el mejor lugar si lo que buscas es tranquilidad.\n\nUn andador de madera cruza el humedal hasta un mirador techado sobre la laguna — y esa es la razón por la que los observadores de aves manejan hasta acá. Garzas, garcetas, pelícanos y aves playeras migratorias trabajan la desembocadura del río, con el viejo puente del ferrocarril de fondo y la planta de hielo floreando en las dunas en primavera.\n\nHay mesas de picnic, baños y una caminata corta hasta la arena. Los días en que el viento está insoportable en Surf, aquí junto al río casi siempre está más calmado.",
    tipsEs:
      "Lleva binoculares — la laguna es todo el punto. En el lado de la playa aplican las mismas reglas de los chorlitos. Es un buen paseo de bajo esfuerzo con niños: poco camino desde el carro, mesas para comer y suficientes aves para mantenerlos entretenidos.",
  },
  "miguelito-park": {
    seasonalityEs: "Todo el año · mejor en primavera y otoño",
    descriptionEs:
      "Sal del pueblo hacia el sur por el cañón Miguelito y la neblina se levanta, los robles se cierran encima de ti, y estás en un Lompoc completamente distinto al de H Street.\n\nMiguelito es el de la sombra. Robles grandes, áreas de picnic para grupos que puedes reservar, un juegos infantiles y senderos que suben por las paredes del cañón. Es el parque que las familias apartan para cumpleaños y reuniones, y en una tarde calurosa se siente diez grados más fresco bajo los árboles que en el centro.\n\nEstá como a diez minutos del centro del pueblo, lo cual lo pone justo en la categoría de lugares a los que los locales piensan ir y de alguna manera nunca van.",
    tipsEs:
      "Las áreas para grupos se reservan con los Parques del Condado de Santa Barbara — hacer picnic en cualquier otro lado es libre. Los senderos de arriba se ponen empinados rápido; ponte buenos zapatos si vas más allá del circuito de picnic. La señal de celular se pierde en el cañón.",
  },
  "ryon-park": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "Ryon Park es donde el pueblo se junta. Campos de pelota, juegos infantiles, árboles grandes con sombra y un pasto amplio que ha visto más eventos de Lompoc de los que alguien podría enumerar — festivales, conciertos, torneos, y ese tipo de sábado en el que llegas con un balón y te quedas cuatro horas.\n\nEstá justo sobre West Ocean, a poca distancia de Old Town, y es la respuesta automática cuando alguien pregunta a dónde llevar a los niños sin tener un plan.\n\nSi llevas tiempo viviendo aquí, tienes un recuerdo en este parque. Si acabas de llegar, este es el primero que hay que aprenderse.",
    tipsEs:
      "Revisa el calendario de eventos de la ciudad antes de ir un fin de semana — cuando hay algo grande apartado, el pasto y el estacionamiento se llenan temprano. Los juegos están mejor en la mañana, antes de que empiece el viento de la tarde.",
  },
  "ken-adam-park": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "Un parque de barrio en el lado norte, con pasto abierto, juegos infantiles bajo robles enormes y suficiente espacio para de verdad correr — de esos parques que usas un martes en vez de planear una salida.\n\nTambién tiene un memorial a los astronautas, lo cual dice todo sobre dónde vives: un parque residencial tranquilo, y un monumento a gente que fue al espacio, a diez minutos de la base que los mandó.\n\nEs más tranquilo que Ryon y menos lejos que Miguelito, así que es la opción práctica para una hora después de la escuela o una caminata que tiene que ser corta. No aparece en casi ninguna guía turística de Lompoc — que es exactamente por lo que está aquí.",
    tipsEs:
      "Buena opción cuando Ryon Park está apartado por un evento. Lleva tu propia sombra — el pasto abierto queda expuesto en cuanto el sol de la tarde pasa los árboles.",
  },
  "beattie-park": {
    seasonalityEs: "Todo el año · mejor al atardecer",
    descriptionEs:
      "Cincuenta acres en la orilla sureste del pueblo, recargados contra las lomas — Beattie es el parque más grande de Lompoc y el que tiene la vista.\n\nAbajo es un parque comunitario completo: juegos infantiles, dos canchas de básquetbol con luz, un campo de fútbol, herraduras, un campo de disc golf y áreas de picnic para grupos. Subiendo la loma hay una reserva de bosque urbano con un sendero de acondicionamiento que serpentea hasta Lookout Point, el punto más alto del parque.\n\nLa subida está lo suficientemente empinada para contar como ejercicio, y lo que te encuentras arriba es todo el Valle de Lompoc extendido abajo — y en un día de verdad despejado, el Pacífico.",
    tipsEs:
      "Sube a Lookout Point como una hora antes del atardecer; la subida es corta pero empinada, así que lleva agua. El campo de disc golf es gratis y casi nunca está lleno entre semana por la tarde. Las áreas de picnic para grupos se reservan con la ciudad.",
  },
  "burton-mesa-ecological-reserve": {
    seasonalityEs: "Todo el año · flores silvestres en primavera",
    descriptionEs:
      "Entre Lompoc y Vandenberg Village hay varios miles de acres de chaparral protegido — suelo arenoso, robles bajos y torcidos, manzanita, y una red de senderos que casi nadie fuera de los barrios vecinos usa.\n\nEl chaparral de Burton Mesa es una comunidad vegetal rara que crece en muy pocos lugares del planeta, y esta reserva existe justamente para protegerla. En la práctica eso significa caminar tranquilo y bastante plano por un bosque bajo y denso, con alguna que otra abertura hacia una vista amplia.\n\nLa administra el Departamento de Pesca y Vida Silvestre de California, así que está sin desarrollar a propósito: no hay baños ni casetas, solo entradas de sendero desde las calles de alrededor.",
    tipsEs:
      "Las entradas a los senderos no están señalizadas y es fácil pasarlas — busca los espacios para estacionarse en las calles del lado de Vandenberg Village. Ponte pantalón largo; en partes la maleza está muy cerca. La primavera es lo mejor, cuando los claros arenosos se llenan de flores silvestres.",
  },
  "point-sal": {
    seasonalityEs: "Todo el año · evítalo después de lluvias fuertes",
    descriptionEs:
      "Point Sal es la costa más impresionante de esta parte de California y una de las más difíciles de alcanzar — que es justamente la razón por la que todavía se ve así.\n\nEl camino que alguna vez llevaba carros hasta los acantilados se lavó hace décadas y nunca lo reconstruyeron. Lo que queda es una caminata larga por el viejo trazo desde el lado de Brown Road, subiendo una cresta antes de bajar hacia el océano, con acantilados altos, farallones y una playa que casi siempre está vacía cuando por fin llegas.\n\nEsto es una salida seria, no un día de campo. Cuenta con casi todo el día, carga todo lo que vayas a necesitar, y trata la cresta y las orillas de los acantilados con respeto.",
    tipsEs:
      "El acceso y las condiciones cambian — revisa cómo está antes de comprometerte al viaje, y nunca te estaciones donde los señalamientos lo prohíban. No hay agua, no hay sombra en la cresta, y no hay señal de celular en casi todo el trayecto. Sáltatelo por completo después de lluvias fuertes, cuando el sendero se vuelve de verdad peligroso.",
  },
  "cypress-gallery": {
    seasonalityEs: "Todo el año · exposición nueva casi cada mes",
    descriptionEs:
      "Sede de la Lompoc Valley Art Association, la Cypress Gallery lleva décadas exhibiendo obra local en Old Town — pintura, fotografía, cerámica y técnicas mixtas de artistas que viven aquí.\n\nLas exposiciones cambian más o menos cada mes, la entrada es gratis, y las personas en el mostrador normalmente son los mismos artistas. Esa es la diferencia entre esto y un museo: aquí le puedes preguntar a quien hizo la pieza qué estaba pensando.\n\nEs una parada de quince minutos que cambia cada pocas semanas, lo cual la hace uno de los hábitos más fáciles de agarrar en Old Town.",
    tipsEs:
      "Las inauguraciones son el mejor momento para ir — es cuando están todos los artistas. Consulta nuestro calendario de eventos para ver la exposición actual; publicamos las de Cypress Gallery conforme van corriendo. Está a una cuadra de H Street, así que combínala con la comida o con el recorrido de murales.",
  },
  "lompoc-theatre": {
    seasonalityEs: "Todo el año · vista exterior",
    descriptionEs:
      "El Lompoc Theatre abrió en H Street en 1927 — escenario de vodevil, sala de cine, el centro de una noche en el centro — y después pasó décadas a oscuras mientras el pueblo cambiaba a su alrededor. La marquesina todavía dice est. 1927, y es lo más fotografiado de Old Town.\n\nEl edificio sigue ahí, y un esfuerzo comunitario lo ha ido rescatando poco a poco: estabilizando la estructura, restaurando la fachada, juntando dinero por partes para reabrirlo como un recinto en funciones. El interior está en obra negra — ladrillo expuesto, techo descubierto, andamios — y el grupo detrás de la restauración lo abre para eventos con suficiente frecuencia como para que estar adentro sea una posibilidad real, no un algún día.\n\nEs uno de los pocos edificios de verdad históricos que quedan en la calle, y vale los cinco minutos en cualquier caminata por Old Town.",
    tipsEs:
      "El acceso al interior depende de lo que esté programado — busca casas abiertas y eventos para recaudar fondos en vez de llegar esperando entrar; los publicamos en el calendario de eventos conforme se anuncian. La fachada se fotografía mejor por la tarde, cuando la luz baja por H Street.",
  },
  "lompoc-aquatic-center": {
    seasonalityEs: "Todo el año · bajo techo",
    descriptionEs:
      "Una alberca municipal bajo techo, lo cual en un pueblo con esta cantidad de neblina y viento es más importante de lo que suena. Aquí funcionan todo el año el nado libre, las clases, la natación recreativa y las clases de ejercicio en el agua.\n\nEs la respuesta confiable para un sábado gris de Lompoc con niños que necesitan quemar energía, y es donde la mayoría de los niños de aquí de verdad aprenden a nadar.\n\nLos horarios cambian por temporada y por programa, así que conviene checar rápido antes de manejar hasta allá.",
    tipsEs:
      "El nado recreativo, el nado de carriles y las clases van en horarios distintos — confirma el horario actual con la ciudad antes de ir. Las mañanas entre semana son las más tranquilas. Lleva tu propia toalla y candado.",
  },
  "la-purisima-golf-course": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "Un campo público de nivel campeonato trazado sobre las lomas al este del pueblo por la carretera 246, y una de las cosas por las que Lompoc de verdad se conoce fuera de Lompoc — hay golfistas de toda la Costa Central que manejan hasta acá específicamente por él.\n\nTiene fama de difícil. Largo, expuesto y muy afectado por el viento, con cambios de elevación que hacen que escoger el palo sea una decisión de verdad. No es un campo de resort y no pretende serlo.\n\nPara los locales, el punto es que un campo de esta calidad está a quince minutos de tu casa y abierto a cualquiera que aparte un horario.",
    tipsEs:
      "El viento es el factor que define todo — las rondas de la mañana se juegan bastante más fácil que las de la tarde. Aparta con anticipación los fines de semana. Se puede caminar, pero los cambios de elevación hacen que el carrito sea la opción popular.",
  },
  "skydiving-lompoc": {
    seasonalityEs: "Todo el año · depende del clima",
    descriptionEs:
      "El paracaidismo tándem sale del aeropuerto de Lompoc, lo que significa que la vista de bajada es la que ya conoces desde el suelo — el valle, los campos de flores, la costa, y en un día despejado las Islas del Canal ahí en el horizonte.\n\nQuienes se lanzan por primera vez van amarrados a un instructor después de una explicación corta, así que no hay curso que terminar antes. Es por mucho lo más caro de esta lista, y de lo que la gente habla durante años.\n\nTambién es el dato más raro de nuestro pequeño aeropuerto: puedes pasar por ahí todos los días durante diez años sin enterarte de que hay gente saliendo de aviones justo encima.",
    tipsEs:
      "Aparta con anticipación y cuenta con esperas por clima — la neblina y el viento de la costa mueven los saltos más seguido aquí que tierra adentro. Los horarios de la mañana suelen ser los más confiables. Confirma directamente con quien opere los precios, los límites de peso y las condiciones actuales.",
  },
  "sta-rita-hills-wine-trail": {
    seasonalityEs: "Todo el año · vendimia en otoño",
    descriptionEs:
      "Al este del pueblo, entre Lompoc y Buellton, dos caminos corren paralelos por las Sta. Rita Hills — la carretera 246 por el lado norte y Santa Rosa Road por el sur. Entre los dos está una de las regiones vitícolas de clima frío más respetadas de Estados Unidos.\n\nEl viento y la neblina que traen gris a Lompoc son exactamente la razón por la que la fruta de aquí es como es. El Pinot Noir y el Chardonnay de estas lomas terminan en botellas que se venden en todo el país, y varias de esas fincas tienen salas de cata a menos de veinte minutos del centro.\n\nEsta es la contraparte del Wine Ghetto: el Ghetto son bodegas dentro del pueblo donde te estacionas una vez y caminas, y el Trail es el recorrido en carro entre los viñedos mismos.",
    tipsEs:
      "Hazlo en circuito — te vas por un camino y regresas por el otro — en vez de devolverte por donde llegaste. Casi todas las salas de cata de finca piden reservación, sobre todo los fines de semana. La vendimia, más o menos de finales de agosto a octubre, es la temporada más interesante para andar por ahí y también la más llena.",
  },
  "lompoc-taco-trail": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "La historia de comida más conocida de Lompoc no es un restaurante, es una ruta. Una docena de taquerías, marisquerías y food trucks repartidos por el pueblo — H Street, Ocean, A Street, Laurel — cada uno con algo que hace mejor que los demás.\n\nAlgunos son de sentarse, otros son una ventanita, uno es una troca que se mueve. Hay negocios aquí que son familiares desde principios de los noventa, y menús con diecisiete tipos de taco, incluyendo ribeye y pancita de puerco. Mariscos estilo Sinaloa, birria, camarón empanizado, huachinango frito.\n\nEsto no se hace en un día. Se hace una parada a la vez, durante meses, y terminas con opiniones que vas a defender.",
    tipsEs:
      "Escoge una parada nueva por semana en vez de intentar recorrer toda la lista — el punto es encontrar tu lugar de siempre, no terminar una tarea. En varios el efectivo sigue siendo más rápido que la tarjeta. Ve con hambre y pide lo que pida la persona detrás de ti.",
  },

  // ─────────────────────────── the original ten ───────────────────────────
  "la-purisima-mission": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "Una de las misiones de California mejor conservadas, La Purísima ofrece recorridos autoguiados por edificios completamente restaurados, jardines y corrales. Caminas por donde el pueblo chumash y los misioneros españoles vivieron y trabajaron a principios del siglo XIX.",
    tipsEs:
      "Llega temprano los fines de semana para evitar la gente. Ponte zapatos cómodos para los caminos de tierra. Se permiten perros con correa en los senderos, fuera de los edificios.",
  },
  "jalama-beach": {
    seasonalityEs: "Todo el año (mejor de primavera a otoño)",
    descriptionEs:
      "Una de las playas más remotas y bonitas de la Costa Central. Jalama Beach está al final de un camino sinuoso de quince millas, y es conocida por sus olas, sus pozas de marea, sus atardeceres increíbles y la famosa Jalama Burger de la tienda del campamento.",
    tipsEs:
      "Se paga cuota de uso diurno. La Jalama Burger de la tienda del campamento es legendaria — no te la saltes. Lleva ropa en capas; el viento de la costa puede estar durísimo incluso en verano.",
  },
  "lompoc-wine-ghetto": {
    seasonalityEs: "Todo el año (jue–dom)",
    descriptionEs:
      "El Lompoc Wine Ghetto es un conjunto de salas de cata de vinícolas pequeñas metidas en un parque industrial cerca del centro. Aquí pruebas pinot noir, chardonnay y syrah del condado de Santa Barbara en un ambiente casual, sin pretensiones y sin el precio de Napa.",
    tipsEs:
      "La mayoría de las salas de cata abren de jueves a domingo. Camina entre ellas — están todas a unos minutos una de otra. Revisa el sitio de cada vinícola para los horarios.",
  },
  "lompoc-murals-tour": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "Lompoc tiene más de setenta murales de gran formato pintados directamente sobre los edificios del centro. Entre historia local, cultura chumash, agricultura y vida cotidiana, los murales convierten al pueblo entero en una galería al aire libre.",
    tipsEs:
      "Los mapas del recorrido autoguiado son gratis y están en el Lompoc Museum. La caminata cubre como milla y media por el centro. Lleva cámara — en cada cuadra hay algo nuevo.",
  },
  "lompoc-flower-fields": {
    seasonalityEs: "Primavera (mayo–junio)",
    descriptionEs:
      "Lompoc es la capital mundial de la semilla de flor. Cada primavera, miles de acres estallan en franjas de color — espuela de caballero, minutisa y statice hasta donde alcanza la vista. Maneja la ruta del mapa de las flores o párate en un campo a tomar fotos.",
    tipsEs:
      "El punto más alto de floración va de finales de mayo a junio. El mapa de la Ruta de las Flores es gratis en la Cámara de Comercio del Valle de Lompoc. La luz de la mañana temprano es la mejor para fotos.",
  },
  "santa-ynez-river-trail": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "El río Santa Ynez corre justo al norte del pueblo y ofrece millas de senderos fáciles para caminar y andar en bici entre vegetación de ribera. Busca halcones, garzas y venados junto a la orilla. Perfecto para familias y para perros con correa.",
    tipsEs:
      "Mejor en primavera y otoño, cuando lleva agua. Lleva bloqueador — casi no hay sombra en el sendero. El parque tiene mesas de picnic y juegos infantiles.",
  },
  "vandenberg-launches": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "La Base Vandenberg lanza cohetes todo el año, y en noches despejadas se ven las estelas y las llamas desde todo el valle. Los lanzamientos grandes juntan gente en puntos de observación por todo el pueblo. Consulta las redes locales para los horarios.",
    tipsEs:
      "Los civiles no tienen acceso a la base. Buenos lugares para ver: el puente de Ocean Ave, Harris Grade Road y el centro de Lompoc. Nosotros publicamos cada lanzamiento en el calendario de eventos.",
  },
  "lompoc-museum": {
    seasonalityEs: "Todo el año (mar–dom)",
    descriptionEs:
      "El Lompoc Museum recorre la historia natural y cultural del Valle de Lompoc, desde objetos chumash y las primeras casas de colonos hasta la era de pruebas de misiles de la Guerra Fría en Vandenberg. Una gran parada para un día lluvioso.",
    tipsEs:
      "La entrada es por donativo. Cierra los lunes. Aquí puedes recoger el mapa del recorrido de murales. Calcula de 45 a 60 minutos para verlo completo.",
  },
  "centennial-park": {
    seasonalityEs: "Todo el año",
    descriptionEs:
      "Un punto de reunión muy querido, con pasto verde, áreas de picnic, campo de disc golf y uno de los mejores skate parks gratuitos de la Costa Central. Aquí se hace la serie de conciertos de verano de Lompoc y varios eventos comunitarios.",
    tipsEs:
      "Entrada gratis. La serie de conciertos de verano va de junio a agosto los viernes por la tarde. Lleva cobija y algo de comer. El estacionamiento es gratis.",
  },
  "harris-grade-road": {
    seasonalityEs: "Todo el año (mejor en primavera)",
    descriptionEs:
      "Un camino de terracería asfaltada de diez millas que conecta Lompoc con la 101 pasando por lomas y bosque de roble. En temporada de flores silvestres las laderas se cubren de amapolas y lupinos. Fíjate en los halcones y en algún venado cruzando.",
    tipsEs:
      "Es de dos carriles — maneja despacio y cuidado con los ciclistas. Lo mejor es la primavera por las flores. También es uno de los mejores puntos para ver lanzamientos en noches despejadas.",
  },
}

async function main() {
  const rows = await db
    .select({ id: activities.id, slug: activities.slug })
    .from(activities)

  let done = 0
  const missing: string[] = []

  for (const row of rows) {
    const es = ES[row.slug]
    if (!es) {
      missing.push(row.slug)
      continue
    }
    await db
      .update(activities)
      .set({ ...es, updatedAt: new Date() })
      .where(eq(activities.id, row.id))
    done++
    console.log(`ok    ${row.slug}`)
  }

  console.log(`\ntranslated ${done}/${rows.length}`)
  if (missing.length) console.log(`no Spanish copy yet: ${missing.join(", ")}`)
}

main().then(() => process.exit(0))
