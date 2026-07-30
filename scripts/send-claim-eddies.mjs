#!/usr/bin/env node
// Personalized claim invite to Carlos Meza — owner of both Eddie's Grill locations.
// Branded (cream header + full-color logo), free-claim + Growth invite, one-click
// unsubscribe + postal footer. Preview to the hub by default; TO=... to send.
//   Preview:  SEND=1 node scripts/send-claim-eddies.mjs
//   To owner: TO=j.carlosmeza1995@yahoo.com SEND=1 node scripts/send-claim-eddies.mjs
//   Render:   DUMP=/path/out.html node scripts/send-claim-eddies.mjs
import { readFileSync } from "node:fs"
import crypto from "node:crypto"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY")
const authSecret = pick("AUTH_SECRET") || ""
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const OWNER_EMAIL = "j.carlosmeza1995@yahoo.com"   // real recipient (for unsubscribe token)
const SEND = process.env.SEND === "1"
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const GUIDE = "https://www.lompoclocals.com/partner-guide.html"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const claimUrl = "https://www.lompoclocals.com/signup?claim=eddies-grill"
const villageUrl = "https://www.lompoclocals.com/biz/eddie-s-grill-village"
const grillUrl = "https://www.lompoclocals.com/biz/eddies-grill"
const unsubUrl = (e) =>
  `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(e)}&t=${crypto.createHmac("sha256", authSecret).update(e.trim().toLowerCase()).digest("base64url").slice(0, 24)}`

const subject = "Your Eddie's Grill pages on Lompoc Locals — ready to claim (free)"
const freeBullets = [
  "Your pages become yours to run — edit photos, your story, hours, and links any time.",
  "You show up in the directory, on the map, and in local search when neighbors want a bite.",
  "Reply to this email any time — a real person here in Lompoc reads it.",
]
const growthBullets = [
  "<strong>Post a deal &mdash; something like &ldquo;$2 off any charbroiled burger&rdquo;</strong> &mdash; and it drops into the feed <em>and</em> our weekly email digest to locals' inboxes across Lompoc.",
  "<strong>Show up first in your category</strong> &mdash; when a neighbor searches for a burger in Lompoc, Eddie's is a name they see.",
  "<strong>See how many locals view your pages each week</strong> &mdash; real numbers, so you know what's bringing people in.",
]
const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Eddie's Grill is on Lompoc Locals, Carlos.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Hi Carlos &mdash; we're <strong>Lompoc Locals</strong>, a community hub where neighbors find the local spots that make Lompoc, Lompoc. Both of your Eddie's Grill locations are here and already getting found: your <a href="${grillUrl}" style="color:${P};font-weight:600;">N H St spot</a> alone had <strong>over 100 locals look it up here last month</strong>, and the <a href="${villageUrl}" style="color:${P};font-weight:600;">Village location</a> on Constellation is live too. We even set the pages up with your photos, menu highlights, hours, and logo &mdash; now they're yours to claim.</p>
      <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:15px;">Claiming your pages is free &mdash; and always will be.</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 22px; padding-left:20px;">
        ${freeBullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join("")}
      </ul>
      <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
        <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Turn lookups into regulars &mdash; try Growth</div>
        <p style="color:#444; line-height:1.6; margin:0 0 12px;">The attention's already there &mdash; Growth is how you turn those 100+ lookups into repeat customers:</p>
        <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
          ${growthBullets.map((b) => `<li style="margin-bottom:8px;">${b}</li>`).join("")}
        </ul>
        <p style="color:#1a1a1a; line-height:1.6; margin:0; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month &mdash; and your <strong>first 14 days are free</strong>. Cancel anytime; no long-term anything.</p>
      </div>
      <p style="margin:0 0 8px;">
        <a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim your Eddie's pages &amp; start free</a>
      </p>
      <p style="color:#777; line-height:1.5; margin:0 0 22px; font-size:13px;">Claiming is always free &mdash; you'll see the option to start Growth free for 14 days right after. No charge to begin.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Want the full picture first? Here's our <a href="${GUIDE}" style="color:${P}; font-weight:700;">partner guide</a> &mdash; it walks through everything Lompoc Locals does for neighborhood spots like Eddie's. No pressure at all; claiming the pages is free and yours to keep either way.</p>
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
        <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">
          You're getting this because Eddie's Grill is listed on Lompoc Locals. <a href="${unsubUrl(OWNER_EMAIL)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or just reply &ldquo;unsubscribe&rdquo; and we'll remove you right away.<br>${POSTAL}
        </div>
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
  body: JSON.stringify({
    from: FROM, to: TO, reply_to: "hello@lompoclocals.com", subject, html,
    headers: {
      "List-Unsubscribe": `<${unsubUrl(OWNER_EMAIL)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }),
})
const body = await res.json().catch(() => ({}))
console.log(res.ok ? `✓ sent (id ${body.id})` : `✗ FAILED: ${JSON.stringify(body)}`)
