// Migration v2: real Lompoc businesses with phone/website/address + sample deals.
// Run: node --env-file=.env.local db/migrate-real-businesses-v2.mjs
//
// DESTRUCTIVE — wipes all businesses + deals before re-inserting.

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const BUSINESSES = [
  // ============ FOOD & DRINK ============
  {
    name: "Old Town Kitchen & Bar",
    slug: "old-town-kitchen-bar",
    categorySlug: "food-drink",
    description:
      "Casual American dining and full bar in Old Town Lompoc, known for great steaks and a build-your-own mac & cheese bar.",
    address: "319 E Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 741-7631",
    website: "https://www.oldtownkitchenlompoc.com",
    lat: 34.6385,
    lng: -120.4575,
  },
  {
    name: "South Side Coffee Co.",
    slug: "south-side-coffee-co",
    categorySlug: "food-drink",
    description:
      "Downtown coffee shop on H Street featuring local artwork, an upstairs loft, and a casual neighborhood feel.",
    address: "105 S H St, Lompoc, CA 93436",
    phone: "(805) 737-3730",
    website: null,
    lat: 34.6383,
    lng: -120.4585,
  },
  {
    name: "La Botte Italian Restaurant",
    slug: "la-botte",
    categorySlug: "food-drink",
    description:
      "Family-owned authentic Italian restaurant serving classic dishes and a thoughtful selection of local and Italian wines.",
    address: "112 S I St, Lompoc, CA 93436",
    phone: "(805) 736-8525",
    website: "https://labotterestaurant.com",
    lat: 34.6383,
    lng: -120.4595,
  },
  {
    name: "Chow-Ya",
    slug: "chow-ya",
    categorySlug: "food-drink",
    description:
      "Asian fusion spot serving poke bowls, ramen, and bulgogi to a loyal Lompoc following.",
    address: "713 E Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 741-7895",
    website: null,
    lat: 34.6385,
    lng: -120.4555,
  },
  {
    name: "Pali Wine Co.",
    slug: "pali-wine-co",
    categorySlug: "food-drink",
    description:
      "Lompoc Wine Ghetto tasting room from Pali Wine Co., specializing in elegant Pinot Noir and Chardonnay.",
    address: "1501 E Chestnut Ct, Lompoc, CA 93436",
    phone: "(805) 735-2354",
    website: null,
    lat: 34.6390,
    lng: -120.4490,
  },

  // ============ RETAIL ============
  {
    name: "Mike's Trains and Hobbies",
    slug: "mikes-trains-hobbies",
    categorySlug: "retail",
    description:
      "Downtown Lompoc hobby shop with model trains, hobby supplies, and locally curated gifts.",
    address: "111 1/2 S H St, Lompoc, CA 93436",
    phone: "(805) 736-6747",
    website: "https://mikestrainslompoc.com",
    lat: 34.6385,
    lng: -120.4585,
  },

  // ============ AUTO ============
  {
    name: "Hodges Automotive",
    slug: "hodges-automotive",
    categorySlug: "auto",
    description:
      "Family-owned AAA-approved auto repair shop serving Lompoc since 1970, known for honest workmanship and clear communication.",
    address: "807 E Chestnut Ave, Lompoc, CA 93436",
    phone: "(805) 736-9696",
    website: "https://lompocautorepair.com",
    lat: 34.6360,
    lng: -120.4540,
  },
  {
    name: "P&L Transmissions & Auto Repair",
    slug: "pl-transmissions-auto-repair",
    categorySlug: "auto",
    description:
      "ASE Master Tech-certified shop specializing in transmissions, brakes, engine, and electrical work since 1987.",
    address: "Lompoc, CA 93436",
    phone: "(805) 736-0660",
    website: "https://www.pandltransmission.com",
    lat: 34.6440,
    lng: -120.4595,
  },

  // ============ HEALTH & BEAUTY ============
  {
    name: "Lompoc Barber Lounge",
    slug: "lompoc-barber-lounge",
    categorySlug: "health-beauty",
    description:
      "Family-friendly barber lounge in historic downtown Lompoc offering classic cuts, fades, beard work, and head shaves.",
    address: "137 N H St, Lompoc, CA 93436",
    phone: "(805) 291-3600",
    website: null,
    lat: 34.6395,
    lng: -120.4585,
  },
  {
    name: "Ramiro's Barbershop",
    slug: "ramiros-barbershop",
    categorySlug: "health-beauty",
    description:
      "Local barbershop on H Street offering walk-in cuts and traditional grooming.",
    address: "734 N H St, Lompoc, CA 93436",
    phone: "(805) 734-8810",
    website: null,
    lat: 34.6470,
    lng: -120.4585,
  },

  // ============ SERVICES ============
  {
    name: "Pier Fitness",
    slug: "pier-fitness",
    categorySlug: "services",
    description:
      "Locally owned full-service gym serving Lompoc for 25+ years. Cardio, weights, group fitness studio, heated outdoor pool, and saunas.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: "https://www.pierfitness.com",
    lat: 34.6450,
    lng: -120.4570,
  },
  {
    name: "Yoga Vie",
    slug: "yoga-vie",
    categorySlug: "services",
    description:
      "Accessible, humble yoga studio on the central coast where the practice and growth of each student is the focus.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: null,
    lat: 34.6420,
    lng: -120.4590,
  },
  {
    name: "Blooming Energy",
    slug: "blooming-energy",
    categorySlug: "services",
    description:
      "Community wellness studio offering yoga, fitness, educational workshops, and local arts and crafts.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: null,
    lat: 34.6410,
    lng: -120.4600,
  },
  {
    name: "Stillman's Dry Cleaning",
    slug: "stillmans-dry-cleaning",
    categorySlug: "services",
    description: "Local Lompoc dry cleaner located next to Yoga Vie.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: null,
    lat: 34.6422,
    lng: -120.4592,
  },

  // ============ ENTERTAINMENT ============
  {
    name: "Ocean Lanes Family Entertainment Center",
    slug: "ocean-lanes",
    categorySlug: "entertainment",
    description:
      "Lompoc's bowling alley and family entertainment center — bowling, games, and snacks under one roof.",
    address: "Lompoc, CA 93436",
    phone: "(805) 736-4541",
    website: null,
    lat: 34.6500,
    lng: -120.4600,
  },
  {
    name: "Lompoc Fun Center",
    slug: "lompoc-fun-center",
    categorySlug: "entertainment",
    description:
      "Family fun center with mini golf, arcade games, laser tag, and a snack bar.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: null,
    lat: 34.6480,
    lng: -120.4620,
  },
  {
    name: "Movies Lompoc",
    slug: "movies-lompoc",
    categorySlug: "entertainment",
    description:
      "Lompoc's first-run movie theater with multiple screens, comfortable seating, and family-friendly options.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: null,
    lat: 34.6450,
    lng: -120.4540,
  },
]

// Sample deals: keyed by business slug
const DEALS = {
  "old-town-kitchen-bar": [
    {
      type: "coupon",
      title: "$5 off any entree on Mondays",
      description: "Mention Lompoc Deals at the table. Dine-in only.",
      discountText: "$5 OFF",
      days: 30,
    },
    {
      type: "special",
      title: "Build-your-own mac & cheese — 3 toppings free",
      description: "Add three toppings to any mac & cheese on the house.",
      discountText: "FREE",
      days: 14,
    },
  ],
  "south-side-coffee-co": [
    {
      type: "coupon",
      title: "$1 off any drink before 8am",
      description: "Earlybird discount, weekdays only. One per customer.",
      discountText: "$1 OFF",
      days: 14,
    },
    {
      type: "announcement",
      title: "New seasonal lattes now available",
      description: "Stop by and try our limited-time spring menu.",
      days: 21,
    },
  ],
  "la-botte": [
    {
      type: "coupon",
      title: "Free dessert with any pasta entree",
      description: "Choose from tiramisu, panna cotta, or cannoli.",
      discountText: "FREE",
      days: 30,
    },
    {
      type: "special",
      title: "Half-price wine flights on Tuesdays",
      description: "Three local pours for the price of one and a half.",
      discountText: "50% OFF",
      days: 30,
    },
  ],
  "chow-ya": [
    {
      type: "coupon",
      title: "$2 off any poke bowl",
      description: "Build your own. Mention Lompoc Deals.",
      discountText: "$2 OFF",
      days: 21,
    },
    {
      type: "special",
      title: "Spicy ramen lunch combo — $12",
      description: "Includes ramen, side, and a drink. 11am–2pm weekdays.",
      discountText: "$12",
      days: 14,
    },
  ],
  "pali-wine-co": [
    {
      type: "special",
      title: "Tasting flight 25% off this weekend",
      description: "Friday through Sunday. Walk-ins welcome.",
      discountText: "25% OFF",
      days: 7,
    },
    {
      type: "announcement",
      title: "New Pinot Noir release party Saturday",
      description: "Meet the winemaker. Light bites included.",
      days: 14,
    },
  ],
  "mikes-trains-hobbies": [
    {
      type: "coupon",
      title: "10% off any model train kit",
      description: "Valid in-store. Show this coupon at checkout.",
      discountText: "10% OFF",
      days: 30,
    },
    {
      type: "announcement",
      title: "Open Saturdays this month",
      description: "Extended weekend hours through the month.",
      days: 30,
    },
  ],
  "hodges-automotive": [
    {
      type: "coupon",
      title: "$25 off any oil change",
      description: "Synthetic or conventional. Mention Lompoc Deals.",
      discountText: "$25 OFF",
      days: 60,
    },
    {
      type: "coupon",
      title: "Free brake inspection",
      description: "30-minute check, no obligation.",
      discountText: "FREE",
      days: 30,
    },
  ],
  "pl-transmissions-auto-repair": [
    {
      type: "coupon",
      title: "Free transmission diagnostic",
      description: "Bring it in for an honest assessment.",
      discountText: "FREE",
      days: 30,
    },
    {
      type: "special",
      title: "$50 off any major service over $300",
      description: "Limit one per visit.",
      discountText: "$50 OFF",
      days: 45,
    },
  ],
  "lompoc-barber-lounge": [
    {
      type: "coupon",
      title: "$5 off your first cut",
      description: "New clients only. Walk-ins welcome.",
      discountText: "$5 OFF",
      days: 30,
    },
    {
      type: "special",
      title: "Add a hot-towel shave for $10",
      description: "Add a hot-towel shave to any cut at half off.",
      discountText: "$10",
      days: 14,
    },
  ],
  "ramiros-barbershop": [
    {
      type: "coupon",
      title: "Walk-in haircut $15",
      description: "Regular $20. Walk-ins only.",
      discountText: "$15",
      days: 21,
    },
    {
      type: "announcement",
      title: "New extended hours starting Monday",
      description: "Open later weekdays — see you after work.",
      days: 14,
    },
  ],
  "pier-fitness": [
    {
      type: "coupon",
      title: "First week free for new members",
      description: "Try the gym, pool, and group classes — no commitment.",
      discountText: "FREE WEEK",
      days: 30,
    },
    {
      type: "special",
      title: "Bring a friend free on weekends",
      description: "Members can bring one guest free Saturday and Sunday.",
      discountText: "BOGO",
      days: 14,
    },
  ],
  "yoga-vie": [
    {
      type: "coupon",
      title: "First class free for new students",
      description: "Drop in any class to try the studio.",
      discountText: "FREE",
      days: 30,
    },
  ],
  "blooming-energy": [
    {
      type: "special",
      title: "Drop-in yoga $10",
      description: "Regular $15 — no membership needed.",
      discountText: "$10",
      days: 21,
    },
  ],
  "stillmans-dry-cleaning": [
    {
      type: "coupon",
      title: "20% off any order over $30",
      description: "Drop off Monday–Friday. Mention Lompoc Deals.",
      discountText: "20% OFF",
      days: 30,
    },
  ],
  "ocean-lanes": [
    {
      type: "coupon",
      title: "$2 off bowling per game on Tuesdays",
      description: "All ages. Shoe rental separate.",
      discountText: "$2 OFF",
      days: 30,
    },
    {
      type: "special",
      title: "Family bowling night — $40",
      description: "4 lanes + shoes for up to 6 people. Friday evenings.",
      discountText: "$40",
      days: 14,
    },
  ],
  "lompoc-fun-center": [
    {
      type: "coupon",
      title: "Free game of mini golf",
      description: "With any arcade card purchase. One per visit.",
      discountText: "FREE",
      days: 21,
    },
    {
      type: "special",
      title: "Birthday party packages 15% off",
      description: "Book a party for 8+ and save.",
      discountText: "15% OFF",
      days: 60,
    },
  ],
  "movies-lompoc": [
    {
      type: "coupon",
      title: "$2 off any concession combo",
      description: "Show this at the snack counter.",
      discountText: "$2 OFF",
      days: 21,
    },
  ],
}

function daysFromNow(d) {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("== BEFORE ==")
  const beforeBiz = await sql`select count(*)::int as n from businesses`
  const beforeDeal = await sql`select count(*)::int as n from deals`
  console.log(`  businesses: ${beforeBiz[0].n}, deals: ${beforeDeal[0].n}`)

  console.log("\n== Wiping businesses + deals (cascade) ==")
  await sql`delete from businesses`

  console.log("\n== Ensuring system owner exists ==")
  const placeholderHash = await bcrypt.hash(
    "placeholder-not-for-login-" + Math.random(),
    10
  )
  await sql`
    insert into users (email, password_hash, role)
    values ('system@lompocdeals.test', ${placeholderHash}, 'business')
    on conflict (email) do nothing
  `
  const owner = await sql`select id from users where email = 'system@lompocdeals.test'`
  const ownerId = owner[0].id

  const cats = await sql`select id, slug from categories`
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

  console.log(`\n== Inserting ${BUSINESSES.length} businesses ==`)
  const slugToId = {}
  for (const b of BUSINESSES) {
    const [row] = await sql`
      insert into businesses (
        owner_user_id, name, slug, description, category_id,
        address, lat, lng, phone, website, status
      )
      values (
        ${ownerId},
        ${b.name},
        ${b.slug},
        ${b.description},
        ${catBySlug[b.categorySlug]},
        ${b.address},
        ${b.lat},
        ${b.lng},
        ${b.phone},
        ${b.website},
        'approved'
      )
      returning id
    `
    slugToId[b.slug] = row.id
    console.log(`  ✓ ${b.name}`)
  }

  console.log(`\n== Inserting sample deals ==`)
  let dealCount = 0
  for (const [slug, dealList] of Object.entries(DEALS)) {
    const businessId = slugToId[slug]
    if (!businessId) {
      console.log(`  ✗ skipped — no business for slug ${slug}`)
      continue
    }
    for (const d of dealList) {
      await sql`
        insert into deals (
          business_id, type, title, description, discount_text,
          starts_at, expires_at
        )
        values (
          ${businessId},
          ${d.type},
          ${d.title},
          ${d.description},
          ${d.discountText ?? null},
          now(),
          ${daysFromNow(d.days).toISOString()}
        )
      `
      dealCount++
    }
  }
  console.log(`  ✓ ${dealCount} deals inserted`)

  console.log("\n== AFTER ==")
  const afterBiz = await sql`select count(*)::int as n from businesses`
  const afterDeal = await sql`select count(*)::int as n from deals`
  console.log(`  businesses: ${afterBiz[0].n}, deals: ${afterDeal[0].n}`)

  const byCat = await sql`
    select c.name as category, count(b.id)::int as n
    from categories c
    left join businesses b on b.category_id = c.id and b.status = 'approved'
    group by c.name
    order by c.name
  `
  console.log("\n  By category:")
  byCat.forEach((r) => console.log(`    ${r.category.padEnd(20)} ${r.n}`))
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
