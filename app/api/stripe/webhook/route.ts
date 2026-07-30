import { NextResponse } from "next/server"
import { stripe, TIERS } from "@/lib/stripe"
import { db } from "@/db/client"
import { subscriptions, businesses, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { TierKey } from "@/lib/stripe"
import type Stripe from "stripe"
import { track } from "@/lib/analytics/track"
import {
  notifyPlatform,
  sendTrialEndingEmail,
  sendTrialEndedEmail,
  sendPaymentFailedEmail,
} from "@/lib/email"

/**
 * Resolve a member's email + display name from a Stripe userId (metadata) or
 * customerId. Used to send lifecycle/retargeting emails from webhook events.
 * Returns null (rather than throwing) when the member can't be resolved.
 */
async function resolveMember(opts: {
  userId?: number
  customerId?: string
}): Promise<{ email: string; name: string } | null> {
  let uid = opts.userId
  if ((!uid || !Number.isFinite(uid) || uid <= 0) && opts.customerId) {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, opts.customerId),
      columns: { userId: true },
    })
    uid = sub?.userId
  }
  if (!uid || !Number.isFinite(uid) || uid <= 0) return null
  const [u, b] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, uid), columns: { email: true } }),
    db.query.businesses.findFirst({
      where: eq(businesses.ownerUserId, uid),
      columns: { name: true, ownerFullName: true },
    }),
  ])
  if (!u?.email) return null
  return { email: u.email, name: (b?.ownerFullName?.trim() || b?.name || "").trim() }
}

/** Map a Stripe price ID back to the tier key it represents. */
function tierFromPriceId(priceId: string): TierKey | null {
  for (const [key, config] of Object.entries(TIERS) as [TierKey, (typeof TIERS)[TierKey]][]) {
    if (config.priceId && config.priceId === priceId) return key
  }
  return null
}

const GRACE_PERIOD_DAYS = 7

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

      // Fetch the subscription to get period end + real status (expand items).
      // P1-4: a transient Stripe error must not 500 the event (Stripe would
      // redeliver). On failure, reconcile via the subscription.* events instead.
      let sub: Stripe.Subscription | null = null
      try {
        sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
          expand: ["items"],
        })
      } catch (err) {
        console.error(
          "stripe.subscriptions.retrieve failed in checkout.session.completed; will reconcile via subscription.* events",
          err
        )
      }
      const periodEnd = sub ? getPeriodEnd(sub) : null
      // Persist the REAL status (e.g. 'trialing' for a 14-day trial) so a
      // trial isn't mislabeled 'active' or clobbered by a racing update event.
      const subStatus = sub?.status as
        | "active"
        | "past_due"
        | "canceled"
        | "trialing"
        | undefined

      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      })

      // Dedupe guard for analytics: this checkout is a genuinely new activation
      // only if the row wasn't already tied to this subscription in an active/
      // trialing state before this event.
      const alreadyActivated =
        !!existing &&
        existing.stripeSubscriptionId === stripeSubscriptionId &&
        (existing.status === "active" || existing.status === "trialing")

      if (existing) {
        await db.update(subscriptions)
          .set({
            stripeCustomerId,
            stripeSubscriptionId,
            tier,
            // Only overwrite status when we could read the real one from Stripe.
            ...(subStatus ? { status: subStatus } : {}),
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
          // Falls back to the column default ('trialing') if Stripe was unreachable.
          ...(subStatus ? { status: subStatus } : {}),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: 0,
        })
      }

      // Emit paid_upgrade at-most-once per subscription — skip if this row was
      // already active/trialing on this subscription (redelivery / duplicate).
      if (tier !== "free" && !alreadyActivated) {
        const lineItem = sub?.items?.data?.[0]
        const priceUsdCents = lineItem?.price?.unit_amount ?? 0
        const updatedSub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, userId),
          columns: { id: true },
        })
        await track("paid_upgrade", {
          userId,
          sessionId: null,
          targetType: "subscription",
          targetId: updatedSub?.id ?? null,
          props: { tier: tier as "standard" | "premium", priceUsdCents },
        })

        // Alert the founder inbox: a new member just started.
        const [memberUser, memberBiz] = await Promise.all([
          db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true } }),
          db.query.businesses.findFirst({
            where: eq(businesses.ownerUserId, userId),
            columns: { name: true },
          }),
        ])
        const planName = TIERS[tier as TierKey].name
        const status = sub?.status ?? "trialing"
        await notifyPlatform(`🎉 New ${planName} member`, [
          `<strong>${memberBiz?.name ?? "A business"}</strong> just started a <strong>${status}</strong> ${planName} subscription.`,
          `Account: ${memberUser?.email ?? "unknown"}`,
          status === "trialing" ? "On a 14-day free trial — converts to paid after the trial." : "",
        ])
      }
      break
    }

    // ~3 days before a trial ends — nudge the member to keep Growth.
    case "customer.subscription.trial_will_end": {
      const sub = event.data.object as Stripe.Subscription
      const member = await resolveMember({
        userId: Number(sub.metadata?.userId),
        customerId: sub.customer as string,
      })
      if (member) await sendTrialEndingEmail(member.email, member.name)
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = Number(sub.metadata?.userId)
      const customerId = sub.customer as string

      // P1-3: fall back to the stripe_customer_id link when metadata.userId is
      // missing/NaN, mirroring the invoice.* handlers — otherwise the update is
      // silently dropped.
      const byUserId = Number.isFinite(userId) && userId > 0
      if (!byUserId && !customerId) break

      // Prefer deriving tier from the active price (handles portal upgrades/downgrades
      // where metadata.tier may still reflect the original plan).
      const activePriceId = sub.items?.data?.[0]?.price?.id
      const tierFromPrice = activePriceId ? tierFromPriceId(activePriceId) : null
      const tier = tierFromPrice ?? ((sub.metadata?.tier ?? "free") as TierKey)
      const periodEnd = getPeriodEnd(sub)

      const updWhere = byUserId
        ? eq(subscriptions.userId, userId)
        : eq(subscriptions.stripeCustomerId, customerId)
      const before = await db.query.subscriptions.findFirst({
        where: updWhere,
        columns: { status: true },
      })

      await db.update(subscriptions)
        .set({
          tier,
          status: sub.status as "active" | "past_due" | "canceled" | "trialing",
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
          updatedAt: new Date(),
        })
        .where(updWhere)

      // Win-back: a trial that flipped straight to canceled never converted.
      // The DB status transition is the dedupe guard — a redelivered event sees
      // 'canceled', not 'trialing', so the email won't re-send.
      if (before?.status === "trialing" && sub.status === "canceled") {
        const member = await resolveMember({ userId, customerId })
        if (member) await sendTrialEndedEmail(member.email, member.name)
      }
      break
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Payment succeeded — clear grace period and re-activate
      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeCustomerId, customerId),
      })
      if (existing) {
        await db.update(subscriptions)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, customerId))
        // Clear grace period on associated business
        const biz = await db.query.businesses.findFirst({
          where: (b, { eq: e }) => e(b.ownerUserId, existing.userId),
          columns: { id: true },
        })
        if (biz) {
          await db.update(businesses)
            .set({ gracePeriodEndsAt: null })
            .where(eq(businesses.id, biz.id))
        }
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeCustomerId, customerId),
      })
      if (existing) {
        const gracePeriodEndsAt = new Date(
          Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
        )
        await db.update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, customerId))
        // Set grace period on associated business
        const biz = await db.query.businesses.findFirst({
          where: (b, { eq: e }) => e(b.ownerUserId, existing.userId),
          columns: { id: true },
        })
        if (biz) {
          await db.update(businesses)
            .set({ gracePeriodEndsAt })
            .where(eq(businesses.id, biz.id))
        }

        // Recover the card before the grace period lapses to free.
        const member = await resolveMember({ userId: existing.userId, customerId })
        if (member) await sendPaymentFailedEmail(member.email, member.name)
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = Number(sub.metadata?.userId)
      const customerId = sub.customer as string

      // P1-3: fall back to the stripe_customer_id link when metadata.userId is
      // missing/NaN so cancellations are never silently dropped.
      const byUserId = Number.isFinite(userId) && userId > 0
      if (!byUserId && !customerId) break

      const delWhere = byUserId
        ? eq(subscriptions.userId, userId)
        : eq(subscriptions.stripeCustomerId, customerId)
      const before = await db.query.subscriptions.findFirst({
        where: delWhere,
        columns: { status: true },
      })

      await db.update(subscriptions)
        .set({
          tier: "free",
          status: "canceled",
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(delWhere)

      // Win-back if a trial lapsed without ever converting to active (guarded by
      // the pre-update status, so an already-processed cancel won't re-send).
      if (before?.status === "trialing") {
        const member = await resolveMember({ userId, customerId })
        if (member) await sendTrialEndedEmail(member.email, member.name)
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
