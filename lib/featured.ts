import type { DealCardData } from "@/lib/queries"
import { getActiveDeals, getDealsByCategorySlug } from "@/lib/queries"
import { dateSeed, seededShuffle } from "@/lib/featured-rotation"

/**
 * Featured row: Premium businesses' active deals, deduped one-per-business,
 * rotated by a date-seeded shuffle, capped at `limit`.
 */
export async function getFeaturedDeals(opts: { categorySlug?: string; limit?: number } = {}): Promise<DealCardData[]> {
  const { categorySlug, limit = 6 } = opts
  // Pull a generous active set, then filter to premium in JS (premium set is small).
  const pool = categorySlug ? await getDealsByCategorySlug(categorySlug, 200) : await getActiveDeals(200)
  const premium = pool.filter((d) => d.featured)

  // One deal per business (keep first encountered = newest, since pool is newest-first).
  const seen = new Set<number>()
  const onePerBiz: DealCardData[] = []
  for (const d of premium) {
    if (seen.has(d.business.id)) continue
    seen.add(d.business.id)
    onePerBiz.push(d)
  }

  return seededShuffle(onePerBiz, dateSeed(new Date())).slice(0, limit)
}
