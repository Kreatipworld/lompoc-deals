import assert from "node:assert/strict"
import { effectiveTier } from "./tier"

const NOW = new Date("2026-06-23T12:00:00Z")

// plan_override wins over everything
assert.equal(effectiveTier({ planOverride: "premium", subTier: "free", subStatus: "active", now: NOW }), "premium")
// active subscription returns its tier
assert.equal(effectiveTier({ subTier: "standard", subStatus: "active", now: NOW }), "standard")
// trialing counts as paid
assert.equal(effectiveTier({ subTier: "premium", subStatus: "trialing", now: NOW }), "premium")
// canceled with no grace = free
assert.equal(effectiveTier({ subTier: "premium", subStatus: "canceled", now: NOW }), "free")
// canceled but within grace = keeps tier
assert.equal(effectiveTier({ subTier: "premium", subStatus: "canceled", gracePeriodEndsAt: new Date("2026-06-30T00:00:00Z"), now: NOW }), "premium")
// grace expired = free
assert.equal(effectiveTier({ subTier: "premium", subStatus: "canceled", gracePeriodEndsAt: new Date("2026-06-01T00:00:00Z"), now: NOW }), "free")
// past_due with no grace = free
assert.equal(effectiveTier({ subTier: "standard", subStatus: "past_due", now: NOW }), "free")
// no subscription at all = free
assert.equal(effectiveTier({ now: NOW }), "free")

console.log("tier.test: all passed")
