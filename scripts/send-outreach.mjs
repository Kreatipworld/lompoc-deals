#!/usr/bin/env node
// First-wave deal-ask outreach sender — Lompoc Locals.
//
// Sends the approved first-wave emails via the REAL Resend account
// (lompoclocals.com verified) FROM hello@lompoclocals.com, with Reply-To
// hello@ so replies come back to the same address and forward to the founder.
//
// SAFETY: dry-run by default. It will NOT send unless you pass SEND=1 AND
// provide a CAN-SPAM physical mailing address. Sends one wave: `initial`
// (default) or `followup`.
//
//   Preview:  node scripts/send-outreach.mjs
//   Send:     SEND=1 MAILING_ADDRESS="PO Box 123, Lompoc, CA 93438" \
//             WAVE=initial node scripts/send-outreach.mjs   (email-only — no phone)
//
// Requires RESEND_API_KEY in .env.local (loaded by the caller via `export $(grep ...)`).

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const REPLY_TO = "hello@lompoclocals.com"
const SENDER_NAME = process.env.SENDER_NAME || "Andres"
const MAILING_ADDRESS = process.env.MAILING_ADDRESS || ""
// Email-only: Lompoc Locals never uses phone in outreach. No phone signature.
const WAVE = process.env.WAVE || "initial"
const SEND = process.env.SEND === "1"
const KEY = process.env.RESEND_API_KEY

// The 5 emailable first-wave targets. (Jasper's Saloon has no email on file →
// unreachable under our email-only policy; excluded until an email is found.)
const TARGETS = [
  { name: "Eddie's Grill", to: "j.carlosmeza1995@yahoo.com", views: 92,
    slug: "eddies-grill", extra: "the most of any restaurant on the site" },
  { name: "LAUNCHpad", to: "lompoclaunchpad@gmail.com", views: 73,
    slug: "launchpad-lompoc", extra: "real locals looking you up" },
  { name: "American Stages", to: "leasing@americanstages.com", views: 73,
    slug: "american-stages-realty-management-inc", extra: "local renters and owners looking you up" },
  { name: "In&Out Tires", to: "inandouttireslpc@gmail.com", views: 67,
    slug: "in-out-tires-lpc", extra: "locals looking up your shop" },
  { name: "Vargas Jewelers", to: "vargasjewelers@gmail.com", views: 60,
    slug: "vargas-jewelers-trophies-awards", extra: "locals looking you up" },
]

const url = (slug) => `https://www.lompoclocals.com/biz/${slug}`

function initialEmail(t) {
  return {
    subject: `${t.name} got ${t.views} views on Lompoc Locals last month`,
    text: `Hi there,

I'm ${SENDER_NAME} — I run Lompoc Locals, the free local site where Lompoc and Vandenberg neighbors find places to eat, shop, and get things done in town.

Good-news reason I'm writing: your page got ${t.views} views on Lompoc Locals in the last 30 days — ${t.extra}:

${url(t.slug)}

Right now they see your info, but nothing gives them a reason to come in this week. One deal does that — it shows in the feed and our weekly local digest.

Two easy ways: you post it (claim your page free, add it in about 2 minutes), or reply with the offer and I'll set it up — you approve before it goes live. No cost, no catch.

Thanks for being part of Lompoc,
${SENDER_NAME}
Lompoc Locals · ${REPLY_TO}
${MAILING_ADDRESS}

Prefer not to hear from me? Reply "unsubscribe" and I won't email again.`,
  }
}

function followupEmail(t) {
  return {
    subject: `Re: ${t.name} got ${t.views} views on Lompoc Locals last month`,
    text: `Hi there,

Floating this back up — no pressure. Your ${t.name} page (${url(t.slug)}) is still getting local views, and it's free to post one deal that shows up in the feed and our weekly digest.

If you want, just reply with an offer and I'll set it up — you approve before it goes live. If it's not for you, a quick "no thanks" and I'll stop reaching out.

Either way, thanks for everything you do for Lompoc.

${SENDER_NAME} · Lompoc Locals · ${REPLY_TO}
${MAILING_ADDRESS}

Reply "unsubscribe" to opt out.`,
  }
}

const build = WAVE === "followup" ? followupEmail : initialEmail

async function main() {
  if (!KEY) { console.error("✗ RESEND_API_KEY not set. `export $(grep RESEND_API_KEY .env.local | xargs)` first."); process.exit(1) }

  console.log(`\n=== Wave: ${WAVE} | ${SEND ? "SEND MODE" : "DRY RUN (no emails sent)"} ===\n`)

  if (SEND && !MAILING_ADDRESS) {
    console.error("✗ Refusing to send: MAILING_ADDRESS is required for CAN-SPAM compliance.")
    process.exit(1)
  }

  for (const t of TARGETS) {
    const { subject, text } = build(t)
    if (!SEND) {
      console.log(`──────────\nTO: ${t.to}\nSUBJECT: ${subject}\n\n${text}\n`)
      continue
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: t.to, reply_to: REPLY_TO, subject, text }),
    })
    const body = await res.json().catch(() => ({}))
    console.log(res.ok ? `✓ sent → ${t.to} (id ${body.id})` : `✗ FAILED → ${t.to}: ${JSON.stringify(body)}`)
  }

  if (!SEND) console.log(`\n${TARGETS.length} emails previewed. To actually send:\n  SEND=1 MAILING_ADDRESS="..." node scripts/send-outreach.mjs\n`)
}

main()
