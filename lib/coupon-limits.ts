/** Why a coupon cannot be claimed right now; null means it can. */
export type ClaimBlock = "expired" | "paused" | "sold_out" | "daily_limit" | null

/**
 * Decide whether a customer may claim a coupon. Pure so the rules are testable
 * without a database.
 *
 * Caps are evaluated at CLAIM time, never at redemption: a code already in a
 * customer's hand must always work at the counter. The trade-off — some claimants
 * never show up, so a 50-claim cap yields fewer than 50 actual redemptions — is
 * deliberate and documented in the spec.
 */
export function evaluateClaim(input: {
  paused: boolean
  expiresAt: Date
  maxRedemptions: number | null
  maxPerDay: number | null
  totalClaims: number
  claimsToday: number
  now: Date
}): ClaimBlock {
  if (input.paused) return "paused"
  if (input.expiresAt.getTime() <= input.now.getTime()) return "expired"
  if (input.maxRedemptions !== null && input.totalClaims >= input.maxRedemptions) return "sold_out"
  if (input.maxPerDay !== null && input.claimsToday >= input.maxPerDay) return "daily_limit"
  return null
}
