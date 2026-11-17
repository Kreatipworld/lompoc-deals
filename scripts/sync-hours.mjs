#!/usr/bin/env node
/**
 * Re-sync opening hours and open/closed status from Google Places (Nov 17 2026).
 *
 * Why: hours were imported once (May 17 2026) and never refreshed. Six months later a paying
 * member's hours were wrong on our page (Sweet Baking Co.), South Side Coffee showed 11 AM–10 PM
 * for a 5:30 AM–3 PM café, and two bakeries Google marks permanently closed were still "approved".
 * Wrong hours are the fastest way to lose a neighbor's trust (and a member's).
 *
 *   node --env-file=.env.local scripts/sync-hours.mjs --dry          # report only
 *   node --env-file=.env.local scripts/sync-hours.mjs                # apply
 *   node --env-file=.env.local scripts/sync-hours.mjs --ids 479,18   # just these
 *   node --env-file=.env.local scripts/sync-hours.mjs --hold 60      # report these ids, change nothing on them
 *
 * Rules:
 *   - hours_source = 'owner' or 'website' is never overwritten; only google / null rows are synced.
 *   - CLOSED_PERMANENTLY: non-members are set to status 'closed' (closures = closed, never pending);
 *     paying members are only reported, Andres decides.
 *   - Only Place Details fields business_status + opening_hours are requested (Basic + Contact
 *     data, ~$3 per 1,000 calls, well inside the monthly credit).
 *
 * Runs on the bot box on the 1st of the month (crontab job:lompoc-sync-hours).
 */
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const KEY = process.env.GOOGLE_MAPS_API_KEY
if (!KEY) {
  console.error("GOOGLE_MAPS_API_KEY missing")
  process.exit(1)
}
const args = process.argv.slice(2)
const DRY = args.includes("--dry")
const idsArg = args[args.indexOf("--ids") + 1]
const ONLY = args.includes("--ids") ? idsArg.split(",").map(Number) : null
// Listings Andres is checking in person (e.g. Google says closed but we just featured them): report only.
const HOLD = args.includes("--hold") ? args[args.indexOf("--hold") + 1].split(",").map(Number) : []
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] // Google's period.day: 0 = Sunday

const rows = await sql`
  SELECT b.id, b.name, b.slug, b.hours_json, b.hours_source, b.google_place_id,
    EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = b.owner_user_id
      AND s.tier IN ('standard','premium') AND s.status IN ('active','trialing','past_due')) AS member
  FROM businesses b
  WHERE b.status = 'approved' AND b.google_place_id IS NOT NULL
    AND (${ONLY}::int[] IS NULL OR b.id = ANY(${ONLY}::int[]))
  ORDER BY b.id`

async function details(placeId) {
  const u = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=business_status,opening_hours&key=${KEY}`
  const res = await fetch(u)
  if (!res.ok) return { status: `http ${res.status}` }
  const j = await res.json()
  return { status: j.status, result: j.result }
}

/** Google periods → our hours_json. One span per day: earliest open, latest close. */
function fromPeriods(periods) {
  const out = Object.fromEntries(DAYS.map((d) => [d, null]))
  if (!Array.isArray(periods)) return out
  if (periods.length === 1 && periods[0].open && !periods[0].close) {
    for (const d of DAYS) out[d] = { open: "00:00", close: "23:59" } // open 24 hours
    return out
  }
  for (const p of periods) {
    if (!p.open || !p.close) continue
    const d = DAYS[p.open.day]
    const open = `${p.open.time.slice(0, 2)}:${p.open.time.slice(2)}`
    const close = `${p.close.time.slice(0, 2)}:${p.close.time.slice(2)}`
    const cur = out[d]
    // A close on the next day (e.g. 11 PM → 1 AM) keeps the late close time as written.
    out[d] = cur ? { open: cur.open < open ? cur.open : open, close: cur.close > close ? cur.close : close } : { open, close }
  }
  return out
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const fmt = (h) => (h ? `${h.open}-${h.close}` : "closed")
const diffLine = (oldH, newH) =>
  DAYS.filter((d) => !same(oldH?.[d], newH[d])).map((d) => `${d} ${fmt(oldH?.[d])} → ${fmt(newH[d])}`).join(", ")

const report = { checked: 0, hoursChanged: [], closed: [], memberClosed: [], skippedOwner: 0, errors: [] }

async function one(b) {
  const d = await details(b.google_place_id)
  report.checked++
  if (d.status !== "OK") {
    if (d.status === "NOT_FOUND") report.errors.push(`${b.id} ${b.name}: place not found on Google (listing may be gone)`)
    else report.errors.push(`${b.id} ${b.name}: ${d.status}`)
    return
  }
  const r = d.result ?? {}
  if (r.business_status === "CLOSED_PERMANENTLY") {
    if (b.member || HOLD.includes(b.id)) report.memberClosed.push(`${b.id} ${b.name}${b.member ? "" : " (held)"}`)
    else {
      report.closed.push(`${b.id} ${b.name} (/biz/${b.slug})`)
      if (!DRY) await sql`UPDATE businesses SET status = 'closed' WHERE id = ${b.id}`
    }
    return
  }
  if (HOLD.includes(b.id)) return
  if (b.hours_source && b.hours_source !== "google") {
    report.skippedOwner++
    return
  }
  if (!r.opening_hours?.periods) return
  const next = fromPeriods(r.opening_hours.periods)
  if (DAYS.every((k) => next[k] === null)) return
  // Compare day by day: the stored object may carry the same hours with keys in another order.
  if (DAYS.every((d) => same(b.hours_json?.[d], next[d]))) {
    if (!DRY) await sql`UPDATE businesses SET hours_synced_at = now() WHERE id = ${b.id}`
    return
  }
  report.hoursChanged.push(`${b.id} ${b.name}${b.member ? " [MEMBER]" : ""}: ${diffLine(b.hours_json, next)}`)
  if (!DRY) {
    await sql`UPDATE businesses SET hours_json = ${JSON.stringify(next)}::jsonb, hours_source = 'google', hours_synced_at = now() WHERE id = ${b.id}`
  }
}

// 4 at a time, like bulk-enrich-businesses.ts
const queue = rows.slice()
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) await one(queue.shift())
}))

console.log(`${DRY ? "[dry] " : ""}Checked ${report.checked} of ${rows.length} listings`)
console.log(`Hours changed: ${report.hoursChanged.length}` + (report.hoursChanged.length ? "\n  " + report.hoursChanged.join("\n  ") : ""))
console.log(`Closed on Google → status closed: ${report.closed.length}` + (report.closed.length ? "\n  " + report.closed.join("\n  ") : ""))
if (report.memberClosed.length) console.log(`Google says closed, NOT touched (members / held — ask Andres):\n  ${report.memberClosed.join("\n  ")}`)
console.log(`Owner-set hours left alone: ${report.skippedOwner}`)
if (report.errors.length) console.log(`Errors: ${report.errors.length}\n  ${report.errors.join("\n  ")}`)
