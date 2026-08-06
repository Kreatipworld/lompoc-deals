import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { businesses, categories, subscriptions } from "@/db/schema"
import { eq, and, isNotNull, sql } from "drizzle-orm"
import type { CategoryId } from "@/lib/map-categories"

// Map DB category slugs to valid map CategoryId values
const VALID_CATEGORY_IDS = new Set<CategoryId>([
  "wineries",
  "food-drink",
  "retail",
  "health-beauty",
  "entertainment",
  "services",
  "auto",
  "dispensaries",
  "real-estate",
  "other",
])

function toMapCategory(slug: string | null): CategoryId {
  if (slug && VALID_CATEGORY_IDS.has(slug as CategoryId)) {
    return slug as CategoryId
  }
  return "other"
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        lat: businesses.lat,
        lng: businesses.lng,
        description: businesses.description,
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

    const pois = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      lat: row.lat as number,
      lng: row.lng as number,
      category: toMapCategory(row.categorySlug ?? null),
      highlight: row.description?.slice(0, 120) ?? row.name,
      partner: Boolean(row.isPartner),
    }))

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
