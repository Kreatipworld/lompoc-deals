// Builds the curated "claim your page" outreach list from the businesses table.
// Usage: node --env-file=.env.local scripts/outreach/export-claim-list.mjs
// Output: docs/marketing/claim-outreach-list.csv  (wave column: 1 = send first)

import { neon } from "@neondatabase/serverless"
import { writeFileSync } from "node:fs"

const sql = neon(process.env.DATABASE_URL)

// Corporate / never-going-to-claim inboxes and web-vendor addresses.
const EXCLUDE_PATTERNS = [
  /press@/i, /investorrelations@/i, /mediainquiries@/i, /media@/i,
  /custserv@/i, /customerservice@/i, /digitalcare@/i, /helpdesk@/i,
  /carecenter@/i, /privacy@/i, /website_support@/i, /support@evetsites/i,
  /support@mjdirect/i, /hello@riteaid/i, /@compass\.com$/i, /@brixmor\.com$/i,
  /@sebrands\.com$/i, /@wellsfargo\.com$/i, /@starbucks\.com$/i,
  /@bootbarn\.com$/i, /@dollargeneral\.com$/i, /@acehardware\.com/i,
  /@greatclips\.com$/i, /@snapfitness\.com$/i, /@wingstop\.com$/i,
  /@nva\.com$/i, /@spoton\.com$/i,
]
// Placeholder / clearly-fake addresses.
const PLACEHOLDERS = [/johndoe@/i, /@company\.co$/i, /joe@commerce\.com/i, /@example\./i]
// Community orgs — real, but the deals pitch fits less; hold for a later wave.
const WAVE2_CATEGORY_HINTS = [/church/i, /museum/i, /mission/i, /recreation/i, /trail/i, /achievement house/i, /goodwill/i, /vtc/i]

const EMAIL_RE = /^[^\s@\\"<>]+@[^\s@\\"<>]+\.[a-z]{2,}$/i

const rows = await sql`
  SELECT b.name, b.slug, b.email, c.name AS category
  FROM businesses b LEFT JOIN categories c ON c.id = b.category_id
  WHERE b.status = 'approved' AND b.email IS NOT NULL
    AND b.owner_user_id IN (
      SELECT id FROM users WHERE email LIKE '%internal%' OR email LIKE '%test%' OR email LIKE '%system%'
    )
  ORDER BY b.name`

const seenEmails = new Set()
const out = []
for (const r of rows) {
  const email = r.email.trim()
  let wave = 1
  let reason = ""
  if (!EMAIL_RE.test(email)) { wave = 0; reason = "malformed" }
  else if (PLACEHOLDERS.some((p) => p.test(email))) { wave = 0; reason = "placeholder" }
  else if (EXCLUDE_PATTERNS.some((p) => p.test(email))) { wave = 0; reason = "corporate" }
  else if (WAVE2_CATEGORY_HINTS.some((p) => p.test(r.name))) { wave = 2; reason = "community-org" }
  else if (seenEmails.has(email.toLowerCase())) { wave = 3; reason = "duplicate-email" }
  if (wave === 1) seenEmails.add(email.toLowerCase())
  out.push({
    wave, reason, name: r.name, slug: r.slug, email,
    category: r.category ?? "", profile_url: `https://www.lompoclocals.com/biz/${r.slug}`,
    sent_at: "", replied: "", claimed: "",
  })
}

out.sort((a, b) => a.wave - b.wave || a.name.localeCompare(b.name))
const esc = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)
const header = "wave,reason,name,slug,email,category,profile_url,sent_at,replied,claimed"
const csv = [header, ...out.map((r) => [r.wave, r.reason, r.name, r.slug, r.email, r.category, r.profile_url, r.sent_at, r.replied, r.claimed].map((v) => esc(String(v))).join(","))].join("\n")
writeFileSync("docs/marketing/claim-outreach-list.csv", csv + "\n")

const counts = out.reduce((m, r) => ((m[r.wave] = (m[r.wave] ?? 0) + 1), m), {})
console.log("written docs/marketing/claim-outreach-list.csv")
console.log("wave 1 (send):", counts[1] ?? 0, "| wave 2 (community orgs):", counts[2] ?? 0, "| wave 3 (dupes):", counts[3] ?? 0, "| excluded:", counts[0] ?? 0)
