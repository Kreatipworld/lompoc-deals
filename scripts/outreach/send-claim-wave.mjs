// Sends the "claim your page" outreach wave from the curated CSV.
// Plain-text, personalized, CAN-SPAM compliant, throttled.
//
// Usage:
//   node --env-file=.env.local scripts/outreach/send-claim-wave.mjs --dry            # preview 3
//   MAILING_ADDRESS="..." node --env-file=.env.local scripts/outreach/send-claim-wave.mjs --batch 25
//
// Marks sent rows with a timestamp in the CSV so re-runs never double-send.

import { readFileSync, writeFileSync } from "node:fs"
import { Resend } from "resend"

const CSV = "docs/marketing/claim-outreach-list.csv"
const FROM = "Andres at Lompoc Locals <hello@lompoclocals.com>"
const REPLY_TO = "andres@kreatipdesign.com"
const DRY = process.argv.includes("--dry")
const batchIx = process.argv.indexOf("--batch")
const BATCH = batchIx > -1 ? Number(process.argv[batchIx + 1]) : 25

const ADDRESS = process.env.MAILING_ADDRESS
if (!DRY && !ADDRESS) {
  console.error("MAILING_ADDRESS env var is required (CAN-SPAM physical address). Aborting.")
  process.exit(1)
}

function parseCsv(text) {
  const lines = text.trim().split("\n")
  const header = lines[0].split(",")
  return {
    header,
    rows: lines.slice(1).map((line) => {
      // handles quoted fields with commas
      const cells = []
      let cur = ""
      let inQ = false
      for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (inQ) {
          if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
          else if (c === '"') inQ = false
          else cur += c
        } else if (c === '"') inQ = true
        else if (c === ",") { cells.push(cur); cur = "" }
        else cur += c
      }
      cells.push(cur)
      return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]))
    }),
  }
}

function toCsv(header, rows) {
  const esc = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)
  return [header.join(","), ...rows.map((r) => header.map((h) => esc(String(r[h] ?? ""))).join(","))].join("\n") + "\n"
}

function emailFor(row) {
  const subject = `${row.name} is already on Lompoc Locals — want to claim it?`
  const text = `Hi there,

I'm Andres, and I run Lompoc Locals — a free local site where Lompoc and Vandenberg neighbors find restaurants, shops, and services right here in town.

I've already set up a page for ${row.name} so locals can find you:
${row.profile_url}

It's yours to claim — free. Once you do, you can:

- Post a deal or special that shows up in our weekly local digest
- Keep your hours, photos, and info current
- See how many people viewed your page and where they came from

No cost and no catch — I'm just trying to help local businesses get found by people nearby. Around 2,300 locals browse the site every week.

To claim it, click "Claim your page" at lompoclocals.com/partners, or just reply to this email and I'll set it up for you.

Thanks for being part of Lompoc,
Andres
Lompoc Locals
${REPLY_TO}
${ADDRESS ?? "[mailing address]"}

Prefer not to hear from me? Reply "unsubscribe" and I won't email again.`
  return { subject, text }
}

const { header, rows } = parseCsv(readFileSync(CSV, "utf8"))
const queue = rows.filter((r) => r.wave === "1" && !r.sent_at && r.email)

if (DRY) {
  console.log(`${queue.length} unsent wave-1 prospects. Previewing 3:\n`)
  for (const row of queue.slice(0, 3)) {
    const { subject, text } = emailFor(row)
    console.log(`TO: ${row.email}\nSUBJECT: ${subject}\n${text}\n${"-".repeat(60)}`)
  }
  process.exit(0)
}

const resend = new Resend(process.env.RESEND_API_KEY)
const batch = queue.slice(0, BATCH)
console.log(`Sending ${batch.length} of ${queue.length} unsent (batch size ${BATCH})`)

let sent = 0
for (const row of batch) {
  const { subject, text } = emailFor(row)
  try {
    await resend.emails.send({ from: FROM, to: row.email, replyTo: REPLY_TO, subject, text })
    row.sent_at = new Date().toISOString().slice(0, 10)
    sent++
    console.log(`  ✓ ${row.slug} → ${row.email}`)
  } catch (err) {
    console.error(`  ✗ ${row.slug}: ${err?.message ?? err}`)
  }
  await new Promise((r) => setTimeout(r, 1200)) // ~1/sec, polite
}

writeFileSync(CSV, toCsv(header, rows))
console.log(`\nsent ${sent}/${batch.length}; CSV updated (${queue.length - sent} remaining)`)
