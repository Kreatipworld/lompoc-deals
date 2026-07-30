#!/usr/bin/env node
// Branded claim-invite reply to Alfie's Fish & Chips (Mike). Preview to founder
// by default; pass TO=... to send to Mike. Dry-run unless SEND=1.
//   Preview:  SEND=1 node scripts/send-claim-email.mjs
//   To Mike:  TO=mrmike336@hotmail.com SEND=1 node scripts/send-claim-email.mjs
//   Render:   DUMP=/path/out.html node scripts/send-claim-email.mjs
import { readFileSync } from "node:fs"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const key = (env.match(/^RESEND_API_KEY\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const SEND = process.env.SEND === "1"
const P = "#650C75"
const claimUrl = "https://www.lompoclocals.com/signup?claim=alfie-s-fish-chips"

const subject = "Re: your Alfie's Fish & Chips listing on Lompoc Locals"
const bullets = [
  "<strong>Get discovered by neighbors</strong> — over 40 locals looked up Alfie's here last month, and you show up in the directory, on the map, and in local search.",
  "<strong>Featured in our weekly community digest</strong> that lands in locals' inboxes.",
  "<strong>Post a special or coupon whenever you want</strong> — Taco Tuesday, a first-visit deal, your call.",
  "<strong>See how many locals are viewing your page.</strong>",
]
const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Thanks, Mike &mdash; and welcome.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Hi Mike, thanks for the kind note &mdash; really glad the Alfie's page is looking good. And you nailed the hours: I've set your page to <strong>11am&ndash;8pm, Mon&ndash;Sat</strong> and locked it as owner-set, so Google's 7:40 (the DoorDash cutoff, good hunch) won't keep overriding it. It's showing correctly now.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">A quick word on why this means a lot to us: <strong>partners like Alfie's are the whole point of Lompoc Locals.</strong> We're a community hub &mdash; neighbors come here to find the local spots that make Lompoc, Lompoc &mdash; and a place serving fish &amp; chips since 1969 is exactly that. Claiming your page (free, ~30 seconds) makes it yours to run:</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        ${bullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join("")}
      </ul>
      <p style="margin:0 0 28px;">
        <a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600;">Claim Alfie's Fish &amp; Chips</a>
      </p>
      <p style="color:#444; line-height:1.55; margin:-8px 0 20px; font-size:14px;">Want the full picture first? Here's our partner guide: <a href="https://www.lompoclocals.com/partner-guide.html" style="color:${P}; font-weight:600;">lompoclocals.com/partner-guide.html</a></p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">It's free &mdash; and free forever for the basics. We're just neighbors trying to help local spots get found. Reply any time; this reaches a real person here in Lompoc.</p>
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
