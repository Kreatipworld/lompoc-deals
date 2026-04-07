// Import real Lompoc listings from Zillow via Apify's zillow-detail-scraper.
// Uses real addresses (verified from earlier web searches) → fetches real
// price, beds, baths, sqft, photos, description from Zillow.
//
// Run: node --env-file=.env.local db/import-zillow-listings.mjs

import { neon } from "@neondatabase/serverless"

const ACTOR_ID = "ENK9p4RZHg0iVso52" // maxcopell/zillow-detail-scraper

// Real Lompoc listings — addresses verified from earlier web searches.
// Brokerage assignment is arbitrary (Zillow doesn't tell us who listed it).
const TARGETS = [
  {
    bizSlug: "coldwell-banker-select-realty",
    address: "516 N 2nd St, Lompoc, CA 93436",
    propertyStatus: "FOR_SALE",
  },
  {
    bizSlug: "coldwell-banker-select-realty",
    address: "933 Bellflower Ln, Lompoc, CA 93436",
    propertyStatus: "FOR_SALE",
  },
  {
    bizSlug: "century-21-hometown-realty",
    address: "1376 Village Meadows Dr, Lompoc, CA 93436",
    propertyStatus: "FOR_RENT",
  },
  {
    bizSlug: "century-21-hometown-realty",
    address: "1445 Calle Marana, Lompoc, CA 93436",
    propertyStatus: "FOR_RENT",
  },
  {
    bizSlug: "hinkens-group",
    address: "217 Amherst Pl, Lompoc, CA 93436",
    propertyStatus: "FOR_RENT",
  },
  {
    bizSlug: "hinkens-group",
    address: "3526 Constellation Rd, Lompoc, CA 93436",
    propertyStatus: "FOR_RENT",
  },
]

async function runApify(addresses, propertyStatus) {
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}&timeout=180`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addresses,
      propertyStatus,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify error ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

function bestPhotoUrl(item) {
  // Try responsivePhotos[0].mixedSources.jpeg highest-res
  const photos = item.responsivePhotos || []
  for (const p of photos) {
    const sources = p?.mixedSources?.jpeg || []
    if (sources.length) {
      // Pick the largest available
      const sorted = [...sources].sort((a, b) => (b.width || 0) - (a.width || 0))
      return sorted[0].url
    }
  }
  // Fallback: hiResImageLink, imgSrc
  return item.hiResImageLink || item.imgSrc || null
}

function extractListing(item, fallbackStatus) {
  const status = (item.homeStatus || fallbackStatus || "").toUpperCase()
  let type = "for-sale"
  if (
    status.includes("RENT") ||
    fallbackStatus === "FOR_RENT"
  ) {
    type = "for-rent"
  }

  const beds = item.bedrooms ?? null
  const baths = item.bathrooms ?? null
  const sqft = item.livingArea ?? null
  const street = item.streetAddress || item.address?.streetAddress || ""
  const city = item.address?.city || "Lompoc"
  const state = item.address?.state || "CA"
  const zip = item.address?.zipcode || item.zipcode || ""
  const fullAddress = `${street}, ${city}, ${state} ${zip}`.trim()
  const description = (item.description || "").slice(0, 800)

  // Pricing logic: for rentals, use rentZestimate (monthly $) → cents.
  // For sales, use price (which Zillow returns as the listing price for
  // active listings, or the Zestimate value for off-market homes).
  let priceCents = null
  if (type === "for-rent") {
    if (item.rentZestimate) priceCents = Math.round(item.rentZestimate * 100)
  } else {
    if (item.price) priceCents = Math.round(item.price * 100)
  }

  const imageUrl = bestPhotoUrl(item)

  // Build a sensible title from the data
  const bedStr = beds ? `${beds}-bed` : "Home"
  const homeType = (item.homeType || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
  const title = `${bedStr} ${homeType || "Property"} on ${street.split(" ").slice(1).join(" ") || street}`.trim()

  return {
    type,
    title,
    description: description || null,
    priceCents,
    beds,
    baths,
    sqft,
    address: fullAddress,
    imageUrl,
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  if (!process.env.APIFY_API_TOKEN) {
    throw new Error("APIFY_API_TOKEN not set in .env.local")
  }

  console.log("== Wiping existing listings ==")
  const deleted = await sql`delete from property_listings returning id`
  console.log(`  ${deleted.length} removed\n`)

  // Group targets by propertyStatus to minimize Apify calls
  const byStatus = TARGETS.reduce((acc, t) => {
    acc[t.propertyStatus] = acc[t.propertyStatus] || []
    acc[t.propertyStatus].push(t)
    return acc
  }, {})

  const allItems = []
  for (const [status, targets] of Object.entries(byStatus)) {
    const addresses = targets.map((t) => t.address)
    console.log(`== Calling Apify (${status}, ${addresses.length} addresses) ==`)
    const items = await runApify(addresses, status)
    console.log(`  got ${items.length} items back from Apify`)
    for (const item of items) {
      allItems.push({ item, status, targets })
    }
  }

  console.log("\n== Inserting into Neon ==")
  let inserted = 0
  for (const { item, status, targets } of allItems) {
    const listing = extractListing(item, status)
    if (!listing.priceCents) {
      console.log(`  ✗ skipped ${listing.address} — no price`)
      continue
    }

    // Find which brokerage this address belongs to
    const target = targets.find(
      (t) =>
        listing.address
          .toLowerCase()
          .startsWith(t.address.split(",")[0].toLowerCase())
    )
    const slug = target?.bizSlug
    if (!slug) {
      console.log(`  ✗ skipped ${listing.address} — no brokerage match`)
      continue
    }

    const biz = await sql`select id from businesses where slug = ${slug}`
    if (!biz.length) continue

    await sql`
      insert into property_listings (
        business_id, type, title, description, price_cents,
        beds, baths, sqft, address, image_url, status
      )
      values (
        ${biz[0].id},
        ${listing.type},
        ${listing.title},
        ${listing.description},
        ${listing.priceCents},
        ${listing.beds},
        ${listing.baths},
        ${listing.sqft},
        ${listing.address},
        ${listing.imageUrl},
        'active'
      )
    `
    inserted++
    const price =
      listing.type === "for-rent"
        ? `$${(listing.priceCents / 100).toLocaleString()}/mo`
        : `$${(listing.priceCents / 100).toLocaleString()}`
    console.log(
      `  ✓ ${listing.address.padEnd(40)} ${price.padEnd(12)} ${
        listing.imageUrl ? "📷" : "❌ no photo"
      }`
    )
  }

  console.log(`\n${inserted} real Zillow listings imported`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
