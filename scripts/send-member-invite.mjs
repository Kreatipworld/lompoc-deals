#!/usr/bin/env node
// Member invitation — free-first, never pushy. The claim is the ask; Growth is
// shown through what current members do with it, as information, not pressure.
// Dry-run unless SEND=1; proof to the hub first, always.
//   Proof:  CLAIM=<slug> NAME="Business Name" DUMP=/path/out.html node scripts/send-member-invite.mjs
//   Send:   CLAIM=<slug> NAME="Business Name" OWNER="First" TO=owner@biz.com SEND=1 node scripts/send-member-invite.mjs
import { readFileSync } from "node:fs"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const key = (env.match(/^RESEND_API_KEY\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const NAME = process.env.NAME || "Your Business"
const CLAIM = process.env.CLAIM || ""
const OWNER = process.env.OWNER || ""
const SEND = process.env.SEND === "1"
const P = "#650C75"
const GOLD = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const claimUrl = `https://www.lompoclocals.com/signup?claim=${encodeURIComponent(CLAIM)}`
const pageUrl = `https://www.lompoclocals.com/biz/${CLAIM}`

const subject = `${NAME} is already on Lompoc Locals — here's your page`

const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,${GOLD} 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Your page is ready &mdash; and it's free.</h1>
      <div style="height:3px; width:52px; background:${GOLD}; border-radius:2px; margin:0 0 18px;"></div>

      <p style="color:#444; line-height:1.6; margin:0 0 16px;">${OWNER ? `Hi ${OWNER}` : "Hi there"} &mdash; we run <strong>Lompoc Locals</strong>, the platform where this town finds its businesses, events, and things to do. <a href="${pageUrl}" style="color:${P}; font-weight:600;">${NAME} is already on it</a> &mdash; photos, hours, and your spot on the town map, live right now.</p>

      <p style="color:#444; line-height:1.6; margin:0 0 20px;"><strong>Claiming your page is free, and it stays free.</strong> No card, no trial, no catch &mdash; it just puts the page in your hands so it always says what you want. Takes about two minutes.</p>

      <p style="margin:0 0 24px;">
        <a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim your free page</a>
      </p>

      <div style="background:#faf8f2; border:1px solid #eee9dc; border-radius:10px; padding:18px 20px; margin:0 0 20px;">
        <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:14px;">What some members do with it</p>
        <p style="color:#555; line-height:1.65; margin:0; font-size:14px;">A few local businesses &mdash; the downtown jeweler, the glass shop, the garden marketplace on Ocean &mdash; are <strong>Growth members</strong>. Their pages carry the Official Partner badge, their pin stands out on the town map, they rotate through the front page of the site, and their specials go out in our Saturday email to the community. That's $39.99/month, whenever it makes sense for you &mdash; and honestly, the free page is a great place to start. There's no pressure here.</p>
      </div>

      <p style="color:#444; line-height:1.6; margin:0 0 4px;">Questions, or something on the page you'd like changed? Just reply &mdash; a real person here in Lompoc reads this inbox and will take care of it either way.</p>
      <p style="color:#888; margin:16px 0 0;">&mdash; Andres, Lompoc Locals</p>

      <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
        <div style="margin-bottom:8px;">
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${GOLD}; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#0B992F; margin:0 3px;"></span>
        </div>
        <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
        <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      </div>
    </div>
  </div>`

if (process.env.DUMP) {
  const { writeFileSync } = await import("node:fs")
  writeFileSync(process.env.DUMP, `<!doctype html><html><body style="background:#f2f2f4;padding:24px;">${html}</body></html>`)
  console.log("dumped to " + process.env.DUMP); process.exit(0)
}
console.log(`${SEND ? "SENDING" : "DRY RUN"} → ${TO}\nSubject: ${subject}\n`)
if (!SEND) { console.log("(set SEND=1 to send)"); process.exit(0) }

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: FROM, to: TO, reply_to: "hello@lompoclocals.com", subject, html }),
})
const body = await res.json().catch(() => ({}))
console.log(res.ok ? `✓ sent (id ${body.id})` : `✗ FAILED: ${JSON.stringify(body)}`)
