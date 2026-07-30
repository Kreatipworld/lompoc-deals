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
const freeBullets = [
  "Your page becomes yours to run — edit photos, your story, hours, and links any time.",
  "You show up in the directory, on the map, and in local search when neighbors look for a bite.",
  "Reply to this email any time — a real person here in Lompoc reads it.",
]
const growthBullets = [
  "<strong>Post a deal &mdash; say &ldquo;Fish &amp; Chips Friday, $2 off&rdquo;</strong> &mdash; and it drops into the feed <em>and</em> our weekly email digest. Your special lands in inboxes across Lompoc, right before the weekend.",
  "<strong>Show up first in your category</strong> &mdash; when a neighbor searches fish &amp; chips in Lompoc, Alfie's is the name they see.",
  "<strong>See how many locals viewed your page each week</strong> &mdash; real numbers, so you know what's bringing people in.",
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
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">A quick word on why this means a lot to us: <strong>partners like Alfie's are the whole point of Lompoc Locals.</strong> We're a community hub &mdash; neighbors come here to find the local spots that make Lompoc, Lompoc &mdash; and a place serving fish &amp; chips since 1969 is exactly that.</p>

      <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:15px;">Claiming your page is free &mdash; and always will be.</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 22px; padding-left:20px;">
        ${freeBullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join("")}
      </ul>

      <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
        <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Turn lookups into regulars &mdash; try Growth</div>
        <p style="color:#444; line-height:1.6; margin:0 0 12px;">Last month <strong>41 neighbors looked up Alfie's</strong> right here on Lompoc Locals. The attention&rsquo;s already there &mdash; Growth is how you turn it into repeat customers:</p>
        <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
          ${growthBullets.map((b) => `<li style="margin-bottom:8px;">${b}</li>`).join("")}
        </ul>
        <p style="color:#1a1a1a; line-height:1.6; margin:0; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month &mdash; about the price of a couple of orders &mdash; and your <strong>first 14 days are free</strong>. Cancel anytime; no long-term anything.</p>
      </div>

      <p style="margin:0 0 8px;">
        <a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim Alfie's &amp; start your free trial</a>
      </p>
      <p style="color:#777; line-height:1.5; margin:0 0 22px; font-size:13px;">Claiming your page is always free &mdash; and you&rsquo;ll see the option to start Growth free for 14 days right after. No charge to begin.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">And consider this a personal invitation: <a href="https://www.lompoclocals.com/partner-guide.html" style="color:${P}; font-weight:700;">take a look at our partner guide</a> &mdash; it walks through everything Lompoc Locals does for neighborhood spots like yours. No pressure at all; claiming the page is free and yours to keep either way.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">We're just neighbors trying to help local spots get found. Reply any time; this reaches a real person here in Lompoc.</p>
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
