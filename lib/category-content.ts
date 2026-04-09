/**
 * Category content: images, taglines, and SEO descriptions for the directory homepage.
 * Sourced by CMO for KRE-119. Used by the homepage category card grid and category pages.
 *
 * Images: Unsplash (free to use, no attribution required under Unsplash license).
 * Format: ?auto=format&fit=crop&w=800&q=80 for consistent card sizing.
 */

export interface CategoryContent {
  slug: string
  /** Short tagline for category cards (6–8 words) */
  tagline: string
  /** One-sentence description for category pages and SEO */
  description: string
  /** Unsplash photo URL — 800×533 crop optimized */
  imageUrl: string
  /** Alt text for accessibility */
  imageAlt: string
}

export const CATEGORY_CONTENT: CategoryContent[] = [
  {
    slug: "food-drink",
    tagline: "Dine local, taste Lompoc",
    description:
      "Restaurants, cafes, wine bars, and eateries serving up real Lompoc flavor — from H Street tacos to Sta. Rita Hills wine.",
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    imageAlt: "A warmly lit restaurant table with local food",
  },
  {
    slug: "retail",
    tagline: "Shop small, shop local",
    description:
      "Boutiques, gift shops, and local stores — find one-of-a-kind items you won't see at the mall.",
    imageUrl:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80",
    imageAlt: "A local boutique clothing store with curated displays",
  },
  {
    slug: "services",
    tagline: "Trusted local experts",
    description:
      "From plumbing to printing, Lompoc's service professionals are right around the corner — reliable, local, and ready.",
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    imageAlt: "A professional handyman working on a home repair",
  },
  {
    slug: "health-beauty",
    tagline: "Look good, feel great",
    description:
      "Salons, spas, barbershops, and wellness studios — Lompoc's best self-care destinations in one place.",
    imageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    imageAlt: "A modern hair salon with styling chairs",
  },
  {
    slug: "auto",
    tagline: "Keep your ride road-ready",
    description:
      "Trusted mechanics, detailers, and auto parts shops serving Lompoc drivers — honest work, local prices.",
    imageUrl:
      "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "A mechanic working inside an auto repair garage",
  },
  {
    slug: "entertainment",
    tagline: "Fun happens right here",
    description:
      "Things to do, places to go, events to catch — Lompoc's entertainment scene, all in one spot.",
    imageUrl:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
    imageAlt: "A lively entertainment event with lights and a crowd",
  },
  {
    slug: "other",
    tagline: "Discover something unique",
    description:
      "Lompoc businesses that defy easy categories — unique, local, and worth discovering.",
    imageUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
    imageAlt: "A charming downtown street with local storefronts",
  },
]

/** Look up category content by slug. Returns undefined if not found. */
export function getCategoryContent(slug: string): CategoryContent | undefined {
  return CATEGORY_CONTENT.find((c) => c.slug === slug)
}
