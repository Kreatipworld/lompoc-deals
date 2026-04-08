import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/db/client"
import { subscriptions, businesses } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { TierKey } from "@/lib/stripe"
import type Stripe from "stripe"

// Stripe requires raw body — disable Next.js body parsing
export const dynamic = "force-dynamic"

/** In Stripe's basil API, current_period_end moved to subscription items. */
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const firstItem = sub.items?.data?.[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ts = (firstItem as any)?.current_period_end as number | undefined
  return ts ? new Date(ts * 1000) : null
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 })
  }

  const body = await request.text()
  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== "subscription") break

      const userId = Number(session.metadata?.userId)
      const tier = (session.metadata?.tier ?? "free") as TierKey
      const stripeCustomerId = session.customer as string
      const stripeSubscriptionId = session.subscription as string

      // Fetch the subscription to get period end (expand items)
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
        expand: ["items"],
      })
      const periodEnd = getPeriodEnd(sub)

      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      })

      if (existing) {
        await db.update(subscriptions)
          .set({
            stripeCustomerId,
            stripeSubscriptionId,
            tier,
            status: "active",
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: 0,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, userId))
      } else {
        await db.insert(subscriptions).values({
          userId,
          stripeCustomerId,
          stripeSubscriptionId,
          tier,
          status: "active",
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: 0,
        })
      }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = Number(sub.metadata?.userId)
      if (!userId) break

      const tier = (sub.metadata?.tier ?? "free") as TierKey
      const periodEnd = getPeriodEnd(sub)

      await db.update(subscriptions)
        .set({
          tier,
          status: sub.status as "active" | "past_due" | "canceled" | "trialing",
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId))
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = Number(sub.metadata?.userId)
      if (!userId) break

      await db.update(subscriptions)
        .set({
          status: "canceled",
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId))
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeCustomerId, customerId),
      })
      if (existing) {
        await db.update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, customerId))
      }
      break
    }

    // Stripe Connect: mark onboarding complete when merchant submits details
    case "account.updated": {
      const account = event.data.object as Stripe.Account
      if (account.details_submitted && account.charges_enabled) {
        await db
          .update(businesses)
          .set({ stripeConnectOnboardingComplete: true })
          .where(eq(businesses.stripeConnectAccountId, account.id))
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
