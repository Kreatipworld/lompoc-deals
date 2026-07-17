// One-shot manual runner for the event syncs (same code the daily cron runs).
// Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/run-event-sync.ts
import { syncVandenbergLaunches } from "@/lib/launch-sync"
import { syncExploreLompocEvents } from "@/lib/city-events-sync"

async function main() {
  console.log("launches:", await syncVandenbergLaunches())
  console.log("city:", await syncExploreLompocEvents())
}
main().then(() => process.exit(0))
