/**
 * The picture on a deal card, in order of how much it actually says about the deal:
 *   1. the deal's own image
 *   2. the business's cover photo
 *   3. their category's photo
 *
 * Step 3 exists because a member can be paying and still have no photo yet — Arthur A. Wise
 * and Primeshield Pest both do — and a blank grey panel on a paying member's deal is worse
 * than an honest category photo. It is a render-time fallback on purpose: nothing generic is
 * ever written into the business's own `cover_url`, so the moment they send a real photo the
 * category image disappears on its own.
 */
const CATEGORY_IMAGES = new Set([
  "auto",
  "construction",
  "dispensaries",
  "entertainment",
  "food-drink",
  "health-beauty",
  "other",
  "real-estate",
  "retail",
  "services",
  "wineries",
])

export function dealImage(deal: {
  imageUrl: string | null
  business: { coverUrl: string | null; categorySlug: string | null }
}): string {
  if (deal.imageUrl) return deal.imageUrl
  if (deal.business.coverUrl) return deal.business.coverUrl
  const slug = deal.business.categorySlug ?? ""
  return `/categories/${CATEGORY_IMAGES.has(slug) ? slug : "other"}.jpg`
}

/** True when the picture is a category stand-in rather than the deal's or the business's own. */
export function isCategoryFallback(deal: {
  imageUrl: string | null
  business: { coverUrl: string | null }
}): boolean {
  return !deal.imageUrl && !deal.business.coverUrl
}
