// One-off migration: delete fake seed businesses, insert 10 real Lompoc ones.
// Run with: node --env-file=.env.local db/migrate-to-real-businesses.mjs
//
// Idempotent on the user side (uses on conflict do nothing for the system owner)
// but DESTRUCTIVE on businesses — it deletes ALL existing businesses first.

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const NEW_BUSINESSES = [
  {
    name: "Old Town Kitchen & Bar",
    slug: "old-town-kitchen-bar",
    categorySlug: "food-drink",
    description:
      "Casual American dining and full bar in Old Town Lompoc, known for steaks and a build-your-own mac & cheese bar.",
    address: "Old Town, Lompoc, CA",
    geocodeQuery: "Old Town Kitchen and Bar, Lompoc, CA",
  },
  {
    name: "South Side Coffee Co.",
    slug: "south-side-coffee-co",
    categorySlug: "food-drink",
    description:
      "Downtown coffee shop on H Street featuring local artwork, an upstairs loft, and a casual neighborhood feel.",
    address: "H Street, Lompoc, CA 93436",
    geocodeQuery: "South Side Coffee Co, Lompoc, CA",
  },
  {
    name: "La Botte",
    slug: "la-botte",
    categorySlug: "food-drink",
    description:
      "Authentic Italian restaurant serving classic dishes and a thoughtful selection of local and Italian wines.",
    address: "Lompoc, CA",
    geocodeQuery: "La Botte restaurant, Lompoc, CA",
  },
  {
    name: "Chow-Ya",
    slug: "chow-ya",
    categorySlug: "food-drink",
    description:
      "Asian fusion spot serving poke bowls, ramen, and bulgogi to a loyal Lompoc following.",
    address: "Lompoc, CA",
    geocodeQuery: "Chow-Ya restaurant, Lompoc, CA",
  },
  {
    name: "Sta. Rita Hills Wine Center",
    slug: "sta-rita-hills-wine-center",
    categorySlug: "food-drink",
    description:
      "Premier wine tasting destination featuring four award-winning tasting rooms, a patio, and regular events.",
    address: "1601 W Chestnut Ct, Lompoc, CA 93436",
    geocodeQuery: "1601 W Chestnut Ct, Lompoc, CA 93436",
  },
  {
    name: "Mike's Trains & Hobbies",
    slug: "mikes-trains-hobbies",
    categorySlug: "retail",
    description:
      "Downtown hobby shop with model trains, hobby supplies, and locally curated gifts.",
    address: "Downtown Lompoc, CA",
    geocodeQuery: "Mike's Trains and Hobbies, Lompoc, CA",
  },
  {
    name: "Hodges Automotive",
    slug: "hodges-automotive",
    categorySlug: "auto",
    description:
      "Family-owned AAA-approved auto repair shop serving Lompoc since 1970, known for honest workmanship.",
    address: "Lompoc, CA",
    geocodeQuery: "Hodges Automotive, Lompoc, CA",
  },
  {
    name: "P&L Transmissions & Auto Repair",
    slug: "pl-transmissions-auto-repair",
    categorySlug: "auto",
    description:
      "ASE Master Tech-certified automotive repair shop offering reliable service and complimentary local pickup.",
    address: "Lompoc, CA",
    geocodeQuery: "P&L Transmissions, Lompoc, CA",
  },
  {
    name: "Lompoc Barber Lounge",
    slug: "lompoc-barber-lounge",
    categorySlug: "health-beauty",
    description:
      "Modern barbershop in historic downtown Lompoc offering classic cuts, fades, and hot-towel shaves.",
    address: "137 N H St, Lompoc, CA 93436",
    geocodeQuery: "137 N H St, Lompoc, CA 93436",
  },
  {
    name: "Ramiro's Barbershop",
    slug: "ramiros-barbershop",
    categorySlug: "health-beauty",
    description:
      "Local barbershop on H Street offering walk-in cuts and traditional grooming services.",
    address: "734 N H St, Lompoc, CA 93436",
    geocodeQuery: "734 N H St, Lompoc, CA 93436",
  },
]

async function geocode(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", query)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "us")
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LompocDeals/1.0 (lompocdeals.local)",
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("== BEFORE ==")
  const beforeBiz = await sql`select count(*)::int as n from businesses`
  const beforeDeal = await sql`select count(*)::int as n from deals`
  console.log(`  businesses: ${beforeBiz[0].n}, deals: ${beforeDeal[0].n}`)

  console.log("\n== Deleting all existing businesses (cascades to deals + favorites) ==")
  await sql`delete from businesses`

  console.log("\n== Creating system placeholder owner ==")
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
  console.log(`  system owner id: ${ownerId}`)

  console.log("\n== Loading category map ==")
  const cats = await sql`select id, slug from categories`
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]))
  console.log(`  ${Object.keys(catBySlug).length} categories`)

  console.log("\n== Inserting real businesses (with Nominatim geocoding, 1.1s/req) ==")
  for (const b of NEW_BUSINESSES) {
    process.stdout.write(`  • ${b.name.padEnd(40)} `)
    const coords = await geocode(b.geocodeQuery)
    if (coords) {
      process.stdout.write(`(${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})\n`)
    } else {
      process.stdout.write(`(no geocode result — pin will be missing)\n`)
    }
    await sql`
      insert into businesses (
        owner_user_id, name, slug, description, category_id,
        address, lat, lng, status
      )
      values (
        ${ownerId},
        ${b.name},
        ${b.slug},
        ${b.description},
        ${catBySlug[b.categorySlug]},
        ${b.address},
        ${coords?.lat ?? null},
        ${coords?.lng ?? null},
        'approved'
      )
    `
    // Be polite to Nominatim (1 req/sec policy)
    await new Promise((r) => setTimeout(r, 1100))
  }

  console.log("\n== AFTER ==")
  const after = await sql`
    select b.name, b.address, b.lat, b.lng, b.status, c.name as category
    from businesses b
    left join categories c on c.id = b.category_id
    order by b.id
  `
  after.forEach((b) => {
    const coord =
      b.lat && b.lng
        ? `(${b.lat.toFixed(4)}, ${b.lng.toFixed(4)})`
        : "(no pin)"
    console.log(`  ${b.name.padEnd(40)} ${b.category?.padEnd(15) ?? ""} ${coord}`)
  })
  console.log(`\n  Total: ${after.length} businesses`)
  console.log(
    `  With geocoded pins: ${after.filter((b) => b.lat && b.lng).length}`
  )
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
