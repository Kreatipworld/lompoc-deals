import assert from "node:assert/strict"
import { CHAIN_PATTERNS, isChain } from "./chains"
import { CHAIN_PATTERNS as SCRIPT_PATTERNS } from "../scripts/lib/voice.mjs"

// The two lists must stay identical: the app filters chains out of the digest, the caption
// pipeline filters them out of social posts, and a chain slipping past either one is the same
// bug wearing a different hat. Compared as sets so ordering and stray duplicates don't matter.
const srcs = (list: RegExp[]) => new Set(list.map((r) => r.source.toLowerCase()))
const app = srcs(CHAIN_PATTERNS)
const script = srcs(SCRIPT_PATTERNS as RegExp[])
const appOnly = Array.from(app).filter((s) => !script.has(s))
const scriptOnly = Array.from(script).filter((s) => !app.has(s))
assert.deepEqual(appOnly, [], `in lib/chains.ts but not scripts/lib/voice.mjs: ${appOnly.join(", ")}`)
assert.deepEqual(scriptOnly, [], `in scripts/lib/voice.mjs but not lib/chains.ts: ${scriptOnly.join(", ")}`)

// The names that actually surfaced in the first live digest build.
for (const n of ["Wingstop", "Starbucks Lompoc", "Fosters Freeze", "Blaze Pizza", "Carl's Jr.", "Albertsons Bakery"])
  assert.ok(isChain(n), `${n} should be treated as a chain`)

// Independents that earlier substring matching wrongly swallowed. These must survive.
for (const n of [
  "Star Motel",            // a bare /motel/ caught this
  "Crossroads Barbershop", // "ross" matched
  "Flower Valley Nursery", // "lowe" matched
  "Mobile Detail Lompoc",  // "mobil" matched
  "South Side Coffee Co.",
  "Bowl & Soul",
  "Tacos El Tizon 1",
])
  assert.ok(!isChain(n), `${n} is independent and must not be filtered`)

console.log(`chains: ${CHAIN_PATTERNS.length} patterns, in sync with voice.mjs — all assertions passed`)
