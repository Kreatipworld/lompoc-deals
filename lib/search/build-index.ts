import { unstable_cache } from "next/cache"
import { db } from "@/db/client"
import { businesses, categories, subscriptions } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { CATEGORY_SYNONYMS } from "@/lib/search"
import { FIND_TERMS } from "@/lib/find-terms"
import type { SearchIndex, IndexBiz } from "@/lib/search/instant"

/**
 * Builds the compact search index (every approved business + word pages +
 * categories) that the browser searches instantly. Shared by the JSON route and
 * by the results page, which uses it server-side for typo recovery.
 */

export const BLOB_BASE = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/"
const STOP = new Set(
  "the and for with from that this your our are was were you all any into out over under near about more most very just also than then them they their there here where when what which who will can has have had not but its a an of in on at to by or as is be we us it lompoc california local locally owned family serving offering offers provide provides providing since years year".split(" ")
)

function keywords(categoryName: string | null, description: string | null): string {
  const words: string[] = []
  const seen = new Set<string>()
  const push = (w: string) => {
    const f = w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")
    if (f.length < 4 || STOP.has(f) || seen.has(f)) return
    seen.add(f)
    words.push(f)
  }
  if (categoryName) categoryName.split(/[^A-Za-z]+/).forEach(push)
  const catWords = words.length
  for (const w of (description ?? "").split(/[^A-Za-z0-9'&-]+/)) {
    if (words.length >= catWords + 8) break
    push(w)
  }
  return words.join(" ")
}

export async function buildSearchIndex(): Promise<SearchIndex> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      categorySlug: categories.slug,
      categoryName: categories.name,
      logoUrl: businesses.logoUrl,
      description: businesses.description,
      tier: sql<number>`coalesce(max(case
        when ${businesses.planOverride} = 'premium' then 2
        when ${businesses.planOverride} = 'standard' then 1
        when ${businesses.planOverride} = 'free' then 0
        when ${subscriptions.status} in ('active','trialing') and ${subscriptions.tier} = 'premium' then 2
        when ${subscriptions.status} in ('active','trialing') and ${subscriptions.tier} = 'standard' then 1
        else 0 end), 0)::int`,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
    .where(eq(businesses.status, "approved"))
    .groupBy(businesses.id, categories.id)
    .orderBy(businesses.name)

  const counts = new Map<string, number>()
  const b: IndexBiz[] = rows.map((r) => {
    if (r.categorySlug) counts.set(r.categorySlug, (counts.get(r.categorySlug) ?? 0) + 1)
    return {
      i: r.id,
      n: r.name,
      s: r.slug,
      c: r.categorySlug,
      l: r.logoUrl ? (r.logoUrl.startsWith(BLOB_BASE) ? "~/" + r.logoUrl.slice(BLOB_BASE.length) : r.logoUrl) : null,
      t: Number(r.tier),
      k: keywords(r.categoryName, r.description),
    }
  })
  const cats = await db.select({ slug: categories.slug, name: categories.name }).from(categories)
  return {
    v: 1,
    lb: BLOB_BASE,
    b,
    w: FIND_TERMS.map((t) => ({ s: t.slug, en: t.title.en, es: t.title.es, a: t.aliases })),
    c: cats.map((c) => ({ s: c.slug, n: c.name, c: counts.get(c.slug) ?? 0, k: (CATEGORY_SYNONYMS[c.slug] ?? []).join(" ") })),
  }
}

/** Ten-minute server cache for pages that need the index during render. */
export const getSearchIndex = unstable_cache(buildSearchIndex, ["search-index-v1"], { revalidate: 600 })
