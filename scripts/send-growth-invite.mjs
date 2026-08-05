#!/usr/bin/env node
// Growth-plan invitation for a business that has CLAIMED its page — invites them
// to start the 14-day free Growth trial. Branded (cream header + full-color logo).
// Preview to the hub by default; TO=... to send to the member. Dry-run unless SEND=1.
//   Preview:  SEND=1 node scripts/send-growth-invite.mjs
//   To member: TO=info@camins2dreams.com NAME="Camins 2 Dreams" SEND=1 node scripts/send-growth-invite.mjs
//   Render:   DUMP=/path/out.html node scripts/send-growth-invite.mjs
import { readFileSync } from "node:fs"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const key = (env.match(/^RESEND_API_KEY\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const NAME = process.env.NAME || "Camins 2 Dreams"
const SEND = process.env.SEND === "1"
// CLAIM=<slug>: the business hasn't claimed its page yet — the CTA becomes the
// claim link (which flows straight into the dashboard, where Growth checkout
// lives), and the intro stops thanking them for a claim they haven't made.
const CLAIM = process.env.CLAIM || ""
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const billing = CLAIM
  ? `https://www.lompoclocals.com/signup?claim=${encodeURIComponent(CLAIM)}`
  : "https://www.lompoclocals.com/dashboard/billing"

const subject = `Unlock Growth for ${NAME} — your first 14 days are free`
const bullets = [
  "<strong>Post specials &amp; coupons anytime</strong> — they drop into the feed <em>and</em> our weekly community digest to locals' inboxes across Lompoc.",
  "<strong>Featured placement in that weekly digest</strong> so more neighbors see you.",
  "<strong>See how many locals view your page each week</strong> — real numbers, so you know what's working.",
  "<strong>Show up first in your category</strong> so locals find you first.",
]
const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Ready to unlock Growth, ${NAME}?</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">${
        CLAIM
          ? `Hi there &mdash; your ${NAME} page is already live on Lompoc Locals (photos, hours, map pin), and neighbors are finding it. Claiming it takes about two minutes, and <strong>Growth is one click away in your dashboard</strong> &mdash; start with 14 days free, cancel anytime.`
          : `Hi there &mdash; thanks for claiming your ${NAME} page on Lompoc Locals. It's live and neighbors are already finding you. Here's how to turn that attention into repeat customers: <strong>start a 14-day free Growth trial</strong> &mdash; no charge to begin, cancel anytime.`
      }</p>
      <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:15px;">With Growth you can:</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        ${bullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join("")}
      </ul>
      <p style="margin:0 0 10px;">
        <a href="${billing}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">${CLAIM ? `Claim ${NAME} &amp; start Growth` : "Start your 14-day free trial"}</a>
      </p>
      <p style="color:#777; line-height:1.5; margin:0 0 20px; font-size:13px;"><strong style="color:${P};">$39.99</strong>/month after the trial &mdash; about the price of a couple of orders &mdash; and you can cancel anytime.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">Reply to this email with any questions &mdash; a real person here in Lompoc reads it.</p>
      <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team</p>
      <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
        <div style="margin-bottom:8px;">
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#EFC618; margin:0 3px;"></span>
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
