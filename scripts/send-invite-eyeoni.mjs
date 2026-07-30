#!/usr/bin/env node
// Warm "welcome, come be part of it" invitation to Eye on I (eyeoni2323@gmail.com).
// Same branded look as the Alfie's note, lighter on the sell — an invitation to
// join the community. Preview to the hub by default; TO=... to send to them.
//   Preview:  SEND=1 node scripts/send-invite-eyeoni.mjs
//   To owner:  TO=eyeoni2323@gmail.com SEND=1 node scripts/send-invite-eyeoni.mjs
//   Render:   DUMP=/path/out.html node scripts/send-invite-eyeoni.mjs
import { readFileSync } from "node:fs"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const key = (env.match(/^RESEND_API_KEY\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const SEND = process.env.SEND === "1"
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const dash = "https://www.lompoclocals.com/dashboard"
const page = "https://www.lompoclocals.com/biz/eye-on-i"
const guide = "https://www.lompoclocals.com/partner-guide.html"

const subject = "You're part of Lompoc Locals — welcome, Eye on I"
const bullets = [
  "Make your page yours — add photos, your story, hours, and links any time; it saves instantly.",
  "Post updates, specials, or a little deal whenever you like — they show up in the feed and our weekly community digest to locals' inboxes.",
  "You're on the map, in the directory, and in local search when neighbors go looking.",
]
const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Welcome to Lompoc Locals, Eye on I.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Hi there &mdash; so glad to have Eye on I as part of Lompoc Locals. We're a community hub where neighbors find the local spots that make Lompoc, Lompoc, and you're one of them: <strong>23 locals looked up your page here just last month.</strong></p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">This is an open invitation to make it yours and be part of it:</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        ${bullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join("")}
      </ul>
      <p style="margin:0 0 20px;">
        <a href="${dash}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Go to your dashboard</a>
      </p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Here's your live page any time: <a href="${page}" style="color:${P}; font-weight:600;">lompoclocals.com/biz/eye-on-i</a>. And if you'd ever like to do more &mdash; feature specials in the weekly digest, see your view numbers, get priority placement &mdash; our <a href="${guide}" style="color:${P}; font-weight:700;">partner guide</a> walks through it (the first 14 days are free, whenever you're ready). No rush at all.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">We're just neighbors trying to help local spots get found. Reply any time &mdash; this reaches a real person here in Lompoc.</p>
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
