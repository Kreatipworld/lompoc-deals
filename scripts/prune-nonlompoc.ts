/**
 * scripts/prune-nonlompoc.ts
 *
 * Deletes businesses whose addresses are not in the Lompoc area
 * (City of Lompoc + Vandenberg — ZIPs 93436, 93437, 93438).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/prune-nonlompoc.ts            # dry-run
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/prune-nonlompoc.ts --apply    # delete
 *
 * Cascades: deals, property_listings, business_claims are deleted.
 * Events pointing to pruned businesses have business_id set to NULL.
 */

import { db } from "../db/client"
import { businesses, deals, propertyListings, businessClaims, events } from "../db/schema"
import { inArray, isNotNull } from "drizzle-orm"
import { LOMPOC_ZIPS, extractZip } from "../lib/lompoc-zip"

const APPLY = process.argv.includes("--apply")

async function main() {
  const all = await db.query.businesses.findMany({
    where: isNotNull(businesses.address),
    columns: { id: true, name: true, address: true },
  })

  const toPrune: Array<{ id: number; name: string; address: string; zip: string | null }> = []

  for (const b of all) {
    const zip = extractZip(b.address!)
    if (!zip || !LOMPOC_ZIPS.has(zip)) {
      toPrune.push({ id: b.id, name: b.name, address: b.address!, zip })
    }
  }

  console.log(`\nScanned: ${all.length} businesses with addresses`)
  console.log(`Lompoc ZIPs allowed: ${Array.from(LOMPOC_ZIPS).join(", ")}`)
  console.log(`Candidates for pruning: ${toPrune.length}\n`)

  if (toPrune.length === 0) {
    console.log("Nothing to prune.")
    process.exit(0)
  }

  const ids = toPrune.map((b) => b.id)

  // Count cascading rows so user understands blast radius
  const [dealRows, listingRows, claimRows, eventRows] = await Promise.all([
    db.select({ id: deals.id }).from(deals).where(inArray(deals.businessId, ids)),
    db.select({ id: propertyListings.id }).from(propertyListings).where(inArray(propertyListings.businessId, ids)),
    db.select({ id: businessClaims.id }).from(businessClaims).where(inArray(businessClaims.businessId, ids)),
    db.select({ id: events.id }).from(events).where(inArray(events.businessId, ids)),
  ])

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("CASCADE PREVIEW")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`  deals to be deleted           : ${dealRows.length}`)
  console.log(`  property_listings to be deleted: ${listingRows.length}`)
  console.log(`  business_claims to be deleted : ${claimRows.length}`)
  console.log(`  events with business_id nulled: ${eventRows.length}`)
  console.log()
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("BUSINESSES TO PRUNE")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  for (const b of toPrune) {
    console.log(`  [${b.id}] zip=${b.zip ?? "n/a"}  "${b.name}"`)
    console.log(`       ${b.address}`)
  }

  if (!APPLY) {
    console.log("\n(DRY RUN — pass --apply to actually delete)")
    process.exit(0)
  }

  console.log("\nDeleting…")
  const deleted = await db.delete(businesses).where(inArray(businesses.id, ids)).returning({ id: businesses.id })
  console.log(`✅  Deleted ${deleted.length} businesses (cascaded to ${dealRows.length} deals, ${listingRows.length} listings, ${claimRows.length} claims)`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
