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
import { normalizeGoogleHours } from "../lib/hours-normalizer"
import { DAY_KEYS } from "../lib/hours"
import { mapGoogleAdditionalInfo } from "../lib/amenities"

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
 * Convert Apify opening hours array to our canonical Hours shape.
 * Input:  [{ day: "Monday", hours: "9 AM–5 PM" }, …]
 * Intermediate: { monday: "9 AM–5 PM", tuesday: "Closed", … }
 * Output: canonical Hours object, or null if no days populated.
 */
function buildNormalizedHours(openingHours: Array<{ day: string; hours: string }> | undefined) {
  if (!openingHours || openingHours.length === 0) return null
  const longKeyMap = Object.fromEntries(
    openingHours.map(({ day, hours }) => [day.toLowerCase(), hours])
  )
  const normalized = normalizeGoogleHours(longKeyMap)
  const anyHours = DAY_KEYS.some((k) => normalized[k] !== null)
  return anyHours ? normalized : null
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
  description?: string
  additionalInfo?: unknown
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
    // --- original coverage ---
    "restaurants Lompoc CA",
    "cafes coffee shops Lompoc CA",
    "auto repair Lompoc CA",
    "hair salon spa Lompoc CA",
    "retail shops Lompoc CA",
    "services Lompoc CA",
    "entertainment Lompoc CA",
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
    // --- professional & financial services ---
    "insurance agency Lompoc CA",
    "attorney lawyer Lompoc CA",
    "accountant tax preparation Lompoc CA",
    "bank credit union Lompoc CA",
    "mortgage loan office Lompoc CA",
    "notary Lompoc CA",
    "printer print shop Lompoc CA",
    "photographer Lompoc CA",
    // --- health & medical ---
    "chiropractor Lompoc CA",
    "optometrist eye doctor Lompoc CA",
    "urgent care medical clinic Lompoc CA",
    "physical therapy Lompoc CA",
    "doctor physician Lompoc CA",
    "massage therapy Lompoc CA",
    // --- home & trade services ---
    "contractor construction Lompoc CA",
    "landscaping gardening Lompoc CA",
    "cleaning service Lompoc CA",
    "hvac heating air conditioning Lompoc CA",
    "pest control Lompoc CA",
    "roofing Lompoc CA",
    "nursery garden center Lompoc CA",
    "hardware store Lompoc CA",
    // --- personal care & lifestyle ---
    "barber shop Lompoc CA",
    "nail salon Lompoc CA",
    "laundromat dry cleaner Lompoc CA",
    // --- retail & specialty ---
    "liquor store Lompoc CA",
    "smoke shop vape Lompoc CA",
    "cannabis dispensary Lompoc CA",
    "furniture store Lompoc CA",
    "jewelry store Lompoc CA",
    "thrift store Lompoc CA",
    "auto parts tire shop Lompoc CA",
    "catering Lompoc CA",
    // --- auto & misc ---
    "gas station Lompoc CA",
    "car wash Lompoc CA",
    "storage units Lompoc CA",
    // --- community ---
    "church Lompoc CA",
    "daycare preschool Lompoc CA",
    "nonprofit organization Lompoc CA",
    // --- geographic variants (still inside 93436/37/38) ---
    "businesses Vandenberg Village CA",
    "restaurants Vandenberg Village CA",
    "shops Mission Hills Lompoc CA",
  ]

  console.log(`\n🔍 Running compass/crawler-google-places actor for ${searchQueries.length} queries…`)
  console.log("   This may take several minutes.\n")

  const run = await client.actor("compass/crawler-google-places").call({
    searchStringsArray: searchQueries,
    maxCrawledPlacesPerSearch: 15,
    language: "en",
    includeImages: true,
    includeOpeningHours: true,
    includeReviews: false,
    maxReviews: 0,
    exportPlaceUrls: true,
    scrapePlaceDetailPage: true,
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
      // Skip if a business with this slug OR the same Google Place ID already
      // exists. Matching on placeId too catches the same place returned under a
      // slightly different title (e.g. "AutoZone Auto Parts" vs "AutoZone
      // Lompoc"), which would otherwise hit the unique placeId index on insert.
      const existing = await db.query.businesses.findFirst({
        where: (b, { eq, or }) =>
          place.placeId
            ? or(eq(b.slug, slug), eq(b.googlePlaceId, place.placeId))
            : eq(b.slug, slug),
      })
      if (existing) {
        // Enrich existing row with Google data if fields are missing
        const updates: Record<string, unknown> = {}
        if (!existing.address && place.address) updates.address = place.address
        if (!existing.lat && place.location?.lat) updates.lat = place.location.lat
        if (!existing.lng && place.location?.lng) updates.lng = place.location.lng
        if (!existing.phone && place.phone) updates.phone = place.phone
        if (!existing.website && place.website) updates.website = place.website
        // Never overwrite hours that the owner has manually edited
        if (existing.hoursSource !== "owner" && !existing.hoursJson && place.openingHours?.length) {
          const normalizedHours = buildNormalizedHours(place.openingHours)
          updates.hoursJson = normalizedHours
          updates.hoursSource = normalizedHours ? "google" : null
          updates.hoursSyncedAt = normalizedHours ? new Date() : null
        }
        if (!existing.googlePlaceId && place.placeId) {
          // placeId is the field Apify's compass/crawler-google-places actor returns (verified in GooglePlaceResult interface)
          updates.googlePlaceId = place.placeId
        }
        if (!existing.coverUrl && (place.imageUrl || place.photos?.[0]?.imageUrl)) {
          updates.coverUrl = place.imageUrl ?? place.photos![0].imageUrl
        }
        if (!existing.googleBusinessUrl && place.url) {
          updates.googleBusinessUrl = place.url
        }
        if (existing.aboutSource !== "owner" && !existing.about && place.description) {
          updates.about = place.description
          updates.aboutSource = "google"
        }
        if (existing.amenitiesSource !== "owner") {
          const mapped = mapGoogleAdditionalInfo(place.additionalInfo)
          if (mapped.length > 0) {
            updates.amenitiesJson = mapped
            updates.amenitiesSource = "google"
          }
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

      const normalizedHours = buildNormalizedHours(place.openingHours)
      const insertAmenities = mapGoogleAdditionalInfo(place.additionalInfo)
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
        hoursJson: normalizedHours,
        hoursSource: normalizedHours ? "google" : null,
        hoursSyncedAt: normalizedHours ? new Date() : null,
        // placeId is the field Apify's compass/crawler-google-places actor returns (verified in GooglePlaceResult interface)
        googlePlaceId: place.placeId ?? null,
        coverUrl,
        about: place.description ?? null,
        aboutSource: place.description ? "google" : null,
        amenitiesJson: insertAmenities.length > 0 ? insertAmenities : null,
        amenitiesSource: insertAmenities.length > 0 ? "google" : null,
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
