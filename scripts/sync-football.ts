// One-off / manual run of the Lompoc Football sync (the cron does this daily).
// Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/sync-football.ts
import { syncFootball } from "../lib/football-sync"
syncFootball().then((r) => { console.log(JSON.stringify(r, null, 1)); process.exit(0) }).catch((e) => { console.error(e); process.exit(1) })
