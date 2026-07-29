#!/usr/bin/env node
// Sends the branded "your page is ready" member email via the real Resend
// account (from hello@lompoclocals.com). Preview to the founder by default;
// pass TO=... to send to the member. Dry-run unless SEND=1.
//
//   Preview to founder:  node scripts/send-member-email.mjs                (SEND=1 to actually send to andres@)
//   Send to member:      TO=vargasjewelers@gmail.com SEND=1 node scripts/send-member-email.mjs
import { readFileSync } from "node:fs"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const key = (env.match(/^RESEND_API_KEY\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "andres@kreatipdesign.com"
const SEND = process.env.SEND === "1"
const BRAND_PURPLE = "#650C75"
const dash = "https://www.lompoclocals.com/dashboard"

const subject = "Your Vargas Jewelers page is ready on Lompoc Locals"
const bullets = [
  "Edit your profile any time — photos, your story, hours, links. It saves to your page instantly.",
  "Post deals &amp; specials whenever you like — they show up in the feed and our weekly community digest.",
  "See how many locals are viewing your page.",
]
const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:${BRAND_PURPLE}; padding:18px 24px; border-radius:12px 12px 0 0;">
      <img src="https://www.lompoclocals.com/brand/lompoc-locals-mark-white.png" alt="Lompoc Locals" width="28" height="36" style="vertical-align:middle; margin-right:10px;">
      <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:-0.02em; vertical-align:middle;">Lompoc Locals</span>
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,#650C75 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">You&rsquo;re all set, Vargas Jewelers.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Welcome to the Lompoc Locals community as a Growth member. Your page is live and already getting found &mdash; over 60 neighbors looked you up last month. It&rsquo;s your page now, ready to make your own:</p>
      <p style="color:#1a1a1a; font-weight:600; margin:0 0 8px;">Here&rsquo;s what you can do, any time:</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        ${bullets.map((b) => `<li>${b}</li>`).join("")}
      </ul>
      <p style="margin:0 0 28px;">
        <a href="${dash}" style="display:inline-block; background:${BRAND_PURPLE}; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600;">Go to your dashboard</a>
      </p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">Log in with your email at lompoclocals.com. Reply to this email any time &mdash; it reaches a real person here in Lompoc.</p>
      <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team</p>
      <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
        <div style="margin-bottom:8px;">
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#650C75; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#EFC618; margin:0 3px;"></span>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#0B992F; margin:0 3px;"></span>
        </div>
        <div style="font-size:14px; font-weight:700; color:#650C75;">lompoclocals.com</div>
        <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      </div>
    </div>
  </div>`

if (process.env.DUMP) {
  const { writeFileSync } = await import("node:fs")
  writeFileSync(process.env.DUMP, `<!doctype html><html><body style="background:#f2f2f4;padding:24px;">${html}</body></html>`)
  console.log("dumped to " + process.env.DUMP)
  process.exit(0)
}
console.log(`${SEND ? "SENDING" : "DRY RUN"} → ${TO}\nSubject: ${subject}\n`)
if (!SEND) { console.log("(set SEND=1 to actually send)"); process.exit(0) }

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: FROM, to: TO, reply_to: "hello@lompoclocals.com", subject, html }),
})
const body = await res.json().catch(() => ({}))
console.log(res.ok ? `✓ sent (id ${body.id})` : `✗ FAILED: ${JSON.stringify(body)}`)
