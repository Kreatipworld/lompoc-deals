import assert from "node:assert/strict"
import { summarizeClaims } from "./coupon-stats"

const H = (h: number) => new Date(Date.UTC(2026, 6, 20, h, 0, 0))
const rows = [
  // deal 1: 3 claims, 2 redeemed
  { dealId: 1, userId: 10, status: "redeemed", claimedAt: H(1), redeemedAt: H(3) }, // 2h
  { dealId: 1, userId: 11, status: "redeemed", claimedAt: H(1), redeemedAt: H(7) }, // 6h
  { dealId: 1, userId: 12, status: "claimed", claimedAt: H(2), redeemedAt: null },
  // deal 2: 1 claim, unredeemed
  { dealId: 2, userId: 10, status: "claimed", claimedAt: H(4), redeemedAt: null },
]
// user 10 has bought here before; 11 and 12 are new to the business
const prior = new Set([10])

const out = summarizeClaims(rows, prior)
const d1 = out.get(1)!
assert.equal(d1.claims, 3, "counts every claim")
assert.equal(d1.redemptions, 2, "counts only verified redemptions")
assert.equal(Math.round(d1.redeemRate * 100), 67, "redeem rate = redeemed / claimed")
assert.equal(d1.repeatCustomers, 1, "user 10 is a repeat customer")
assert.equal(d1.newCustomers, 2, "users 11 and 12 are new")
assert.equal(d1.medianHoursToRedeem, 4, "median of 2h and 6h")

const d2 = out.get(2)!
assert.equal(d2.redemptions, 0)
assert.equal(d2.redeemRate, 0, "no redemptions is a 0 rate, never NaN")
assert.equal(d2.medianHoursToRedeem, null, "no redemptions means no median")

// empty input is safe
assert.equal(summarizeClaims([], new Set()).size, 0)

console.log("coupon-stats: all assertions passed")
