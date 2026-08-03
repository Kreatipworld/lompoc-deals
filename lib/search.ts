import { db } from "@/db/client"
import { businesses, categories } from "@/db/schema"
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { searchDeals, type DealCardData } from "@/lib/queries"
import { isChain } from "@/lib/chains"

/**
 * Keyword → category synonym map. Lets a searcher type what they're looking for
 * ("coffee", "wine", "haircut", "weed") and discover the right category even
 * when no business name contains that word. Keys are category slugs.
 */
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "food-drink": [
    "food", "drink", "restaurant", "eat", "dinner", "lunch", "breakfast",
    "coffee", "cafe", "pizza", "taco", "mexican", "burger", "sushi", "bakery",
    "dessert", "brewery", "beer", "bar", "grill", "deli", "ice cream", "boba",
    "comida", "restaurante", "cena", "almuerzo", "desayuno", "café", "panadería", "cerveza",
  ],
  wineries: [
    "wine", "winery", "wineries", "tasting", "vineyard", "vino", "cellar",
    "viñedo", "cata",
  ],
  retail: [
    "shop", "store", "retail", "clothing", "clothes", "boutique", "gift",
    "jewelry", "furniture", "market", "thrift", "books", "flowers", "florist",
    "tienda", "ropa", "regalos", "flores",
  ],
  "health-beauty": [
    "salon", "spa", "beauty", "hair", "haircut", "nails", "nail", "barber",
    "massage", "gym", "fitness", "yoga", "wellness", "health", "skin", "facial",
    "belleza", "pelo", "corte", "uñas", "masaje", "gimnasio",
  ],
  auto: [
    "auto", "car", "tire", "mechanic", "oil", "repair", "brake", "collision",
    "body shop", "smog", "detailing", "parts",
    "carro", "coche", "llantas", "mecánico", "taller",
  ],
  services: [
    "service", "plumber", "plumbing", "electrician", "cleaning", "clean",
    "landscaping", "contractor", "insurance", "bank", "legal", "attorney",
    "lawyer", "accountant", "notary", "printing", "photographer",
    "servicio", "plomero", "electricista", "limpieza", "abogado", "seguro",
  ],
  entertainment: [
    "entertainment", "movie", "theater", "fun", "arcade", "bowling", "music",
    "event", "games",
    "cine", "diversión", "música", "eventos",
  ],
  dispensaries: [
    "dispensary", "dispensaries", "cannabis", "weed", "marijuana", "cbd", "smoke", "vape",
    "hierba",
  ],
  "real-estate": [
    "real estate", "realtor", "realty", "home", "house", "rent", "lease",
    "property", "apartment", "mortgage",
    "casa", "renta", "bienes raíces", "departamento",
  ],
}

export type CategoryHit = { name: string; slug: string; count: number }
export type BizHit = {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  categoryName: string | null
  description: string | null
}
export type SearchResults = {
  businesses: BizHit[]
  categories: CategoryHit[]
  deals: DealCardData[]
}

export function matchedCategorySlugs(q: string): Set<string> {
  const lower = q.toLowerCase()
  const matched = new Set<string>()
  for (const [slug, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some((w) => w.includes(lower) || lower.includes(w))) matched.add(slug)
  }
  return matched
}

/**
 * Order search hits the way this town would.
 *
 * Two problems, one fix. Sorting by "name matches first" alone meant a search for `pizza` returned
 * six businesses with Pizza in the name and stopped — Eye on I, a wood-fired pizzeria on I Street
 * whose description says "wood-fired pizza shop" in the first four words, could never appear at any
 * limit, because the name matches always filled it. Its owner asked us why. That is the whole
 * reason a directory searches descriptions at all, and the ranking was quietly undoing it.
 *
 * The same query also put Domino's, Little Caesars and Blaze above three independent Lompoc
 * pizzerias. Chains are legitimate answers and stay in the results — but they do not go first on a
 * site whose reason for existing is the businesses that live here. A chain searched for by name
 * still lands on top, because when the query is "domino's" there are no local hits to outrank it.
 *
 * One nuance the first version got wrong: "pizza" and "domino's" are different intents. The first
 * is a browse — show me the pizza in this town — and locals should lead it. The second is a lookup,
 * where the searcher has already named who they want, and burying them under local pizzerias is
 * just being unhelpful. A name that *starts with* the query is treated as a lookup and wins
 * outright, chain or not; everything else is a browse, and there the town comes first.
 *
 * Order: starts-with → local name match → local word match → chain name match → chain word match.
 */
export function rankBusinessHits<T extends { name: string }>(rows: T[], q: string, limit: number): T[] {
  const lower = q.trim().toLowerCase()
  const rank = (r: T) => {
    const name = r.name.toLowerCase()
    if (name.startsWith(lower)) return 0 // they typed who they wanted
    return 1 + (isChain(r.name) ? 2 : 0) + (name.includes(lower) ? 0 : 1)
  }
  return rows
    .map((r, i) => ({ r, i, k: rank(r) }))
    .sort((a, b) => a.k - b.k || a.i - b.i) // stable within a tier: keep the DB's order
    .slice(0, limit)
    .map((x) => x.r)
}

export async function searchAll(q: string): Promise<SearchResults> {
  const term = `%${q}%`
  const lower = q.toLowerCase()
  const synonymSlugs = matchedCategorySlugs(q)

  const catRows = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      count: sql<number>`count(${businesses.id})`,
    })
    .from(categories)
    .leftJoin(
      businesses,
      and(eq(businesses.categoryId, categories.id), eq(businesses.status, "approved"))
    )
    .groupBy(categories.id)

  const categoryHits = catRows
    .map((r) => ({ ...r, count: Number(r.count) }))
    .filter(
      (c) =>
        c.count > 0 &&
        (c.name.toLowerCase().includes(lower) || synonymSlugs.has(c.slug))
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const synonymSlugList = Array.from(synonymSlugs)
  const bizConditions = [
    ilike(businesses.name, term),
    ilike(categories.name, term),
    ilike(businesses.description, term),
    ilike(businesses.about, term),
  ]
  // Synonym hits: "haircut" should surface salons, not nothing.
  if (synonymSlugList.length > 0) {
    bizConditions.push(inArray(categories.slug, synonymSlugList))
  }

  const [bizRows, deals] = await Promise.all([
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        logoUrl: businesses.logoUrl,
        categoryName: categories.name,
        description: businesses.description,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(and(eq(businesses.status, "approved"), or(...bizConditions)))
      .orderBy(sql`case when ${businesses.name} ilike ${term} then 0 else 1 end`)
      .limit(60),
    searchDeals(q),
  ])

  return { businesses: rankBusinessHits(bizRows, q, 24), categories: categoryHits, deals }
}
