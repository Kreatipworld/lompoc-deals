import assert from "node:assert/strict"
import { fairShuffle, fairShuffleByRank, seededShuffle, dateSeed } from "./featured-rotation"

// ── fairShuffle: preserves membership, does not mutate ──
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const shuffled = fairShuffle(items)
assert.deepEqual([...shuffled].sort((a, b) => a - b), items, "keeps every item exactly once")
assert.deepEqual(items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "does not mutate the input")
assert.equal(fairShuffle([]).length, 0, "empty input is safe")
assert.deepEqual(fairShuffle([7]), [7], "single item is safe")

// ── fairShuffle actually varies across calls (the whole point) ──
// 10! orders, so 40 identical runs would be astronomically unlikely unless it's broken.
const orders = new Set(Array.from({ length: 40 }, () => fairShuffle(items).join(",")))
assert.ok(orders.size > 1, "produces different orders across calls")

// ── every item reaches the front slot over many draws (fairness) ──
const frontSlots = new Set(Array.from({ length: 400 }, () => fairShuffle(items)[0]))
assert.equal(frontSlots.size, items.length, "every item gets a turn in first place")

// ── fairShuffleByRank: higher rank always precedes lower rank ──
type Biz = { id: number; rank: number }
const mixed: Biz[] = [
  { id: 1, rank: 0 }, { id: 2, rank: 2 }, { id: 3, rank: 0 },
  { id: 4, rank: 1 }, { id: 5, rank: 2 }, { id: 6, rank: 0 },
]
for (let run = 0; run < 50; run++) {
  const ranked = fairShuffleByRank(mixed, (b) => b.rank)
  assert.equal(ranked.length, mixed.length, "keeps every item")
  const ranks = ranked.map((b) => b.rank)
  assert.deepEqual(ranks, [...ranks].sort((a, b) => b - a), "ranks are in descending order")
}

// premium (rank 2) members each reach the top slot — fair within their tier
const topOfRankedRuns = new Set(
  Array.from({ length: 300 }, () => fairShuffleByRank(mixed, (b) => b.rank)[0].id)
)
assert.deepEqual(Array.from(topOfRankedRuns).sort(), [2, 5], "only rank-2 items lead, and both get turns")

// ── seededShuffle still deterministic (unchanged behavior) ──
assert.deepEqual(
  seededShuffle(items, 12345),
  seededShuffle(items, 12345),
  "same seed still yields the same order"
)
assert.equal(dateSeed(new Date("2026-07-20T00:00:00Z")), dateSeed(new Date("2026-07-20T23:59:00Z")),
  "dateSeed still stable within a day")

console.log("featured-rotation: all assertions passed")
