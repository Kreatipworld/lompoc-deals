import assert from "node:assert/strict"
import { evaluateClaim } from "./coupon-limits"

const NOW = new Date("2026-07-20T18:00:00Z")
const base = {
  paused: false,
  expiresAt: new Date("2026-08-01T00:00:00Z"),
  maxRedemptions: null as number | null,
  maxPerDay: null as number | null,
  totalClaims: 0,
  claimsToday: 0,
  now: NOW,
}

// happy path
assert.equal(evaluateClaim(base), null, "unlimited live deal is claimable")

// paused wins over everything
assert.equal(evaluateClaim({ ...base, paused: true }), "paused")

// expired
assert.equal(
  evaluateClaim({ ...base, expiresAt: new Date("2026-07-19T00:00:00Z") }),
  "expired"
)
// expiring exactly now counts as expired (no grace)
assert.equal(evaluateClaim({ ...base, expiresAt: NOW }), "expired")

// total cap
assert.equal(evaluateClaim({ ...base, maxRedemptions: 50, totalClaims: 49 }), null, "under cap")
assert.equal(evaluateClaim({ ...base, maxRedemptions: 50, totalClaims: 50 }), "sold_out", "at cap")
assert.equal(evaluateClaim({ ...base, maxRedemptions: 50, totalClaims: 51 }), "sold_out", "over cap")

// per-day cap
assert.equal(evaluateClaim({ ...base, maxPerDay: 10, claimsToday: 9 }), null)
assert.equal(evaluateClaim({ ...base, maxPerDay: 10, claimsToday: 10 }), "daily_limit")

// null caps mean unlimited even with high counts
assert.equal(evaluateClaim({ ...base, totalClaims: 9999, claimsToday: 9999 }), null)

// zero cap blocks immediately (a deliberate "no claims" setting)
assert.equal(evaluateClaim({ ...base, maxRedemptions: 0 }), "sold_out")

// priority: expired beats sold_out
assert.equal(
  evaluateClaim({ ...base, expiresAt: new Date("2026-01-01T00:00:00Z"), maxRedemptions: 1, totalClaims: 5 }),
  "expired"
)
// priority: sold_out beats daily_limit
assert.equal(
  evaluateClaim({ ...base, maxRedemptions: 1, totalClaims: 5, maxPerDay: 1, claimsToday: 5 }),
  "sold_out"
)

console.log("coupon-limits: all assertions passed")
