// Replace seeded listings with REAL Lompoc data from Zillow/Coldwell Banker.
// Photos are themed Unsplash stock images (we don't have rights to MLS photos).
// Real addresses + real prices + real specs.
//
// Run: node --env-file=.env.local db/seed-real-listings.mjs

import { neon } from "@neondatabase/serverless"

// Brokerage assignment is arbitrary — these are real listings but not
// necessarily listed by these specific brokerages in real life.
const LISTINGS = {
  "coldwell-banker-select-realty": [
    {
      type: "for-sale",
      title: "3-bed home on Bellflower Lane",
      description:
        "Single-family home in a quiet residential neighborhood. 3 bedrooms, 2 full baths. Listed March 2026.",
      priceCents: 59900000, // $599,000 — verified Coldwell Banker listing
      beds: 3,
      baths: 2,
      sqft: null,
      address: "933 Bellflower Ln, Lompoc, CA 93436",
      photoQuery: "modern,house,exterior",
      photoSeed: "bellflower-933",
    },
    {
      type: "for-rent",
      title: "1-bedroom at Oceanwood Apartments",
      description:
        "1-bed apartment at the Oceanwood Apartments complex. Onsite amenities. Available now.",
      priceCents: 205000, // $2,050/mo — verified
      beds: 1,
      baths: 1,
      sqft: null,
      address: "113 S U St, Lompoc, CA 93436",
      photoQuery: "apartment,interior,modern",
      photoSeed: "oceanwood-1bed",
    },
  ],
  "century-21-hometown-realty": [
    {
      type: "for-sale",
      title: "3-bed home on N 2nd Street",
      description:
        "3 bedrooms, 2 bathrooms, 1,316 sqft. Listed price reduced. Established Lompoc neighborhood.",
      priceCents: 45500000, // $455,000 — verified
      beds: 3,
      baths: 2,
      sqft: 1316,
      address: "516 N 2nd St, Lompoc, CA 93436",
      photoQuery: "craftsman,house,front",
      photoSeed: "n2nd-516",
    },
    {
      type: "for-rent",
      title: "3-bed house on Village Meadows Drive",
      description:
        "3-bedroom, 2-bath single-family home, 1,500 sqft. Family-friendly neighborhood. Available now.",
      priceCents: 299500, // $2,995/mo — verified
      beds: 3,
      baths: 2,
      sqft: 1500,
      address: "1376 Village Meadows Dr, Lompoc, CA 93436",
      photoQuery: "single,family,home",
      photoSeed: "village-meadows-1376",
    },
  ],
  "hinkens-group": [
    {
      type: "for-rent",
      title: "5-bed family home on Calle Marana",
      description:
        "Spacious 5-bedroom, 2-bath home, 1,960 sqft. Large yard and quiet cul-de-sac. Available for long-term lease.",
      priceCents: 395000, // $3,950/mo — verified
      beds: 5,
      baths: 2,
      sqft: 1960,
      address: "1445 Calle Marana, Lompoc, CA 93436",
      photoQuery: "spanish,style,house",
      photoSeed: "calle-marana-1445",
    },
    {
      type: "for-rent",
      title: "3-bed home on Amherst Place",
      description:
        "3 bedrooms, 2 baths, 1,337 sqft. Move-in ready. Private back yard with patio.",
      priceCents: 320000, // $3,200/mo — verified
      beds: 3,
      baths: 2,
      sqft: 1337,
      address: "217 Amherst Pl, Lompoc, CA 93436",
      photoQuery: "suburban,home,exterior",
      photoSeed: "amherst-217",
    },
  ],
}

function unsplashUrl(query, seed) {
  return `https://source.unsplash.com/1200x800/?${query}&sig=${seed}`
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("== Wiping existing property listings ==")
  const deleted = await sql`delete from property_listings returning id`
  console.log(`  ${deleted.length} listings removed\n`)

  console.log("== Inserting real Lompoc listings ==")
  let total = 0
  for (const [slug, listings] of Object.entries(LISTINGS)) {
    const biz = await sql`select id from businesses where slug = ${slug}`
    if (biz.length === 0) {
      console.log(`  ✗ business not found: ${slug}`)
      continue
    }
    const businessId = biz[0].id

    for (const l of listings) {
      const imageUrl = unsplashUrl(l.photoQuery, l.photoSeed)
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
      console.log(`  ✓ ${l.title.padEnd(50)} ${price}`)
    }
  }
  console.log(`\n${total} real listings inserted`)

  // Quick sanity check
  const final = await sql`
    select pl.title, pl.price_cents, pl.type, pl.address, b.name as biz
    from property_listings pl
    join businesses b on b.id = pl.business_id
    order by pl.id
  `
  console.log("\n== Final state ==")
  final.forEach((r) => {
    const price =
      r.type === "for-rent"
        ? `$${(r.price_cents / 100).toLocaleString()}/mo`
        : `$${(r.price_cents / 100).toLocaleString()}`
    console.log(`  ${r.address.padEnd(38)} ${price.padEnd(12)} (${r.biz})`)
  })
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
