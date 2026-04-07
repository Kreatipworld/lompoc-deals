// Zillow listing sync via Apify's maxcopell/zillow-detail-scraper.
// Used by both the manual import script and the daily cron route.
//
// Auto-attributes each listing to its REAL brokerage from Zillow's
// `brokerageName` field. Creates new brokerage businesses on the fly
// when Zillow returns a brokerage we haven't seen before.

import { sql, eq, and, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { propertyListings, businesses, categories, users } from "@/db/schema"

const ACTOR_ID = "ENK9p4RZHg0iVso52" // maxcopell/zillow-detail-scraper

// Lompoc addresses we track. Brokerage assignment is now AUTOMATIC —
// we read it from Zillow's response. The bizSlug field below is only used
// as a FALLBACK if Zillow doesn't return a brokerageName.
export const TRACKED: Array<{
  address: string
  fallbackBizSlug: string
  status: "FOR_SALE" | "FOR_RENT"
}> = [
  { address: "933 Bellflower Ln, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_SALE" },
  { address: "516 N 2nd St, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "426 S K St, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_SALE" },
  { address: "538 Andromeda Dr, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_SALE" },
  { address: "1350 Purisima Rd, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "3890 Via Mondo, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_SALE" },
  { address: "4182 Sirius Ave, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_SALE" },
  { address: "1221 Westbrook Dr, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "1505 E Cherry Ave, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_SALE" },
  { address: "1317 N V St SPACE 127, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_SALE" },
  { address: "825 E Ocean Ave SPACE 24B, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "1376 Village Meadows Dr, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_RENT" },
  { address: "1445 Calle Marana, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_RENT" },
  { address: "217 Amherst Pl, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_RENT" },
  { address: "3526 Constellation Rd, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_RENT" },
  { address: "401 N Lupine St #C, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_RENT" },
  { address: "1493 Calle Segunda, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_RENT" },

  // ── More for-sale (10) ──
  { address: "1324 Sunnybrook Ct, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "243 Gardengate Ln, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_SALE" },
  { address: "1479 Calle Segunda, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_SALE" },
  { address: "1536 Sheffield Dr, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "1601 Barrington Court, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_SALE" },
  { address: "4241 Sirius Ave, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_SALE" },
  { address: "6888 Highway 246, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_SALE" },
  { address: "415 River Terrace Dr, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "416 River Terrace Dr, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },
  { address: "419 River Terrace Dr, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_SALE" },

  // ── More for-rent (5) ──
  { address: "309 N K St APT F, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_RENT" },
  { address: "215 N K St #215B, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_RENT" },
  { address: "117-121 S K St APT B, Lompoc, CA 93436", fallbackBizSlug: "hinkens-group", status: "FOR_RENT" },
  { address: "118 N J St #118A, Lompoc, CA 93436", fallbackBizSlug: "coldwell-banker-select-realty", status: "FOR_RENT" },
  { address: "306 N L St #306C, Lompoc, CA 93436", fallbackBizSlug: "century-21-hometown-realty", status: "FOR_RENT" },
]

type ZillowItem = {
  zpid?: string | number
  streetAddress?: string
  address?: { streetAddress?: string; city?: string; state?: string; zipcode?: string }
  homeStatus?: string
  homeType?: string
  price?: number
  rentZestimate?: number
  bedrooms?: number
  bathrooms?: number
  livingArea?: number
  yearBuilt?: number
  description?: string
  longitude?: number
  latitude?: number
  hdpUrl?: string
  brokerageName?: string
  attributionInfo?: { agentName?: string; mlsName?: string; agentPhoneNumber?: string }
  responsivePhotos?: Array<{
    mixedSources?: { jpeg?: Array<{ url: string; width: number }> }
  }>
  hiResImageLink?: string
  imgSrc?: string
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
}

// Stopwords to strip when computing the canonical brokerage key.
// Leading stopwords (articles + connectors).
const LEADING_STOPWORDS = new Set([
  "the", "a", "an", "and", "of", "for", "&",
])
// Generic real estate words to ignore for matching purposes.
const NOISE_WORDS = new Set([
  "realty", "real", "estate", "estates", "estatae", "group", "properties",
  "property", "homes", "homeservices", "services", "inc", "llc", "associates",
  "partners", "team", "pro", "professional", "international", "company",
  "co", "ltd",
])

/**
 * Compute a canonical key for fuzzy matching brokerage names.
 * Examples:
 *   "The Hinkens Group" → "hinkens"
 *   "The Hinkens Group Realty Pro" → "hinkens"
 *   "Berkshire Hathaway HomeServices - Santa Barbara" → "berkshire-hathaway"
 *   "Coldwell Banker Select Realty" → "coldwell-banker"
 *   "Century 21 Hometown Realty" → "century-21"
 */
function brokerageKey(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)

  // Strip leading stopwords
  let i = 0
  while (i < cleaned.length && LEADING_STOPWORDS.has(cleaned[i])) i++
  const significant = cleaned.slice(i).filter((w) => !NOISE_WORDS.has(w))

  // Take first 2 significant words; fall back to whatever remains
  const keyWords = significant.length >= 2
    ? significant.slice(0, 2)
    : significant.length
      ? significant
      : cleaned.slice(0, 1)
  return keyWords.join("-")
}

function bestPhotoUrl(item: ZillowItem): string | null {
  const photos = item.responsivePhotos || []
  for (const p of photos) {
    const sources = p?.mixedSources?.jpeg || []
    if (sources.length) {
      const sorted = [...sources].sort((a, b) => (b.width || 0) - (a.width || 0))
      return sorted[0].url
    }
  }
  return item.hiResImageLink || item.imgSrc || null
}

function allPhotoUrls(item: ZillowItem): string[] {
  const photos = item.responsivePhotos || []
  const out: string[] = []
  for (const p of photos.slice(0, 12)) {
    const sources = p?.mixedSources?.jpeg || []
    if (sources.length) {
      const sorted = [...sources].sort((a, b) => (b.width || 0) - (a.width || 0))
      out.push(sorted[0].url)
    }
  }
  return out
}

function buildTitle(item: ZillowItem): string {
  const beds = item.bedrooms ? `${item.bedrooms}-bed` : "Home"
  const homeType = (item.homeType || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
  const street = item.streetAddress || item.address?.streetAddress || ""
  const namePart = street.split(" ").slice(1).join(" ") || street
  return `${beds} ${homeType || "Property"} on ${namePart}`.trim()
}

async function callApify(addresses: string[], status: "FOR_SALE" | "FOR_RENT") {
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}&timeout=240`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses, propertyStatus: status }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify ${res.status}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as ZillowItem[]
}

/**
 * Find an existing real estate business by name (fuzzy slug match) OR
 * create a new one with sensible defaults. Used for auto-attribution.
 */
async function findOrCreateBrokerage(
  brokerageName: string,
  ownerId: number,
  realEstateCatId: number
): Promise<{ id: number; created: boolean }> {
  const slug = slugify(brokerageName)
  const key = brokerageKey(brokerageName)

  // Pass 1 — exact slug match
  const exact = await db.query.businesses.findFirst({
    where: (b, { eq: e }) => e(b.slug, slug),
  })
  if (exact) return { id: exact.id, created: false }

  // Pass 2 — canonical brokerage key match. Compute key for every existing
  // real-estate business and look for an exact key collision.
  if (key.length >= 3) {
    const allRealEstate = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .innerJoin(categories, eq(businesses.categoryId, categories.id))
      .where(eq(categories.slug, "real-estate"))
    for (const biz of allRealEstate) {
      if (brokerageKey(biz.name) === key) {
        return { id: biz.id, created: false }
      }
    }
  }

  // Create a new brokerage
  const inserted = await db
    .insert(businesses)
    .values({
      ownerUserId: ownerId,
      name: brokerageName,
      slug,
      description: `Lompoc-area real estate brokerage. Listing data sourced from Zillow.`,
      categoryId: realEstateCatId,
      address: "Lompoc, CA 93436",
      lat: 34.6391,
      lng: -120.4579,
      coverUrl: `https://picsum.photos/seed/${slug}/1200/600`,
      status: "approved",
    })
    .returning({ id: businesses.id })
  return { id: inserted[0].id, created: true }
}

export type SyncReport = {
  fetched: number
  upserted: number
  skipped: number
  newBrokerages: string[]
  errors: string[]
}

export async function syncZillowListings(): Promise<SyncReport> {
  const report: SyncReport = {
    fetched: 0,
    upserted: 0,
    skipped: 0,
    newBrokerages: [],
    errors: [],
  }

  // Resolve owner + category once
  const ownerRow = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.email, "system@lompocdeals.test"),
    columns: { id: true },
  })
  if (!ownerRow) throw new Error("system owner missing")
  const ownerId = ownerRow.id
  const catRow = await db.query.categories.findFirst({
    where: (c, { eq: e }) => e(c.slug, "real-estate"),
    columns: { id: true },
  })
  if (!catRow) throw new Error("real-estate category missing")
  const realEstateCatId = catRow.id

  const byStatus: Record<string, typeof TRACKED> = {}
  for (const t of TRACKED) {
    byStatus[t.status] = byStatus[t.status] || []
    byStatus[t.status].push(t)
  }

  for (const [status, targets] of Object.entries(byStatus)) {
    const addresses = targets.map((t) => t.address)
    let items: ZillowItem[] = []
    try {
      items = await callApify(addresses, status as "FOR_SALE" | "FOR_RENT")
    } catch (e) {
      report.errors.push(
        `${status}: ${e instanceof Error ? e.message : String(e)}`
      )
      continue
    }
    report.fetched += items.length

    for (const item of items) {
      try {
        const street = item.streetAddress || item.address?.streetAddress || ""
        if (!street) {
          report.skipped++
          continue
        }

        // Determine the brokerage. Prefer Zillow's brokerageName, fall back
        // to the TRACKED entry's mapping.
        let businessId: number
        if (item.brokerageName) {
          const result = await findOrCreateBrokerage(
            item.brokerageName,
            ownerId,
            realEstateCatId
          )
          businessId = result.id
          if (result.created && !report.newBrokerages.includes(item.brokerageName)) {
            report.newBrokerages.push(item.brokerageName)
          }
        } else {
          const target = targets.find((t) =>
            t.address.toLowerCase().startsWith(street.toLowerCase())
          )
          if (!target) {
            report.skipped++
            continue
          }
          const biz = await db
            .select({ id: businesses.id })
            .from(businesses)
            .where(eq(businesses.slug, target.fallbackBizSlug))
            .limit(1)
          if (!biz.length) {
            report.skipped++
            continue
          }
          businessId = biz[0].id
        }

        const type = status === "FOR_RENT" ? "for-rent" : "for-sale"
        const priceCents =
          type === "for-rent"
            ? item.rentZestimate
              ? Math.round(item.rentZestimate * 100)
              : null
            : item.price
              ? Math.round(item.price * 100)
              : null
        if (!priceCents) {
          report.skipped++
          continue
        }

        const fullAddress = `${street}, ${item.address?.city ?? "Lompoc"}, ${
          item.address?.state ?? "CA"
        } ${item.address?.zipcode ?? ""}`.trim()
        const photoUrl = bestPhotoUrl(item)
        const photos = allPhotoUrls(item)
        const zpid = item.zpid != null ? String(item.zpid) : null
        const detailUrl = item.hdpUrl
          ? `https://www.zillow.com${item.hdpUrl}`
          : null

        if (zpid) {
          const existing = await db.query.propertyListings.findFirst({
            where: (l, { eq: e }) => e(l.zpid, zpid),
          })
          if (existing) {
            await db
              .update(propertyListings)
              .set({
                businessId,
                type,
                title: buildTitle(item),
                description: (item.description ?? "").slice(0, 800) || null,
                priceCents,
                beds: item.bedrooms ?? null,
                baths: item.bathrooms ?? null,
                sqft: item.livingArea ?? null,
                address: fullAddress,
                imageUrl: photoUrl,
                photosJson: photos,
                yearBuilt: item.yearBuilt ?? null,
                lat: item.latitude ?? null,
                lng: item.longitude ?? null,
                detailUrl,
                status: "active",
                lastSyncedAt: new Date(),
              })
              .where(eq(propertyListings.id, existing.id))
          } else {
            await db.insert(propertyListings).values({
              businessId,
              type,
              title: buildTitle(item),
              description: (item.description ?? "").slice(0, 800) || null,
              priceCents,
              beds: item.bedrooms ?? null,
              baths: item.bathrooms ?? null,
              sqft: item.livingArea ?? null,
              address: fullAddress,
              imageUrl: photoUrl,
              photosJson: photos,
              yearBuilt: item.yearBuilt ?? null,
              lat: item.latitude ?? null,
              lng: item.longitude ?? null,
              detailUrl,
              zpid,
              status: "active",
              lastSyncedAt: new Date(),
            })
          }
          report.upserted++
        }
      } catch (e) {
        report.errors.push(e instanceof Error ? e.message : String(e))
      }
    }
  }

  // Mark any tracked listings that didn't come back as inactive
  const trackedZpids = await db
    .select({ zpid: propertyListings.zpid })
    .from(propertyListings)
    .where(
      and(
        eq(propertyListings.status, "active"),
        sql`${propertyListings.lastSyncedAt} < now() - interval '1 hour'`
      )
    )
  if (trackedZpids.length > 0) {
    const stale = trackedZpids
      .map((r) => r.zpid)
      .filter((z): z is string => z != null)
    if (stale.length) {
      await db
        .update(propertyListings)
        .set({ status: "inactive" })
        .where(inArray(propertyListings.zpid, stale))
    }
  }

  return report
}
