import assert from "node:assert/strict"
import { isGarageSale, isThisWeekend, interleaveDeals } from "./feed-interleave"

// --- isGarageSale
assert.equal(isGarageSale("for_sale", new Date("2026-07-10")), true)
assert.equal(isGarageSale("for_sale", null), false)
assert.equal(isGarageSale("info", new Date("2026-07-10")), false)

// --- isThisWeekend (Tue Jul 7 2026 → upcoming weekend is Fri Jul 10 – Sun Jul 12)
const tue = new Date("2026-07-07T12:00:00-07:00")
assert.equal(isThisWeekend(new Date("2026-07-11T08:00:00-07:00"), null, tue), true)
assert.equal(isThisWeekend(new Date("2026-07-18T08:00:00-07:00"), null, tue), false)
// sale spanning into the window counts
assert.equal(
  isThisWeekend(new Date("2026-07-09T08:00:00-07:00"), new Date("2026-07-11T17:00:00-07:00"), tue),
  true
)
// on a Saturday, the CURRENT weekend counts
const sat = new Date("2026-07-11T09:00:00-07:00")
assert.equal(isThisWeekend(new Date("2026-07-12T08:00:00-07:00"), null, sat), true)
assert.equal(isThisWeekend(null, null, tue), false)

// --- isThisWeekend: Pacific-pinned UTC-boundary cases (must pass under any TZ, incl. TZ=UTC)
// Fri just after midnight Pacific (07:30 UTC) counts as the weekend, even though
// server-local (UTC) midnight rollover hasn't happened at the equivalent hour.
assert.equal(
  isThisWeekend(new Date("2026-07-10T00:30:00-07:00"), null, tue),
  true
)
// Mon just after midnight Pacific must NOT count as weekend.
assert.equal(
  isThisWeekend(new Date("2026-07-13T00:30:00-07:00"), null, tue),
  false
)
// Sun 11:30pm Pacific (Mon 06:30 UTC): current weekend is still active — a sale
// spanning Sat Jul 11 → Sun Jul 12 (Pacific) still counts.
const sunLateNight = new Date("2026-07-12T23:30:00-07:00")
assert.equal(
  isThisWeekend(
    new Date("2026-07-11T09:00:00-07:00"),
    new Date("2026-07-12T20:00:00-07:00"),
    sunLateNight
  ),
  true
)

// --- interleaveDeals: 1 deal after every 4 non-deals, never adjacent, leftovers dropped
const nd = (n: number) => Array.from({ length: n }, (_, i) => ({ source: "feed", i }))
const dl = (n: number) => Array.from({ length: n }, (_, i) => ({ source: "deal", i }))

const mixed = interleaveDeals(nd(10), dl(5))
// 10 non-deals → deals inserted after positions 4 and 8 → 12 items, 2 deals
assert.equal(mixed.length, 12)
assert.equal(mixed.filter((x) => x.source === "deal").length, 2)
for (let i = 1; i < mixed.length; i++) {
  assert.ok(
    !(mixed[i].source === "deal" && mixed[i - 1].source === "deal"),
    "no adjacent deals"
  )
}
// order of non-deals preserved
assert.deepEqual(
  mixed.filter((x) => x.source === "feed").map((x) => (x as { i: number }).i),
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
)
// no deals → passthrough
assert.deepEqual(interleaveDeals(nd(3), []), nd(3))
// no non-deals → at most one deal (nothing to separate them)
assert.equal(interleaveDeals([], dl(4)).length, 1)

console.log("feed-interleave.test.ts OK")
