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
//   node --env-file=.env.local scripts/seed-realtor-segura.mjs <cover.png>
//
// Phillip Segura: facts verified Oct 19 2026 on his Coldwell Banker agent page
// (active listings, phone, designations) and RealTrends 2025 (city rank #1).
// The Solvang listing (15 Paseo Del Rio) is skipped: Lompoc + Vandenberg only.

import { put } from "@vercel/blob"
import { readFileSync } from "fs"
import { neon } from "@neondatabase/serverless"

const CONFIG = {
  slug: "phillip-segura-realtor",
  name: "Phillip Segura, Realtor · Coldwell Banker Select Realty",
  phone: "(805) 588-5992",
  instagram: null,
  description:
    "Lompoc Realtor with Coldwell Banker Select Realty, ranked the #1 agent in Lompoc in 2025. Buyers and sellers across Lompoc and the Central Coast, in English and Spanish.",
  about: `Phillip Segura is a Lompoc Realtor with Coldwell Banker Select Realty, at 129 W Central Ave. He was ranked the number-one agent in Lompoc in 2025 by both sales volume and homes sold (RealTrends), and he has been recognized repeatedly with Coldwell Banker's International President's Circle and President's Elite awards.

He works with buyers and sellers across Lompoc, Vandenberg Village and the Central Coast, in English and Spanish, and holds the Military Relocation Professional and Luxury Property Specialist designations — useful for families moving in and out of Vandenberg.`,
  listings: [
    { type: "for-sale", title: "4-bed home on Pellham Drive", priceCents: 91990000, beds: 4, baths: 3, sqft: 2738, address: "941 Pellham Dr, Lompoc, CA 93436",
      description: "Four bedrooms, three baths, 2,738 square feet in Lompoc. Listed by Phillip Segura, Coldwell Banker Select Realty (MLS# 26001214). Photos and showing details come straight from the agent." },
    { type: "for-sale", title: "3-bed home on Antares Avenue", priceCents: 65990000, beds: 3, baths: 2, sqft: 1362, address: "235 Antares Ave, Lompoc, CA 93436",
      description: "Three bedrooms, two baths, 1,362 square feet in Vandenberg Village. Listed by Phillip Segura, Coldwell Banker Select Realty (MLS# 26001417). Photos and showing details come straight from the agent." },
    { type: "for-sale", title: "4-bed home on Altair Avenue", priceCents: 63990000, beds: 4, baths: 2, sqft: 1760, address: "270 Altair Ave, Lompoc, CA 93436",
      description: "Four bedrooms, two baths, 1,760 square feet in Vandenberg Village. Listed by Phillip Segura, Coldwell Banker Select Realty (MLS# 26001899). Photos and showing details come straight from the agent." },
    { type: "for-sale", title: "4-bed home on Calle Marana", priceCents: 56500000, beds: 4, baths: 2, sqft: 1144, address: "1440 Calle Marana, Lompoc, CA 93436",
      description: "Four bedrooms, two baths, 1,144 square feet in Lompoc. Listed by Phillip Segura, Coldwell Banker Select Realty (MLS# 26001880). Photos and showing details come straight from the agent." },
  ],
}

const PLACEHOLDER_OWNER = 16 // scraper@lompocdeals.system — unclaimed rows

const sql = neon(process.env.DATABASE_URL)
const coverPath = process.argv[2]
if (!coverPath) {
  console.error("usage: node --env-file=.env.local scripts/seed-realtor-segura.mjs <cover.png>")
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
  // Google Geocoding is not enabled on the local key; Mapbox (public token) is.
  let loc = null
  try {
    const geo = await (
      await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(l.address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      )
    ).json()
    loc = geo.results?.[0]?.geometry?.location ?? null
  } catch {}
  if (!loc && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    const mb = await (
      await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(l.address)}.json?limit=1&country=us&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      )
    ).json()
    const f = mb.features?.[0]
    if (f && f.relevance > 0.8) loc = { lat: f.center[1], lng: f.center[0] }
  }
  const r = await sql`
    insert into property_listings (business_id, type, title, description, price_cents, beds, baths, sqft, address, image_url, status, lat, lng, expires_at)
    values (${bizId}, ${l.type}, ${l.title}, ${l.description}, ${l.priceCents}, ${l.beds}, ${l.baths}, ${l.sqft}, ${l.address}, null, 'active', ${loc?.lat ?? null}, ${loc?.lng ?? null}, now() + interval '60 days')
    returning id`
  console.log("listing created", r[0].id, l.address, loc ? "geocoded" : "no geocode")
}

console.log("done. Revalidate: /biz/" + CONFIG.slug + ", /homes, /category/real-estate, /businesses, /")
