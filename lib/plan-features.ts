import { TIERS, type TierKey, type TierConfig } from "@/lib/stripe"

export type FeatureFlag =
  | "canViewAnalytics"
  | "canShowSocialLinks"
  | "canListRealEstate"
  | "priorityRanking"
  | "featuredOnHomepage"

export class UpgradeRequiredError extends Error {
  constructor(
    public readonly feature: FeatureFlag,
    public readonly requiredTier: TierKey
  ) {
    super(
      `Feature "${feature}" requires the ${TIERS[requiredTier].name} plan or higher.`
    )
    this.name = "UpgradeRequiredError"
  }
}

/** Return the full tier config for a given tier key. */
export function getPlanFeatures(tier: TierKey): TierConfig {
  return TIERS[tier]
}

/** The minimum tier that unlocks a given feature flag. */
const FEATURE_MINIMUM_TIER: Record<FeatureFlag, TierKey> = {
  canViewAnalytics: "standard",
  canShowSocialLinks: "standard",
  canListRealEstate: "premium",
  priorityRanking: "premium",
  featuredOnHomepage: "premium",
}

/**
 * Throws UpgradeRequiredError if the given tier does not have the feature.
 * Call from server actions to guard gated operations.
 */
export function assertFeature(tier: TierKey, feature: FeatureFlag): void {
  if (!TIERS[tier][feature]) {
    throw new UpgradeRequiredError(feature, FEATURE_MINIMUM_TIER[feature])
  }
}
