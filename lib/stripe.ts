import Stripe from "stripe"

// Singleton Stripe client — server-side only
if (!process.env.STRIPE_SECRET_KEY) {
  // Allow missing key at build time; will throw at runtime if used
  console.warn("STRIPE_SECRET_KEY is not set — billing features will not work")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-03-31.basil",
  typescript: true,
})

// Subscription tier config.
// NOTE: enum keys stay free/standard/premium (no DB migration); `name` carries
// the customer-facing plan name (Free / Growth / Plus). `price` is DISPLAY only —
// the actually-charged amount lives in the Stripe Price object referenced by
// `priceId` (env STRIPE_PRICE_*), which must be set to match in the Stripe
// dashboard ($39.99 for standard/Growth, $99.99 for premium/Plus).
export const TIERS = {
  free: {
    name: "Free",
    priceId: process.env.STRIPE_PRICE_FREE ?? "",
    price: 0,
    dealLimit: 0, // Free is listing-only — deals start on Growth
    canViewAnalytics: false,
    canViewTrafficSources: false,
    canViewTrends: false,
    canShowSocialLinks: false,
    canListRealEstate: false,
    priorityRanking: false,
    featuredOnHomepage: false,
    features: [
      "Business profile page",
      "Logo + cover photo",
      "Map pin + directory listing",
      "Show up in local search",
      "Contact info & hours",
    ],
  },
  standard: {
    name: "Growth",
    priceId: process.env.STRIPE_PRICE_STANDARD ?? "",
    price: 39.99,
    dealLimit: 15,
    canViewAnalytics: true,
    canViewTrafficSources: false,
    canViewTrends: false,
    canShowSocialLinks: true,
    canListRealEstate: false,
    priorityRanking: false,
    featuredOnHomepage: false,
    features: [
      "Everything in Free",
      "Post & showcase up to 15 deals",
      "Featured in the weekly deals digest",
      "Views & clicks analytics",
      "Social links + Google reviews",
    ],
  },
  premium: {
    name: "Plus",
    priceId: process.env.STRIPE_PRICE_PREMIUM ?? "",
    price: 99.99,
    dealLimit: Infinity,
    canViewAnalytics: true,
    canViewTrafficSources: true,
    canViewTrends: true,
    canShowSocialLinks: true,
    canListRealEstate: true,
    priorityRanking: true,
    featuredOnHomepage: true,
    features: [
      "Everything in Growth",
      "Unlimited deals",
      "Featured placement (homepage + digest)",
      "Priority in search results",
      "1 Featured Deal of the Week rotation / mo",
      "Sponsor Spotlight ad included",
      "Real estate listings module",
      "Priority support",
    ],
  },
} as const

export type TierKey = keyof typeof TIERS
export type TierConfig = (typeof TIERS)[TierKey]
