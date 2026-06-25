import assert from "node:assert/strict"
import {
  AMENITIES,
  AMENITY_SLUGS,
  isAmenitySlug,
  mapGoogleAdditionalInfo,
} from "./amenities"

// taxonomy shape
assert.equal(AMENITIES.length, 14)
assert.ok(AMENITIES.every((a) => a.slug && a.icon && a.labelKey))
assert.deepEqual(AMENITY_SLUGS, AMENITIES.map((a) => a.slug))

// slug guard
assert.equal(isAmenitySlug("takeout"), true)
assert.equal(isAmenitySlug("not_a_real_amenity"), false)

// null / wrong-shape input → []
assert.deepEqual(mapGoogleAdditionalInfo(null), [])
assert.deepEqual(mapGoogleAdditionalInfo(undefined), [])
assert.deepEqual(mapGoogleAdditionalInfo("garbage"), [])
assert.deepEqual(mapGoogleAdditionalInfo(42), [])

// realistic Apify additionalInfo blob
const blob = {
  "Service options": [{ "Dine-in": true }, { Takeout: true }, { Delivery: false }],
  Accessibility: [{ "Wheelchair accessible entrance": true }],
  Amenities: [{ "Free Wi-Fi": true }, { "Restroom": true }],
  Payments: [{ "Credit cards": true }],
  Children: [{ "Good for kids": true }],
}
const got = mapGoogleAdditionalInfo(blob)
// false-valued label (Delivery) excluded; known labels mapped; stable AMENITIES order
assert.deepEqual(got, [
  "wheelchair_accessible",
  "dine_in",
  "takeout",
  "accepts_cards",
  "free_wifi",
  "family_friendly",
  "restroom",
])

// unknown labels dropped, dedupe
const blob2 = {
  X: [{ "Totally unknown thing": true }, { Takeout: true }, { "Take-out": true }],
}
assert.deepEqual(mapGoogleAdditionalInfo(blob2), ["takeout"])

console.log("amenities.test: all passed")
