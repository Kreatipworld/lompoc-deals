import assert from "node:assert/strict"
import { seoTitle, seoDescription } from "./seo"

assert.equal(seoTitle("Lompoc Museum", "Things to Do in Lompoc"), "Lompoc Museum") // says Lompoc → no descriptor
assert.equal(seoTitle("Ryon Park", "Things to Do"), "Ryon Park — Things to Do")
assert.ok(seoTitle("Harris Grade Road Scenic Drive", "Things to Do in Lompoc").length + 15 <= 60)
assert.equal(seoTitle("Rolling Tire & Auto Repair - Auto Repair Service Lompoc CA", "Auto"), "Rolling Tire & Auto Repair - Auto Repair…")
assert.ok(seoTitle("A".repeat(80), undefined, { absolute: true }).length <= 60)
const d = seoDescription("Short stub", "Local business in Lompoc, CA — hours, photos, and directions on Lompoc Locals.")
assert.ok(d.length >= 70 && d.length <= 155 && d.startsWith("Short stub. Local business"))
assert.ok(seoDescription("word ".repeat(80), "x").length <= 155)
assert.ok(seoDescription("word ".repeat(80), "x").endsWith("…"))
console.log("seo: all assertions passed")
