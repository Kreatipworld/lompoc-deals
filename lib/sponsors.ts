import { and, eq, sql, desc, gt, inArray, isNotNull } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses, categories, subscriptions, deals } from "@/db/schema"

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
  /** The member's live coupon, if any — showcases the value of membership. */
  deal: { id: number; discountText: string | null; title: string } | null
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

  // Daily rotation only applies to the shared (non-exclusive) pool.
  const day = Math.floor(Date.now() / 86_400_000)
  const rotatedShared = shared.length
    ? shared.slice(day % shared.length).concat(shared.slice(0, day % shared.length))
    : shared

  const ordered = exclusive.concat(rotatedShared).slice(0, limit)
  return attachDeals(ordered)
}

/** Attach each member's soonest-expiring live coupon (one per business). */
async function attachDeals(
  rows: Omit<SponsorBusiness, "deal">[]
): Promise<SponsorBusiness[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const dealRows = await db
    .select({
      id: deals.id,
      businessId: deals.businessId,
      discountText: deals.discountText,
      title: deals.title,
      expiresAt: deals.expiresAt,
    })
    .from(deals)
    .where(
      and(
        inArray(deals.businessId, ids),
        eq(deals.paused, false),
        gt(deals.expiresAt, sql`now()`),
        isNotNull(deals.discountText)
      )
    )
    .orderBy(deals.expiresAt)

  // First hit per business = soonest to expire (most urgent to surface)
  const byBiz = new Map<number, { id: number; discountText: string | null; title: string }>()
  for (const d of dealRows) {
    if (!byBiz.has(d.businessId))
      byBiz.set(d.businessId, { id: d.id, discountText: d.discountText, title: d.title })
  }

  return rows.map((r) => ({ ...r, deal: byBiz.get(r.id) ?? null }))
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
