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

// Every paying member (Growth or Plus) rides the partner slides: admin
// plan_override, or an active/trialing paid subscription. Plus still outranks
// Growth in the ordering below.
const IS_PAID = sql`(
  ${businesses.planOverride} in ('standard', 'premium')
  or (
    ${businesses.planOverride} is null
    and ${subscriptions.tier} in ('standard', 'premium')
    and ${subscriptions.status} in ('active', 'trialing')
  )
)`

// 2 = Plus (premium), 1 = Growth (standard) — mirrors effectiveTier precedence.
const PAID_RANK = sql<number>`case
  when ${businesses.planOverride} = 'premium' then 2
  when ${businesses.planOverride} = 'standard' then 1
  when ${subscriptions.status} in ('active','trialing') and ${subscriptions.tier} = 'premium' then 2
  else 1 end`

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
  paidRank: PAID_RANK,
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
        IS_PAID,
        opts?.categorySlug ? eq(categories.slug, opts.categorySlug) : undefined
      )
    )
    .orderBy(desc(businesses.sponsorExclusive))
    .limit(50)

  const exclusive = rows.filter((r) => r.exclusive)
  const plus = rows.filter((r) => !r.exclusive && Number(r.paidRank) >= 2)
  const growth = rows.filter((r) => !r.exclusive && Number(r.paidRank) < 2)

  // Ladder holds: Category-Exclusive owners lead, then Plus, then Growth —
  // each group reshuffled per request so no one member always fronts the row.
  return fairShuffle(exclusive)
    .concat(fairShuffle(plus), fairShuffle(growth))
    .slice(0, limit)
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
