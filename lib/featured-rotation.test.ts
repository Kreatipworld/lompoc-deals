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

// ── weightedSlots: partners dominate but free listings still get through ──
import { weightedSlots } from "./featured-rotation"

// Mirrors production: more partners than slots, so the partner pool is never the
// limiting factor and the weighting is what actually decides the mix.
const partners = Array.from({ length: 11 }, (_, i) => `p${i}`)
const free = Array.from({ length: 50 }, (_, i) => `f${i}`)

// always fills every slot it can
for (let i = 0; i < 50; i++) {
  assert.equal(weightedSlots(partners, free, 6).length, 6, "fills all requested slots")
}
// never duplicates within a render
for (let i = 0; i < 50; i++) {
  const picked = weightedSlots(partners, free, 6)
  assert.equal(new Set(picked).size, picked.length, "no duplicate entries in one render")
}

// over many renders: partners appear more often, but free listings genuinely appear
let partnerSlots = 0
let freeSlots = 0
const seenFree = new Set<string>()
for (let run = 0; run < 600; run++) {
  for (const item of weightedSlots(partners, free, 6, 0.7)) {
    if (partners.includes(item)) partnerSlots++
    else { freeSlots++; seenFree.add(item) }
  }
}
assert.ok(partnerSlots > freeSlots, "partners dominate on average")
assert.ok(freeSlots > 0, "free listings still reach the homepage")
assert.ok(seenFree.size > 20, `many different free businesses get a turn (saw ${seenFree.size})`)

// pool exhaustion: a tiny partner pool must fall through to free, never return short
const tinyPartners = ["only1", "only2"]
for (let i = 0; i < 50; i++) {
  const mix = weightedSlots(tinyPartners, free, 6)
  assert.equal(mix.length, 6, "falls through to the other pool rather than returning short")
  assert.equal(new Set(mix).size, 6, "fallback still never duplicates")
}
const noFree = weightedSlots(tinyPartners, [], 6)
assert.equal(noFree.length, 2, "cannot invent items when the other pool is empty")
const noPartners = weightedSlots([], free, 6)
assert.equal(noPartners.length, 6, "fills entirely from others when preferred pool is empty")
assert.equal(weightedSlots([], [], 6).length, 0, "both pools empty is safe")

// scale-stability: growing the free pool 20x must not starve partners
const hugeFree = Array.from({ length: 1000 }, (_, i) => `h${i}`)
let partnerSlotsHuge = 0
for (let run = 0; run < 600; run++) {
  for (const item of weightedSlots(partners, hugeFree, 6, 0.7)) {
    if (partners.includes(item)) partnerSlotsHuge++
  }
}
// within ~15% of the small-pool result — proves slot weighting, not per-item weighting
const drift = Math.abs(partnerSlotsHuge - partnerSlots) / partnerSlots
assert.ok(drift < 0.15, `partner share stable as catalogue grows (drift ${(drift * 100).toFixed(1)}%)`)

// ── seededShuffle still deterministic (unchanged behavior) ──
assert.deepEqual(
  seededShuffle(items, 12345),
  seededShuffle(items, 12345),
  "same seed still yields the same order"
)
assert.equal(dateSeed(new Date("2026-07-20T00:00:00Z")), dateSeed(new Date("2026-07-20T23:59:00Z")),
  "dateSeed still stable within a day")

console.log("featured-rotation: all assertions passed")
