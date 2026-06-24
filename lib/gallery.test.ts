import assert from "node:assert/strict"
import { planGallery } from "./gallery"

// empty
assert.deepEqual(planGallery([]), { lead: null, thumbs: [], overflow: 0, total: 0 })
// single
assert.deepEqual(planGallery(["a"]), { lead: "a", thumbs: [], overflow: 0, total: 1 })
// two
assert.deepEqual(planGallery(["a", "b"]), { lead: "a", thumbs: ["b"], overflow: 0, total: 2 })
// four — lead + 3 thumbs, no overflow
assert.deepEqual(planGallery(["a", "b", "c", "d"]), { lead: "a", thumbs: ["b", "c", "d"], overflow: 0, total: 4 })
// five — lead + 4 thumbs, no overflow (boundary: +N appears only past 5)
assert.deepEqual(planGallery(["a", "b", "c", "d", "e"]), { lead: "a", thumbs: ["b", "c", "d", "e"], overflow: 0, total: 5 })
// nine — lead + 4 thumbs, overflow 4
assert.deepEqual(planGallery(["a", "b", "c", "d", "e", "f", "g", "h", "i"]), {
  lead: "a", thumbs: ["b", "c", "d", "e"], overflow: 4, total: 9,
})
// custom maxThumbs
assert.deepEqual(planGallery(["a", "b", "c", "d"], 2), { lead: "a", thumbs: ["b", "c"], overflow: 1, total: 4 })

console.log("gallery.test: all passed")
