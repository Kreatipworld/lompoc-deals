// Add 2 "Other" category businesses + cover images for all businesses.
// Idempotent: uses upsert/update where possible.
// Run: node --env-file=.env.local db/add-other-and-images.mjs

import { neon } from "@neondatabase/serverless"

const NEW_OTHER = [
  {
    name: "Lompoc Public Library",
    slug: "lompoc-public-library",
    description:
      "Serving the Lompoc Valley for more than 100 years with books, digital resources, and community programs.",
    address: "501 E North Ave, Lompoc, CA 93436",
    phone: "(805) 875-8775",
    website: "https://www.cityoflompoc.com/services/library",
    lat: 34.6450,
    lng: -120.4540,
  },
  {
    name: "Lompoc Museum",
    slug: "lompoc-museum",
    description:
      "Local history museum featuring Chumash artifacts, pioneer tales, and a 7-million-year-old dolphin fossil.",
    address: "200 S H St, Lompoc, CA 93436",
    phone: "(805) 736-3888",
    website: null,
    lat: 34.6378,
    lng: -120.4585,
  },
]

function coverUrlFor(slug) {
  return `https://picsum.photos/seed/${slug}/1200/600`
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  // ----- Add 2 Other businesses if missing -----
  const ownerRows = await sql`
    select id from users where email = 'system@lompocdeals.test'
  `
  const ownerId = ownerRows[0].id

  const otherCat = await sql`select id from categories where slug = 'other'`
  const otherCatId = otherCat[0].id

  console.log("== Adding 'Other' category businesses ==")
  for (const b of NEW_OTHER) {
    const existing =
      await sql`select id from businesses where slug = ${b.slug}`
    if (existing.length) {
      console.log(`  ↻ ${b.name} (already exists)`)
      continue
    }
    await sql`
      insert into businesses (
        owner_user_id, name, slug, description, category_id,
        address, lat, lng, phone, website, status
      )
      values (
        ${ownerId},
        ${b.name},
        ${b.slug},
        ${b.description},
        ${otherCatId},
        ${b.address},
        ${b.lat},
        ${b.lng},
        ${b.phone},
        ${b.website},
        'approved'
      )
    `
    console.log(`  ✓ ${b.name}`)
  }

  // ----- Set cover images on all businesses -----
  console.log("\n== Setting cover images for all businesses ==")
  const all = await sql`select id, slug, name from businesses`
  for (const b of all) {
    const url = coverUrlFor(b.slug)
    await sql`update businesses set cover_url = ${url} where id = ${b.id}`
    console.log(`  ✓ ${b.name}`)
  }

  // ----- Set image URLs on all deals -----
  console.log("\n== Setting deal images ==")
  const allDeals = await sql`
    select d.id, d.title, b.slug as biz_slug
    from deals d join businesses b on b.id = d.business_id
  `
  for (const d of allDeals) {
    const url = `https://picsum.photos/seed/${d.biz_slug}-${d.id}/800/450`
    await sql`update deals set image_url = ${url} where id = ${d.id}`
  }
  console.log(`  ✓ ${allDeals.length} deals`)

  console.log("\n== Final state ==")
  const counts = await sql`
    select c.name as category, count(b.id)::int as n
    from categories c
    left join businesses b on b.category_id = c.id and b.status = 'approved'
    group by c.name
    order by c.name
  `
  counts.forEach((r) => console.log(`  ${r.category.padEnd(20)} ${r.n}`))
  const total = await sql`select count(*)::int as n from businesses`
  console.log(`\n  Total businesses: ${total[0].n}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
