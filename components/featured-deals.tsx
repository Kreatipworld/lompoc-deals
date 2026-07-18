import { getTranslations } from "next-intl/server"
import { getFeaturedDeals } from "@/lib/featured"
import { DealsCarousel } from "@/components/deals-carousel"

/**
 * Featured Deals — the site-wide paid placement. A strip of premium members'
 * live deals, dropped at the bottom of pages (blog, profile, events, category…)
 * so a paid membership buys awareness everywhere. Self-fetching; renders
 * nothing when there are no premium deals.
 *
 * @param categorySlug   scope to one category (category pages)
 * @param excludeBusinessId  hide a business's own deal (its own profile page)
 */
export async function FeaturedDeals({
  categorySlug,
  excludeBusinessId,
}: {
  categorySlug?: string
  excludeBusinessId?: number
} = {}) {
  let deals = await getFeaturedDeals({ categorySlug, limit: 10 })
  if (excludeBusinessId) deals = deals.filter((d) => d.business.id !== excludeBusinessId)
  if (deals.length === 0) return null

  const t = await getTranslations("featuredDeals")
  return <DealsCarousel deals={deals} heading={t("heading")} sub={t("sub")} />
}
