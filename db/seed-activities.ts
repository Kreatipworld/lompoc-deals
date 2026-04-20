/**
 * Seed activities/things-to-do for Lompoc.
 * Run: npx tsx db/seed-activities.ts
 *
 * CMO can add more entries to the ACTIVITIES array below,
 * or provide a docs/activities-seed-data.md file and update this script.
 */
import "dotenv/config"
import { db } from "./client"
import { activities } from "./schema"

const ACTIVITIES = [
  {
    title: "La Purisima Mission State Historic Park",
    slug: "la-purisima-mission",
    category: "history",
    description:
      "One of the best-preserved of the California missions, La Purisima offers self-guided tours through fully restored mission buildings, gardens, and livestock areas.",
    address: "2295 Purisima Rd, Lompoc, CA 93436",
    lat: 34.6696,
    lng: -120.4362,
    imageUrl: "/activities/la-purisima-mission.jpg",
    tips: "Arrive early on weekends. Wear comfortable shoes. Leashed dogs allowed on outside trails.",
    seasonality: "Year-round",
    sourceUrl: "https://www.parks.ca.gov/?page_id=608",
    featured: true,
  },
  {
    title: "Lompoc Valley Flower Fields",
    slug: "lompoc-flower-fields",
    category: "outdoors",
    description:
      "Lompoc is the flower seed capital of the world. Every spring, thousands of acres burst into vivid stripes of color — larkspur, sweet william, and statice stretching to the horizon.",
    address: "Central Ave & V St, Lompoc, CA 93436",
    lat: 34.6391,
    lng: -120.51,
    imageUrl: "/activities/lompoc-flower-fields.jpg",
    tips: "Peak bloom runs late May through June. Pick up the free Flower Route map at the Chamber of Commerce.",
    seasonality: "Spring (May–June)",
    sourceUrl: "https://www.lompoc.com/flower-industry",
    featured: true,
  },
  {
    title: "Lompoc Murals Walking Tour",
    slug: "lompoc-murals-tour",
    category: "arts",
    description:
      "Lompoc is home to over 70 large-scale outdoor murals. Spanning local history, Chumash culture, agriculture, and everyday life, the murals make the entire town an open-air gallery.",
    address: "Downtown Lompoc, H St & Ocean Ave",
    lat: 34.6383,
    lng: -120.4578,
    imageUrl: "/activities/lompoc-murals.jpg",
    tips: "Free self-guided tour maps at the Lompoc Museum. Walk covers ~1.5 miles downtown.",
    seasonality: "Year-round",
    sourceUrl: "https://www.muralslompoc.com",
    featured: true,
  },
  {
    title: "Jalama Beach County Park",
    slug: "jalama-beach",
    category: "outdoors",
    description:
      "One of the most remote and beautiful beaches on the Central Coast — crashing waves, tide pools, incredible sunsets, and the famous Jalama Burger from the camp store.",
    address: "Jalama Rd, Lompoc, CA 93436",
    lat: 34.5068,
    lng: -120.5018,
    imageUrl: "/activities/jalama-beach.jpg",
    tips: "Day use fee required. The Jalama Burger is legendary — do not skip it. Bring layers for coastal wind.",
    seasonality: "Year-round (best spring–fall)",
    sourceUrl: "https://www.countyofsb.org/parks/jalama",
    featured: true,
  },
  {
    title: "Lompoc Wine Ghetto Tasting",
    slug: "lompoc-wine-ghetto",
    category: "food-wine",
    description:
      "A cluster of boutique winery tasting rooms in an industrial park near downtown. Taste Santa Barbara County pinot noir, chardonnay, and syrah in a casual, unpretentious setting.",
    address: "1520-1800 E Chestnut Ave, Lompoc, CA 93436",
    lat: 34.6491,
    lng: -120.4378,
    imageUrl: "/activities/wine-ghetto-tasting.jpg",
    tips: "Most tasting rooms open Thursday–Sunday. Walk between wineries — all within a few minutes of each other.",
    seasonality: "Year-round (Thu–Sun)",
    sourceUrl: "https://www.lompocwineghetto.com",
    featured: true,
  },
  {
    title: "Vandenberg Space Force Base Launch Viewing",
    slug: "vandenberg-launches",
    category: "unique",
    description:
      "Vandenberg launches rockets year-round. On clear nights you can see the plumes from across the valley. Major launches draw crowds to viewing spots throughout Lompoc.",
    address: "Lompoc, CA 93436",
    lat: 34.6391,
    lng: -120.4579,
    imageUrl: "/activities/vandenberg-launch.jpg",
    tips: "Great viewing: Ocean Ave overpass, Harris Grade Road, downtown. Follow @30thSpaceWing on X for launch alerts.",
    seasonality: "Year-round",
    sourceUrl: null,
    featured: true,
  },
  {
    title: "River Park & Santa Ynez River Trail",
    slug: "santa-ynez-river-trail",
    category: "outdoors",
    description:
      "Miles of easy walking and biking trails through riparian habitat along the Santa Ynez River. Watch for hawks, herons, and deer. Perfect for families and dogs.",
    address: "River Park, Airport Blvd, Lompoc, CA 93436",
    lat: 34.6611,
    lng: -120.4578,
    imageUrl:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
    tips: "Best in spring and fall. Bring sunscreen — little shade. The park has picnic tables and a playground.",
    seasonality: "Year-round",
    sourceUrl: null,
    featured: false,
  },
  {
    title: "Lompoc Museum",
    slug: "lompoc-museum",
    category: "history",
    description:
      "Explores the natural and cultural history of the Lompoc Valley — from Chumash artifacts and early settler homesteads to Cold War missile testing at Vandenberg.",
    address: "200 S H St, Lompoc, CA 93436",
    lat: 34.6357,
    lng: -120.4578,
    imageUrl:
      "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=800&q=80",
    tips: "Admission by donation. Closed Mondays. Pick up the mural walking tour map here.",
    seasonality: "Year-round (Tue–Sun)",
    sourceUrl: "https://www.lompocmuseum.org",
    featured: false,
  },
  {
    title: "Centennial Park & Skate Park",
    slug: "centennial-park",
    category: "family",
    description:
      "A popular community hub with green lawns, picnic areas, disc golf, and one of the best free skate parks on the Central Coast. Home to Lompoc's summer concert series.",
    address: "100 W Ocean Ave, Lompoc, CA 93436",
    lat: 34.6397,
    lng: -120.464,
    imageUrl:
      "https://images.unsplash.com/photo-1563865436874-9aef32095fad?auto=format&fit=crop&w=800&q=80",
    tips: "Free admission. Summer concert series runs June–August on Friday evenings. Bring a blanket.",
    seasonality: "Year-round",
    sourceUrl: null,
    featured: false,
  },
  {
    title: "Harris Grade Road Scenic Drive",
    slug: "harris-grade-road",
    category: "outdoors",
    description:
      "A stunning 10-mile back-road drive through rolling hills and oak woodland connecting Lompoc to Hwy 101. Spring wildflowers cover the hillsides.",
    address: "Harris Grade Rd, Lompoc, CA 93436",
    lat: 34.7,
    lng: -120.48,
    imageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    tips: "Two-lane road — drive slowly and watch for cyclists. Best in spring for wildflowers. Also a prime rocket launch viewing spot.",
    seasonality: "Year-round (best spring)",
    sourceUrl: null,
    featured: false,
  },
]

async function seed() {
  console.log("Seeding activities...")
  for (const activity of ACTIVITIES) {
    await db.insert(activities).values(activity).onConflictDoNothing()
    console.log(`  ✓ ${activity.title}`)
  }
  console.log("Done.")
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
