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
  basic: {
    name: "Basic",
    priceId: process.env.STRIPE_PRICE_BASIC ?? "",
    price: 49,
    dealLimit: 5,
    features: [
      "Up to 5 active deals",
      "Business profile page",
      "Basic analytics",
      "Email digest inclusion",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    price: 99,
    dealLimit: 20,
    features: [
      "Up to 20 active deals",
      "Everything in Basic",
      "Priority listing in search",
      "Social media links",
    ],
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PRICE_PREMIUM ?? "",
    price: 199,
    dealLimit: Infinity,
    features: [
      "Unlimited deals",
      "Everything in Pro",
      "Featured placement on homepage",
      "Real estate listings",
    ],
  },
} as const

export type TierKey = keyof typeof TIERS
