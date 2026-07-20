import { and, eq, sql, desc } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses, categories, subscriptions } from "@/db/schema"
import { fairShuffle } from "@/lib/featured-rotation"

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

  // Exclusive owners keep top billing (they paid for it); both groups are
  // reshuffled on every request so every sponsor gets an equal turn at the
  // front rather than the same one always leading.
  return fairShuffle(exclusive).concat(fairShuffle(shared)).slice(0, limit)
}

/**
 * The single sponsor to feature at the top of a category page. Prefers a
 * Category-Exclusive owner; falls back to a Plus sponsor, drawn fresh each
 * request so the spotlight rotates fairly. Null if unsponsored.
 */
export async function getCategorySpotlight(
  categorySlug: string
): Promise<SponsorBusiness | null> {
  const [top] = await getSponsoredBusinesses({ categorySlug, limit: 1 })
  return top ?? null
}
