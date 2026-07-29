#!/usr/bin/env node
// Live watch for the first real paid subscription (proves the Stripe webhook →
// tier-upgrade path fires end-to-end). Polls the subscriptions table until a row
// with a real stripe_subscription_id + status=active appears, then exits.
import { readFileSync } from "node:fs"
import { neon } from "@neondatabase/serverless"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const m = env.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m)
if (!m) { console.error("no DATABASE_URL in .env.local"); process.exit(2) }
const sql = neon(m[1])

const DEADLINE_MS = 30 * 60 * 1000 // 30 minutes
const start = Date.now()
let polls = 0
console.log("Watching subscriptions for the first real paid upgrade (baseline: 0 paid rows)...")

while (Date.now() - start < DEADLINE_MS) {
  const rows = await sql`
    SELECT id, user_id, tier, status, stripe_subscription_id, stripe_customer_id, current_period_end, updated_at
    FROM subscriptions
    WHERE stripe_subscription_id IS NOT NULL AND status = 'active'
    ORDER BY updated_at DESC LIMIT 1`
  polls++
  if (rows.length) {
    console.log("WEBHOOK_FIRED ✓ — first paid subscription written to DB:")
    console.log(JSON.stringify(rows[0], null, 2))
    process.exit(0)
  }
  await new Promise((r) => setTimeout(r, 10000)) // poll every 10s
}
console.log(`TIMEOUT — no paid subscription after ${Math.round((Date.now()-start)/60000)} min (${polls} polls). Relaunch to keep watching.`)
process.exit(1)
