// Seed script: all Lompoc, CA restaurants
// Run: node --env-file=.env.local db/seed-restaurants.mjs
//
// Non-destructive — uses ON CONFLICT DO NOTHING on slug.
// Adds restaurants not already in the businesses table.

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

// Researched from Yelp, TripAdvisor, ExploreLomc, and Chamber of Commerce (April 2026).
// All businesses are real Lompoc, CA restaurants.
const RESTAURANTS = [
  // ---- American / Bar & Grill ----
  {
    name: "Valle Eatery & Bar",
    slug: "valle-eatery-bar",
    description:
      "California cuisine inside the Hilton Garden Inn — seasonal menu, full bar, and a welcoming patio.",
    address: "1201 N H St, Lompoc, CA 93436",
    phone: "(805) 735-1880",
    website: "https://www.valleeatery.com",
    lat: 34.6540,
    lng: -120.4583,
  },
  {
    name: "Eddie's Grill",
    slug: "eddies-grill",
    description:
      "Beloved local lunch and dinner spot on N H Street serving fresh salads, sandwiches, wraps, and hearty bowls.",
    address: "1325 N H St, Lompoc, CA 93436",
    phone: "(805) 735-4488",
    website: null,
    lat: 34.6565,
    lng: -120.4583,
  },
  {
    name: "The Hook & Slice",
    slug: "the-hook-and-slice",
    description:
      "Bar and eatery at the golf club serving burgers, pizza by the slice, sandwiches, and cold drinks.",
    address: "4300 Club House Rd, Lompoc, CA 93436",
    phone: "(805) 733-3535",
    website: null,
    lat: 34.6630,
    lng: -120.4300,
  },
  {
    name: "Applebee's Grill + Bar",
    slug: "applebees-lompoc",
    description:
      "Full-service casual dining chain with American favorites, cocktails, and happy hour specials.",
    address: "621 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 735-2141",
    website: "https://restaurants.applebees.com",
    lat: 34.6415,
    lng: -120.4665,
  },

  // ---- Breakfast / Brunch ----
  {
    name: "The Morning Stop Restaurant",
    slug: "the-morning-stop",
    description:
      "Cozy breakfast-and-lunch diner on N V Street, open weekdays only — known for hearty plates and friendly service.",
    address: "129 N V St, Lompoc, CA 93436",
    phone: "(805) 733-7578",
    website: null,
    lat: 34.6398,
    lng: -120.4490,
  },

  // ---- Mexican ----
  {
    name: "Floriano's Mexican Food",
    slug: "florianos-mexican-food",
    description:
      "Family-owned taqueria and butcher shop serving authentic Mexican — tacos, burritos, menudo, tri-tip, and fresh salsa.",
    address: "1140 N H St, Lompoc, CA 93436",
    phone: "(805) 737-9396",
    website: "https://www.florianos.net",
    lat: 34.6522,
    lng: -120.4583,
  },
  {
    name: "Mr. Taco",
    slug: "mr-taco-lompoc",
    description:
      "Popular family taqueria on Constellation Road serving street tacos, burritos, quesadillas, and agua frescas.",
    address: "3734 Constellation Rd, Lompoc, CA 93436",
    phone: "(805) 733-3213",
    website: "https://www.mrtacolompoc.com",
    lat: 34.6660,
    lng: -120.4420,
  },
  {
    name: "Taqueria La Mision",
    slug: "taqueria-la-mision",
    description:
      "Authentic Mexican taqueria on Burton Mesa Blvd with a loyal local following for its carne asada and al pastor tacos.",
    address: "1410 Burton Mesa Blvd, Lompoc, CA 93436",
    phone: "(805) 741-7733",
    website: null,
    lat: 34.6580,
    lng: -120.4430,
  },

  // ---- Pizza ----
  {
    name: "Eye on I",
    slug: "eye-on-i",
    description:
      "Downtown pizza restaurant at 131 N I Street — hand-tossed pies, calzones, salads, and a full bar.",
    address: "131 N I St, Lompoc, CA 93436",
    phone: "(805) 735-6393",
    website: null,
    lat: 34.6395,
    lng: -120.4595,
  },
  {
    name: "Bravo Pizza",
    slug: "bravo-pizza-lompoc",
    description:
      "Family pizza spot in downtown Lompoc serving New York-style pies, pasta, and calzones since the 1990s.",
    address: "129 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 737-6181",
    website: null,
    lat: 34.6409,
    lng: -120.4602,
  },

  // ---- Asian ----
  {
    name: "Sake Sushi",
    slug: "sake-sushi-lompoc",
    description:
      "Japanese and Korean fusion restaurant on N H Street with sushi rolls, ramen, bibimbap, and sake selections.",
    address: "1325 N H St Ste C, Lompoc, CA 93436",
    phone: "(805) 736-8899",
    website: "https://www.sakesushilompoc.com",
    lat: 34.6565,
    lng: -120.4582,
  },
  {
    name: "Suvans Kitchen",
    slug: "suvans-kitchen",
    description:
      "Authentic Thai, Laotian, and Chinese cuisine tucked into the Central Ave strip — a Lompoc gem for noodle and curry lovers.",
    address: "129 W Central Ave Ste E, Lompoc, CA 93436",
    phone: "(805) 737-9802",
    website: null,
    lat: 34.6410,
    lng: -120.4604,
  },

  // ---- Mediterranean / Middle Eastern ----
  {
    name: "Happy Mediterranean Restaurant",
    slug: "happy-mediterranean",
    description:
      "Casual Mediterranean and Middle Eastern fast food on East Ocean Ave — falafel, shawarma, gyros, and fresh salads.",
    address: "1100 E Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 623-6389",
    website: null,
    lat: 34.6385,
    lng: -120.4490,
  },

  // ---- Seafood / British ----
  {
    name: "Alfie's Fish & Chips",
    slug: "alfies-fish-chips",
    description:
      "Lompoc institution since 1969 serving authentic English-style fish & chips, clam chowder, and British treats.",
    address: "610 N H St, Lompoc, CA 93436",
    phone: "(805) 736-0154",
    website: "https://alfiesfish.com",
    lat: 34.6453,
    lng: -120.4583,
  },

  // ---- Drinks / Specialty ----
  {
    name: "Flare",
    slug: "flare-lompoc",
    description:
      "Trendy bubble tea and specialty drinks shop on W Ocean Ave with creative boba, smoothies, and light bites.",
    address: "510 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 972-3047",
    website: null,
    lat: 34.6384,
    lng: -120.4655,
  },
  {
    name: "Capulin Eats & Provisions",
    slug: "capulin-eats",
    description:
      "Neighborhood café and provisions market at 12th Street — coffee, breakfast bites, sandwiches, and locally sourced goods.",
    address: "300 N 12th St Ste 1E, Lompoc, CA 93436",
    phone: "(805) 743-4151",
    website: null,
    lat: 34.6408,
    lng: -120.4520,
  },

  // ---- Craft Beer / Taproom ----
  {
    name: "Hoptions Taproom & Eatery",
    slug: "hoptions-taproom",
    description:
      "Solvang Brewing Company's Lompoc taproom with craft beers brewed on-site, plus burgers, wings, and wood-fired bites.",
    address: "234 N H St, Lompoc, CA 93436",
    phone: "(805) 735-2099",
    website: "https://solvangbrewing.com",
    lat: 34.6406,
    lng: -120.4585,
  },

  // ---- BBQ ----
  {
    name: "Glaze's Smokehouse and BBQ",
    slug: "glazes-smokehouse-bbq",
    description:
      "Downtown BBQ joint on N H Street dishing up smoked brisket, pulled pork, ribs, and loaded sides.",
    address: "234 N H St, Lompoc, CA 93436",
    phone: "(805) 741-7610",
    website: null,
    lat: 34.6406,
    lng: -120.4585,
  },

  // ---- Wings / Fast Casual ----
  {
    name: "Wingstop",
    slug: "wingstop-lompoc",
    description:
      "Chicken wing chain with 11 classic flavors, tenders, and seasoned fries on N H Street.",
    address: "1413 N H St, Lompoc, CA 93436",
    phone: "(805) 741-7900",
    website: "https://www.wingstop.com",
    lat: 34.6570,
    lng: -120.4583,
  },
]

// Sample deals keyed by slug
const DEALS = {
  "valle-eatery-bar": [
    {
      type: "special",
      title: "Happy hour 3–6pm weekdays",
      description: "Half-price appetizers and $2 off all cocktails.",
      discountText: "HAPPY HOUR",
      days: 30,
    },
    {
      type: "announcement",
      title: "Seasonal menu now available",
      description: "New California-inspired dishes featuring local Santa Barbara County produce.",
      days: 14,
    },
  ],
  "eddies-grill": [
    {
      type: "coupon",
      title: "$2 off any combo meal",
      description: "Dine-in or takeout. Mention Lompoc Deals.",
      discountText: "$2 OFF",
      days: 21,
    },
  ],
  "the-hook-and-slice": [
    {
      type: "special",
      title: "Golf + lunch combo — $35",
      description: "9 holes and a burger combo at the clubhouse. Weekdays only.",
      discountText: "$35",
      days: 30,
    },
  ],
  "applebees-lompoc": [
    {
      type: "special",
      title: "Date night 2 for $25",
      description: "Two entrees and one appetizer for just $25. Dine-in only.",
      discountText: "2 FOR $25",
      days: 14,
    },
  ],
  "the-morning-stop": [
    {
      type: "coupon",
      title: "Free coffee with any breakfast",
      description: "Weekday mornings. Show this deal to your server.",
      discountText: "FREE COFFEE",
      days: 21,
    },
  ],
  "florianos-mexican-food": [
    {
      type: "coupon",
      title: "3 tacos for $9",
      description: "Any combination. Mention Lompoc Deals at the counter.",
      discountText: "3 FOR $9",
      days: 14,
    },
    {
      type: "announcement",
      title: "Sunday menudo special",
      description: "Fresh menudo every Sunday morning. Limited quantity.",
      days: 7,
    },
  ],
  "mr-taco-lompoc": [
    {
      type: "coupon",
      title: "$1 off any burrito",
      description: "All burritos included. Mention Lompoc Deals.",
      discountText: "$1 OFF",
      days: 21,
    },
  ],
  "taqueria-la-mision": [
    {
      type: "special",
      title: "Taco Tuesday — $2 tacos",
      description: "All day Tuesday — carne asada, al pastor, and pollo.",
      discountText: "$2 TACOS",
      days: 30,
    },
  ],
  "eye-on-i": [
    {
      type: "coupon",
      title: "$3 off any 16-inch pizza",
      description: "Dine-in or pickup. One coupon per order.",
      discountText: "$3 OFF",
      days: 21,
    },
    {
      type: "special",
      title: "Lunch slice deal — $5",
      description: "One slice + a drink 11am–2pm weekdays.",
      discountText: "$5",
      days: 14,
    },
  ],
  "bravo-pizza-lompoc": [
    {
      type: "coupon",
      title: "Free garlic bread with any large pizza",
      description: "In-store pickup only. Mention Lompoc Deals.",
      discountText: "FREE",
      days: 21,
    },
  ],
  "sake-sushi-lompoc": [
    {
      type: "coupon",
      title: "10% off sushi rolls on Wednesdays",
      description: "Dine-in only. Not valid on specialty or chef's rolls.",
      discountText: "10% OFF",
      days: 30,
    },
    {
      type: "special",
      title: "Lunch bento box — $14",
      description: "Choice of protein + miso soup + salad + rice. Weekday lunches.",
      discountText: "$14",
      days: 21,
    },
  ],
  "suvans-kitchen": [
    {
      type: "coupon",
      title: "$2 off any noodle dish",
      description: "Pad Thai, Pad See Ew, and more. Mention Lompoc Deals.",
      discountText: "$2 OFF",
      days: 21,
    },
  ],
  "happy-mediterranean": [
    {
      type: "coupon",
      title: "Free side with any combo plate",
      description: "Choose hummus, tabbouleh, or fattoush. One per customer.",
      discountText: "FREE SIDE",
      days: 21,
    },
  ],
  "alfies-fish-chips": [
    {
      type: "coupon",
      title: "$2 off any fish & chips combo",
      description: "Classic British combo with coleslaw and tartar sauce.",
      discountText: "$2 OFF",
      days: 30,
    },
    {
      type: "special",
      title: "Family meal deal — 4 combos for $40",
      description: "Perfect for the whole family. Pickup or dine-in.",
      discountText: "$40",
      days: 21,
    },
  ],
  "flare-lompoc": [
    {
      type: "coupon",
      title: "$1 off any boba drink",
      description: "All sizes. Mention Lompoc Deals at the counter.",
      discountText: "$1 OFF",
      days: 14,
    },
  ],
  "capulin-eats": [
    {
      type: "coupon",
      title: "Free pastry with any coffee purchase",
      description: "Weekend mornings only. While supplies last.",
      discountText: "FREE PASTRY",
      days: 21,
    },
  ],
  "hoptions-taproom": [
    {
      type: "special",
      title: "Pint & pretzel — $8",
      description: "Any house-brewed pint + warm pretzel bites. All day.",
      discountText: "$8",
      days: 21,
    },
    {
      type: "announcement",
      title: "New seasonal IPA on tap",
      description: "Freshly brewed spring IPA — stop in for a taste.",
      days: 14,
    },
  ],
  "glazes-smokehouse-bbq": [
    {
      type: "coupon",
      title: "$5 off any BBQ platter",
      description: "Brisket, pulled pork, or ribs platter. Mention Lompoc Deals.",
      discountText: "$5 OFF",
      days: 21,
    },
  ],
  "wingstop-lompoc": [
    {
      type: "coupon",
      title: "10 wings for the price of 8",
      description: "Any flavor combo. Carryout only. Mention Lompoc Deals.",
      discountText: "10 FOR 8",
      days: 14,
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

  console.log("== Seeding Lompoc restaurants ==\n")

  // Ensure system owner exists
  const placeholderHash = await bcrypt.hash(
    "placeholder-not-for-login-" + Math.random(),
    10
  )
  await sql`
    insert into users (email, password_hash, role)
    values ('system@lompocdeals.test', ${placeholderHash}, 'business')
    on conflict (email) do nothing
  `
  const [owner] = await sql`select id from users where email = 'system@lompocdeals.test'`
  const ownerId = owner.id

  // Get food-drink category
  const cats = await sql`select id, slug from categories`
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]))
  const foodDrinkCategoryId = catBySlug["food-drink"]

  if (!foodDrinkCategoryId) {
    console.error("ERROR: 'food-drink' category not found. Run seed.ts first.")
    process.exit(1)
  }

  // Insert restaurants (skip duplicates by slug)
  console.log(`Inserting ${RESTAURANTS.length} restaurants (skipping existing)...\n`)
  const slugToId = {}
  let inserted = 0
  let skipped = 0

  for (const r of RESTAURANTS) {
    const rows = await sql`
      insert into businesses (
        owner_user_id, name, slug, description, category_id,
        address, lat, lng, phone, website, status
      )
      values (
        ${ownerId},
        ${r.name},
        ${r.slug},
        ${r.description},
        ${foodDrinkCategoryId},
        ${r.address},
        ${r.lat},
        ${r.lng},
        ${r.phone ?? null},
        ${r.website ?? null},
        'approved'
      )
      on conflict (slug) do nothing
      returning id
    `
    if (rows.length > 0) {
      slugToId[r.slug] = rows[0].id
      inserted++
      console.log(`  ✓ ${r.name}`)
    } else {
      // fetch existing id for deal insertion
      const existing = await sql`select id from businesses where slug = ${r.slug}`
      if (existing.length > 0) slugToId[r.slug] = existing[0].id
      skipped++
      console.log(`  ~ ${r.name} (already exists)`)
    }
  }

  console.log(`\n  Inserted: ${inserted}, Skipped: ${skipped}`)

  // Insert deals
  console.log("\nInserting sample deals...\n")
  let dealCount = 0

  for (const [slug, dealList] of Object.entries(DEALS)) {
    const businessId = slugToId[slug]
    if (!businessId) {
      console.log(`  ✗ No business id for slug "${slug}", skipping deals`)
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

  // Summary
  const [bizCount] = await sql`select count(*)::int as n from businesses where status = 'approved'`
  const [dealTotal] = await sql`select count(*)::int as n from deals`
  console.log(`\n== Done ==`)
  console.log(`  Total approved businesses: ${bizCount.n}`)
  console.log(`  Total deals: ${dealTotal.n}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
