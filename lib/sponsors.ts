import { and, eq, sql } from "drizzle-orm"
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
}

/**
 * Businesses on the Plus (premium) tier — the $99.99 plan's sponsor placements.
 * Effective tier follows lib/tier.ts precedence: admin plan_override first,
 * then an active/trialing premium subscription.
 */
export async function getSponsoredBusinesses(opts?: {
  categorySlug?: string
  limit?: number
}): Promise<SponsorBusiness[]> {
  const limit = opts?.limit ?? 8

  const isPremium = sql`(
    ${businesses.planOverride} = 'premium'
    or (
      ${businesses.planOverride} is null
      and ${subscriptions.tier} = 'premium'
      and ${subscriptions.status} in ('active', 'trialing')
    )
  )`

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      coverUrl: businesses.coverUrl,
      logoUrl: businesses.logoUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(businesses)
    .leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
    .leftJoin(categories, eq(categories.id, businesses.categoryId))
    .where(
      and(
        eq(businesses.status, "approved"),
        isPremium,
        opts?.categorySlug ? eq(categories.slug, opts.categorySlug) : undefined
      )
    )
    .limit(50)

  // Deterministic daily rotation so every sponsor gets fair top billing
  // without the layout reshuffling on every request.
  const day = Math.floor(Date.now() / 86_400_000)
  const rotated = rows.length
    ? rows.slice(day % rows.length).concat(rows.slice(0, day % rows.length))
    : rows

  return rotated.slice(0, limit)
}
