import assert from "node:assert/strict"
import { instantSearch, fold, editDistance, type SearchIndex } from "./instant"

const index: SearchIndex = {
  v: 1,
  lb: "https://blob.example/",
  c: [
    { s: "auto", n: "Auto", c: 3, k: "car tire mechanic repair brake smog carro llantas mecanico taller" },
    { s: "food-drink", n: "Food & Drink", c: 4, k: "food restaurant eat pizza taco coffee cafe comida restaurante cena" },
    { s: "other", n: "Other", c: 1, k: "" },
  ],
  w: [
    { s: "pizza", en: "Pizza in Lompoc", es: "Pizza en Lompoc", a: ["pizzas", "pizzeria", "pizza near downtown"] },
    { s: "auto-repair", en: "Auto Repair in Lompoc", es: "Taller mecánico en Lompoc", a: ["mechanic", "car repair", "mecánico"] },
  ],
  b: [
    { i: 1, n: "Hodges Automotive", s: "hodges-automotive", c: "auto", l: "~/logos/h.png", t: 0, k: "auto brake repair honda toyota smog" },
    { i: 2, n: "In&Out Tires Lpc", s: "in-out-tires-lpc", c: "auto", l: null, t: 1, k: "auto tires wheels alignment" },
    { i: 3, n: "Pizza Garden", s: "pizza-garden", c: "food-drink", l: null, t: 0, k: "food pizzeria breadsticks wings delivery" },
    { i: 4, n: "Hangar 7 Social House", s: "hangar-7-social-house", c: "food-drink", l: null, t: 1, k: "food wine bar wood-fired pizzas charcuterie lounge" },
    { i: 5, n: "Eddie's Grill", s: "eddies-grill", c: "food-drink", l: null, t: 1, k: "food burgers pastrami shakes homemade buns" },
    { i: 6, n: "Café Ñandú", s: "cafe-nandu", c: "food-drink", l: null, t: 0, k: "food coffee espresso pastries" },
    { i: 7, n: "Kaizen Collision Center", s: "kaizen-collision-center", c: "auto", l: null, t: 0, k: "auto body collision paint" },
  ],
}

assert.equal(fold("Café Ñandú!"), "cafe nandu")
assert.equal(editDistance("hudges", "hodges"), 1)
assert.equal(editDistance("hodgse", "hodges"), 1) // transposition
assert.equal(editDistance("abc", "xyz", 2), 3) // capped

// exact name prefix wins, and resolves the relative logo
let r = instantSearch(index, "hod")
assert.equal(r.businesses[0].n, "Hodges Automotive")
assert.equal(r.businesses[0].rank, 0)
assert.equal(r.businesses[0].logoUrl, "https://blob.example/logos/h.png")

// fuzzy: a typo still finds the shop
r = instantSearch(index, "hudges")
assert.equal(r.businesses[0]?.n, "Hodges Automotive")
assert.equal(r.businesses[0].rank, 3)

// members first within the same rank ("pizza": Hangar 7 keyword pizzas + Pizza Garden name)
r = instantSearch(index, "pizza")
assert.equal(r.businesses[0].n, "Pizza Garden") // rank 0 beats keyword rank 2
assert.equal(r.businesses[1].n, "Hangar 7 Social House")
assert.equal(r.wordPages[0]?.s, "pizza")

// accents and Spanish
r = instantSearch(index, "cafe")
assert.equal(r.businesses[0].n, "Café Ñandú")
r = instantSearch(index, "mecánico")
assert.ok(r.wordPages.some((w) => w.s === "auto-repair"))
assert.ok(r.categories.some((c) => c.s === "auto"))

// multi-word: every token must match
r = instantSearch(index, "hangar 7")
assert.equal(r.businesses[0].n, "Hangar 7 Social House")
assert.equal(r.businesses[0].rank, 0)
r = instantSearch(index, "hangar pizza")
assert.equal(r.businesses.length, 1)

// category synonym fallback only when little else matches, members first
r = instantSearch(index, "comida")
assert.equal(r.businesses.length, 4)
assert.equal(r.businesses[0].t, 1)
assert.ok(r.businesses.every((b) => b.c === "food-drink"))

// nonsense → nothing, short → nothing
assert.equal(instantSearch(index, "zzqx").businesses.length, 0)
assert.equal(instantSearch(index, "h").businesses.length, 0)

// speed: 500 rows, 200 queries under ~1s total (i.e. < 5 ms each)
const big: SearchIndex = { ...index, b: Array.from({ length: 500 }, (_, i) => ({ ...index.b[i % 7], i, s: `${index.b[i % 7].s}-${i}` })) }
const t0 = performance.now()
for (let i = 0; i < 200; i++) instantSearch(big, i % 2 ? "hudges auto" : "pizza")
const per = (performance.now() - t0) / 200
assert.ok(per < 5, `expected < 5 ms per query, got ${per.toFixed(2)}`)

console.log(`instant search: passed (${per.toFixed(2)} ms/query on 500 rows)`)
