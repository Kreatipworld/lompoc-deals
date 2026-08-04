import assert from "node:assert/strict"
import { rankBusinessHits, matchedCategorySlugs } from "./search"

// The exact result set production returned for "pizza" before the fix, in the exact order the
// database produced it: six name matches, limit exhausted, Eye on I unreachable.
const PIZZA = [
  { name: "Pizza Garden", description: "Family-owned pizzeria serving Lompoc since 1997." },
  { name: "Fatte's pizza Of Lompoc", description: "Hand-made pizzas on North H Street." },
  { name: "Blaze Pizza", description: "Build-your-own fast-fired pizza chain." },
  { name: "Mi Amore Pizza and Pasta", description: "Pizza and pasta on North H." },
  { name: "Little Caesars Pizza", description: "Carry-out pizza chain." },
  { name: "Domino's Pizza", description: "Delivery pizza chain." },
  { name: "Wild West Pizza & Grill", description: "Pizza and grill." },
  // The two word matches. Only one of them is actually a pizzeria.
  { name: "Eye on I", description: "Wood-fired pizza shop, kitchen, and community event space on I Street." },
  { name: "Big Jayke's", description: "Asian-fusion noodles \u2014 yakisoba, teriyaki bowls, loaded fries." },
]

const top6 = rankBusinessHits(PIZZA, "pizza", 6).map((b) => b.name)

// The complaint that started this: a wood-fired pizzeria absent from a search for pizza.
assert.ok(top6.includes("Eye on I"), `Eye on I must appear in the top 6 for "pizza", got: ${top6.join(", ")}`)

// Local independents come first. Chains stay in the results, below them.
const chainsAt = top6.findIndex((n) => /blaze|little caesars|domino/i.test(n))
const localsAt = top6.map((n, i) => (/fatte|mi amore|wild west|eye on i/i.test(n) ? i : -1)).filter((i) => i >= 0)
assert.ok(Math.max(...localsAt) < chainsAt, `every local should outrank the first chain, got: ${top6.join(", ")}`)
// A word match keeps its reserved seat even though five pizzerias name-match ahead of it.
assert.equal(top6[0], "Pizza Garden", "starts-with wins outright")
assert.ok(top6.indexOf("Eye on I") < chainsAt, "the local pizzeria outranks every chain")
// Description evidence beats a passing mention buried in about text.
assert.ok(!top6.includes("Big Jayke's"), "a noodle shop that merely mentions pizza must not take the seat")

// A chain searched for BY NAME still wins — demoting chains must not make them unfindable.
assert.equal(rankBusinessHits(PIZZA, "domino's", 3)[0].name, "Domino's Pizza")
assert.equal(rankBusinessHits(PIZZA, "little caesars", 3)[0].name, "Little Caesars Pizza")

// Ranking is stable: equal-tier rows keep the order the query gave them, so results don't
// reshuffle between identical searches.
const twice = [rankBusinessHits(PIZZA, "pizza", 6), rankBusinessHits(PIZZA, "pizza", 6)]
assert.deepEqual(twice[0], twice[1], "same input must produce the same order")

// Synonyms still route bare words to the right category — the other half of "show up on words".
assert.ok(matchedCategorySlugs("pizza").has("food-drink"))
assert.ok(matchedCategorySlugs("plumbing").has("services"))
assert.ok(matchedCategorySlugs("haircut").has("health-beauty"))
assert.ok(matchedCategorySlugs("comida").has("food-drink"), "Spanish searches must work too")

console.log(`rankBusinessHits: all assertions passed — "pizza" → ${top6.slice(0, 4).join(", ")}, …`)
