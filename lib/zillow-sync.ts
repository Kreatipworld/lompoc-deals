// Zillow listing sync via Apify's maxcopell/zillow-detail-scraper.
// Used by both the manual import script and the daily cron route.

import { sql, eq, and, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { propertyListings, businesses } from "@/db/schema"

const ACTOR_ID = "ENK9p4RZHg0iVso52" // maxcopell/zillow-detail-scraper

// Lompoc addresses to track + which brokerage to assign them to.
// Brokerage assignment is arbitrary — Zillow doesn't expose listing-agent
// per address consistently.
export const TRACKED: Array<{
  address: string
  bizSlug: string
  status: "FOR_SALE" | "FOR_RENT"
}> = [
  // FOR SALE — 11 verified Lompoc Zillow addresses
  {
    address: "933 Bellflower Ln, Lompoc, CA 93436",
    bizSlug: "coldwell-banker-select-realty",
    status: "FOR_SALE",
  },
  {
    address: "516 N 2nd St, Lompoc, CA 93436",
    bizSlug: "century-21-hometown-realty",
    status: "FOR_SALE",
  },
  {
    address: "426 S K St, Lompoc, CA 93436",
    bizSlug: "coldwell-banker-select-realty",
    status: "FOR_SALE",
  },
  {
    address: "538 Andromeda Dr, Lompoc, CA 93436",
    bizSlug: "hinkens-group",
    status: "FOR_SALE",
  },
  {
    address: "1350 Purisima Rd, Lompoc, CA 93436",
    bizSlug: "century-21-hometown-realty",
    status: "FOR_SALE",
  },
  {
    address: "3890 Via Mondo, Lompoc, CA 93436",
    bizSlug: "coldwell-banker-select-realty",
    status: "FOR_SALE",
  },
  {
    address: "4182 Sirius Ave, Lompoc, CA 93436",
    bizSlug: "hinkens-group",
    status: "FOR_SALE",
  },
  {
    address: "1221 Westbrook Dr, Lompoc, CA 93436",
    bizSlug: "century-21-hometown-realty",
    status: "FOR_SALE",
  },
  {
    address: "1505 E Cherry Ave, Lompoc, CA 93436",
    bizSlug: "coldwell-banker-select-realty",
    status: "FOR_SALE",
  },
  {
    address: "1317 N V St SPACE 127, Lompoc, CA 93436",
    bizSlug: "hinkens-group",
    status: "FOR_SALE",
  },
  {
    address: "825 E Ocean Ave SPACE 24B, Lompoc, CA 93436",
    bizSlug: "century-21-hometown-realty",
    status: "FOR_SALE",
  },

  // FOR RENT — 6 verified Lompoc Zillow rental addresses
  {
    address: "1376 Village Meadows Dr, Lompoc, CA 93436",
    bizSlug: "century-21-hometown-realty",
    status: "FOR_RENT",
  },
  {
    address: "1445 Calle Marana, Lompoc, CA 93436",
    bizSlug: "hinkens-group",
    status: "FOR_RENT",
  },
  {
    address: "217 Amherst Pl, Lompoc, CA 93436",
    bizSlug: "hinkens-group",
    status: "FOR_RENT",
  },
  {
    address: "3526 Constellation Rd, Lompoc, CA 93436",
    bizSlug: "century-21-hometown-realty",
    status: "FOR_RENT",
  },
  {
    address: "401 N Lupine St #C, Lompoc, CA 93436",
    bizSlug: "coldwell-banker-select-realty",
    status: "FOR_RENT",
  },
  {
    address: "1493 Calle Segunda, Lompoc, CA 93436",
    bizSlug: "hinkens-group",
    status: "FOR_RENT",
  },
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
  responsivePhotos?: Array<{
    mixedSources?: { jpeg?: Array<{ url: string; width: number }> }
  }>
  hiResImageLink?: string
  imgSrc?: string
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

export type SyncReport = {
  fetched: number
  upserted: number
  skipped: number
  errors: string[]
}

export async function syncZillowListings(): Promise<SyncReport> {
  const report: SyncReport = { fetched: 0, upserted: 0, skipped: 0, errors: [] }

  // Group by status to minimize Apify calls
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
          .where(eq(businesses.slug, target.bizSlug))
          .limit(1)
        if (!biz.length) {
          report.skipped++
          continue
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

        // Upsert by zpid if available, else by (business + address)
        if (zpid) {
          const existing = await db.query.propertyListings.findFirst({
            where: (l, { eq: e }) => e(l.zpid, zpid),
          })
          if (existing) {
            await db
              .update(propertyListings)
              .set({
                businessId: biz[0].id,
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
              businessId: biz[0].id,
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
  // (i.e., the listing was removed from Zillow)
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
