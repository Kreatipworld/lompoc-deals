import { NextRequest, NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { db } from "@/db/client"
import { businesses, categories, subscriptions, propertyListings } from "@/db/schema"
import { eq, and, isNotNull, sql, or, gt } from "drizzle-orm"
import type { CategoryId } from "@/lib/map-categories"
import type { POI } from "@/lib/map-pois"
import { pick } from "@/lib/localize"
import { hasStreetAddress, formatListingFacts, formatListingPriceShort } from "@/lib/listing-utils"

// Without this, Next statically optimizes the GET at build time and the whole
// map freezes at deploy — new businesses and partner-status changes only
// appeared after the next deploy. The CDN header below is the real cache.
export const dynamic = "force-dynamic"

// Map DB category slugs to valid map CategoryId values
const VALID_CATEGORY_IDS = new Set<CategoryId>([
  "wineries",
  "food-drink",
  "retail",
  "health-beauty",
  "entertainment",
  "services",
  "auto",
  "construction",
  "real-estate",
  "other",
])

function toMapCategory(slug: string | null): CategoryId {
  if (slug && VALID_CATEGORY_IDS.has(slug as CategoryId)) {
    return slug as CategoryId
  }
  return "other"
}

export async function GET(req: NextRequest) {
  // neon-http fetches get cached inside GET handlers otherwise (see project memory).
  unstable_noStore()
  // `?locale=es` swaps in the Spanish description for the popup highlight (English fallback).
  const locale = req.nextUrl.searchParams.get("locale") === "es" ? "es" : "en"
  const intl = locale === "es" ? "es-US" : "en-US"
  try {
    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        lat: businesses.lat,
        lng: businesses.lng,
        description: businesses.description,
        descriptionEs: businesses.descriptionEs,
        categorySlug: categories.slug,
        // Every paying member (Growth or Plus, override or live subscription)
        // is an Official Partner and gets the prominent marker.
        isPartner: sql<boolean>`(
          ${businesses.planOverride} in ('standard','premium')
          or (${subscriptions.status} in ('active','trialing')
              and ${subscriptions.tier} in ('standard','premium'))
        )`,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
      .where(and(eq(businesses.status, "approved"), isNotNull(businesses.lat), isNotNull(businesses.lng)))
      .orderBy(businesses.name)

    const pois: POI[] = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      lat: row.lat as number,
      lng: row.lng as number,
      category: toMapCategory(row.categorySlug ?? null),
      highlight: pick(locale, row.description, row.descriptionEs)?.slice(0, 120) ?? row.name,
      partner: Boolean(row.isPartner),
      kind: "business" as const,
    }))

    // Homes: live listings from approved agents, with a real street address
    // (city-only addresses geocode to the city center — no pin for those).
    try {
      const homes = await db
        .select({
          id: propertyListings.id,
          title: propertyListings.title,
          type: propertyListings.type,
          priceCents: propertyListings.priceCents,
          beds: propertyListings.beds,
          baths: propertyListings.baths,
          sqft: propertyListings.sqft,
          address: propertyListings.address,
          imageUrl: propertyListings.imageUrl,
          lat: propertyListings.lat,
          lng: propertyListings.lng,
          agent: businesses.name,
          agentSlug: businesses.slug,
        })
        .from(propertyListings)
        .innerJoin(businesses, eq(propertyListings.businessId, businesses.id))
        .where(
          and(
            eq(propertyListings.status, "active"),
            or(sql`${propertyListings.expiresAt} is null`, gt(propertyListings.expiresAt, sql`now()`)),
            eq(businesses.status, "approved"),
            isNotNull(propertyListings.lat),
            isNotNull(propertyListings.lng)
          )
        )
        .orderBy(propertyListings.createdAt)

      for (const h of homes) {
        if (!hasStreetAddress(h.address)) continue
        const price = formatListingPriceShort(h.priceCents, h.type, intl)
        const facts = formatListingFacts(h.beds, h.baths, h.sqft)
        pois.push({
          id: `home-${h.id}`,
          name: h.address ?? h.title,
          slug: h.agentSlug,
          lat: h.lat as number,
          lng: h.lng as number,
          category: "homes",
          highlight: [price, facts].filter(Boolean).join(" · "),
          price,
          kind: "home",
          listingId: h.id,
          listingType: h.type,
          imageUrl: h.imageUrl,
          address: h.address,
          facts,
          agent: h.agent,
        })
      }
    } catch (err) {
      console.error("[map-pois] homes query failed:", err)
    }

    return NextResponse.json(pois, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (err) {
    console.error("[map-pois] DB query failed:", err)
    return NextResponse.json([], { status: 200 })
  }
}
