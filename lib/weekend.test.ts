import assert from "node:assert/strict"
import { weekendWindow, weekendLabel } from "./weekend"

// Wed Oct 14 2026, 10:00 PDT → coming weekend Fri Oct 16 00:00 PDT (07:00Z) – Mon Oct 19 00:00 PDT
let w = weekendWindow(new Date("2026-10-14T17:00:00Z"))
assert.equal(w.start.toISOString(), "2026-10-16T07:00:00.000Z")
assert.equal(w.end.toISOString(), "2026-10-19T07:00:00.000Z")
// Sat Oct 17, 23:30 PDT (Sun 06:30Z) → still the same weekend
w = weekendWindow(new Date("2026-10-18T06:30:00Z"))
assert.equal(w.start.toISOString(), "2026-10-16T07:00:00.000Z")
// Fri Oct 30 → weekend crosses the Nov 1 DST change: Mon Nov 2 00:00 PST = 08:00Z
w = weekendWindow(new Date("2026-10-30T19:00:00Z"))
assert.equal(w.start.toISOString(), "2026-10-30T07:00:00.000Z")
assert.equal(w.end.toISOString(), "2026-11-02T08:00:00.000Z")
assert.equal(weekendLabel(new Date("2026-10-14T17:00:00Z"), "en"), "Oct 16–18")
assert.equal(weekendLabel(new Date("2026-10-30T19:00:00Z"), "en"), "Oct 30–Nov 1")
assert.equal(weekendLabel(new Date("2026-10-14T17:00:00Z"), "es"), "16–18 oct")
console.log("weekend: all assertions passed")
