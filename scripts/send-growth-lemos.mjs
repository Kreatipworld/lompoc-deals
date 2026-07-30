#!/usr/bin/env node
// Personal Growth-plan invitation to Paul at Lemos Feed & Pet Supply (claimed member,
// already has a great page). Warm + specific. Preview to hub by default; TO=... to send.
//   Preview:  SEND=1 node scripts/send-growth-lemos.mjs
//   To Paul:  TO=paul@lemospet.com SEND=1 node scripts/send-growth-lemos.mjs
//   Render:   DUMP=/path/out.html node scripts/send-growth-lemos.mjs
import { readFileSync } from "node:fs"
import crypto from "node:crypto"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY")
const authSecret = pick("AUTH_SECRET") || ""
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const OWNER_EMAIL = "paul@lemospet.com"
const SEND = process.env.SEND === "1"
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const billing = "https://www.lompoclocals.com/dashboard/billing"
const page = "https://www.lompoclocals.com/biz/lemos-feed-pet-supply"
const unsubUrl = (e) =>
  `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(e)}&t=${crypto.createHmac("sha256", authSecret).update(e.trim().toLowerCase()).digest("base64url").slice(0, 24)}`

const subject = "Paul — your Lemos page is one of our best. Ready for Growth?"
const bullets = [
  "<strong>Post a deal &mdash; say &ldquo;$5 off a self-serve pet wash&rdquo; or &ldquo;15% off treats this weekend&rdquo;</strong> &mdash; and it drops into the feed <em>and</em> our weekly community digest to locals' inboxes.",
  "<strong>Featured placement in that weekly digest</strong> so more neighbors see Lemos.",
  "<strong>See how many locals view your page each week</strong> &mdash; real numbers, so you know what's working.",
  "<strong>Show up first in your category</strong> &mdash; when a neighbor searches pet supplies in Lompoc, Lemos is the name they see.",
]
const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Nice work on the Lemos page, Paul.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Hi Paul &mdash; we wanted to reach out personally: <a href="${page}" style="color:${P};font-weight:600;">your Lemos Feed &amp; Pet Supply page</a> is genuinely one of the best-looking listings on Lompoc Locals. The photos, the story, the self-serve wash details &mdash; you've clearly put care into it, and it shows. Around <strong>20 neighbors looked it up here just last month.</strong></p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">That's exactly the kind of partner Growth is built for. The attention's already there &mdash; here's how Growth turns it into repeat customers:</p>
      <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
        <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 10px;">With Growth you can</div>
        <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
          ${bullets.map((b) => `<li style="margin-bottom:8px;">${b}</li>`).join("")}
        </ul>
        <p style="color:#1a1a1a; line-height:1.6; margin:0; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month &mdash; and your <strong>first 14 days are free</strong>. Cancel anytime; no long-term anything.</p>
      </div>
      <p style="margin:0 0 10px;">
        <a href="${billing}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Start your 14-day free trial</a>
      </p>
      <p style="color:#777; line-height:1.5; margin:0 0 20px; font-size:13px;">No charge to begin &mdash; and your listing stays free either way.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">Either way, thanks for being part of the community and for building such a great page. Reply any time &mdash; this reaches a real person here in Lompoc.</p>
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
          You're getting this because you manage Lemos Feed &amp; Pet Supply on Lompoc Locals. <a href="${unsubUrl(OWNER_EMAIL)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or just reply &ldquo;unsubscribe.&rdquo;<br>${POSTAL}
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
