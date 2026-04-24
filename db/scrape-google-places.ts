/**
 * db/scrape-google-places.ts
 *
 * Seeds the businesses table with real Lompoc-area businesses from
 * the Apify "compass/crawler-google-places" actor.
 *
 * Usage:
 *   npx tsx db/scrape-google-places.ts
 *
 * Env required:
 *   APIFY_API_TOKEN   — from https://console.apify.com/account/integrations
 *   DATABASE_URL      — Neon connection string
 *
 * Behavior:
 *   - Runs the Apify actor with several Lompoc search queries
 *   - Maps each Google Maps result to our DB schema
 *   - Upserts businesses (dedup by slug; skip if already exists)
 *   - Creates a "scraper@lompocdeals.system" user to own imported rows
 *   - Never touches existing deals — only adds/enriches business rows
 */

import "dotenv/config"
import { ApifyClient } from "apify-client"
import bcrypt from "bcryptjs"
import { db } from "./client"
import { categories, users, businesses } from "./schema"
import { eq } from "drizzle-orm"
import { isLompocAddress } from "../lib/lompoc-zip"

// ---- helpers ---------------------------------------------------------------

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Map a Google Maps category string to one of our category slugs.
 * Falls back to "other".
 */
function mapCategory(googleCategories: string[]): string {
  const all = googleCategories.join(" ").toLowerCase()

  if (/restaurant|food|pizza|burger|taco|sushi|cafe|coffee|bar|grill|diner|bakery|deli|winery|wine|brewery|pub|bistro|eatery|takeout|chinese|italian|mexican|thai|seafood|fish/.test(all))
    return "food-drink"
  if (/salon|spa|beauty|barber|nail|hair|massage|wax|facial|gym|fitness|yoga|pilates|wellness|health/.test(all))
    return "health-beauty"
  if (/auto|car|tire|vehicle|mechanic|collision|body shop|transmission|oil change|lube/.test(all))
    return "auto"
  if (/shop|store|retail|boutique|clothing|apparel|market|gift|furniture|jewelry|florist|book|music|instrument/.test(all))
    return "retail"
  if (/theater|cinema|movie|entertainment|arcade|bowling|event/.test(all))
    return "entertainment"
  if (/plumb|electr|hvac|clean|landscap|pest|repair|service|contractor|insurance|bank|financial|dental|doctor|clinic|hospital|law|attorney|accountant|school|church|nonprofit/.test(all))
    return "services"

  return "other"
}

/**
 * Convert Apify opening hours array to our JSON format.
 * Input:  [{ day: "Monday", hours: "9 AM–5 PM" }, …]
 * Output: { monday: "9 AM–5 PM", tuesday: "Closed", … }
 */
function parseHours(openingHours: Array<{ day: string; hours: string }> | undefined) {
  if (!openingHours || openingHours.length === 0) return null
  return Object.fromEntries(
    openingHours.map(({ day, hours }) => [day.toLowerCase(), hours])
  )
}

// ---- main ------------------------------------------------------------------

interface GooglePlaceResult {
  title?: string
  address?: string
  location?: { lat?: number; lng?: number }
  phone?: string
  website?: string
  openingHours?: Array<{ day: string; hours: string }>
  imageUrl?: string
  photos?: Array<{ imageUrl: string }>
  categories?: string[]
  categoryName?: string
  url?: string
  totalScore?: number
  reviewsCount?: number
  placeId?: string
}

async function main() {
  const apiToken = process.env.APIFY_API_TOKEN
  if (!apiToken) {
    console.error("❌  APIFY_API_TOKEN is not set. Add it to .env.local.")
    process.exit(1)
  }

  const client = new ApifyClient({ token: apiToken })

  // ---- ensure categories exist ----
  const catRows = [
    { name: "Food & Drink", slug: "food-drink", icon: "utensils" },
    { name: "Retail", slug: "retail", icon: "shopping-bag" },
    { name: "Services", slug: "services", icon: "wrench" },
    { name: "Health & Beauty", slug: "health-beauty", icon: "heart" },
    { name: "Auto", slug: "auto", icon: "car" },
    { name: "Entertainment", slug: "entertainment", icon: "ticket" },
    { name: "Other", slug: "other", icon: "more-horizontal" },
  ]
  await db.insert(categories).values(catRows).onConflictDoNothing()
  const allCats = await db.query.categories.findMany()
  const catBySlug = Object.fromEntries(allCats.map((c) => [c.slug, c.id]))

  // ---- ensure scraper system user ----
  const scraperEmail = "scraper@lompocdeals.system"
  await db
    .insert(users)
    .values({
      email: scraperEmail,
      passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
      role: "business",
    })
    .onConflictDoNothing()
  const scraperUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, scraperEmail),
  })
  if (!scraperUser) throw new Error("Could not create or find scraper user")
  console.log(`✓ scraper user (id=${scraperUser.id})`)

  // ---- run Apify actor ----
  const searchQueries = [
    "restaurants Lompoc CA",
    "cafes coffee shops Lompoc CA",
    "auto repair Lompoc CA",
    "hair salon spa Lompoc CA",
    "retail shops Lompoc CA",
    "services Lompoc CA",
    "entertainment Lompoc CA",
    // Extended queries for broader coverage
    "winery wine tasting Lompoc CA",
    "bakery dessert Lompoc CA",
    "dentist dental Lompoc CA",
    "gym fitness yoga Lompoc CA",
    "grocery supermarket Lompoc CA",
    "hotel motel lodging Lompoc CA",
    "pet store veterinarian Lompoc CA",
    "florist flowers Lompoc CA",
    "pharmacy drug store Lompoc CA",
    "pizza Lompoc CA",
    "mexican food taco Lompoc CA",
    "fast food burger Lompoc CA",
    "clothing boutique Lompoc CA",
    "tattoo Lompoc CA",
    "plumber electrician Lompoc CA",
    "real estate Lompoc CA",
  ]

  console.log(`\n🔍 Running compass/crawler-google-places actor for ${searchQueries.length} queries…`)
  console.log("   This may take several minutes.\n")

  const run = await client.actor("compass/crawler-google-places").call({
    searchStringsArray: searchQueries,
    maxCrawledPlacesPerSearch: 30,
    language: "en",
    includeImages: true,
    includeOpeningHours: true,
    includeReviews: false,
    maxReviews: 0,
    exportPlaceUrls: true,
  })

  if (run.status !== "SUCCEEDED") {
    console.error(`❌  Actor run ended with status: ${run.status}`)
    process.exit(1)
  }

  console.log(`✓ Actor run ${run.id} succeeded`)

  // ---- fetch results ----
  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  const places = items as GooglePlaceResult[]
  console.log(`   ${places.length} places returned\n`)

  // ---- upsert businesses ----
  let inserted = 0
  let skipped = 0
  let skippedNonLompoc = 0
  let errors = 0

  for (const place of places) {
    if (!place.title) { skipped++; continue }

    const name = place.title.trim()
    const slug = slugify(name)

    // Guard: reject anything outside the Lompoc area so the scraper can't
    // pull in wrong-city chain-store matches (Walmart in Toledo, CVS in NC, etc.)
    if (!isLompocAddress(place.address ?? null)) {
      console.log(`  ⊘ skip (non-Lompoc): ${name} — ${place.address ?? "no address"}`)
      skippedNonLompoc++
      continue
    }

    try {
      // Skip if business with this slug already exists
      const existing = await db.query.businesses.findFirst({
        where: (b, { eq }) => eq(b.slug, slug),
      })
      if (existing) {
        // Enrich existing row with Google data if fields are missing
        const updates: Record<string, unknown> = {}
        if (!existing.address && place.address) updates.address = place.address
        if (!existing.lat && place.location?.lat) updates.lat = place.location.lat
        if (!existing.lng && place.location?.lng) updates.lng = place.location.lng
        if (!existing.phone && place.phone) updates.phone = place.phone
        if (!existing.website && place.website) updates.website = place.website
        if (!existing.hoursJson && place.openingHours?.length) {
          updates.hoursJson = parseHours(place.openingHours)
        }
        if (!existing.coverUrl && (place.imageUrl || place.photos?.[0]?.imageUrl)) {
          updates.coverUrl = place.imageUrl ?? place.photos![0].imageUrl
        }
        if (!existing.googleBusinessUrl && place.url) {
          updates.googleBusinessUrl = place.url
        }

        if (Object.keys(updates).length > 0) {
          await db
            .update(businesses)
            .set(updates)
            .where(eq(businesses.id, existing.id))
          console.log(`  ↑ enriched: ${name}`)
        } else {
          console.log(`  — skip (exists): ${name}`)
        }
        skipped++
        continue
      }

      // Determine category
      const googleCats = [
        ...(place.categories ?? []),
        place.categoryName ?? "",
      ].filter(Boolean)
      const catSlug = mapCategory(googleCats)
      const categoryId = catBySlug[catSlug]

      const coverUrl =
        place.imageUrl ??
        place.photos?.[0]?.imageUrl ??
        null

      await db.insert(businesses).values({
        ownerUserId: scraperUser.id,
        name,
        slug,
        description: null,
        categoryId,
        address: place.address ?? null,
        lat: place.location?.lat ?? null,
        lng: place.location?.lng ?? null,
        phone: place.phone ?? null,
        website: place.website ?? null,
        hoursJson: parseHours(place.openingHours),
        coverUrl,
        googleBusinessUrl: place.url ?? null,
        status: "approved",
      })

      console.log(`  + added: ${name} [${catSlug}]`)
      inserted++
    } catch (err) {
      console.error(`  ✗ error on "${name}":`, (err as Error).message)
      errors++
    }
  }

  console.log(`\n✅  Done. inserted=${inserted}  enriched/skipped=${skipped}  non-Lompoc-skipped=${skippedNonLompoc}  errors=${errors}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
