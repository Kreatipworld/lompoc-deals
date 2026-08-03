#!/usr/bin/env node
/**
 * Asks Lompoc's institutions — churches, the museum, the theatre, the hospital, non-profits — to
 * link to the page we already maintain for them.
 *
 * A different ask from the claim campaign, and a different audience. Nobody here is a shop owner
 * looking for customers; they run an office, they publish a "community resources" or "links" page,
 * and a link from a .org carries more weight than a hundred ordinary ones. So the email offers a
 * fact rather than a pitch: your page exists, it's free, here is the link.
 *
 * Nothing is asked in return. Never offer placement in exchange for a link — traded links are
 * against Google's guidelines and would put the whole domain at risk.
 *
 * EMAIL-APPROVAL RULE: dry-run by default. Nothing sends without SEND=1.
 *
 *   Preview the list:  node --env-file=.env.local scripts/outreach/send-institution-links.mjs
 *   Dump the HTML:     DUMP=/tmp/out.html node --env-file=.env.local scripts/outreach/send-institution-links.mjs
 *   Send:              SEND=1 node --env-file=.env.local scripts/outreach/send-institution-links.mjs
 */
import { readFileSync, appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY")
const authSecret = pick("AUTH_SECRET") || ""
const sql = neon(pick("DATABASE_URL"))

const SEND = process.env.SEND === "1"
const DUMP = process.env.DUMP || ""
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null
const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const SENT_LOG = "/Users/kreatip/Projects/lompoc-deals/scripts/data/institution-sent.log"
const SITE = "https://www.lompoclocals.com"

const unsubToken = (email) =>
  crypto.createHmac("sha256", authSecret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (email) => `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

const loadLog = () => {
  if (!existsSync(SENT_LOG)) return new Set()
  return new Set(readFileSync(SENT_LOG, "utf8").split("\n").map((l) => l.split(",")[0].trim().toLowerCase()).filter(Boolean))
}
const alreadySent = loadLog()

// Genuine institutions only. The category regex that found them also matches a salon called
// "Mission" and a vet practice with "hospital" in the name, so the list is stated explicitly
// rather than inferred — this is a small, one-off audience worth naming by hand.
const SLUGS = [
  "achievement-house", "calvary-baptist-church", "crossroads-community-church-cogop",
  "first-christian-church", "hope-chapel-mission-hills", "kids-space-museum-lompoc",
  "lompoc-foursquare-church", "lompoc-museum", "lompoc-theatre", "lompoc-valley-baptist-church",
  "lompoc-valley-medical-center", "mission-la-purisima", "place-of-grace-church",
  "st-mary-s-episcopal-church", "trinity-church-of-the-nazarene", "west-coast-industries",
]

const rows = await sql`
  select b.id, b.name, b.slug, b.email, b.website,
         jsonb_array_length(coalesce(b.photos_json,'[]'::jsonb)) as photos
  from businesses b
  where b.slug = any(${SLUGS}) and b.status='approved' and b.email is not null
  order by b.name`

// A slug that matches nothing drops a recipient without saying so — one typo here quietly cut the
// children's museum from the first build of this list. Name the gap loudly instead.
const missing = SLUGS.filter((s) => !rows.some((r) => r.slug === s))
if (missing.length) {
  console.error(`\n  ✗ ${missing.length} slug(s) matched no approved row with an email:`)
  for (const m of missing) console.error(`      ${m}`)
  console.error(`    Fix the slug or drop it from SLUGS — do not send a short list by accident.\n`)
}

// Never invite somebody to look at an empty page. A page with no photographs makes the ask look
// like the favor it is not.
const ready = rows.filter((r) => r.photos >= 3 && !alreadySent.has(r.email.toLowerCase()))
const thin = rows.filter((r) => r.photos < 3)

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const subjectFor = (b) => `${b.name} has a page on Lompoc Locals — here's the link`

const htmlFor = (b) => `<!doctype html><html><body style="margin:0;background:#f6f4f0;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#241629;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:4px;overflow:hidden;">
  <tr><td style="background:#FAF5EC;padding:22px 28px;text-align:center;">
    <img src="${SITE}/brand/lompoc-locals-logo.svg" alt="Lompoc Locals" width="150" style="display:block;margin:0 auto;">
  </td></tr>
  <tr><td style="height:4px;background:linear-gradient(90deg,#EFC618,#650C75,#0B992F);font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:30px 28px 8px;">
    <h1 style="margin:0 0 6px;font-size:21px;line-height:1.25;">${esc(b.name)} is on Lompoc Locals.</h1>
    <div style="width:44px;height:3px;background:#EFC618;margin:0 0 18px;"></div>

    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hello — we're Lompoc Locals, a free community hub for Lompoc. We keep a page for
    ${esc(b.name)} with your photos, hours and directions, so neighbors looking for you can find you:</p>

    <p style="margin:0 0 18px;"><a href="${SITE}/biz/${b.slug}" style="font-size:15px;color:#650C75;font-weight:700;">lompoclocals.com/biz/${esc(b.slug)}</a></p>

    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">There's nothing to sign up for and nothing to pay — the page is there either way, in English
    and Spanish. We're writing for one small reason: <strong>if you keep a links or community-resources page, a link to it
    would help people find you.</strong> Search engines treat a link from an organization like yours as a strong signal, and it
    helps neighbors who are searching land on the right place.</p>

    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">If anything on the page is wrong or out of date, reply to this email and we'll fix it — a real
    person here in Lompoc reads it. If you'd rather we took the page down, we'll do that too, no questions.</p>

    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;">Thank you for what you do here.</p>
    <p style="margin:0 0 4px;font-size:15px;line-height:1.6;">— The Lompoc Locals team</p>
  </td></tr>
  <tr><td style="padding:18px 28px 26px;border-top:1px solid #efe7dc;text-align:center;">
    <div style="font-size:13px;color:#650C75;font-weight:700;">lompoclocals.com</div>
    <div style="font-size:11px;color:#8b8091;margin-top:6px;line-height:1.5;">
      community &amp; communication for Lompoc, California<br>
      You're receiving this because ${esc(b.name)} is listed on Lompoc Locals.
      <a href="${unsubUrl(b.email)}" style="color:#8b8091;">Unsubscribe</a> — or reply &ldquo;unsubscribe&rdquo;.<br>
      Lompoc Locals · PO Box 880, Lompoc, CA 93438
    </div>
  </td></tr>
</table></body></html>`

console.log(`${rows.length} institution(s) on the list · ${ready.length} ready to contact · ${thin.length} held back`)
if (thin.length) {
  console.log(`\nheld back — too few photos to invite anyone to look:`)
  for (const t of thin) console.log(`  ! ${t.name} (${t.photos} photo(s))  ${SITE}/biz/${t.slug}`)
}
console.log(`\nmode = ${SEND ? "SEND" : "DRY RUN"}\n`)
for (const b of ready) console.log(`  · ${b.name.slice(0, 38).padEnd(40)} → ${b.email}`)

if (DUMP) {
  mkdirSync(dirname(DUMP), { recursive: true })
  writeFileSync(DUMP, ready.map((b) => `<p style="font:13px system-ui;color:#650C75;padding:8px 12px;">to: ${b.email} · ${esc(b.name)}</p>${htmlFor(b)}`).join("\n<hr>\n"))
  console.log(`\ndumped ${ready.length} email(s) to ${DUMP}`)
}

if (!SEND) {
  console.log(`\n(dry run — set SEND=1 to send)`)
  process.exit(0)
}

mkdirSync(dirname(SENT_LOG), { recursive: true })
let sent = 0
for (const b of ready.slice(0, LIMIT ?? ready.length)) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: b.email, subject: subjectFor(b), html: htmlFor(b),
      headers: { "List-Unsubscribe": `<${unsubUrl(b.email)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>` },
    }),
  })
  const out = await res.json()
  if (out.id) {
    appendFileSync(SENT_LOG, `${b.email},${b.slug},${new Date().toISOString()},${out.id}\n`)
    console.log(`  ✓ ${b.name}  →  ${b.email}  (${out.id})`)
    sent++
  } else {
    console.log(`  ✗ ${b.name}  →  ${b.email}  ${JSON.stringify(out).slice(0, 120)}`)
  }
  await new Promise((r) => setTimeout(r, 1200))
}
console.log(`\nDone. sent:${sent}`)
