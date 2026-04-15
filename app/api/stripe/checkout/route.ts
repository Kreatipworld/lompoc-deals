import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { stripe, TIERS, type TierKey } from "@/lib/stripe"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "business") {
    return NextResponse.json({ error: "Only business accounts can subscribe" }, { status: 403 })
  }

  const { tier } = await request.json() as { tier: TierKey }
  if (!TIERS[tier]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  // Free tier requires no Stripe checkout — just create/update the subscription record
  if (tier === "free") {
    const userId = Number(session.user.id)
    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    })
    if (existing) {
      await db.update(subscriptions)
        .set({ tier: "free", status: "active", stripeSubscriptionId: null, cancelAtPeriodEnd: 0, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId))
    } else {
      await db.insert(subscriptions).values({
        userId,
        tier: "free",
        status: "active",
        cancelAtPeriodEnd: 0,
      })
    }
    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"
    return NextResponse.json({ url: `${baseUrl}/dashboard/billing?success=1` })
  }

  const priceId = TIERS[tier].priceId
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured for this tier" }, { status: 503 })
  }

  const userId = Number(session.user.id)
  const userEmail = session.user.email!

  // Get or create Stripe customer
  let stripeCustomerId: string
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  if (existing?.stripeCustomerId) {
    stripeCustomerId = existing.stripeCustomerId
  } else {
    let customer
    try {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: String(userId) },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create Stripe customer"
      console.error("[stripe/checkout] customer create failed:", message)
      return NextResponse.json({ error: message }, { status: 502 })
    }
    stripeCustomerId = customer.id

    // Persist the customer ID immediately so retries reuse the same customer
    try {
      if (existing) {
        await db.update(subscriptions)
          .set({ stripeCustomerId: customer.id, status: "trialing", updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId))
      } else {
        await db.insert(subscriptions).values({
          userId,
          stripeCustomerId: customer.id,
          tier: "free",
          status: "trialing",
          cancelAtPeriodEnd: 0,
        })
      }
    } catch (err) {
      console.error("[stripe/checkout] failed to save stripeCustomerId:", err)
      // Non-fatal — the webhook will update on checkout.session.completed
    }
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  let checkoutSession
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/billing?success=1`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
      metadata: { userId: String(userId), tier },
      subscription_data: {
        metadata: { userId: String(userId), tier },
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe checkout failed"
    console.error("[stripe/checkout] session create failed:", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  if (!checkoutSession.url) {
    console.error("[stripe/checkout] checkout session created but url is null", checkoutSession.id)
    return NextResponse.json({ error: "Stripe returned no checkout URL. Please try again." }, { status: 502 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
