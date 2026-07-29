/**
 * Wave 2 of the "Things to Do" directory — the places Lompoc Locals was missing.
 *
 * Each entry carries its own written content (description, tips, seasonality). Address,
 * coordinates, and photos are resolved from Google Places so nothing here is invented;
 * entries that Places can't verify keep the manual fallback coords declared below.
 *
 * Routes (taco trail, wine trail) have no single Places record by design — they get manual
 * coords and a curated lead image.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/seed-activities-wave2.ts --dry
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/seed-activities-wave2.ts
 */
import { db } from "@/db/client"
import { activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { put } from "@vercel/blob"

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const DRY = process.argv.includes("--dry")
const MAX_PHOTOS = 5
const PHOTO_MAX_WIDTH = 1600
const DELAY_MS = 400

type Seed = {
  slug: string
  title: string
  category: "outdoors" | "history" | "arts" | "food-wine" | "family" | "unique"
  /** Google Places text query. null = route/concept with no single record. */
  placesQuery: string | null
  /** Used when Places can't verify the entry (always used when placesQuery is null). */
  fallback: { address: string; lat: number; lng: number }
  /** Curated lead image for entries Places won't have photos for. */
  fallbackImage?: string
  seasonality: string
  sourceUrl?: string
  description: string
  tips: string
}

const SEEDS: Seed[] = [
  {
    slug: "surf-beach",
    title: "Surf Beach",
    category: "outdoors",
    placesQuery: "Surf Beach Lompoc CA",
    fallback: { address: "Ocean Park Rd, Lompoc, CA 93436", lat: 34.6786, lng: -120.5996 },
    seasonality: "Year-round · sections closed March–September",
    description:
      "Drive west on Ocean Avenue until the road runs out and you're at Surf Beach — the closest ocean to almost every house in Lompoc, about twelve miles from downtown. There's no boardwalk and no snack bar. There's a parking lot, a set of railroad tracks, and a long stretch of open Pacific coastline that most Central Coast visitors never find.\n\nThe beach sits on Vandenberg Space Force Base land, which is why it looks the way it does: undeveloped, wind-scoured, and usually close to empty. Amtrak's Surf station is right at the parking lot, and trains still stop here.\n\nWestern snowy plovers nest in the dunes, so sections of the beach close every year from March 1 through September 30 to protect them. The open stretch stays open, but the boundaries move — and rangers enforce them.",
    tips:
      "Check the current plover closure boundaries before you go; they change year to year and fines are real. The beach is open 8am to 6pm. Water is cold and rip currents are strong — this is a walking-and-watching beach far more than a swimming one. Bring a jacket even in August.",
  },
  {
    slug: "ocean-beach-county-park",
    title: "Ocean Beach County Park",
    category: "outdoors",
    placesQuery: "Ocean Beach County Park Lompoc CA",
    fallback: { address: "W Ocean Ave, Lompoc, CA 93436", lat: 34.6893, lng: -120.6015 },
    seasonality: "Year-round · best for birding in winter and spring",
    description:
      "Where the Santa Ynez River finally meets the Pacific, the county keeps a small park most people in town have driven past without stopping. It's the last turnout before Surf Beach, and it's the better spot if what you want is quiet.\n\nThe river mouth forms a lagoon that draws serious numbers of shorebirds — herons, egrets, pelicans, and migrating species that birders drive here specifically to see. There are picnic tables, restrooms, and a short walk down to the sand.\n\nIt's an easy add-on to a Surf Beach trip, and on days when the wind is howling at the beach it's often noticeably calmer down by the river.",
    tips:
      "Bring binoculars — the lagoon is the whole point. Same plover rules apply on the beach side. It's a good low-effort outing with kids: short walk from the car, tables for lunch, and enough birds to keep them interested.",
  },
  {
    slug: "miguelito-park",
    title: "Miguelito County Park",
    category: "outdoors",
    placesQuery: "Miguelito County Park Lompoc CA",
    fallback: { address: "Miguelito Canyon Rd, Lompoc, CA 93436", lat: 34.6021, lng: -120.4535 },
    seasonality: "Year-round · best in spring and fall",
    description:
      "Head south out of town up Miguelito Canyon and the fog burns off, the oaks close in overhead, and you're in a completely different Lompoc than the one on H Street.\n\nMiguelito is the shady one. Big oaks, group picnic areas you can reserve, a playground, and trails climbing up the canyon walls. It's the park families book for birthdays and reunions, and on a hot inland afternoon it's ten degrees cooler under the trees than it is downtown.\n\nIt's roughly ten minutes from the middle of town, which puts it firmly in the category of places locals mean to go and somehow never do.",
    tips:
      "Group areas need a reservation through Santa Barbara County Parks — walk-up picnicking is fine anywhere else. The upper trails get steep quickly; good shoes if you're going past the picnic loop. Cell service thins out in the canyon.",
  },
  {
    slug: "ryon-park",
    title: "Ryon Park",
    category: "family",
    placesQuery: "Ryon Park Lompoc CA",
    fallback: { address: "800 W Ocean Ave, Lompoc, CA 93436", lat: 34.6386, lng: -120.4652 },
    seasonality: "Year-round",
    description:
      "Ryon Park is the town's living room. Ball fields, a playground, big shade trees, and a wide lawn that has hosted more Lompoc events than anyone could list — festivals, concerts, tournaments, and the kind of Saturday where you show up with a soccer ball and stay four hours.\n\nIt's right off West Ocean, walking distance from Old Town, and it's the default answer when someone asks where to take the kids without a plan.\n\nIf you've lived here any length of time you have a memory in this park. If you just moved here, this is the first one to learn.",
    tips:
      "Check the city's event calendar before a weekend visit — when something big is booked, the lawn and parking fill early. The playground is best in the morning before the afternoon wind picks up.",
  },
  {
    slug: "ken-adam-park",
    title: "Ken Adam Park",
    category: "family",
    placesQuery: "Ken Adam Park Lompoc CA",
    fallback: { address: "Lompoc, CA 93436", lat: 34.6555, lng: -120.4552 },
    seasonality: "Year-round",
    description:
      "A neighborhood park on the north side with open turf, a playground, and enough room to actually run — the kind of park you use on a Tuesday rather than plan a trip around.\n\nIt's quieter than Ryon and less of a drive than Miguelito, which makes it the practical choice for an after-school hour or a walk that needs to be short.\n\nIt exists on almost no visitor guide to Lompoc, which is exactly why it's here.",
    tips:
      "Good option when Ryon Park is booked for an event. Bring your own shade — the open turf is exposed once the afternoon sun clears the trees.",
  },
  {
    slug: "beattie-park",
    title: "Beattie Park",
    category: "family",
    placesQuery: "Beattie Park Lompoc CA",
    fallback: { address: "1100 E Olive Ave, Lompoc, CA 93436", lat: 34.6324, lng: -120.444 },
    seasonality: "Year-round · best at sunset",
    description:
      "Fifty acres on the southeast edge of town, laid up against the foothills — Beattie is the biggest park in Lompoc and the one with the view.\n\nDown low it's a full community park: playground, two lighted basketball courts, a soccer and football field, horseshoe pits, a disc golf course, and group picnic areas. Up the hill there's an urban forest preserve with a winding fitness trail that climbs to Lookout Point, the highest spot in the park.\n\nThe climb is steep enough to count as a workout, and what you get at the top is the whole Lompoc Valley spread out below you — and on a genuinely clear day, the Pacific.",
    tips:
      "Go up to Lookout Point about an hour before sunset; the climb is short but steep, so take water. The disc golf course is free and rarely crowded on weekday evenings. Group picnic areas can be reserved through the city.",
  },
  {
    slug: "burton-mesa-ecological-reserve",
    title: "Burton Mesa Ecological Reserve",
    category: "outdoors",
    placesQuery: "Burton Mesa Ecological Reserve Lompoc CA",
    fallback: { address: "Burton Mesa Blvd, Lompoc, CA 93436", lat: 34.7086, lng: -120.4421 },
    seasonality: "Year-round · wildflowers in spring",
    description:
      "Between Lompoc and Vandenberg Village sits several thousand acres of protected chaparral — sandy soil, low twisted oak, manzanita, and a network of trails that hardly anyone outside the neighborhoods bordering it uses.\n\nBurton Mesa chaparral is a rare plant community that grows in very few places on earth, and this reserve exists specifically to protect it. What that means on the ground is quiet, level-ish walking through dense low forest with the occasional opening onto a wide view.\n\nIt's managed by the California Department of Fish and Wildlife, so it's undeveloped by design: no restrooms, no kiosks, just trailheads off the surrounding streets.",
    tips:
      "Trailheads are unmarked and easy to miss — look for the pull-offs along the roads on the Vandenberg Village side. Wear long pants; the brush is close in places. Spring is best, when the sandy openings fill with wildflowers.",
  },
  {
    slug: "point-sal",
    title: "Point Sal",
    category: "outdoors",
    placesQuery: "Point Sal State Beach",
    fallback: { address: "Brown Rd, Guadalupe, CA 93434", lat: 34.9027, lng: -120.6672 },
    seasonality: "Year-round · avoid after heavy rain",
    description:
      "Point Sal is the most dramatic coastline in this part of California and one of the hardest to reach — which is the whole reason it still looks the way it does.\n\nThe road that once carried cars out to the bluffs washed out decades ago and was never rebuilt. What's left is a long walk in along the old roadbed from the Brown Road side, climbing over a ridge before dropping toward the ocean, with steep cliffs, sea stacks, and a beach that's usually empty when you finally get there.\n\nThis is a serious outing, not a picnic. Plan on most of a day, carry everything you'll need, and treat the ridge and any cliff edges with respect.",
    tips:
      "Access and conditions change — check current status before you commit to the drive, and never park where signage prohibits it. There's no water, no shade on the ridge, and no cell service for most of it. Skip it entirely after heavy rain, when the trail becomes genuinely dangerous.",
  },
  {
    slug: "cypress-gallery",
    title: "Cypress Gallery",
    category: "arts",
    placesQuery: "Cypress Gallery Lompoc CA",
    fallback: { address: "119 E Cypress Ave, Lompoc, CA 93436", lat: 34.6386, lng: -120.4566 },
    seasonality: "Year-round · new show most months",
    description:
      "Home of the Lompoc Valley Art Association, the Cypress Gallery has been showing local work in Old Town for decades — paintings, photography, ceramics, and mixed media from artists who live here.\n\nThe shows rotate roughly monthly, admission is free, and the people at the desk are usually the artists themselves. That's the difference between this and a museum: you can ask the person who made the thing what they were thinking.\n\nIt's a fifteen-minute stop that changes every few weeks, which makes it one of the easiest habits to build in Old Town.",
    tips:
      "Openings are the best time to go — that's when the artists are all there. Check our events calendar for the current show; we list Cypress Gallery exhibitions as they run. It's a block off H Street, so pair it with lunch or the mural walk.",
  },
  {
    slug: "lompoc-theatre",
    title: "Lompoc Theatre",
    category: "arts",
    placesQuery: "Lompoc Theatre H Street Lompoc CA",
    fallback: { address: "112 N H St, Lompoc, CA 93436", lat: 34.6403, lng: -120.4576 },
    seasonality: "Year-round · exterior viewing",
    description:
      "The Lompoc Theatre opened on H Street in 1927 — vaudeville stage, movie house, the center of a downtown night out — and then sat dark for decades while the town changed around it.\n\nThe building is still there, and a community effort has been slowly bringing it back: stabilizing the structure, restoring the facade, raising money a piece at a time toward reopening it as a working venue. It is one of the few genuinely historic buildings left on the street, and its marquee is the most photographed thing in Old Town.\n\nRestoration is ongoing, so what's available to see varies. But standing in front of it and understanding what it was is a five-minute stop worth making on any walk through Old Town.",
    tips:
      "Interior access depends on where restoration stands — check for scheduled tours or open-house events rather than showing up expecting to get in. The facade photographs best in late afternoon when the light comes down H Street.",
  },
  {
    slug: "lompoc-aquatic-center",
    title: "Lompoc Aquatic Center",
    category: "family",
    placesQuery: "Lompoc Aquatic Center",
    fallback: { address: "207 W College Ave, Lompoc, CA 93436", lat: 34.6492, lng: -120.4614 },
    seasonality: "Year-round · indoor",
    description:
      "An indoor city pool complex, which in a town with this much fog and wind is a bigger deal than it sounds. Lap swimming, lessons, open recreation swim, and water exercise classes all run out of here year-round.\n\nIt's the reliable answer to a grey Lompoc Saturday with kids who need to burn energy, and it's the place most local kids actually learn to swim.\n\nSchedules shift by season and by program, so it rewards a quick check before you drive over.",
    tips:
      "Rec swim, lap swim, and lessons all run on separate schedules — confirm the current one with the city before going. Weekday mornings are the quietest. Bring your own towel and lock.",
  },
  {
    slug: "la-purisima-golf-course",
    title: "La Purisima Golf Course",
    category: "outdoors",
    placesQuery: "La Purisima Golf Course Lompoc CA",
    fallback: { address: "3455 State Route 246, Lompoc, CA 93436", lat: 34.6636, lng: -120.4062 },
    seasonality: "Year-round",
    description:
      "A public championship course laid out across the rolling hills east of town on Highway 246, and one of the genuinely well-known things about Lompoc outside of Lompoc — golfers from across the Central Coast drive here specifically for it.\n\nIt has a reputation for being hard. Long, exposed, and wind-affected, with elevation changes that make club selection a real decision. It is not a resort course and doesn't pretend to be.\n\nFor locals, the point is that a course of this quality is fifteen minutes from your house and open to anyone who books a tee time.",
    tips:
      "Wind is the defining factor — morning rounds play noticeably easier than afternoon ones. Book ahead on weekends. Walking it is possible but the elevation changes make a cart the popular choice.",
  },
  {
    slug: "skydiving-lompoc",
    title: "Skydiving Over the Lompoc Valley",
    category: "unique",
    placesQuery: "Skydive Santa Barbara Lompoc airport",
    fallback: { address: "Lompoc Airport, 1801 N H St, Lompoc, CA 93436", lat: 34.6656, lng: -120.4682 },
    seasonality: "Year-round · weather dependent",
    description:
      "Tandem skydiving runs out of Lompoc Airport, which means the view on the way down is the one you already know from the ground — the valley, the flower fields, the coastline, and on a clear day the Channel Islands sitting out on the horizon.\n\nFirst-timers jump strapped to an instructor after a short briefing, so there's no course to complete beforehand. It's the most expensive thing on this list by a distance, and the one people talk about for years.\n\nIt's also the strangest fact about our town's small airport: you can drive past it every day for a decade and never know people are stepping out of planes above it.",
    tips:
      "Book ahead and expect weather holds — coastal fog and wind push jumps more often here than inland. Morning slots are usually the most reliable. Confirm current operators, pricing, and weight limits directly before booking.",
  },
  {
    slug: "sta-rita-hills-wine-trail",
    title: "Sta. Rita Hills Wine Trail",
    category: "food-wine",
    placesQuery: null,
    fallback: { address: "Santa Rosa Rd & Hwy 246, Lompoc, CA 93436", lat: 34.6215, lng: -120.3735 },
    fallbackImage: "/activities/wine-ghetto-tasting.jpg",
    seasonality: "Year-round · harvest in fall",
    description:
      "East of town, between Lompoc and Buellton, two roads run parallel through the Sta. Rita Hills — Highway 246 on the north side and Santa Rosa Road on the south. Between them sits one of the most respected cold-climate growing regions in the United States.\n\nThe wind and fog that make Lompoc grey are the exact reason the fruit here is what it is. Pinot Noir and Chardonnay from these hills go into bottles that sell nationally, and several of those estates have tasting rooms you can drive to in under twenty minutes from downtown.\n\nThis is the counterpart to the Wine Ghetto: the Ghetto is warehouses in town where you park once and walk, and the Trail is the drive out through the vineyards themselves.",
    tips:
      "Loop it — out one road and back the other — rather than doubling back the way you came. Most estate tasting rooms want a reservation, especially on weekends. Harvest, roughly late August through October, is the most interesting time to be out there and the busiest.",
  },
  {
    slug: "lompoc-taco-trail",
    title: "The Lompoc Taco Trail",
    category: "food-wine",
    placesQuery: null,
    fallback: { address: "H Street & Ocean Avenue, Lompoc, CA 93436", lat: 34.6391, lng: -120.4579 },
    fallbackImage: "/categories/food-drink.jpg",
    seasonality: "Year-round",
    description:
      "Lompoc's best-known food story isn't a restaurant, it's a route. A dozen taquerías, mariscos counters, and food trucks spread across town — H Street, Ocean, A Street, Laurel — each with something it does better than anyone else.\n\nSome are sit-down, some are a window, one is a truck that moves. There are shops here that have been family-run since the early nineties, and menus running seventeen kinds of taco including ribeye and pork belly. Sinaloa-style mariscos, birria, breaded shrimp, fried red snapper.\n\nYou do not do this in one day. You do it one stop at a time, over months, and you end up with opinions you'll defend.",
    tips:
      "Pick one new stop a week instead of trying to run the whole list — the point is finding your regular, not finishing a checklist. Cash still moves faster than card at several of them. Go hungry and order the thing the person behind you orders.",
  },
]

// ---------------------------------------------------------------- places lookup

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function findPlace(
  query: string
): Promise<{ placeId: string; name: string; address: string; lat: number; lng: number } | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent(query)}&inputtype=textquery` +
    `&fields=place_id,name,formatted_address,geometry&key=${GOOGLE_API_KEY}` +
    `&locationbias=circle:30000@34.6392,-120.4579`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    status: string
    candidates: Array<{
      place_id: string
      name: string
      formatted_address?: string
      geometry?: { location: { lat: number; lng: number } }
    }>
  }
  const c = data.candidates?.[0]
  if (data.status !== "OK" || !c?.geometry) return null
  return {
    placeId: c.place_id,
    name: c.name,
    address: c.formatted_address ?? "",
    lat: c.geometry.location.lat,
    lng: c.geometry.location.lng,
  }
}

async function getPhotoReferences(placeId: string): Promise<string[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as {
    status: string
    result: { photos?: Array<{ photo_reference: string }> }
  }
  if (data.status !== "OK") return []
  return (data.result.photos ?? []).slice(0, MAX_PHOTOS).map((p) => p.photo_reference)
}

async function downloadPhoto(ref: string): Promise<Buffer | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=${PHOTO_MAX_WIDTH}&photo_reference=${ref}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) return null
  if (!(res.headers.get("content-type") ?? "").startsWith("image/")) return null
  const buf = Buffer.from(await res.arrayBuffer())
  return buf.byteLength > 100 ? buf : null
}

/** Guards against Places handing back a same-named place in another town. */
function inArea(address: string, name: string): boolean {
  return /Lompoc|Jalama|Purisima|Vandenberg|Guadalupe|Santa Rita|Buellton|Surf Beach/i.test(
    `${address} ${name}`
  )
}

// ---------------------------------------------------------------- main

async function main() {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY missing")
  console.log(`${DRY ? "DRY RUN — nothing will be written" : "LIVE — writing to the database"}\n`)

  let created = 0
  let updated = 0
  let verified = 0

  for (const seed of SEEDS) {
    const existing = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.slug, seed.slug))

    let address = seed.fallback.address
    let lat = seed.fallback.lat
    let lng = seed.fallback.lng
    let photos: string[] = []
    let matchNote = "manual coords (route/concept)"

    if (seed.placesQuery) {
      const place = await findPlace(seed.placesQuery)
      await sleep(DELAY_MS)

      if (place && inArea(place.address, place.name)) {
        address = place.address
        lat = place.lat
        lng = place.lng
        matchNote = `Places: "${place.name}"`
        verified++

        if (!DRY) {
          const refs = await getPhotoReferences(place.placeId)
          await sleep(DELAY_MS)
          for (let i = 0; i < refs.length; i++) {
            const buf = await downloadPhoto(refs[i])
            await sleep(DELAY_MS)
            if (!buf) continue
            const blob = await put(`activities/g-${seed.slug}-${i + 1}.jpeg`, buf, {
              access: "public",
              addRandomSuffix: false,
              contentType: "image/jpeg",
            })
            photos.push(blob.url)
          }
        }
      } else {
        matchNote = place
          ? `NO MATCH — Places returned "${place.name}" @ ${place.address}; kept manual coords`
          : "NO MATCH — Places found nothing; kept manual coords"
      }
    }

    const imageUrl = photos[0] ?? seed.fallbackImage ?? null
    const row = {
      title: seed.title,
      slug: seed.slug,
      category: seed.category,
      description: seed.description,
      address,
      lat,
      lng,
      imageUrl,
      photosJson: photos.length ? photos : null,
      tips: seed.tips,
      seasonality: seed.seasonality,
      sourceUrl: seed.sourceUrl ?? null,
      updatedAt: new Date(),
    }

    const action = existing.length ? "update" : "create"
    if (!DRY) {
      if (existing.length) {
        await db.update(activities).set(row).where(eq(activities.id, existing[0].id))
        updated++
      } else {
        await db.insert(activities).values(row)
        created++
      }
    } else {
      existing.length ? updated++ : created++
    }

    console.log(
      `${action.padEnd(6)} ${seed.slug.padEnd(32)} ${photos.length} photos · ${matchNote}\n` +
        `       ${address}  (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    )
  }

  console.log(
    `\n${DRY ? "would create" : "created"} ${created} · ${DRY ? "would update" : "updated"} ${updated} · ` +
      `${verified}/${SEEDS.filter((s) => s.placesQuery).length} verified against Google Places`
  )
}

main().then(() => process.exit(0))
