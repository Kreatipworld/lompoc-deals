// Personal invitation from Andres to his networking-group contacts.
// Usage:
//   node --env-file=.env.local scripts/send-group-invite.mjs --proof   → one [PROOF] to hello@
//   node --env-file=.env.local scripts/send-group-invite.mjs --send    → real send, logged + throttled
// Drift-proof: skips anyone in the sent-log or on email_suppressions.
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import crypto from "node:crypto"
import { Resend } from "resend"
import { neon } from "@neondatabase/serverless"

const MODE = process.argv.includes("--send") ? "send" : "proof"
const CONTACTS_FILE = "docs/marketing/networking-group-contacts.json"
const SENT_LOG = "docs/marketing/networking-group-sent-log.json"
const FROM = "Andres at Lompoc Locals <hello@lompoclocals.com>"
const PROOF_TO = "hello@lompoclocals.com"
const SITE = "https://www.lompoclocals.com"
const LOGO =
  "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"

const resend = new Resend(process.env.RESEND_API_KEY)
const sql = neon(process.env.DATABASE_URL)

function unsubUrl(email) {
  const addr = email.trim().toLowerCase()
  const t = crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "")
    .update(addr)
    .digest("base64url")
    .slice(0, 24)
  return `${SITE}/api/unsubscribe?e=${encodeURIComponent(addr)}&t=${t}`
}

function html(first, email) {
  const greet = first ? `Hi ${first},` : "Hi neighbor,"
  return `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,#650C75 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <p style="color:#444; line-height:1.65; margin:0 0 16px;">${greet}</p>
      <p style="color:#444; line-height:1.65; margin:0 0 16px;">
        Andres here, from the Lompoc Business Group — with a small invitation.
      </p>
      <p style="color:#444; line-height:1.65; margin:0 0 16px;">
        You know how it goes around here: the best stuff happens quietly, and half the
        town finds out after. We've been working for years on how to change that, and
        we're proud to finally introduce <strong>Lompoc Locals</strong> — the whole
        town in one place. 500+ local businesses, every event, every deal, even the
        launches. Free for everyone.
      </p>
      <p style="color:#444; line-height:1.65; margin:0 0 22px;">
        The idea is simple: when locals, businesses, and visitors can actually find each
        other, everybody wins — shops get seen, the town gets busier, and nobody misses
        the good stuff.
      </p>
      <p style="margin:0 0 26px; text-align:center;">
        <a href="${SITE}" style="display:inline-block; background:#650C75; color:#ffffff; padding:13px 26px; border-radius:8px; text-decoration:none; font-weight:600;">Come take a look</a>
      </p>
      <p style="color:#444; line-height:1.65; margin:0 0 16px;">
        If you run a business here, your page is probably already live — claiming it is
        free and takes two minutes. And when you're ready to put it in front of the
        whole town: <a href="${SITE}/partners" style="color:#650C75; font-weight:600;">lompoclocals.com/partners</a>
      </p>
      <p style="color:#444; line-height:1.65; margin:0 0 16px;">
        Would love to have you along — follow, share it with a neighbor, and tell us
        what's missing.
      </p>
      <p style="color:#444; line-height:1.65; margin:0 0 4px;">— Andres</p>
      <p style="color:#888; margin:0;">Lompoc Locals</p>
      <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
        <div style="margin-bottom:8px;">
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#650C75; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#EFC618; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#0B992F; margin:0 3px;"></span>
        </div>
        <div style="font-size:14px; font-weight:700; color:#650C75;">lompoclocals.com</div>
        <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.6;">
          This is a one-time personal note because we know each other from the Lompoc Business Group — you're not on a list.<br>
          <a href="${unsubUrl(email)}" style="color:#999;">Unsubscribe</a> · Lompoc Locals · PO Box 880, Lompoc, CA 93438
        </div>
      </div>
    </div>
  </div>`
}

const SUBJECT = "Lompoc, all in one place 🌸"

const contacts = JSON.parse(readFileSync(CONTACTS_FILE, "utf8")).contacts
const sentLog = existsSync(SENT_LOG) ? JSON.parse(readFileSync(SENT_LOG, "utf8")) : []
const sentSet = new Set(sentLog.map((r) => r.email.toLowerCase()))

const supRows = await sql.query("select lower(email) as email from email_suppressions")
const suppressed = new Set(supRows.map((r) => r.email))

if (MODE === "proof") {
  const sample = contacts[2] // Eric — has a first name
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: PROOF_TO,
    subject: `[PROOF] ${SUBJECT}`,
    html: html(sample.first, sample.email),
    headers: { "List-Unsubscribe": `<${unsubUrl(sample.email)}>` },
  })
  if (error) throw new Error(JSON.stringify(error))
  console.log("PROOF sent to", PROOF_TO, "id:", data.id, "(rendered for:", sample.email + ")")
  process.exit(0)
}

let sent = 0
let skipped = 0
for (const c of contacts) {
  const email = c.email.toLowerCase()
  if (sentSet.has(email)) { skipped++; continue }
  if (suppressed.has(email)) { console.log("SUPPRESSED, skipping:", email); skipped++; continue }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: c.email,
    subject: SUBJECT,
    html: html(c.first, c.email),
    headers: { "List-Unsubscribe": `<${unsubUrl(c.email)}>` },
  })
  if (error) {
    console.error("FAILED:", email, JSON.stringify(error))
    continue
  }
  sentLog.push({ email, name: c.name || c.first || "", resendId: data.id, sentAt: new Date().toISOString() })
  writeFileSync(SENT_LOG, JSON.stringify(sentLog, null, 2))
  sent++
  console.log("sent:", email, data.id)
  await new Promise((r) => setTimeout(r, 700))
}
console.log(`DONE — sent ${sent}, skipped ${skipped}, of ${contacts.length}`)
