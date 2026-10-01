import assert from "node:assert/strict"
import { normalizeKeyword, pagePath, pctChange, positionDelta, queryMatchesKeyword, weightedPosition } from "./keyword-positions"

// Run: node_modules/.bin/tsx lib/keyword-positions.test.ts

assert.equal(normalizeKeyword("  Lompoc   Tires! "), "lompoc tires")
assert.equal(normalizeKeyword("Paisano's Family Barbershop"), "paisano's family barbershop")
assert.equal(normalizeKeyword("B&B Towing, Inc."), "b&b towing inc")
assert.equal(normalizeKeyword("Café Ñandú"), "café ñandú")
assert.equal(normalizeKeyword("---"), "")

assert.ok(queryMatchesKeyword("lompoc tires", "lompoc tires"), "exact")
assert.ok(queryMatchesKeyword("best lompoc tires shop", "lompoc tires"), "contains")
assert.ok(queryMatchesKeyword("Lompoc Tires", "lompoc tires"), "case-insensitive")
assert.ok(!queryMatchesKeyword("lompoc tire", "lompoc tires"), "singular does not match plural")
assert.ok(!queryMatchesKeyword("anything", ""), "empty keyword never matches")

assert.equal(weightedPosition([]), null)
assert.equal(weightedPosition([{ impressions: 0, position: 3 }]), null, "no impressions = not shown")
assert.equal(weightedPosition([{ impressions: 10, position: 2 }, { impressions: 30, position: 6 }]), 5, "impression-weighted")

assert.equal(positionDelta(4.2, 6.2)?.toFixed(1), "-2.0", "negative = moved up")
assert.equal(positionDelta(null, 6), null)
assert.equal(positionDelta(4, null), null)

assert.equal(pctChange(150, 100), 50)
assert.equal(pctChange(50, 100), -50)
assert.equal(pctChange(5, 0), null, "no baseline")

assert.equal(pagePath("https://www.lompoclocals.com/biz/in-out-tires/"), "/biz/in-out-tires")
assert.equal(pagePath("https://www.lompoclocals.com/"), "/")
assert.equal(pagePath("https://www.lompoclocals.com/search?q=tacos"), "/search?q=tacos")
assert.equal(pagePath("not a url"), "not a url")

console.log("keyword-positions: all assertions passed")
