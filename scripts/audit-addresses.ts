/**
 * scripts/audit-addresses.ts
 *
 * Scans businesses.address for out-of-state values, missing state/zip, or
 * zip codes outside the Lompoc / Santa Barbara County / SLO County range.
 * Read-only — does not write.
 */

import { db } from "../db/client"
import { businesses } from "../db/schema"
import { isNotNull } from "drizzle-orm"

async function main() {
  const all = await db.query.businesses.findMany({
    where: isNotNull(businesses.address),
    columns: { id: true, name: true, address: true, lat: true, lng: true },
  })

  // Central-coast CA zip prefixes we expect in this directory
  const CA_ZIPS = /\b(934[0-9][0-9]|935[0-9][0-9]|930[0-9][0-9]|931[0-9][0-9])\b/
  const ANY_STATE = /,\s*([A-Z]{2})\s+\d{5}/

  const outOfState: Array<{ id: number; name: string; address: string; state: string }> = []
  const oddZip: Array<{ id: number; name: string; address: string }> = []
  const noParse: Array<{ id: number; name: string; address: string }> = []

  for (const b of all) {
    const addr = b.address!
    const m = addr.match(ANY_STATE)
    if (!m) {
      noParse.push({ id: b.id, name: b.name, address: addr })
      continue
    }
    if (m[1] !== "CA") {
      outOfState.push({ id: b.id, name: b.name, address: addr, state: m[1] })
    } else if (!CA_ZIPS.test(addr)) {
      oddZip.push({ id: b.id, name: b.name, address: addr })
    }
  }

  console.log(`\nScanned: ${all.length} businesses with addresses`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`OUT-OF-STATE addresses: ${outOfState.length}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  for (const s of outOfState) {
    console.log(`  [${s.id}] ${s.state}  "${s.name}"`)
    console.log(`       ${s.address}`)
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`CA addresses with unusual ZIP: ${oddZip.length}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  for (const s of oddZip) {
    console.log(`  [${s.id}] "${s.name}"`)
    console.log(`       ${s.address}`)
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`No state/ZIP parseable: ${noParse.length}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  for (const s of noParse.slice(0, 30)) {
    console.log(`  [${s.id}] "${s.name}" — ${s.address}`)
  }
  if (noParse.length > 30) console.log(`  … and ${noParse.length - 30} more`)

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
