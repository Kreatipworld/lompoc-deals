import { db } from "@/db/client"
import { subscriptions, businesses } from "@/db/schema"
import { eq } from "drizzle-orm"
import { effectiveTier } from "@/lib/tier"
import type { TierKey } from "@/lib/stripe"

/**
 * Single source of truth for a user's effective paid tier.
 *
 * Resolves entitlements the way `effectiveTier` intends — honoring admin comps
 * (businesses.plan_override), active/trialing Stripe subscriptions, and the
 * post-payment-failure grace period. Every dashboard gate and feature check
 * should go through this instead of reading `subscriptions.tier`/`status`
 * directly, so a comped, trialing, or grace-period business is treated
 * consistently everywhere.
 */
export async function getEffectiveTierForUser(userId: number): Promise<TierKey> {
  const [sub, biz] = await Promise.all([
    db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) }),
    db.query.businesses.findFirst({ where: eq(businesses.ownerUserId, userId) }),
  ])
  return effectiveTier({
    planOverride: biz?.planOverride ?? null,
    subTier: sub?.tier ?? null,
    subStatus: sub?.status ?? null,
    gracePeriodEndsAt: biz?.gracePeriodEndsAt ?? null,
  })
}
