import assert from "node:assert/strict"
import {
  NEIGHBORHOODS,
  latLngToNeighborhood,
  neighborhoodLabel,
} from "./neighborhoods"

// shape: every zone has slug, labels, and a [S, W, N, E] box that is coherent
assert.ok(NEIGHBORHOODS.length >= 8)
for (const n of NEIGHBORHOODS) {
  assert.ok(n.slug && n.en && n.es)
  const [s, w, no, e] = n.bounds
  assert.ok(s < no, `${n.slug}: south < north`)
  assert.ok(w < e, `${n.slug}: west < east`)
}

// Old Town core (H St & Ocean Ave area) — must win over the wider Downtown box
assert.equal(latLngToNeighborhood(34.6391, -120.4579), "old-town")
// Wider central Lompoc, outside the Old Town core
assert.equal(latLngToNeighborhood(34.632, -120.448), "downtown")
// North of Central Ave, inside city
assert.equal(latLngToNeighborhood(34.665, -120.45), "northside")
// West of V St
assert.equal(latLngToNeighborhood(34.64, -120.475), "westside")
// South of Olive Ave
assert.equal(latLngToNeighborhood(34.62, -120.45), "southside")
// Vandenberg Village
assert.equal(latLngToNeighborhood(34.708, -120.461), "vandenberg-village")
// Mission Hills
assert.equal(latLngToNeighborhood(34.683, -120.428), "mission-hills")
// Mesa Oaks
assert.equal(latLngToNeighborhood(34.693, -120.462), "mesa-oaks")
// Vandenberg SFB (far west)
assert.equal(latLngToNeighborhood(34.73, -120.57), "vsfb")
// Way outside (Santa Maria) → null
assert.equal(latLngToNeighborhood(34.953, -120.435), null)

// labels
assert.equal(neighborhoodLabel("downtown", "es"), "Centro")
assert.equal(neighborhoodLabel("downtown", "en"), "Downtown")
assert.equal(neighborhoodLabel("not-a-zone", "en"), "Lompoc")

console.log("neighborhoods.test.ts OK")
