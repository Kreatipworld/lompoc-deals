import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { stripe, validStripeCustomerId, TIERS, type TierKey } from "@/lib/stripe"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  let session
  try {
    session = await auth()
  } catch (err) {
    console.error("[stripe/checkout] auth() failed:", err)
    return NextResponse.json({ error: "Authentication error. Please sign in again." }, { status: 401 })
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "business") {
    return NextResponse.json({ error: "Only business accounts can subscribe" }, { status: 403 })
  }

  let body: { tier: TierKey }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const { tier } = body

  if (!TIERS[tier]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  // Plus is a contact-led tier for listing businesses — not self-serve checkout.
  // Route these to our team instead of creating a Stripe session.
  if (tier === "premium") {
    return NextResponse.json(
      { error: "Plus is set up personally — email hello@lompoclocals.com and we'll get you started." },
      { status: 403 }
    )
  }

  const userId = Number(session.user.id)

  // Free tier is a downgrade — no Stripe checkout. If there's a live Stripe
  // subscription we must actually cancel it (at period end so they keep the
  // access they already paid for); otherwise the customer keeps getting billed.
  if (tier === "free") {
    let existing
    try {
      existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      })
    } catch (err) {
      console.error("[stripe/checkout] DB query failed (free tier):", err)
      return NextResponse.json({ error: "Database error. Please try again." }, { status: 503 })
    }

    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

    if (existing?.stripeSubscriptionId) {
      // Schedule cancellation at period end. Do NOT touch tier/subscriptionId
      // here — the customer.subscription.updated/deleted webhook records the
      // final downgrade once Stripe actually cancels.
      try {
        await stripe.subscriptions.update(existing.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })
      } catch (err) {
        console.error("[stripe/checkout] failed to schedule subscription cancellation:", err)
        return NextResponse.json(
          { error: "We couldn't cancel your subscription. Please try again in a minute." },
          { status: 502 }
        )
      }
      return NextResponse.json({ url: `${baseUrl}/dashboard/billing?success=1` })
    }

    // No live Stripe subscription — just make sure a free record exists.
    try {
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
    } catch (err) {
      console.error("[stripe/checkout] DB update failed (free tier):", err)
      return NextResponse.json({ error: "Database error. Please try again." }, { status: 503 })
    }

    return NextResponse.json({ url: `${baseUrl}/dashboard/billing?success=1` })
  }

  const priceId = TIERS[tier].priceId
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured for this tier. Contact support." }, { status: 503 })
  }

  const userEmail = session.user.email!

  // Get or create Stripe customer
  let stripeCustomerId: string
  let existing
  try {
    existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    })
  } catch (err) {
    console.error("[stripe/checkout] DB query failed:", err)
    return NextResponse.json({ error: "Database error. Please try again." }, { status: 503 })
  }

  // Self-healing: only reuse the stored customer if it actually exists in the
  // current Stripe account (ids from before the account migration are stale).
  const validExistingId = await validStripeCustomerId(existing?.stripeCustomerId)
  if (validExistingId) {
    stripeCustomerId = validExistingId
  } else {
    let customer
    try {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: String(userId) },
      })
    } catch (err) {
      console.error("[stripe/checkout] customer create failed:", err)
      return NextResponse.json(
        { error: "We couldn't reach our payment provider. Please try again in a minute." },
        { status: 502 }
      )
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

  // One trial per account: anyone who has ever held a real subscription
  // (active, trialing, or canceled) checks out without a trial — the card
  // is charged today. Fresh members still get the 14 free days.
  const hadSubscription = Boolean(existing?.stripeSubscriptionId)

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
      allow_promotion_codes: true,
      // "always": trials owe $0 today, and with "if_required" Stripe skipped the
      // card entirely — trial members had no payment method and quietly expired
      // at day 14 instead of converting. Comp'd members (100%-off promo) now
      // enter a card too; they're still never charged.
      payment_method_collection: "always",
      metadata: { userId: String(userId), tier },
      subscription_data: {
        ...(hadSubscription ? {} : { trial_period_days: 14 }),
        metadata: { userId: String(userId), tier },
      },
    })
  } catch (err) {
    console.error("[stripe/checkout] session create failed:", err)
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again in a minute." },
      { status: 502 }
    )
  }

  if (!checkoutSession.url) {
    console.error("[stripe/checkout] checkout session created but url is null", checkoutSession.id)
    return NextResponse.json({ error: "Stripe returned no checkout URL. Please try again." }, { status: 502 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
