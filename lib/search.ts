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
 * Sorting alone still isn't enough. Lompoc has five pizzerias with Pizza in the name, so however
 * they are ordered they can fill a six-slot dropdown by themselves and Eye on I is out again. A
 * word match therefore gets a *reserved seat* — the list is built from two queues, not one sort.
 *
 * Within word matches, the short curated description beats the long about text: Eye on I's
 * description opens "Wood-fired pizza shop", while Big Jayke's is an Asian-fusion noodle place that
 * happens to mention pizza 172 characters into its story. Both are honest matches; only one is what
 * the searcher meant.
 *
 * Order: starts-with → local name → chain name, with word matches held a seat, best-signal first.
 */
export function rankBusinessHits<T extends { name: string; description?: string | null }>(
  rows: T[],
  q: string,
  limit: number
): T[] {
  const lower = q.trim().toLowerCase()
  const nameRank = (r: T) => {
    const name = r.name.toLowerCase()
    if (name.startsWith(lower)) return 0 // they typed who they wanted
    return 1 + (isChain(r.name) ? 1 : 0)
  }
  // Word matches rank by where the evidence lives: description before about, earlier before later.
  const wordRank = (r: T) => {
    const at = (r.description ?? "").toLowerCase().indexOf(lower)
    return (at >= 0 ? 0 : 1000) + (at >= 0 ? at / 1000 : 0) + (isChain(r.name) ? 2000 : 0)
  }
  const keyed = rows.map((r, i) => ({ r, i, isName: r.name.toLowerCase().includes(lower) }))
  const sortBy = (f: (r: T) => number) => (a: (typeof keyed)[0], b: (typeof keyed)[0]) => f(a.r) - f(b.r) || a.i - b.i

  const lookup = keyed.filter((x) => x.r.name.toLowerCase().startsWith(lower))
  const rest = keyed.filter((x) => !lookup.includes(x))
  const localName = rest.filter((x) => x.isName && !isChain(x.r.name)).sort(sortBy(nameRank))
  const chainName = rest.filter((x) => x.isName && isChain(x.r.name)).sort(sortBy(nameRank))
  const byWord = rest.filter((x) => !x.isName).sort(sortBy(wordRank))

  // One seat per six, so a name-heavy category can never hide the places it doesn't name.
  const reserved = Math.min(byWord.length, Math.max(1, Math.floor(limit / 6)))
  const out = [
    ...lookup,
    ...localName.slice(0, Math.max(0, limit - lookup.length - reserved)),
    ...byWord.slice(0, reserved),
    ...chainName,
    ...localName,
    ...byWord,
  ]
  const seen = new Set<(typeof keyed)[0]>()
  return out.filter((x) => !seen.has(x) && seen.add(x)).slice(0, limit).map((x) => x.r)
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
