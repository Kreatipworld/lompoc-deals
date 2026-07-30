#!/usr/bin/env node
// Delivery report across all emails Resend has sent for us. Pages the Resend
// list API, tallies delivery/bounce/open events, flags dead addresses, and (with
// SUPPRESS=1) adds bounced/complained recipients to email_suppressions so we
// never retry them. Re-run anytime to follow up on outreach performance.
//   Report:            node scripts/outreach-report.mjs
//   Report + suppress: SUPPRESS=1 node scripts/outreach-report.mjs
import { readFileSync } from "node:fs"
import { neon } from "@neondatabase/serverless"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY")
const dbUrl = pick("DATABASE_URL")
const SUPPRESS = process.env.SUPPRESS === "1"

async function fetchAll() {
  const all = []
  let after = null
  for (let page = 0; page < 20; page++) {
    const url = new URL("https://api.resend.com/emails")
    url.searchParams.set("limit", "100")
    if (after) url.searchParams.set("after", after)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
    if (!res.ok) break
    const body = await res.json()
    const data = body.data || []
    all.push(...data)
    if (!body.has_more || !data.length) break
    after = data[data.length - 1].id
  }
  return all
}

const emails = await fetchAll()
const HUB = "hello@lompoclocals.com"
// Outreach = real recipients (exclude previews we routed to the hub).
const outreach = emails.filter((e) => !(e.to || []).includes(HUB))
const previews = emails.length - outreach.length

const tally = {}
const bounced = []
for (const e of outreach) {
  const ev = e.last_event || "unknown"
  tally[ev] = (tally[ev] || 0) + 1
  if (ev === "bounced" || ev === "complained") bounced.push({ to: (e.to || [])[0], subject: e.subject, ev })
}

const n = outreach.length
const pct = (x) => (n ? ((x / n) * 100).toFixed(1) : "0.0") + "%"
console.log("═══ Outreach delivery report ═══")
console.log(`Total emails in Resend: ${emails.length}  (outreach: ${n}, hub previews: ${previews})`)
console.log("")
console.log("By last event:")
for (const [ev, c] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${ev.padEnd(12)} ${String(c).padStart(4)}  ${pct(c)}`)
}
const delivered = (tally.delivered || 0) + (tally.opened || 0) + (tally.clicked || 0)
console.log("")
console.log(`Delivered or better: ${delivered}/${n}  (${pct(delivered)})`)
console.log(`Bounced/complained:  ${bounced.length}`)
if (!("opened" in tally) && !("clicked" in tally)) {
  console.log("(No open data — enable Open tracking in the Resend dashboard to see open rates.)")
}
if (bounced.length) {
  console.log("\nDead / problem addresses:")
  for (const b of bounced) console.log(`  ✗ ${b.ev.padEnd(10)} ${b.to}  — ${(b.subject || "").slice(0, 40)}`)
}

if (SUPPRESS && bounced.length && dbUrl) {
  const sql = neon(dbUrl)
  let added = 0
  for (const b of bounced) {
    if (!b.to) continue
    const [r] = await sql`INSERT INTO email_suppressions (email, reason, source)
      VALUES (${b.to.toLowerCase()}, ${b.ev}, 'delivery-report')
      ON CONFLICT (email) DO NOTHING RETURNING id`
    if (r) added++
  }
  console.log(`\n✓ Added ${added} bounced/complained address(es) to email_suppressions (won't be retried).`)
} else if (bounced.length) {
  console.log("\n(Run with SUPPRESS=1 to add these to the suppression list.)")
}
