import { and, eq, sql, desc } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses, categories, subscriptions } from "@/db/schema"

export type SponsorBusiness = {
  id: number
  name: string
  slug: string
  description: string | null
  coverUrl: string | null
  logoUrl: string | null
  categoryName: string | null
  categorySlug: string | null
  exclusive: boolean
}

// A business is a "Plus" sponsor when its effective tier is premium:
// admin plan_override, or an active/trialing premium subscription.
const IS_PREMIUM = sql`(
  ${businesses.planOverride} = 'premium'
  or (
    ${businesses.planOverride} is null
    and ${subscriptions.tier} = 'premium'
    and ${subscriptions.status} in ('active', 'trialing')
  )
)`

const SPONSOR_SELECT = {
  id: businesses.id,
  name: businesses.name,
  slug: businesses.slug,
  description: businesses.description,
  coverUrl: businesses.coverUrl,
  logoUrl: businesses.logoUrl,
  categoryName: categories.name,
  categorySlug: categories.slug,
  exclusive: businesses.sponsorExclusive,
}

/**
 * Sponsor businesses for the search ad row and (via categorySlug) a category
 * page. Ordering: Category-Exclusive owners first, then Plus sponsors. Within
 * each group we apply a deterministic daily rotation so non-exclusive sponsors
 * share top billing fairly without the layout reshuffling every request.
 */
export async function getSponsoredBusinesses(opts?: {
  categorySlug?: string
  limit?: number
}): Promise<SponsorBusiness[]> {
  const limit = opts?.limit ?? 8

  const rows = await db
    .select(SPONSOR_SELECT)
    .from(businesses)
    .leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
    .leftJoin(categories, eq(categories.id, businesses.categoryId))
    .where(
      and(
        eq(businesses.status, "approved"),
        IS_PREMIUM,
        opts?.categorySlug ? eq(categories.slug, opts.categorySlug) : undefined
      )
    )
    .orderBy(desc(businesses.sponsorExclusive))
    .limit(50)

  const exclusive = rows.filter((r) => r.exclusive)
  const shared = rows.filter((r) => !r.exclusive)

  // Exclusive owners keep top billing (they paid for it); the shared pool is
  // shuffled with a per-day seed so every member gets an equal, fair turn at
  // the front. Stable within a day (no layout jank, plays nice with caching),
  // reshuffled each day.
  const daySeed = Math.floor(Date.now() / 86_400_000)
  const shuffledShared = seededShuffle(shared, daySeed)

  return exclusive.concat(shuffledShared).slice(0, limit)
}

/** Deterministic Fisher-Yates shuffle — same seed → same order (stable per day). */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * The single sponsor to feature at the top of a category page. Prefers the
 * Category-Exclusive owner (always, no rotation); falls back to the daily-rotated
 * Plus sponsor when no one owns the category exclusively. Null if unsponsored.
 */
export async function getCategorySpotlight(
  categorySlug: string
): Promise<SponsorBusiness | null> {
  const [top] = await getSponsoredBusinesses({ categorySlug, limit: 1 })
  return top ?? null
}
