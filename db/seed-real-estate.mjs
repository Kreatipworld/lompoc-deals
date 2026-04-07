// Seed 3 verified Lompoc real estate offices into the new "Real Estate" category.
// Run: node --env-file=.env.local db/seed-real-estate.mjs
// Idempotent: skips if a business with the slug already exists.

import { neon } from "@neondatabase/serverless"

const REAL_ESTATE = [
  {
    name: "Coldwell Banker Select Realty",
    slug: "coldwell-banker-select-realty",
    description:
      "Full-service real estate brokerage serving the Lompoc Valley for over 20 years. Buying, selling, and community-focused agents.",
    address: "129 W Central Ave Suite G, Lompoc, CA 93436",
    phone: "(805) 735-7755",
    website: "https://www.coldwellbanker.com/ca/lompoc/offices/coldwell-banker-select-realty/oid-P00400000FDdqWeSD5lY3dnqildiU77X0WFoiUiq",
    facebookUrl: "https://www.facebook.com/ColdwellBankerLompoc/",
    lat: 34.6395,
    lng: -120.4595,
    deals: [
      {
        type: "announcement",
        title: "Free home valuation — book in 60 seconds",
        description:
          "Curious what your Lompoc home is worth? Schedule a no-obligation valuation with one of our local agents.",
        days: 60,
      },
    ],
  },
  {
    name: "Century 21 Hometown Realty",
    slug: "century-21-hometown-realty",
    description:
      "Lompoc office of the global Century 21 brand. Local agents, hometown service, full residential and commercial coverage.",
    address: "521 E Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-5663",
    website: "https://hometownrealty26.c21.com/",
    facebookUrl: null,
    lat: 34.6388,
    lng: -120.4555,
    deals: [
      {
        type: "announcement",
        title: "First-time buyer info session — Saturday 10am",
        description:
          "Free monthly workshop covering down payments, loans, and the home-buying timeline. Walk-ins welcome.",
        days: 30,
      },
    ],
  },
  {
    name: "The Hinkens Group",
    slug: "hinkens-group",
    description:
      "Family-run brokerage and property management since 1985. Founded by Tom Hinkens, helping Lompoc Valley clients buy, sell, and lease for nearly 40 years.",
    address: "200 E College Ave, Lompoc, CA 93436",
    phone: "(805) 430-3292",
    website: "https://hinkensgroup.com",
    facebookUrl: "https://www.facebook.com/hinkensgroup/",
    lat: 34.6432,
    lng: -120.4570,
    deals: [
      {
        type: "coupon",
        title: "Free seller consultation",
        description:
          "Thinking of selling? Sit down with a Hinkens Group broker for a free 30-minute strategy session.",
        discountText: "FREE",
        days: 60,
      },
      {
        type: "announcement",
        title: "New rental listings every Friday",
        description:
          "Check our website each Friday for the latest rental homes available across the Lompoc Valley.",
        days: 30,
      },
    ],
  },
]

function daysFromNow(d) {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date
}

function coverUrlFor(slug) {
  return `https://picsum.photos/seed/${slug}/1200/600`
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  const owner = await sql`select id from users where email = 'system@lompocdeals.test'`
  if (owner.length === 0) {
    console.error("system owner not found")
    process.exit(1)
  }
  const ownerId = owner[0].id

  const realEstateCat = await sql`select id from categories where slug = 'real-estate'`
  if (realEstateCat.length === 0) {
    console.error("real-estate category not found")
    process.exit(1)
  }
  const catId = realEstateCat[0].id

  let inserted = 0
  let dealsInserted = 0
  for (const b of REAL_ESTATE) {
    const existing = await sql`select id from businesses where slug = ${b.slug}`
    let bizId
    if (existing.length) {
      console.log(`  ↻ ${b.name} already exists, updating`)
      await sql`
        update businesses set
          name = ${b.name},
          description = ${b.description},
          category_id = ${catId},
          address = ${b.address},
          lat = ${b.lat},
          lng = ${b.lng},
          phone = ${b.phone},
          website = ${b.website},
          facebook_url = ${b.facebookUrl},
          status = 'approved',
          cover_url = ${coverUrlFor(b.slug)}
        where slug = ${b.slug}
      `
      bizId = existing[0].id
    } else {
      const result = await sql`
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
          ${coverUrlFor(b.slug)},
          'approved'
        )
        returning id
      `
      bizId = result[0].id
      inserted++
      console.log(`  ✓ inserted ${b.name}`)
    }

    for (const d of b.deals) {
      await sql`
        insert into deals (
          business_id, type, title, description, discount_text,
          starts_at, expires_at, image_url
        )
        values (
          ${bizId},
          ${d.type},
          ${d.title},
          ${d.description},
          ${d.discountText ?? null},
          now(),
          ${daysFromNow(d.days).toISOString()},
          ${`https://picsum.photos/seed/${b.slug}-deal-${dealsInserted}/800/450`}
        )
      `
      dealsInserted++
    }
  }

  console.log(`\n${inserted} new businesses, ${dealsInserted} deals inserted`)
  const final = await sql`
    select b.name, c.name as cat, b.address, b.phone
    from businesses b
    left join categories c on c.id = b.category_id
    where c.slug = 'real-estate'
    order by b.id
  `
  console.log("\nReal Estate listings:")
  final.forEach((r) =>
    console.log(`  ${r.name.padEnd(35)} ${(r.address?.split(",")[0] ?? "").padEnd(30)} ${r.phone}`)
  )
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
