#!/usr/bin/env node
/**
 * Pre-push guard: never compare raw user input to a stored string with ILIKE.
 *
 * Eye on I, a wood-fired pizzeria, could not be found by searching "pizza". Four residents searched
 * "js glass" and got an empty box, because the business is "J's Glass Co" and ILIKE cares about an
 * apostrophe nobody types. 145 of 472 business names here carry punctuation. Both faults had been
 * live for as long as the features existed, and both were found by a person noticing — one of them
 * a business owner who had every reason to conclude we didn't work.
 *
 * `looseLike` from lib/search-match.ts folds both sides before comparing. This exists so the next
 * person to write a search — including me, next month — cannot quietly reintroduce the same bug.
 *
 *   node scripts/check-search-matching.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = ["lib", "app", "components"]
const SKIP = /node_modules|\.next|\/tests?\//
const offenders = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (SKIP.test(full)) continue
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full)) inspect(full)
  }
}

function inspect(file) {
  const src = readFileSync(file, "utf8")
  src.split("\n").forEach((line, i) => {
    // An ilike() whose pattern is a template literal or a variable is user input meeting a column.
    if (/\bilike\s*\(/.test(line) && !/eslint-disable|allow-ilike/.test(line)) {
      offenders.push({ file, line: i + 1, src: line.trim() })
    }
  })
}

for (const r of ROOTS) {
  try {
    walk(r)
  } catch {
    // root missing in some checkout — not a reason to fail the push
  }
}

if (offenders.length === 0) {
  console.log("[search] ✓ no raw ILIKE on user input; matching goes through looseLike")
  process.exit(0)
}

console.error(`\n[search] ✗ ${offenders.length} raw ILIKE comparison(s) found.\n`)
for (const o of offenders) console.error(`  ${o.file}:${o.line}\n    ${o.src.slice(0, 110)}`)
console.error(`
  ILIKE compares punctuation literally, so "js glass" will not match "J's Glass Co" —
  a third of the businesses in this directory have punctuation in their name.

  Use looseLike from lib/search-match.ts:

      import { looseLike } from "@/lib/search-match"
      or(looseLike(businesses.name, q), looseLike(businesses.description, q))

  And match the DESCRIPTION as well as the name: a directory has to find a business by
  what it does, not only by what it is called.

  If a literal comparison is genuinely what you want, add a trailing // allow-ilike.
`)
process.exit(1)
