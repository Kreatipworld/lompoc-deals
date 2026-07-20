import type { DealCardData } from "@/lib/queries"
import { getActiveDeals, getDealsByCategorySlug } from "@/lib/queries"
import { fairShuffle } from "@/lib/featured-rotation"

/**
 * Featured row: Premium businesses' active deals, deduped one-per-business,
 * reshuffled on every request so each partner gets an equal turn at the top
 * slot, capped at `limit`.
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

  return fairShuffle(onePerBiz).slice(0, limit)
}
