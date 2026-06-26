import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/client"
import { businesses, deals, categories } from "@/db/schema"
import { and, eq, gt, ilike, or, sql } from "drizzle-orm"

export const runtime = "nodejs"

/**
 * Keyword → category synonym map. Lets a searcher type what they're looking for
 * ("coffee", "wine", "haircut", "weed") and discover the right category even
 * when no business name contains that word. Keys are category slugs.
 */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "food-drink": [
    "food", "drink", "restaurant", "eat", "dinner", "lunch", "breakfast",
    "coffee", "cafe", "pizza", "taco", "mexican", "burger", "sushi", "bakery",
    "dessert", "brewery", "beer", "bar", "grill", "deli", "ice cream", "boba",
  ],
  wineries: ["wine", "winery", "wineries", "tasting", "vineyard", "vino", "cellar"],
  retail: [
    "shop", "store", "retail", "clothing", "clothes", "boutique", "gift",
    "jewelry", "furniture", "market", "thrift", "books", "flowers", "florist",
  ],
  "health-beauty": [
    "salon", "spa", "beauty", "hair", "haircut", "nails", "nail", "barber",
    "massage", "gym", "fitness", "yoga", "wellness", "health", "skin", "facial",
  ],
  auto: [
    "auto", "car", "tire", "mechanic", "oil", "repair", "brake", "collision",
    "body shop", "smog", "detailing", "parts",
  ],
  services: [
    "service", "plumber", "plumbing", "electrician", "cleaning", "clean",
    "landscaping", "contractor", "insurance", "bank", "legal", "attorney",
    "lawyer", "accountant", "notary", "printing", "photographer",
  ],
  entertainment: [
    "entertainment", "movie", "theater", "fun", "arcade", "bowling", "music",
    "event", "games",
  ],
  dispensaries: ["dispensary", "dispensaries", "cannabis", "weed", "marijuana", "cbd", "smoke", "vape"],
  "real-estate": [
    "real estate", "realtor", "realty", "home", "house", "rent", "lease",
    "property", "apartment", "mortgage",
  ],
}

type CategoryHit = { name: string; slug: string; count: number }

/** Categories with their approved-business counts (only ~10 rows). */
async function categoriesWithCounts(): Promise<CategoryHit[]> {
  const rows = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      count: sql<number>`count(${businesses.id})`,
    })
    .from(categories)
    .leftJoin(
      businesses,
      and(eq(businesses.categoryId, categories.id), eq(businesses.status, "approved")),
    )
    .groupBy(categories.id)
  return rows.map((r) => ({ ...r, count: Number(r.count) }))
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  const wantPopular = req.nextUrl.searchParams.get("popular") === "1"

  // Idle "Discover" state: no query yet → return the most-populated categories.
  if (!q || q.length < 2) {
    if (wantPopular) {
      const cats = await categoriesWithCounts()
      const popular = cats
        .filter((c) => c.count > 0 && c.slug !== "other")
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      return NextResponse.json({ categories: popular, businesses: [], deals: [] })
    }
    return NextResponse.json({ categories: [], businesses: [], deals: [] })
  }

  const term = `%${q}%`
  const lower = q.toLowerCase()

  // --- category suggestions: direct name match OR synonym keyword match ---
  const allCats = await categoriesWithCounts()
  const matchedSlugs = new Set<string>()
  for (const [slug, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some((w) => w.includes(lower) || lower.includes(w))) matchedSlugs.add(slug)
  }
  const categoryHits = allCats
    .filter(
      (c) =>
        c.count > 0 &&
        (c.name.toLowerCase().includes(lower) || matchedSlugs.has(c.slug)),
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  const [bizRows, dealRows] = await Promise.all([
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        logoUrl: businesses.logoUrl,
        categoryName: categories.name,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(
        and(
          eq(businesses.status, "approved"),
          // Match the name, the category, or the description / About text so
          // keyword searches surface relevant places, not just name hits.
          or(
            ilike(businesses.name, term),
            ilike(categories.name, term),
            ilike(businesses.description, term),
            ilike(businesses.about, term),
          ),
        ),
      )
      // Name matches rank above content matches.
      .orderBy(sql`case when ${businesses.name} ilike ${term} then 0 else 1 end`)
      .limit(6),

    db
      .select({
        id: deals.id,
        title: deals.title,
        discountText: deals.discountText,
        bizId: businesses.id,
        bizName: businesses.name,
        bizSlug: businesses.slug,
      })
      .from(deals)
      .innerJoin(businesses, eq(deals.businessId, businesses.id))
      .where(
        and(
          eq(businesses.status, "approved"),
          gt(deals.expiresAt, sql`now()`),
          or(ilike(deals.title, term), ilike(businesses.name, term)),
        ),
      )
      .limit(5),
  ])

  return NextResponse.json({ categories: categoryHits, businesses: bizRows, deals: dealRows })
}
