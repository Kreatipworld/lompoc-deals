import { and, eq, sql, desc } from "drizzle-orm"
import { db } from "@/db/client"
import { businesses, categories, subscriptions } from "@/db/schema"
import { fairShuffle } from "@/lib/featured-rotation"
import { localizeFields, type Locale } from "@/lib/localize"

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


const SPONSOR_SELECT = {
  id: businesses.id,
  name: businesses.name,
  slug: businesses.slug,
  description: businesses.description,
  descriptionEs: businesses.descriptionEs,
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
  locale?: Locale
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
    .orderBy(desc(businesses.sponsorExclusive), sql`random()`)
    .limit(50)

  // Every Official Partner gets the SAME chance at slot one, re-drawn on every
  // page load — no tier ladder, no fixed first. Sometimes first, sometimes
  // last, fair for everyone. The one exception: on a category-scoped surface
  // the Category-Exclusive owner still leads its own category (that exclusivity
  // is a sold product); the stable sort keeps the shuffle intact behind it.
  const shuffled = fairShuffle(rows)
  if (opts?.categorySlug) {
    shuffled.sort((a, b) => Number(b.exclusive) - Number(a.exclusive))
  }
  return shuffled.slice(0, limit).map((r) => localizeFields(opts?.locale ?? "en", r, ["description"]))
}

/**
 * The single sponsor to feature at the top of a category page. Prefers a
 * Category-Exclusive owner; falls back to a Plus sponsor, drawn fresh each
 * request so the spotlight rotates fairly. Null if unsponsored.
 */
export async function getCategorySpotlight(
  categorySlug: string,
  locale: Locale = "en"
): Promise<SponsorBusiness | null> {
  const [top] = await getSponsoredBusinesses({ categorySlug, limit: 1, locale })
  return top ?? null
}
