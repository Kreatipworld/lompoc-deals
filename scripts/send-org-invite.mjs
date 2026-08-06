#!/usr/bin/env node
// Community-organization invite — awareness-first, no sales pressure. For
// nonprofits and community institutions whose page we set up: claim it free,
// use the platform to reach the town. Dry-run unless SEND=1; proof to hub first.
//   Proof:   CLAIM=<slug> NAME="Org Name" DUMP=/path/out.html node scripts/send-org-invite.mjs
//   Send:    CLAIM=<slug> NAME="Org Name" TO=office@org.org SEND=1 node scripts/send-org-invite.mjs
import { readFileSync } from "node:fs"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const key = (env.match(/^RESEND_API_KEY\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const NAME = process.env.NAME || "Your Organization"
const CLAIM = process.env.CLAIM || ""
const OWNER = process.env.OWNER || ""
const SEND = process.env.SEND === "1"
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const claimUrl = `https://www.lompoclocals.com/signup?claim=${encodeURIComponent(CLAIM)}`
const pageUrl = `https://www.lompoclocals.com/biz/${CLAIM}`

const subject = `${NAME} is on Lompoc Locals — your page is ready for you`
const bullets = [
  `<strong>Your services, findable</strong> — locals searching the directory, the map, and the town's site see ${NAME} alongside every business in Lompoc.`,
  "<strong>Announcements that reach the town</strong> — post updates and events; they appear in the community feed and can be featured in our Saturday email edition.",
  "<strong>English y español</strong> — every page works in both languages, because that's who Lompoc is.",
  "<strong>Free for community organizations, and it stays free</strong> — no card, no catch. This is what a town platform is for.",
]
const html = `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">The community should know about you.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">${OWNER ? `Hi ${OWNER}` : "Hi there"} &mdash; we run <strong>Lompoc Locals</strong>, the community platform where Lompoc finds its businesses, events, and resources. The work ${NAME} does matters to this town, so we set up <a href="${pageUrl}" style="color:${P}; font-weight:600;">a page for you</a> &mdash; your services, contact information, hours, and location, already live and looking sharp.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Claiming it is <strong>free</strong> and takes about two minutes. It puts the page in your hands, so it always says exactly what you want the community to know.</p>
      <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:15px;">What being on the platform does:</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        ${bullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join("")}
      </ul>
      <p style="margin:0 0 10px;">
        <a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim ${NAME}'s page &mdash; free</a>
      </p>
      <p style="color:#444; line-height:1.6; margin:16px 0 4px;">Reply to this email with any questions or changes you'd like on the page &mdash; a real person here in Lompoc reads it and will take care of it either way.</p>
      <p style="color:#888; margin:16px 0 0;">&mdash; Andres, Lompoc Locals</p>
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
