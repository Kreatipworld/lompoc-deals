import type { TierKey } from "@/lib/stripe"

export type EffectiveTierInput = {
  planOverride?: TierKey | null
  subTier?: TierKey | null
  subStatus?: "active" | "past_due" | "canceled" | "trialing" | null
  gracePeriodEndsAt?: Date | null
  now?: Date
}

/**
 * Resolve a business's effective paid tier.
 * Order: plan_override (admin) > active/trialing subscription > within grace period > free.
 */
export function effectiveTier(input: EffectiveTierInput): TierKey {
  if (input.planOverride) return input.planOverride

  const isActive = input.subStatus === "active" || input.subStatus === "trialing"
  if (isActive && input.subTier) return input.subTier

  const now = input.now ?? new Date()
  const inGrace = input.gracePeriodEndsAt != null && input.gracePeriodEndsAt.getTime() > now.getTime()
  if (inGrace && input.subTier) return input.subTier

  return "free"
}
