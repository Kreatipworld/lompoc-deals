import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { stripe, TIERS } from "@/lib/stripe"

export const dynamic = "force-dynamic"

/**
 * What Stripe will actually charge for each plan, read from the price objects
 * production is wired to. The local .env.local carries a TEST key on another
 * account, so "$99.99 for Plus" can only be verified here, against production.
 * Gated like the crons (bearer CRON_SECRET); scripts/check-production.mjs
 * calls it and goes red when a price drifts from the display amount.
 */
export async function GET(request: Request) {
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  async function read(priceId: string) {
    if (!priceId) return { id: null, error: "price id not configured" }
    try {
      const p = await stripe.prices.retrieve(priceId)
      return {
        id: p.id,
        unit_amount: p.unit_amount,
        currency: p.currency,
        interval: p.recurring?.interval ?? null,
        active: p.active,
        livemode: p.livemode,
      }
    } catch (err) {
      return { id: priceId, error: err instanceof Error ? err.message : String(err) }
    }
  }

  const [standard, premium] = await Promise.all([
    read(TIERS.standard.priceId),
    read(TIERS.premium.priceId),
  ])
  return NextResponse.json({
    standard: { ...standard, display: TIERS.standard.price },
    premium: { ...premium, display: TIERS.premium.price },
  })
}
