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
const dbUrl = (env.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m) || [])[1]

// Live social proof: real partner brands (name + logo) and real view metrics.
// Queried at send time — stale numbers in a sales email cost trust.
let PROOF = { partners: [], views30d: 0, topName: "", topViews: 0 }
if (dbUrl) {
  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(dbUrl)
    const partners = await sql`
      select distinct b.name, b.logo_url from businesses b
      left join subscriptions s on s.user_id = b.owner_user_id
      where b.status='approved' and b.logo_url is not null and b.logo_url != ''
        and (b.plan_override is not null or (s.status in ('active','trialing') and s.tier != 'free'))`
    const prefer = ["Eddie's Grill", "Eye on I", "In&Out Tires Lpc", "Jasper's Saloon", "Lompoc Valley Florist", "J's Glass Co"]
    PROOF.partners = prefer.map((n) => partners.find((p) => p.name === n)).filter(Boolean).slice(0, 6)
    const [tot] = await sql`select count(*)::int c from analytics_events where event_name='business_page_viewed' and created_at > now() - interval '30 days'`
    PROOF.views30d = tot?.c ?? 0
    const [top] = await sql`
      select b.name, count(*)::int c from analytics_events a join businesses b on b.id = a.target_id
      where a.event_name='business_page_viewed' and a.created_at > now() - interval '30 days'
        and (b.plan_override is not null or exists (select 1 from subscriptions s where s.user_id=b.owner_user_id and s.status in ('active','trialing') and s.tier != 'free'))
      group by b.name order by c desc limit 1`
    if (top) { PROOF.topName = top.name; PROOF.topViews = top.c }
  } catch (e) { console.error("proof query failed (email still sends):", String(e).slice(0, 80)) }
}
const proofBlock = PROOF.partners.length
  ? `
      <div style="margin:4px 0 22px; padding:16px 18px; background:#F7F3E9; border-radius:12px;">
        <p style="margin:0 0 10px; font-size:13px; font-weight:700; letter-spacing:0.04em; color:#650C75;">YOU'D BE IN GOOD COMPANY</p>
        <div>
          ${PROOF.partners.map((p) => `<img src="${p.logo_url}" alt="${p.name.replace(/"/g, "")}" width="46" height="46" style="display:inline-block; width:46px; height:46px; object-fit:cover; border-radius:10px; background:#ffffff; border:1px solid #e5ddcc; margin:0 6px 6px 0;">`).join("")}
        </div>
        <p style="margin:8px 0 0; font-size:13px; color:#555; line-height:1.5;">${PROOF.partners.map((p) => p.name).join(" · ")} — all Growth partners here in Lompoc.</p>
        ${PROOF.views30d ? `<p style="margin:10px 0 0; font-size:13px; color:#555; line-height:1.5;">Neighbors viewed local business pages <strong>${PROOF.views30d.toLocaleString()} times in the last 30 days</strong>${PROOF.topName ? ` — partner pages lead that list (<strong>${PROOF.topName}</strong> alone took <strong>${PROOF.topViews}</strong> of them)` : ""}. Growth is how your page joins the front of it.</p>` : ""}
      </div>`
  : ""

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const TO = process.env.TO || "hello@lompoclocals.com"
const NAME = process.env.NAME || "Camins 2 Dreams"
const SEND = process.env.SEND === "1"
// CLAIM=<slug>: the business hasn't claimed its page yet — the CTA becomes the
// claim link (which flows straight into the dashboard, where Growth checkout
// lives), and the intro stops thanking them for a claim they haven't made.
const CLAIM = process.env.CLAIM || ""
// OWNER=Gale: greet the owner by first name instead of "Hi there".
const OWNER = process.env.OWNER || ""
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
// EMAIL=<owner email>: pre-associates the account email on the signup form —
// the owner only picks a password, then goes straight to the Stripe card form
// (plan=standard rides along so signup flows password → card in one motion).
const EMAIL = process.env.EMAIL || ""
const billing = CLAIM
  ? `https://www.lompoclocals.com/signup?claim=${encodeURIComponent(CLAIM)}&plan=standard${EMAIL ? `&email=${encodeURIComponent(EMAIL)}` : ""}`
  : "https://www.lompoclocals.com/dashboard/billing"

const subject = `Unlock Growth for ${NAME} — your page is ready`
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
          ? `${OWNER ? `Hi ${OWNER}` : "Hi there"} &mdash; your ${NAME} page is already live on Lompoc Locals (photos, hours, map pin), and neighbors are finding it. Making it officially yours takes about a minute: <strong>pick a password, add your card, done</strong> &mdash; $39.99/month, cancel anytime.`
          : `${OWNER ? `Hi ${OWNER}` : "Hi there"} &mdash; thanks for claiming your ${NAME} page on Lompoc Locals. It's live and neighbors are already finding you. Here's how to turn that attention into repeat customers: <strong>upgrade to Growth</strong> &mdash; $39.99/month, cancel anytime.`
      }</p>
      <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:15px;">With Growth you can:</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 24px; padding-left:20px;">
        ${bullets.map((b) => `<li style="margin-bottom:6px;">${b}</li>`).join("")}
      </ul>
      ${proofBlock}
      <p style="margin:0 0 10px;">
        <a href="${billing}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">${CLAIM ? `Claim ${NAME} &amp; start Growth` : "Upgrade to Growth"}</a>
      </p>
      <p style="color:#777; line-height:1.5; margin:0 0 20px; font-size:13px;"><strong style="color:${P};">$39.99</strong>/month &mdash; about the price of a couple of orders &mdash; and you can cancel anytime.</p>
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
