import { NextRequest, NextResponse } from "next/server"
import { pick } from "@/lib/localize"
import { db } from "@/db/client"
import { businesses, deals, categories } from "@/db/schema"
import { and, eq, gt, or, sql } from "drizzle-orm"
import {
  CATEGORY_SYNONYMS,
  rankBusinessHits,
  fuzzyBusinessSearch,
  looseLike,
  dropCompetitorMentions,
} from "@/lib/search"

export const runtime = "nodejs"

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
  const locale = req.nextUrl.searchParams.get("locale") === "es" ? "es" : "en"

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
        // Needed by rankBusinessHits: a match in the short description is stronger evidence
        // than one buried in the about text.
        description: businesses.description,
        about: businesses.about,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(
        and(
          eq(businesses.status, "approved"),
          // Match the name, the category, or the description / About text so
          // keyword searches surface relevant places, not just name hits.
          // looseLike everywhere: never compare raw typing to a stored string. See lib/search-match.ts.
          or(
            // A business appears because ITS OWN words match. The category name is deliberately
            // not here: matching it made "food" return the whole Food & Drink list. The category
            // chip is the honest place to offer a browse.
            looseLike(businesses.name, q),
            looseLike(businesses.description, q),
            looseLike(businesses.about, q),
          ),
        ),
      )
      // Fetch wide, then rank. A narrow limit here let name matches eat every slot, so a
      // business whose *description* answers the query could never surface — see rankBusinessHits.
      .orderBy(sql`case when ${businesses.name} ilike ${term} then 0 else 1 end`)
      .limit(40),

    db
      .select({
        id: deals.id,
        title: deals.title,
        discountText: deals.discountText,
        titleEs: deals.titleEs,
        discountTextEs: deals.discountTextEs,
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
          or(looseLike(deals.title, q), looseLike(businesses.name, q), looseLike(businesses.description, q)),
        ),
      )
      .limit(5),
  ])

  const ranked = rankBusinessHits(dropCompetitorMentions(bizRows, q), q, 6)
  // Nothing matched: offer the nearest name rather than an empty box. See fuzzyBusinessSearch.
  const businessesOut =
    ranked.length || categoryHits.length ? ranked : await fuzzyBusinessSearch(q, 4)

  return NextResponse.json({
    categories: categoryHits,
    businesses: businessesOut,
    deals: dealRows.map(({ titleEs, discountTextEs, ...d }) => ({
      ...d,
      title: pick(locale, d.title, titleEs),
      discountText: pick(locale, d.discountText, discountTextEs),
    })),
  })
}
