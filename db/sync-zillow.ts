// One-shot wrapper around lib/zillow-sync.ts for manual runs.
// Run: node --env-file=.env.local node_modules/.bin/tsx db/sync-zillow.ts
// Or: npm run db:sync-zillow

import { syncZillowListings } from "../lib/zillow-sync"

async function main() {
  console.log("== Zillow sync starting ==")
  const report = await syncZillowListings()
  console.log("\n== Report ==")
  console.log(`  fetched: ${report.fetched}`)
  console.log(`  upserted: ${report.upserted}`)
  console.log(`  skipped: ${report.skipped}`)
  if (report.newBrokerages?.length) {
    console.log("\n  new brokerages auto-created:")
    report.newBrokerages.forEach((b) => console.log("    +", b))
  }
  if (report.errors.length) {
    console.log("\n  errors:")
    report.errors.forEach((e) => console.log("    -", e))
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
