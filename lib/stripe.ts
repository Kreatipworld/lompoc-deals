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

// Subscription tier config
export const TIERS = {
  free: {
    name: "Free",
    priceId: process.env.STRIPE_PRICE_FREE ?? "",
    price: 0,
    dealLimit: 3,
    features: [
      "Up to 3 active deals",
      "Business profile page",
      "Logo + cover image",
      "Map pin + directory listing",
      "Weekly digest inclusion",
    ],
  },
  standard: {
    name: "Standard",
    priceId: process.env.STRIPE_PRICE_STANDARD ?? "",
    price: 19.99,
    dealLimit: 15,
    features: [
      "Up to 15 active deals",
      "Everything in Free",
      "View & click analytics",
      "Social media links on profile",
      "Hours + Google reviews link",
    ],
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PRICE_PREMIUM ?? "",
    price: 39.99,
    dealLimit: Infinity,
    features: [
      "Unlimited deals",
      "Everything in Standard",
      "Priority listing in search results",
      "Featured placement on homepage",
      "Real estate listings module",
    ],
  },
} as const

export type TierKey = keyof typeof TIERS
