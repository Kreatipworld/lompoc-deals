#!/usr/bin/env node
/**
 * The reply to Eye on I, who asked why they weren't showing up for "pizza".
 *
 * This is a service report first and an ask second, in that order, because that is the honest
 * shape of it: they reported a fault, the fault was real, it was ours, and it turned out to be
 * hiding a third of the directory. Leading with the ask would waste the only thing that makes this
 * email worth opening.
 *
 * Every number here is verified: 11 searches containing "pizza" in analytics_events, 33 views of
 * their page in 30 days, position 6 confirmed live, two deals expired 2026-04-21 and 2026-04-28.
 *
 * EMAIL-APPROVAL RULE: nothing sends without SEND=1.
 *
 *   Preview HTML:  DUMP=/tmp/eye.html node --env-file=.env.local scripts/outreach/send-eye-on-i.mjs
 *   Proof to us:   PROOF=hello@lompoclocals.com node --env-file=.env.local scripts/outreach/send-eye-on-i.mjs
 *   Send for real: SEND=1 node --env-file=.env.local scripts/outreach/send-eye-on-i.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import crypto from "node:crypto"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY")
const authSecret = pick("AUTH_SECRET") || ""

const SEND = process.env.SEND === "1"
const PROOF = process.env.PROOF || ""
const DUMP = process.env.DUMP || ""
const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const SITE = "https://www.lompoclocals.com"
const TO = "eyeoni2323@gmail.com"

const unsubUrl = (email) =>
  `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${crypto
    .createHmac("sha256", authSecret)
    .update(email.trim().toLowerCase())
    .digest("base64url")
    .slice(0, 24)}`

const SUBJECT = `You asked why you weren't showing up for "pizza"`

const p = (t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;">${t}</p>`

const html = (to) => `<!doctype html><html><body style="margin:0;background:#f6f4f0;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#241629;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:4px;overflow:hidden;">
  <tr><td style="background:#FAF5EC;padding:22px 28px;text-align:center;">
    <img src="${SITE}/brand/lompoc-locals-logo.svg" alt="Lompoc Locals" width="150" style="display:block;margin:0 auto;">
  </td></tr>
  <tr><td style="height:4px;background:linear-gradient(90deg,#EFC618,#650C75,#0B992F);font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:30px 28px 8px;">
    <h1 style="margin:0 0 6px;font-size:21px;line-height:1.28;">You asked why you weren't showing up for &ldquo;pizza.&rdquo; You are now.</h1>
    <div style="width:44px;height:3px;background:#EFC618;margin:0 0 18px;"></div>

    ${p(`You're the sixth result — and the five above you are all independent Lompoc pizzerias. Domino's, Little Caesars and Blaze now sit below you.`)}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;background:#FAF7FB;border-left:3px solid #650C75;">
      <tr><td style="padding:14px 16px;font-size:14px;line-height:1.7;color:#3d2e42;">
        1. Pizza Garden<br>2. Wild West Pizza &amp; Grill<br>3. Bravo Pizza<br>4. Mi Amore Pizza and Pasta<br>5. Fatte's Pizza<br>
        <strong style="color:#650C75;">6. Eye on I</strong>
      </td></tr>
    </table>

    ${p(`It turned out to be nothing to do with your listing. Your description has said &ldquo;wood-fired pizza shop&rdquo; from the start — the search was reading it and then throwing the result away, because the businesses with <em>Pizza</em> in their name filled every slot before yours could appear.`)}

    ${p(`Your question exposed it for the whole directory. Around a third of the businesses in Lompoc have a name that doesn't say what they sell — a plumber called Terrones, a jeweler called Vargas — and none of them could be found by what they actually do. That's fixed for all of them now, because you asked.`)}

    <div style="border-top:1px solid #efe7dc;margin:22px 0 18px;"></div>

    ${p(`<strong>Two things while I'm here.</strong>`)}
    ${p(`Eleven people searched for pizza on the site last month, and your page was opened 33 times. Small numbers — we're a young site and I'd rather give you the real ones.`)}
    ${p(`Your last two offers, the $5 lunch slice and $3 off a 16-inch, expired back in April. Your page stays free either way and always will. If you'd like something current on it, Growth is $39.99 a month and lets you keep up to five things posted — an offer, or just an announcement: new hours, who's playing, what's coming out of the oven this week.`)}

    <p style="margin:22px 0 8px;">
      <a href="${SITE}/en/dashboard" style="display:inline-block;background:#650C75;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:2px;">Post something to your page</a>
    </p>
    ${p(`<span style="font-size:13px;color:#7a6d80;">14 days free, and you can cancel and keep the free page exactly as it is.</span>`)}

    ${p(`Either way — thank you for telling us. We'd much rather hear it than not.`)}
    ${p(`— The Lompoc Locals team`)}
  </td></tr>
  <tr><td style="padding:18px 28px 26px;border-top:1px solid #efe7dc;text-align:center;">
    <div style="font-size:13px;color:#650C75;font-weight:700;">lompoclocals.com/biz/eye-on-i</div>
    <div style="font-size:11px;color:#8b8091;margin-top:6px;line-height:1.5;">
      community &amp; communication for Lompoc, California<br>
      <a href="${unsubUrl(to)}" style="color:#8b8091;">Unsubscribe</a> — or just reply and say so.<br>
      Lompoc Locals · PO Box 880, Lompoc, CA 93438
    </div>
  </td></tr>
</table></body></html>`

if (DUMP) {
  mkdirSync(dirname(DUMP), { recursive: true })
  writeFileSync(DUMP, html(TO))
  console.log(`wrote ${DUMP}`)
}

const target = PROOF || (SEND ? TO : null)
if (!target) {
  console.log(`\nDRY RUN — nothing sent.\n  to      : ${TO}\n  subject : ${SUBJECT}\n\n  PROOF=hello@lompoclocals.com  to send yourself a copy\n  SEND=1                        to send it to them\n`)
  process.exit(0)
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
  body: JSON.stringify({
    from: FROM,
    to: target,
    subject: PROOF ? `[PROOF — not sent to them] ${SUBJECT}` : SUBJECT,
    html: html(target),
    headers: { "List-Unsubscribe": `<${unsubUrl(target)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>` },
  }),
})
const out = await res.json()
console.log(out.id ? `  ✓ sent to ${target}  (${out.id})` : `  ✗ ${JSON.stringify(out).slice(0, 200)}`)
process.exit(out.id ? 0 : 1)
