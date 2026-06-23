import type { DealCardData } from "@/lib/queries"
import { getActiveDeals, getDealsByCategorySlug } from "@/lib/queries"

/** Seed derived from the calendar date (UTC) — stable within a day, changes daily. */
export function dateSeed(date: Date): number {
  const key = date.toISOString().slice(0, 10) // YYYY-MM-DD
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic, non-mutating shuffle (mulberry32 PRNG). */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items]
  let s = seed >>> 0
  const rand = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

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
