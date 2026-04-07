// Add more verified Lompoc real estate brokerages.
// Run: node --env-file=.env.local db/seed-more-brokerages.mjs
// Idempotent: skips slugs that already exist.

import { neon } from "@neondatabase/serverless"

const NEW_BROKERAGES = [
  {
    name: "Keller Williams Realty SB Lompoc",
    slug: "keller-williams-realty-sb-lompoc",
    description:
      "Lompoc office of Keller Williams Realty Santa Barbara — full-service residential brokerage with local agents.",
    address: "1512 N H Street, Suite C, Lompoc, CA 93436",
    phone: null,
    website: "https://kw.com",
    facebookUrl: null,
    lat: 34.6485,
    lng: -120.4585,
  },
  {
    name: "EXP Realty of California",
    slug: "exp-realty-lompoc",
    description:
      "Cloud-based real estate brokerage with local Lompoc agents serving the Central Coast.",
    address: "Lompoc, CA 93436",
    phone: "(805) 588-2425",
    website: "https://exprealty.com",
    facebookUrl: null,
    lat: 34.6391,
    lng: -120.4579,
  },
  {
    name: "Compass — Lompoc",
    slug: "compass-lompoc",
    description:
      "Compass agents serving Lompoc and the Central Coast. Modern real estate technology + local market expertise.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: "https://www.compass.com/agents/locations/lompoc-ca/17441/",
    facebookUrl: null,
    lat: 34.6395,
    lng: -120.4585,
  },
  {
    name: "Berkshire Hathaway HomeServices California Properties",
    slug: "berkshire-hathaway-lompoc",
    description:
      "Berkshire Hathaway HomeServices California Properties — local Lompoc agents backed by the strength of the Berkshire Hathaway brand.",
    address: "Lompoc, CA 93436",
    phone: null,
    website: "https://www.bhhscalifornia.com/",
    facebookUrl: null,
    lat: 34.6388,
    lng: -120.4582,
  },
]

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  const owner = await sql`select id from users where email = 'system@lompocdeals.test'`
  if (owner.length === 0) {
    console.error("system owner not found")
    process.exit(1)
  }
  const ownerId = owner[0].id

  const cat = await sql`select id from categories where slug = 'real-estate'`
  if (cat.length === 0) {
    console.error("real-estate category not found")
    process.exit(1)
  }
  const catId = cat[0].id

  let inserted = 0
  for (const b of NEW_BROKERAGES) {
    const existing = await sql`select id from businesses where slug = ${b.slug}`
    if (existing.length) {
      console.log(`  ↻ ${b.name} already exists, skipping`)
      continue
    }
    await sql`
      insert into businesses (
        owner_user_id, name, slug, description, category_id,
        address, lat, lng, phone, website, facebook_url,
        cover_url, status
      )
      values (
        ${ownerId},
        ${b.name},
        ${b.slug},
        ${b.description},
        ${catId},
        ${b.address},
        ${b.lat},
        ${b.lng},
        ${b.phone},
        ${b.website},
        ${b.facebookUrl},
        ${`https://picsum.photos/seed/${b.slug}/1200/600`},
        'approved'
      )
    `
    inserted++
    console.log(`  ✓ ${b.name}`)
  }

  console.log(`\n${inserted} new brokerages added`)

  const total = await sql`
    select count(*)::int as n
    from businesses b
    join categories c on c.id = b.category_id
    where c.slug = 'real-estate'
  `
  console.log(`Total real estate brokerages now: ${total[0].n}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
