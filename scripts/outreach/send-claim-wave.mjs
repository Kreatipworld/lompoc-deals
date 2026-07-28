// Sends the "claim your page" outreach wave from the curated CSV.
// Branded HTML (purple header, business cover photo, gold CTA), CAN-SPAM
// compliant, throttled. The only identity shown is hello@lompoclocals.com.
//
// RULE: never run a sending mode without the user's explicit confirmation of
// the exact email. --yes is required to send; preview first, always.
//
// Usage:
//   node --env-file=.env.local scripts/outreach/send-claim-wave.mjs --preview <slug>   # write HTML preview, no send
//   MAILING_ADDRESS="..." node ... send-claim-wave.mjs --batch 25 --yes                # first-touch wave
//   MAILING_ADDRESS="..." node ... send-claim-wave.mjs --update --yes                  # branded update to already-sent rows
//
// Marks sent rows (sent_at / update_sent_at) in the CSV so re-runs never double-send.

import { readFileSync, writeFileSync } from "node:fs"
import { Resend } from "resend"
import { neon } from "@neondatabase/serverless"

const CSV = "docs/marketing/claim-outreach-list.csv"
const FROM = "Andres at Lompoc Locals <hello@lompoclocals.com>"
const REPLY_TO = process.env.OUTREACH_REPLY_TO ?? "hello@lompoclocals.com"

const UPDATE = process.argv.includes("--update")
const YES = process.argv.includes("--yes")
const previewIx = process.argv.indexOf("--preview")
const PREVIEW_SLUG = previewIx > -1 ? process.argv[previewIx + 1] : null
const batchIx = process.argv.indexOf("--batch")
const BATCH = batchIx > -1 ? Number(process.argv[batchIx + 1]) : 25

const ADDRESS = process.env.MAILING_ADDRESS
if (!PREVIEW_SLUG && !ADDRESS) {
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

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function emailFor(row, coverUrl, description, eventsBlock = "") {
  const name = esc(row.name)
  const url = row.profile_url
  const subject = UPDATE
    ? `${row.name} — your page, your photos, and this week in Lompoc`
    : `${row.name} is already on Lompoc Locals — it's yours to claim`
  const intro = UPDATE
    ? `Here's your page on Lompoc Locals in full — your photos, your story, and what's happening in town this week. This is what <strong>2,300+ neighbors a week</strong> see when they find <strong>${name}</strong>:`
    : `Hi — I'm Andres, and I run Lompoc Locals, where <strong>2,300+ neighbors a week</strong> find the businesses, deals, and events of our town. We already built a page for <strong>${name}</strong> — photos, story, and all:`

  const coverBlock = coverUrl
    ? `<div style="background:#fff"><a href="${url}"><img src="${coverUrl}" alt="${name}" width="560" style="width:100%;max-height:280px;object-fit:cover;display:block"/></a></div>`
    : ""

  // quote their real page description so the email feels hand-built, not mass-sent
  const descBlock = description
    ? `<div style="border-left:3px solid #EFC618;padding:2px 0 2px 14px;margin:0 0 18px"><p style="font-style:italic;color:#650C75;font-size:15px;line-height:1.55;margin:0">&ldquo;${esc(description)}&rdquo;</p><p style="color:#999;font-size:12px;margin:6px 0 0">— what locals read on your page</p></div>`
    : ""

  const html = `<div style="margin:0;padding:0;background:#f4eef6">
<div style="max-width:560px;margin:0 auto;padding:24px 12px;font-family:Georgia,serif">
  <div style="background:#650C75;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
    <div style="color:#EFC618;font-size:13px;letter-spacing:3px;text-transform:uppercase">Lompoc Locals</div>
    <h1 style="color:#fff;font-size:26px;margin:10px 0 0;line-height:1.25">${name} is on Lompoc Locals</h1>
  </div>
  ${coverBlock}
  <div style="background:#fff;border-radius:0 0 16px 16px;padding:28px 32px">
    <p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 16px">${intro}</p>
    ${descBlock}
    <div style="text-align:center;margin:26px 0">
      <a href="${url}" style="background:#EFC618;color:#3a2b00;text-decoration:none;font-weight:bold;font-size:17px;padding:14px 36px;border-radius:999px;display:inline-block">See your page &rarr;</a>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 20px">
      <tr>
        <td style="text-align:center;padding:10px;border-top:1px solid #eee"><div style="font-size:20px;font-weight:bold;color:#650C75">2,300+</div><div style="font-size:12px;color:#999">locals every week</div></td>
        <td style="text-align:center;padding:10px;border-top:1px solid #eee"><div style="font-size:20px;font-weight:bold;color:#650C75">474</div><div style="font-size:12px;color:#999">local businesses</div></td>
        <td style="text-align:center;padding:10px;border-top:1px solid #eee"><div style="font-size:20px;font-weight:bold;color:#0B992F">Free</div><div style="font-size:12px;color:#999">to claim your page</div></td>
      </tr>
    </table>
    <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 6px">Claiming it is free: post deals that reach the whole town, keep your info current, and see exactly how many locals found you.</p>
    <p style="font-size:15px;line-height:1.6;color:#333;margin:16px 0 0">Questions? Just reply — it's really me.<br/><strong>Andres</strong> &middot; Lompoc Locals &middot; <a href="mailto:hello@lompoclocals.com" style="color:#650C75">hello@lompoclocals.com</a></p>
  </div>
  ${eventsBlock}
  <p style="text-align:center;color:#999;font-size:11px;line-height:1.6;margin:16px 0 0">Lompoc Locals &middot; ${esc(ADDRESS ?? "[mailing address]")}<br/>Prefer not to hear from me? Reply &quot;unsubscribe&quot; and I won't email again.</p>
</div></div>`

  const text = `${UPDATE ? "Quick update from Lompoc Locals — your page is live." : `Hi — I'm Andres from Lompoc Locals. We already built a page for ${row.name}.`}

See your page (free to claim): ${url}

2,300+ locals browse the site every week. Claiming is free: post deals, keep your info current, see how many locals found you. Questions? Just reply.

Andres · Lompoc Locals · hello@lompoclocals.com
${ADDRESS ?? "[mailing address]"}

Prefer not to hear from me? Reply "unsubscribe" and I won't email again.`

  return { subject, html, text }
}

const { header, rows } = parseCsv(readFileSync(CSV, "utf8"))
if (!header.includes("update_sent_at")) header.push("update_sent_at")

const queue = UPDATE
  ? rows.filter((r) => r.sent_at && !r.update_sent_at && r.email)
  : rows.filter((r) => r.wave === "1" && !r.sent_at && r.email)

// covers + descriptions come from the DB so the email mirrors the live page
const sql = neon(process.env.DATABASE_URL)
async function metaFor(slugs) {
  if (!slugs.length) return {}
  const found = await sql`SELECT slug, cover_url, description FROM businesses WHERE slug = ANY(${slugs})`
  return Object.fromEntries(found.map((b) => [b.slug, b]))
}

// real upcoming events (deduped by title) close the email with proof the town is active
async function upcomingEventsBlock() {
  const events = await sql`
    SELECT DISTINCT ON (title) title, starts_at, location FROM events
    WHERE starts_at > now() AND status = 'approved'
    ORDER BY title, starts_at`
  // same-instant events are the same real-world thing under two source titles
  const seen = new Set()
  const next = events
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .filter((e) => {
      const key = new Date(e.starts_at).toISOString()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 3)
  if (!next.length) return ""
  const items = next
    .map((e) => {
      const d = new Date(e.starts_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles" })
      const place = (e.location ?? "").split(",")[0]
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #7a2b88;color:#EFC618;font-size:13px;font-weight:bold;white-space:nowrap;vertical-align:top">${d}</td>
        <td style="padding:8px 0 8px 14px;border-bottom:1px solid #7a2b88;color:#fff;font-size:14px;line-height:1.4">${esc(e.title)}${place ? `<span style="color:#c9a3d4"> &middot; ${esc(place)}</span>` : ""}</td>
      </tr>`
    })
    .join("")
  return `<div style="background:#650C75;border-radius:16px;padding:22px 28px;margin:14px 0 0">
    <div style="color:#EFC618;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Happening in Lompoc</div>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    <p style="margin:12px 0 0;text-align:center"><a href="https://www.lompoclocals.com/events" style="color:#EFC618;font-size:13px;text-decoration:none;font-weight:bold">See all events &rarr;</a></p>
  </div>`
}

if (PREVIEW_SLUG) {
  const row = rows.find((r) => r.slug === PREVIEW_SLUG) ?? queue[0]
  if (!row) { console.error("no row for preview"); process.exit(1) }
  const meta = await metaFor([row.slug])
  const { subject, html } = emailFor(row, meta[row.slug]?.cover_url, meta[row.slug]?.description, await upcomingEventsBlock())
  const out = `${process.env.PREVIEW_OUT ?? "/tmp"}/outreach-preview-${row.slug}.html`
  writeFileSync(out, `<!-- SUBJECT: ${subject} -->\n${html}`)
  console.log(`preview written: ${out}\nSUBJECT: ${subject}\nTO: ${row.email}\nqueue size for this mode: ${queue.length}`)
  process.exit(0)
}

if (!YES) {
  console.error(`SAFETY: sending requires --yes (user must approve the exact email first). Queue: ${queue.length}`)
  process.exit(1)
}

const resend = new Resend(process.env.RESEND_API_KEY)
const batch = queue.slice(0, BATCH)
const meta = await metaFor(batch.map((r) => r.slug))
const eventsBlock = await upcomingEventsBlock()
console.log(`Sending ${batch.length} of ${queue.length} unsent (${UPDATE ? "update" : "first-touch"} mode)`)

let sent = 0
for (const row of batch) {
  const { subject, html, text } = emailFor(row, meta[row.slug]?.cover_url, meta[row.slug]?.description, eventsBlock)
  try {
    const res = await resend.emails.send({ from: FROM, to: row.email, replyTo: REPLY_TO, subject, html, text })
    if (res.error) throw new Error(res.error.message ?? JSON.stringify(res.error))
    row[UPDATE ? "update_sent_at" : "sent_at"] = new Date().toISOString().slice(0, 10)
    sent++
    console.log(`  ✓ ${row.slug} → ${row.email}`)
  } catch (err) {
    console.error(`  ✗ ${row.slug}: ${err?.message ?? err}`)
  }
  await new Promise((r) => setTimeout(r, 1200)) // ~1/sec, polite
}

writeFileSync(CSV, toCsv(header, rows))
console.log(`\nsent ${sent}/${batch.length}; CSV updated (${queue.length - sent} remaining in this mode)`)
