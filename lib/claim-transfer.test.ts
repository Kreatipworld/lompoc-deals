import assert from "node:assert/strict"
import { effectiveTier } from "./tier"

// The bug this guards against: effectiveTier() returns plan_override BEFORE it
// looks at any subscription. Neither claim path used to clear the override, so
// a comped listing that got claimed handed its new owner full entitlements with
// no card on file — permanently, and without ever being asked for one.
// transferBusinessToOwner() now clears it. These assert why that matters.

// 1. While nobody owns it, the comp is what grants the tier.
assert.equal(
  effectiveTier({ planOverride: "standard", subTier: null, subStatus: null }),
  "standard",
  "a comp grants its tier with no subscription at all"
)

// 2. After the transfer clears it, an unpaid owner is free — so checkout is required.
assert.equal(
  effectiveTier({ planOverride: null, subTier: null, subStatus: null }),
  "free",
  "comp cleared and no subscription means free"
)

// 3. After the transfer, a real subscription is the only thing granting the tier.
assert.equal(
  effectiveTier({ planOverride: null, subTier: "premium", subStatus: "active" }),
  "premium",
  "a real Plus subscription grants premium"
)

// 4. The worst case: a stale comp masks a cancelled subscription forever.
assert.equal(
  effectiveTier({ planOverride: "standard", subTier: "standard", subStatus: "canceled" }),
  "standard",
  "a stale comp keeps a cancelled member on Growth"
)
assert.equal(
  effectiveTier({ planOverride: null, subTier: "standard", subStatus: "canceled" }),
  "free",
  "with the comp cleared, cancelling actually ends the membership"
)

console.log("claim-transfer: all assertions passed")
