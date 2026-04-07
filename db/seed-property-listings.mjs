// Seed sample property listings for the 3 real estate brokerages.
// Also deletes any existing "deals" on real estate businesses (they don't fit
// the listings model).
// Run: node --env-file=.env.local db/seed-property-listings.mjs

import { neon } from "@neondatabase/serverless"

const LISTINGS = {
  "coldwell-banker-select-realty": [
    {
      type: "for-sale",
      title: "3-bed Mediterranean on Walnut Ave",
      description:
        "Bright open layout, refinished oak floors, updated kitchen, two-car garage, and a sunny backyard with mature lemon trees. Walking distance to Old Town.",
      priceCents: 67500000, // $675,000
      beds: 3,
      baths: 2,
      sqft: 1820,
      address: "412 W Walnut Ave, Lompoc, CA 93436",
    },
    {
      type: "for-rent",
      title: "Updated 2-bed apartment near downtown",
      description:
        "Recently renovated 2-bed/1-bath with in-unit laundry, off-street parking, and a private patio. Walking distance to H Street shops.",
      priceCents: 195000, // $1,950
      beds: 2,
      baths: 1,
      sqft: 920,
      address: "215 N D St #4, Lompoc, CA 93436",
    },
  ],
  "century-21-hometown-realty": [
    {
      type: "for-sale",
      title: "4-bed family home on a quiet cul-de-sac",
      description:
        "Spacious family home with vaulted ceilings, primary suite, three additional bedrooms, large yard, and a pool. Close to top-rated schools.",
      priceCents: 82500000, // $825,000
      beds: 4,
      baths: 3,
      sqft: 2640,
      address: "1207 Aldebaran Dr, Lompoc, CA 93436",
    },
    {
      type: "for-rent",
      title: "Cozy 1-bed studio in Vandenberg Village",
      description:
        "Bright efficient studio with full kitchen, walk-in closet, and private entrance. Utilities included. Pet-friendly.",
      priceCents: 145000, // $1,450
      beds: 1,
      baths: 1,
      sqft: 510,
      address: "3855 Constellation Rd, Lompoc, CA 93436",
    },
  ],
  "hinkens-group": [
    {
      type: "for-sale",
      title: "Charming 3-bed Craftsman near Old Town",
      description:
        "Lovingly maintained 1940s Craftsman with original built-ins, hardwood floors, fully updated kitchen, and a detached studio in the back.",
      priceCents: 54500000, // $545,000
      beds: 3,
      baths: 2,
      sqft: 1620,
      address: "528 W Cypress Ave, Lompoc, CA 93436",
    },
    {
      type: "for-rent",
      title: "Modern 2-bed townhouse with garage",
      description:
        "Two-story townhouse with attached garage, washer/dryer, central A/C, and a small fenced yard. Quiet neighborhood, close to parks.",
      priceCents: 220000, // $2,200
      beds: 2,
      baths: 2.5,
      sqft: 1240,
      address: "640 N V St #B, Lompoc, CA 93436",
    },
  ],
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  // 1. Delete existing deals on real estate businesses
  console.log("== Deleting old real estate deals ==")
  const deleted = await sql`
    delete from deals
    where business_id in (
      select b.id from businesses b
      join categories c on c.id = b.category_id
      where c.slug = 'real-estate'
    )
    returning id, title
  `
  deleted.forEach((d) => console.log(`  - removed: ${d.title}`))
  console.log(`  ${deleted.length} deals deleted\n`)

  // 2. Insert listings
  console.log("== Seeding property listings ==")
  let total = 0
  for (const [slug, listings] of Object.entries(LISTINGS)) {
    const biz = await sql`select id from businesses where slug = ${slug}`
    if (biz.length === 0) {
      console.log(`  ✗ business not found: ${slug}`)
      continue
    }
    const businessId = biz[0].id

    // Clear any existing listings for this business so the script is idempotent
    await sql`delete from property_listings where business_id = ${businessId}`

    for (let i = 0; i < listings.length; i++) {
      const l = listings[i]
      const imageUrl = `https://picsum.photos/seed/${slug}-listing-${i}/1200/800`
      await sql`
        insert into property_listings (
          business_id, type, title, description, price_cents,
          beds, baths, sqft, address, image_url, status
        )
        values (
          ${businessId},
          ${l.type},
          ${l.title},
          ${l.description},
          ${l.priceCents},
          ${l.beds},
          ${l.baths},
          ${l.sqft},
          ${l.address},
          ${imageUrl},
          'active'
        )
      `
      total++
      const price =
        l.type === "for-rent"
          ? `$${(l.priceCents / 100).toLocaleString()}/mo`
          : `$${(l.priceCents / 100).toLocaleString()}`
      console.log(`  ✓ ${l.title.padEnd(48)} ${price}`)
    }
  }
  console.log(`\n${total} listings inserted`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
