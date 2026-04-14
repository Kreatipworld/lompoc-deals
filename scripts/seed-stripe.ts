/**
 * seed-stripe.ts
 *
 * Creates the three Lompoc Deals Stripe products/prices and prints the price
 * IDs to paste into .env.local.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/seed-stripe.ts
 */

import Stripe from "stripe"

const secret = process.env.STRIPE_SECRET_KEY
if (!secret) {
  console.error("ERROR: STRIPE_SECRET_KEY is not set in environment.")
  process.exit(1)
}

const stripe = new Stripe(secret, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
})

interface PlanDef {
  key: string
  name: string
  description: string
  priceCents: number // 0 = free (no price created)
  interval: "month" | null
}

const PLANS: PlanDef[] = [
  {
    key: "free",
    name: "Lompoc Deals — Free",
    description: "Up to 3 active deals, business profile, map listing, weekly digest.",
    priceCents: 0,
    interval: null,
  },
  {
    key: "standard",
    name: "Lompoc Deals — Standard",
    description: "Up to 15 active deals, analytics, social links. $19.99/mo.",
    priceCents: 1999,
    interval: "month",
  },
  {
    key: "premium",
    name: "Lompoc Deals — Premium",
    description: "Unlimited deals, priority listing, homepage featured placement. $39.99/mo.",
    priceCents: 3999,
    interval: "month",
  },
]

async function main() {
  console.log("Seeding Stripe products and prices…\n")

  const envLines: string[] = []

  for (const plan of PLANS) {
    // Create or find product
    const products = await stripe.products.search({
      query: `name:'${plan.name}'`,
      limit: 1,
    })

    let product: Stripe.Product
    if (products.data.length > 0) {
      product = products.data[0]
      console.log(`  Product already exists: ${product.name} (${product.id})`)
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { plan: plan.key },
      })
      console.log(`  Created product: ${product.name} (${product.id})`)
    }

    if (plan.priceCents === 0 || !plan.interval) {
      // Free plan — no Stripe price needed
      envLines.push(`STRIPE_PRICE_FREE=`)
      console.log(`  Free plan — no price ID needed.\n`)
      continue
    }

    // Check for existing recurring price on this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 10,
    })

    const existing = prices.data.find(
      (p) =>
        p.unit_amount === plan.priceCents &&
        p.recurring?.interval === plan.interval
    )

    let price: Stripe.Price
    if (existing) {
      price = existing
      console.log(
        `  Price already exists: $${plan.priceCents / 100}/${plan.interval} (${price.id})`
      )
    } else {
      price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: plan.priceCents,
        recurring: { interval: plan.interval },
        metadata: { plan: plan.key },
      })
      console.log(
        `  Created price: $${plan.priceCents / 100}/${plan.interval} (${price.id})`
      )
    }

    const envKey = `STRIPE_PRICE_${plan.key.toUpperCase()}`
    envLines.push(`${envKey}=${price.id}`)
    console.log()
  }

  console.log("\n─────────────────────────────────────────────")
  console.log("Add these to your .env.local:\n")
  for (const line of envLines) {
    console.log(line)
  }
  console.log("─────────────────────────────────────────────\n")
}

main().catch((err) => {
  console.error("Stripe seed failed:", err)
  process.exit(1)
})
