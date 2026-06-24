import assert from "node:assert/strict"
import { dateSeed, seededShuffle } from "./featured-rotation"

// dateSeed: same day → same seed, different day → different seed
assert.equal(dateSeed(new Date("2026-06-23T01:00:00Z")), dateSeed(new Date("2026-06-23T23:00:00Z")))
assert.notEqual(dateSeed(new Date("2026-06-23T12:00:00Z")), dateSeed(new Date("2026-06-24T12:00:00Z")))

// seededShuffle: deterministic for a given seed, does not mutate input, preserves elements
const input = [1, 2, 3, 4, 5]
const a = seededShuffle(input, 42)
const b = seededShuffle(input, 42)
assert.deepEqual(a, b, "same seed → same order")
assert.deepEqual(input, [1, 2, 3, 4, 5], "input not mutated")
assert.deepEqual([...a].sort((x, y) => x - y), [1, 2, 3, 4, 5], "all elements preserved")
const c = seededShuffle(input, 99)
assert.notDeepEqual(a, c, "different seed → (very likely) different order")

console.log("featured.test: all passed")
