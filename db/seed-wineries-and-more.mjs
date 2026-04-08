// Seed script: 50 more Lompoc businesses including Lompoc Wine Ghetto wineries
// Run: node --env-file=.env.local db/seed-wineries-and-more.mjs
//
// Non-destructive — uses ON CONFLICT DO NOTHING on slug.
// Adds "wineries" category if missing.

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

// ============ WINERIES (Lompoc Wine Ghetto & Santa Rita Hills) ============
const WINERIES = [
  {
    name: "Flying Goat Cellars",
    slug: "flying-goat-cellars",
    description:
      "Lompoc Wine Ghetto stalwart producing single-vineyard Pinot Noir and Chardonnay from Santa Rita Hills fruit. Tasting room walk-ins welcome.",
    address: "1520 E Chestnut Ct, Lompoc, CA 93436",
    phone: "(805) 736-9032",
    website: "https://flyinggoatcellars.com",
    lat: 34.6392, lng: -120.4400,
  },
  {
    name: "Fiddlehead Cellars",
    slug: "fiddlehead-cellars",
    description:
      "Kathy Joseph's acclaimed winery focused on Oregon Pinot Gris and Santa Rita Hills Pinot Noir, celebrated for elegance and consistency.",
    address: "1597 E Chestnut Ave, Lompoc, CA 93436",
    phone: "(805) 742-2474",
    website: "https://fiddleheadcellars.com",
    lat: 34.6388, lng: -120.4395,
  },
  {
    name: "Ampelos Cellars",
    slug: "ampelos-cellars",
    description:
      "Biodynamic and organic winemaking in the Lompoc Wine Ghetto. Known for Syrah, Pinot Noir, and Grenache from sustainably farmed vineyards.",
    address: "312 N 9th St, Lompoc, CA 93436",
    phone: "(805) 736-9957",
    website: "https://ampeloscellars.com",
    lat: 34.6405, lng: -120.4490,
  },
  {
    name: "Ken Brown Wines",
    slug: "ken-brown-wines",
    description:
      "Veteran Santa Barbara winemaker Ken Brown crafts small-production Pinot Noir and Chardonnay from top Santa Rita Hills vineyards.",
    address: "1200 E Chestnut Ct, Lompoc, CA 93436",
    phone: "(805) 736-4259",
    website: "https://kenbrownwines.com",
    lat: 34.6391, lng: -120.4420,
  },
  {
    name: "Longoria Wines",
    slug: "longoria-wines",
    description:
      "Rick Longoria's boutique winery in the Lompoc Wine Ghetto. Specializes in Pinot Noir, Chardonnay, and Albariño with a distinct Santa Barbara style.",
    address: "415 E Chestnut Ct, Lompoc, CA 93436",
    phone: "(805) 735-4040",
    website: "https://longoriawine.com",
    lat: 34.6389, lng: -120.4445,
  },
  {
    name: "Loring Wine Company",
    slug: "loring-wine-company",
    description:
      "Brian Loring's cult Pinot Noir producer drawing from vineyards up and down the California coast. Tasting room in the Lompoc Wine Ghetto.",
    address: "1526 E Chestnut Ave, Lompoc, CA 93436",
    phone: "(805) 736-0700",
    website: "https://loringwinecompany.com",
    lat: 34.6388, lng: -120.4398,
  },
  {
    name: "Tyler Winery",
    slug: "tyler-winery",
    description:
      "Justin Willett's Tyler Winery pursues Burgundian-inspired Pinot Noir and Chardonnay from old-vine Santa Barbara County vineyards.",
    address: "343 N 9th St, Lompoc, CA 93436",
    phone: "(805) 693-9675",
    website: "https://tylerwinery.com",
    lat: 34.6407, lng: -120.4488,
  },
  {
    name: "Brewer-Clifton",
    slug: "brewer-clifton",
    description:
      "Renowned Burgundian-focused producer making single-vineyard Pinot Noir and Chardonnay from Santa Rita Hills AVA vineyards.",
    address: "324 N 9th St, Lompoc, CA 93436",
    phone: "(805) 735-7180",
    website: "https://brewerclifton.com",
    lat: 34.6406, lng: -120.4488,
  },
  {
    name: "Stolpman Vineyards",
    slug: "stolpman-vineyards",
    description:
      "Ballard Canyon estate focused on Rhône varieties — Syrah, Grenache, and Roussanne. Tasting room in the Lompoc Wine Ghetto.",
    address: "2434 Alamo Pintado Ave, Los Olivos, CA 93441",
    phone: "(805) 688-0400",
    website: "https://stolpmanvineyards.com",
    lat: 34.6390, lng: -120.4455,
  },
  {
    name: "Kessler-Haak Vineyard & Wines",
    slug: "kessler-haak-wines",
    description:
      "Family-owned estate winery producing Pinot Noir and Chardonnay from their estate vineyard in the Santa Rita Hills.",
    address: "1261 Hansen Dr, Lompoc, CA 93436",
    phone: "(805) 740-9463",
    website: "https://kessler-haak.com",
    lat: 34.6376, lng: -120.5020,
  },
  {
    name: "Melville Winery",
    slug: "melville-winery",
    description:
      "Estate Pinot Noir, Chardonnay, and Syrah from one of the Santa Rita Hills' most respected growers. Beautiful tasting room on Hwy 246.",
    address: "5185 E Hwy 246, Lompoc, CA 93436",
    phone: "(805) 735-7030",
    website: "https://melvillewinery.com",
    lat: 34.6181, lng: -120.3820,
  },
  {
    name: "Babcock Winery & Vineyards",
    slug: "babcock-winery",
    description:
      "Pioneer Santa Rita Hills winery known for Pinot Noir, Chardonnay, and Sauvignon Blanc from their estate on Highway 246.",
    address: "5175 E Hwy 246, Lompoc, CA 93436",
    phone: "(805) 736-1455",
    website: "https://babcockwinery.com",
    lat: 34.6181, lng: -120.3825,
  },
  {
    name: "Sanford Winery",
    slug: "sanford-winery",
    description:
      "Historic Santa Rita Hills pioneer. The Sanford & Benedict Vineyard is one of California's most celebrated Pinot Noir sites.",
    address: "5010 Santa Rosa Rd, Lompoc, CA 93436",
    phone: "(805) 688-3300",
    website: "https://sanfordwinery.com",
    lat: 34.6120, lng: -120.4140,
  },
  {
    name: "Spear Winery",
    slug: "spear-winery",
    description:
      "Small-production Pinot Noir and Chardonnay from Santa Rita Hills. Focused on expressing terroir with minimal intervention.",
    address: "Lompoc Wine Ghetto, Lompoc, CA 93436",
    phone: "(805) 735-3960",
    website: null,
    lat: 34.6390, lng: -120.4430,
  },
  {
    name: "Evening Land Vineyards",
    slug: "evening-land-vineyards",
    description:
      "Producer of exceptional Chardonnay and Pinot Noir from Seven Springs Vineyard in Oregon and Sta. Rita Hills. Tasting by appointment.",
    address: "Lompoc Wine Ghetto, Lompoc, CA 93436",
    phone: "(805) 736-2455",
    website: "https://eveninglandvineyards.com",
    lat: 34.6389, lng: -120.4415,
  },
  {
    name: "Volk Wines",
    slug: "volk-wines",
    description:
      "Boutique producer crafting Pinot Noir and Chardonnay from carefully selected Santa Rita Hills vineyards. Open weekends.",
    address: "Lompoc Wine Ghetto, Lompoc, CA 93436",
    phone: null,
    website: "https://volkwines.com",
    lat: 34.6391, lng: -120.4428,
  },
  {
    name: "Zotovich Family Vineyards",
    slug: "zotovich-family-vineyards",
    description:
      "Family estate in the Santa Rita Hills AVA producing Pinot Noir, Chardonnay, and Pinot Gris with a farm-to-glass philosophy.",
    address: "9219 Santa Rosa Rd, Buellton, CA 93427",
    phone: "(805) 693-0500",
    website: "https://zotovichvineyards.com",
    lat: 34.6108, lng: -120.4270,
  },
  {
    name: "Huber Vineyards",
    slug: "huber-vineyards",
    description:
      "Estate Pinot Noir and Chardonnay grown in the Santa Rita Hills. Small-batch winemaking with old-vine intensity.",
    address: "Lompoc Wine Ghetto, Lompoc, CA 93436",
    phone: null,
    website: null,
    lat: 34.6388, lng: -120.4410,
  },
  {
    name: "Riverbench Winery",
    slug: "riverbench-winery",
    description:
      "Chardonnay and Pinot Noir specialist with a stunning estate tasting room in Santa Maria Valley and satellite pours in Lompoc.",
    address: "6020 Foxen Canyon Rd, Santa Maria, CA 93454",
    phone: "(805) 937-8340",
    website: "https://riverbench.com",
    lat: 34.6990, lng: -120.4420,
  },
  {
    name: "Municipal Winemakers",
    slug: "municipal-winemakers",
    description:
      "Dave Potter's urban winery in the Lompoc Wine Ghetto making approachable, fruit-forward Pinot Noir and Chardonnay. Vinyl on the turntable.",
    address: "22 W Chestnut Ave, Lompoc, CA 93436",
    phone: "(805) 735-2400",
    website: "https://municipalwinemakers.com",
    lat: 34.6371, lng: -120.4560,
  },
]

// ============ FOOD & DRINK ============
const FOOD_DRINK = [
  {
    name: "Tacos Santa Fe",
    slug: "tacos-santa-fe",
    description:
      "Beloved local taqueria serving carne asada, carnitas, and birria tacos with homemade salsas and horchata.",
    address: "1101 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-9881",
    website: null,
    lat: 34.6384, lng: -120.4720,
  },
  {
    name: "El Rancho Market",
    slug: "el-rancho-market",
    description:
      "Full-service Mexican grocery and deli with fresh tortillas, carnitas, tamales, and prepared foods.",
    address: "917 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-1401",
    website: null,
    lat: 34.6384, lng: -120.4695,
  },
  {
    name: "The Habit Burger Grill",
    slug: "habit-burger-lompoc",
    description:
      "California-born burger chain with charbroiled burgers, fresh salads, and crispy onion rings. Quick, quality fast-casual.",
    address: "1101 N H St, Lompoc, CA 93436",
    phone: "(805) 736-8824",
    website: "https://habitburger.com",
    lat: 34.6515, lng: -120.4579,
  },
  {
    name: "Cattaneo Bros.",
    slug: "cattaneo-bros",
    description:
      "Family deli and sandwich shop famous for their jerky, Italian cold cuts, and old-school sandwiches. A Lompoc institution since 1952.",
    address: "769 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-1441",
    website: "https://cattaneobrothers.com",
    lat: 34.6384, lng: -120.4668,
  },
  {
    name: "Ono Hawaiian BBQ",
    slug: "ono-hawaiian-bbq-lompoc",
    description:
      "Hawaiian-style plate lunches with kalua pork, teriyaki chicken, and macaroni salad. Generous portions at fair prices.",
    address: "1109 N H St, Lompoc, CA 93436",
    phone: "(805) 736-0600",
    website: "https://onohawaiianbbq.com",
    lat: 34.6513, lng: -120.4579,
  },
  {
    name: "Lompoc Brewing Company",
    slug: "lompoc-brewing-company",
    description:
      "Local craft brewery and taproom pouring rotating IPAs, lagers, and seasonal specials brewed on-site. Live music on weekends.",
    address: "119 E College Ave, Lompoc, CA 93436",
    phone: "(805) 588-9450",
    website: null,
    lat: 34.6370, lng: -120.4572,
  },
  {
    name: "Starbucks Lompoc",
    slug: "starbucks-lompoc",
    description:
      "Drive-through and dine-in Starbucks on N H Street with the full espresso, Frappuccino, and bakery lineup.",
    address: "1100 N H St, Lompoc, CA 93436",
    phone: "(805) 735-1710",
    website: "https://starbucks.com",
    lat: 34.6512, lng: -120.4579,
  },
  {
    name: "Jersey Mike's Subs Lompoc",
    slug: "jersey-mikes-lompoc",
    description:
      "Fresh-sliced subs on freshly baked bread. Fan favorites include the #13 Italian and the Mike's Way treatment.",
    address: "1021 N H St, Lompoc, CA 93436",
    phone: "(805) 735-1600",
    website: "https://jerseymikes.com",
    lat: 34.6504, lng: -120.4579,
  },
]

// ============ RETAIL ============
const RETAIL = [
  {
    name: "Lompoc Wine & Spirits",
    slug: "lompoc-wine-spirits",
    description:
      "Well-curated bottle shop with an exceptional Santa Barbara County wine selection, craft beer, and spirits.",
    address: "210 N H St, Lompoc, CA 93436",
    phone: "(805) 735-8887",
    website: null,
    lat: 34.6415, lng: -120.4579,
  },
  {
    name: "Vons Lompoc",
    slug: "vons-lompoc",
    description:
      "Full-service Vons supermarket with fresh produce, deli, bakery, pharmacy, and gas station.",
    address: "1001 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 735-1420",
    website: "https://vons.com",
    lat: 34.6384, lng: -120.4700,
  },
  {
    name: "Grocery Outlet Lompoc",
    slug: "grocery-outlet-lompoc",
    description:
      "Bargain-priced groceries, specialty foods, wine, beer, and household goods — great deals change weekly.",
    address: "121 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 735-1550",
    website: "https://groceryoutlet.com",
    lat: 34.6384, lng: -120.4600,
  },
  {
    name: "Lompoc Ace Hardware",
    slug: "lompoc-ace-hardware",
    description:
      "Your neighborhood hardware store with tools, paint, garden supplies, and friendly staff who know their stuff.",
    address: "601 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-3323",
    website: "https://acehardware.com",
    lat: 34.6384, lng: -120.4645,
  },
  {
    name: "Dollar Tree Lompoc",
    slug: "dollar-tree-lompoc",
    description:
      "Everything $1.25 — household goods, party supplies, snacks, cleaning products, and seasonal items.",
    address: "905 N H St, Lompoc, CA 93436",
    phone: "(805) 736-0015",
    website: "https://dollartree.com",
    lat: 34.6480, lng: -120.4579,
  },
]

// ============ SERVICES ============
const SERVICES = [
  {
    name: "Marian Regional Medical Center Lompoc",
    slug: "marian-regional-lompoc",
    description:
      "Dignity Health clinic offering primary care, urgent care, and specialty services for the Lompoc community.",
    address: "508 E Maple Ave, Lompoc, CA 93436",
    phone: "(805) 737-3300",
    website: "https://marianmedical.org",
    lat: 34.6410, lng: -120.4538,
  },
  {
    name: "Lompoc Valley Community Bank",
    slug: "lompoc-valley-community-bank",
    description:
      "Community-focused bank serving Lompoc since 1975, offering personal banking, small business loans, and financial services.",
    address: "100 S H St, Lompoc, CA 93436",
    phone: "(805) 735-3358",
    website: "https://lvcb.com",
    lat: 34.6372, lng: -120.4579,
  },
  {
    name: "Anytime Fitness Lompoc",
    slug: "anytime-fitness-lompoc",
    description:
      "24/7 access gym with cardio equipment, free weights, and personal training. Key fob access for members.",
    address: "1710 N H St, Lompoc, CA 93436",
    phone: "(805) 736-0600",
    website: "https://anytimefitness.com",
    lat: 34.6592, lng: -120.4579,
  },
  {
    name: "Mail It Plus Lompoc",
    slug: "mail-it-plus-lompoc",
    description:
      "Shipping, mailbox rental, printing, fax, notary, and packaging supplies — your local shipping and business services hub.",
    address: "1106 N H St, Lompoc, CA 93436",
    phone: "(805) 735-5400",
    website: null,
    lat: 34.6511, lng: -120.4579,
  },
  {
    name: "Lompoc Animal Hospital",
    slug: "lompoc-animal-hospital",
    description:
      "Full-service veterinary care for dogs and cats including wellness exams, surgery, dentistry, and emergency services.",
    address: "221 N A St, Lompoc, CA 93436",
    phone: "(805) 736-3343",
    website: "https://lompocanimalhospital.com",
    lat: 34.6400, lng: -120.4553,
  },
  {
    name: "Lompoc Car Wash",
    slug: "lompoc-car-wash",
    description:
      "Full-service and self-service car wash with detailing packages, interior cleaning, and monthly membership plans.",
    address: "1200 N H St, Lompoc, CA 93436",
    phone: "(805) 736-8880",
    website: null,
    lat: 34.6528, lng: -120.4579,
  },
]

// ============ HEALTH & BEAUTY ============
const HEALTH_BEAUTY = [
  {
    name: "Great Clips Lompoc",
    slug: "great-clips-lompoc",
    description:
      "Walk-in haircuts, kids and adults. No appointment needed — check in online to reduce your wait.",
    address: "1020 N H St, Lompoc, CA 93436",
    phone: "(805) 736-2888",
    website: "https://greatclips.com",
    lat: 34.6502, lng: -120.4579,
  },
  {
    name: "Lompoc Beauty College",
    slug: "lompoc-beauty-college",
    description:
      "Student-staffed salon offering cuts, colors, perms, facials, nails, and waxing at below-market prices.",
    address: "119 N I St, Lompoc, CA 93436",
    phone: "(805) 736-1504",
    website: null,
    lat: 34.6382, lng: -120.4591,
  },
  {
    name: "Massage Envy Lompoc",
    slug: "massage-envy-lompoc",
    description:
      "Professional massage therapy and facials with flexible membership options. Book online or by phone.",
    address: "1010 N H St, Lompoc, CA 93436",
    phone: "(805) 735-9200",
    website: "https://massageenvy.com",
    lat: 34.6500, lng: -120.4579,
  },
]

// ============ ENTERTAINMENT ============
const ENTERTAINMENT = [
  {
    name: "Lompoc Valley Raceway",
    slug: "lompoc-valley-raceway",
    description:
      "Local dirt track oval racing venue featuring stock cars, motorcycles, and special events on summer weekends.",
    address: "1000 S H St, Lompoc, CA 93436",
    phone: "(805) 736-1212",
    website: null,
    lat: 34.6260, lng: -120.4579,
  },
  {
    name: "Lompoc Recreation Department",
    slug: "lompoc-recreation-department",
    description:
      "City parks, sports leagues, aquatic center, senior programs, and community events for all ages.",
    address: "100 Civic Center Plaza, Lompoc, CA 93436",
    phone: "(805) 875-8100",
    website: "https://ci.lompoc.ca.us",
    lat: 34.6393, lng: -120.4571,
  },
  {
    name: "Lompoc Aquatic Center",
    slug: "lompoc-aquatic-center",
    description:
      "Indoor and outdoor pools for lap swimming, lessons, water aerobics, and recreational swim. Open year-round.",
    address: "3205 Harris Grade Rd, Lompoc, CA 93436",
    phone: "(805) 875-8120",
    website: "https://ci.lompoc.ca.us/rec",
    lat: 34.6501, lng: -120.4350,
  },
]

// ============ AUTO ============
const AUTO = [
  {
    name: "Lompoc Toyota",
    slug: "lompoc-toyota",
    description:
      "New and certified pre-owned Toyota dealership with full service center. Financing available for all credit situations.",
    address: "1900 N H St, Lompoc, CA 93436",
    phone: "(805) 736-3535",
    website: "https://lompoctoyota.com",
    lat: 34.6615, lng: -120.4579,
  },
  {
    name: "Firestone Complete Auto Care",
    slug: "firestone-lompoc",
    description:
      "Full-service auto care including tires, oil changes, brakes, alignment, and AC repair. Appointments and walk-ins.",
    address: "916 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-2040",
    website: "https://firestonecompleteautocare.com",
    lat: 34.6384, lng: -120.4692,
  },
  {
    name: "Jiffy Lube Lompoc",
    slug: "jiffy-lube-lompoc",
    description:
      "Fast oil changes and preventive maintenance services. No appointment needed — in and out in about 15 minutes.",
    address: "1012 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-5823",
    website: "https://jiffylube.com",
    lat: 34.6384, lng: -120.4703,
  },
]

async function run() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("== Seeding 50 more Lompoc businesses + wineries ==\n")

  // ── 1. Ensure a seed owner exists ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 10)
  await sql`
    INSERT INTO users (email, password_hash, role)
    VALUES ('seedowner@lompocdeals.internal', ${passwordHash}, 'business')
    ON CONFLICT (email) DO NOTHING
  `
  const [owner] = await sql`
    SELECT id FROM users WHERE email = 'seedowner@lompocdeals.internal'
  `
  const ownerId = owner.id
  console.log(`Seed owner id: ${ownerId}`)

  // ── 2. Ensure "wineries" category exists ───────────────────────────────────
  await sql`
    INSERT INTO categories (name, slug, icon)
    VALUES ('Wineries', 'wineries', 'wine')
    ON CONFLICT (slug) DO NOTHING
  `
  console.log("✓ Wineries category ensured")

  // ── 3. Load all categories ─────────────────────────────────────────────────
  const cats = await sql`SELECT id, slug FROM categories`
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

  // ── 4. Seed helper ─────────────────────────────────────────────────────────
  async function seedBusinesses(list, categorySlug, label) {
    console.log(`\n--- ${label} (${list.length}) ---`)
    let inserted = 0
    const catId = catBySlug[categorySlug]
    if (!catId) {
      console.error(`ERROR: category '${categorySlug}' not found`)
      return
    }
    for (const b of list) {
      const rows = await sql`
        INSERT INTO businesses (
          owner_user_id, name, slug, description, category_id,
          address, phone, website, lat, lng, status
        ) VALUES (
          ${ownerId}, ${b.name}, ${b.slug}, ${b.description}, ${catId},
          ${b.address ?? null}, ${b.phone ?? null}, ${b.website ?? null},
          ${b.lat ?? null}, ${b.lng ?? null}, 'approved'
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `
      if (rows.length > 0) inserted++
    }
    console.log(`  inserted ${inserted} / ${list.length}`)
  }

  await seedBusinesses(WINERIES, "wineries", "Wineries")
  await seedBusinesses(FOOD_DRINK, "food-drink", "Food & Drink")
  await seedBusinesses(RETAIL, "retail", "Retail")
  await seedBusinesses(SERVICES, "services", "Services")
  await seedBusinesses(HEALTH_BEAUTY, "health-beauty", "Health & Beauty")
  await seedBusinesses(ENTERTAINMENT, "entertainment", "Entertainment")
  await seedBusinesses(AUTO, "auto", "Auto")

  // ── 5. Summary ─────────────────────────────────────────────────────────────
  const [total] = await sql`SELECT COUNT(*)::int AS n FROM businesses WHERE status = 'approved'`
  console.log(`\n✓ Done. Total approved businesses: ${total.n}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
