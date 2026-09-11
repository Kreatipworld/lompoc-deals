// seed-realtor-preview.mjs
//
// Creates (idempotently) a realtor's preview presence on the platform so a
// prospect can see how they would look as a Plus member: an approved
// service-area business row in Real Estate (no address → no map pin), a
// branded cover, a Plus comp via plan_override (REVOKE with
// scripts/grant-membership.mjs once they pay), and their verified active
// listing(s) on /homes with facts only (no third-party photos — the agent
// adds their own when they claim).
//
// Usage:
//   node --env-file=.env.local scripts/seed-realtor-preview.mjs <cover.png>
//
// Facts below were verified on Sep 11 2026 (Compass listing page + public
// agent profiles). Edit the CONFIG block for the next realtor.

import { put } from "@vercel/blob"
import { readFileSync } from "fs"
import { neon } from "@neondatabase/serverless"

const CONFIG = {
  slug: "maressa-martinez-realtor",
  name: "Maressa Martinez, Realtor · Empire Real Estate Group",
  phone: "(805) 819-2612",
  instagram: "https://www.instagram.com/maressamartinezrealtor/",
  description:
    "Lompoc Realtor with Empire Real Estate Group — buyers and sellers across Lompoc and the Central Coast, licensed since 2011, part of Team Grand with Bobbie Ranney.",
  about: `Maressa Martinez is a Lompoc-based Realtor with Empire Real Estate Group, licensed since 2011 and working with buyers and sellers across Lompoc and the Central Coast. Before real estate she spent eleven years as a teacher, and she brings that same patience to walking families through a purchase or a sale.

She works alongside her grandmother, Bobbie Ranney, as Team Grand, a grandmother-and-granddaughter team, and she is active in the Women's Council of REALTORS. A portion of every transaction she closes goes to youth programs in the community.`,
  listings: [
    {
      type: "for-sale",
      title: "3-bed home on S J Street",
      description:
        "Three bedrooms, two baths, 1,496 square feet in central Lompoc. Listed by Maressa Martinez, Empire Real Estate Group. Photos and showing details come straight from the agent.",
      priceCents: 65900000,
      beds: 3,
      baths: 2,
      sqft: 1496,
      address: "238 S J St, Lompoc, CA 93436",
    },
  ],
}

const PLACEHOLDER_OWNER = 16 // scraper@lompocdeals.system — unclaimed rows

const sql = neon(process.env.DATABASE_URL)
const coverPath = process.argv[2]
if (!coverPath) {
  console.error("usage: node --env-file=.env.local scripts/seed-realtor-preview.mjs <cover.png>")
  process.exit(1)
}

const cover = await put(`biz-photos/${CONFIG.slug}/cover.png`, readFileSync(coverPath), {
  access: "public",
  token: process.env.BLOB_READ_WRITE_TOKEN,
  addRandomSuffix: false,
  contentType: "image/png",
})
console.log("cover", cover.url)

let bizId
const existing = await sql`select id from businesses where slug = ${CONFIG.slug}`
if (existing.length) {
  bizId = existing[0].id
  console.log("business exists", bizId)
} else {
  const r = await sql`
    insert into businesses (owner_user_id, name, slug, description, category_id, address, lat, lng, phone, cover_url, photos_json, status, instagram_url, about, about_source, plan_override)
    values (${PLACEHOLDER_OWNER}, ${CONFIG.name}, ${CONFIG.slug}, ${CONFIG.description}, 8, null, null, null, ${CONFIG.phone}, ${cover.url}, ${JSON.stringify([cover.url])}::jsonb, 'approved', ${CONFIG.instagram}, ${CONFIG.about}, 'website', 'premium')
    returning id`
  bizId = r[0].id
  console.log("business created", bizId)
}

for (const l of CONFIG.listings) {
  const dup = await sql`select id from property_listings where business_id = ${bizId} and address = ${l.address}`
  if (dup.length) {
    console.log("listing exists", dup[0].id, l.address)
    continue
  }
  const geo = await (
    await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(l.address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
  ).json()
  const loc = geo.results?.[0]?.geometry?.location ?? null
  const r = await sql`
    insert into property_listings (business_id, type, title, description, price_cents, beds, baths, sqft, address, image_url, status, lat, lng, expires_at)
    values (${bizId}, ${l.type}, ${l.title}, ${l.description}, ${l.priceCents}, ${l.beds}, ${l.baths}, ${l.sqft}, ${l.address}, null, 'active', ${loc?.lat ?? null}, ${loc?.lng ?? null}, now() + interval '60 days')
    returning id`
  console.log("listing created", r[0].id, l.address, loc ? "geocoded" : "no geocode")
}

console.log("done. Revalidate: /biz/" + CONFIG.slug + ", /homes, /category/real-estate, /businesses, /")
