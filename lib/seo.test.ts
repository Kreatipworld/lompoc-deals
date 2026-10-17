import assert from "node:assert/strict"
import { seoTitle, seoDescription, bizSeoTitle } from "./seo"

assert.equal(bizSeoTitle("Eddie's Grill", ["Hours", "Deals", "Photos"]), "Eddie's Grill, Lompoc: Hours, Deals & Photos | Lompoc Locals") // exactly 60
assert.equal(bizSeoTitle("ALDI Lompoc", ["Hours"]), "ALDI Lompoc: Hours | Lompoc Locals") // no doubled town; brand fits
assert.equal(bizSeoTitle("Toro Loco", ["Horario", "Fotos"], "es"), "Toro Loco, Lompoc: Horario y Fotos | Lompoc Locals")
assert.equal(bizSeoTitle("Hangar 7 Social House", ["Hours", "Deals", "Photos"]), "Hangar 7 Social House, Lompoc: Hours, Deals & Photos")
assert.ok(bizSeoTitle("A Very Long Business Name That Goes On And On Forever", ["Hours", "Deals", "Photos"]).length <= 60)
assert.equal(bizSeoTitle("Coastal Tint", []), "Coastal Tint, Lompoc | Lompoc Locals")

assert.equal(seoTitle("Lompoc Museum", "Things to Do in Lompoc"), "Lompoc Museum — Things to Do") // town dropped, descriptor kept
assert.equal(seoTitle("Hilton Garden Inn Lompoc", "Lompoc Hotel"), "Hilton Garden Inn Lompoc — Hotel")
assert.equal(seoTitle("ALDI Lompoc", "Lompoc, CA"), "ALDI Lompoc")
assert.equal(seoTitle("Ryon Park", "Things to Do"), "Ryon Park — Things to Do")
assert.ok(seoTitle("Harris Grade Road Scenic Drive", "Things to Do in Lompoc").length + 15 <= 60)
assert.equal(seoTitle("Rolling Tire & Auto Repair - Auto Repair Service Lompoc CA", "Auto"), "Rolling Tire & Auto Repair - Auto Repair…")
assert.ok(seoTitle("A".repeat(80), undefined, { absolute: true }).length <= 60)
const d = seoDescription("Short stub", "Local business in Lompoc, CA — hours, photos, and directions on Lompoc Locals.")
assert.ok(d.length >= 70 && d.length <= 155 && d.startsWith("Short stub. Local business"))
assert.ok(seoDescription("word ".repeat(80), "x").length <= 155)
assert.ok(seoDescription("word ".repeat(80), "x").endsWith("…"))
console.log("seo: all assertions passed")
