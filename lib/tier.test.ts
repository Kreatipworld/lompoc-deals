import assert from "node:assert/strict"
import { effectiveTier } from "./tier"

// Deterministic clock — never rely on the real Date.now() for grace-window math.
const NOW = new Date("2026-07-29T12:00:00Z")
const FUTURE = new Date("2026-08-05T12:00:00Z") // inside grace window
const PAST = new Date("2026-07-22T12:00:00Z") // grace window already expired

// 1. Admin comp override beats everything, even a null/expired subscription.
assert.equal(
  effectiveTier({
    planOverride: "premium",
    subTier: null,
    subStatus: "canceled",
    gracePeriodEndsAt: PAST,
    now: NOW,
  }),
  "premium",
  "plan_override wins over an absent/expired subscription"
)

// 2. Override wins even when a real subscription is active at a different tier.
assert.equal(
  effectiveTier({
    planOverride: "standard",
    subTier: "premium",
    subStatus: "active",
    now: NOW,
  }),
  "standard",
  "plan_override beats an active subscription tier"
)

// 3. No override, active subscription → its tier.
assert.equal(
  effectiveTier({ subTier: "standard", subStatus: "active", now: NOW }),
  "standard",
  "active subscription grants its tier"
)

// 4. No override, TRIALING subscription → entitled (the 14-day-trial case).
assert.equal(
  effectiveTier({ subTier: "standard", subStatus: "trialing", now: NOW }),
  "standard",
  "trialing subscription is entitled"
)

// 5. No override, past_due but still inside the grace window → keep tier.
assert.equal(
  effectiveTier({
    subTier: "standard",
    subStatus: "past_due",
    gracePeriodEndsAt: FUTURE,
    now: NOW,
  }),
  "standard",
  "grace period keeps a past_due sub entitled"
)

// 6. No override, past_due with grace window in the PAST → free.
assert.equal(
  effectiveTier({
    subTier: "standard",
    subStatus: "past_due",
    gracePeriodEndsAt: PAST,
    now: NOW,
  }),
  "free",
  "expired grace period drops to free"
)

// 7. No override, canceled with no grace → free.
assert.equal(
  effectiveTier({
    subTier: "standard",
    subStatus: "canceled",
    gracePeriodEndsAt: null,
    now: NOW,
  }),
  "free",
  "canceled with no grace is free"
)

// 8. No override, no subscription at all → free.
assert.equal(
  effectiveTier({
    planOverride: null,
    subTier: null,
    subStatus: null,
    gracePeriodEndsAt: null,
    now: NOW,
  }),
  "free",
  "no subscription is free"
)

// 9. Edge: subscription active but tier is null → free (nothing to grant).
assert.equal(
  effectiveTier({ subTier: null, subStatus: "active", now: NOW }),
  "free",
  "active sub with null tier grants nothing"
)

console.log("tier: all assertions passed")
