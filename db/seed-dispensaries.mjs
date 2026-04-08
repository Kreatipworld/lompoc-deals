// Seed script: Lompoc dispensaries
// Run: node --env-file=.env.local db/seed-dispensaries.mjs
//
// Non-destructive — uses ON CONFLICT DO NOTHING on slug.
// Adds "dispensaries" category if missing.

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const DISPENSARIES = [
  {
    name: "Leaf Dispensary",
    slug: "leaf-dispensary-lompoc",
    description:
      "Lompoc's first dispensary, open since 2019. Carries a wide selection of flower, edibles, concentrates, and vapes from top brands like Stiiizy, Claybourne, Cold Fire, and Wyld. Daily deals and friendly staff.",
    address: "423 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 743-4771",
    website: "https://www.leaflompoc.com",
    lat: 34.6384,
    lng: -120.4620,
  },
  {
    name: "Elevate Lompoc",
    slug: "elevate-lompoc",
    description:
      "Premium cannabis dispensary on S H St offering top-shelf flower, concentrates, edibles, tinctures, and CBD products. Open early daily with knowledgeable budtenders.",
    address: "118 S H St, Lompoc, CA 93436",
    phone: "(805) 819-0077",
    website: "https://elevatelompoc.com",
    lat: 34.6360,
    lng: -120.4579,
  },
  {
    name: "Oceans Lompoc",
    slug: "oceans-lompoc",
    description:
      "East-side dispensary with a relaxed, welcoming vibe. Stocks flower, pre-rolls, vapes, edibles, and accessories. Recreational and medical sales. Open late daily.",
    address: "1101 E Ocean Ave, Ste A, Lompoc, CA 93436",
    phone: "(805) 742-8787",
    website: null,
    lat: 34.6384,
    lng: -120.4450,
  },
  {
    name: "TRD Dispensary",
    slug: "trd-dispensary-lompoc",
    description:
      "The Roots Dispensary — community-first cannabis shop serving Lompoc with a curated menu of premium flower, concentrates, edibles, and wellness products at fair prices.",
    address: "805 W Laurel Ave, Lompoc, CA 93436",
    phone: "(805) 291-3565",
    website: "https://www.visittheroots.com",
    lat: 34.6430,
    lng: -120.4700,
  },
  {
    name: "One Plant Lompoc",
    slug: "one-plant-lompoc",
    description:
      "Part of the One Plant California family. Full-service dispensary offering cannabis flower, pre-rolls, vapes, edibles, and topicals. Knowledgeable staff for both new and experienced consumers.",
    address: "119 N A St, Lompoc, CA 93436",
    phone: "(805) 741-7419",
    website: "https://oneplant.life",
    lat: 34.6410,
    lng: -120.4560,
  },
]

async function run() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("== Seeding Lompoc dispensaries ==\n")

  // ── 1. Ensure a seed owner exists ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 10)
  await sql`
    INSERT INTO users (email, password_hash, role)
    VALUES ('seedowner@lompocdeals.internal', ${passwordHash}, 'business')
    ON CONFLICT (email) DO NOTHING
  `
  const [owner] = await sql`
    SELECT id FROM users WHERE email = 'seedowner@lompocdeals.internal'
  `
  const ownerId = owner.id
  console.log(`Seed owner id: ${ownerId}`)

  // ── 2. Ensure "dispensaries" category exists ───────────────────────────────
  await sql`
    INSERT INTO categories (name, slug, icon)
    VALUES ('Dispensaries', 'dispensaries', 'cannabis')
    ON CONFLICT (slug) DO NOTHING
  `
  console.log("✓ Dispensaries category ensured")

  // ── 3. Load category id ────────────────────────────────────────────────────
  const [cat] = await sql`SELECT id FROM categories WHERE slug = 'dispensaries'`
  const catId = cat.id

  // ── 4. Insert dispensaries ─────────────────────────────────────────────────
  console.log(`\n--- Dispensaries (${DISPENSARIES.length}) ---`)
  let inserted = 0
  for (const b of DISPENSARIES) {
    const rows = await sql`
      INSERT INTO businesses (
        owner_user_id, name, slug, description, category_id,
        address, phone, website, lat, lng, status
      ) VALUES (
        ${ownerId}, ${b.name}, ${b.slug}, ${b.description}, ${catId},
        ${b.address ?? null}, ${b.phone ?? null}, ${b.website ?? null},
        ${b.lat ?? null}, ${b.lng ?? null}, 'approved'
      )
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `
    if (rows.length > 0) {
      inserted++
      console.log(`  ✓ ${b.name}`)
    } else {
      console.log(`  – ${b.name} (already exists)`)
    }
  }
  console.log(`\nInserted ${inserted} / ${DISPENSARIES.length}`)

  // ── 5. Summary ─────────────────────────────────────────────────────────────
  const [total] = await sql`SELECT COUNT(*)::int AS n FROM businesses WHERE status = 'approved'`
  console.log(`✓ Done. Total approved businesses: ${total.n}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
