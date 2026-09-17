#!/usr/bin/env node
// Growth invite for Grocery Outlet Lompoc — sent AFTER the Sep 17 2026 meeting, to the email they give us.
// Signed "The Lompoc Locals team" (no owner name), no "free" framing, one CTA.
//   node scripts/invites/grocery-outlet.mjs                     # dry run
//   SEND=1 PREVIEW=1 node scripts/invites/grocery-outlet.mjs    # proof → hello@
//   TO=store@example.com SEND=1 node scripts/invites/grocery-outlet.mjs   # real send (only on explicit "send")
import { readFileSync, appendFileSync } from "node:fs"
import crypto from "node:crypto"
const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY"), secret = pick("AUTH_SECRET")
const SEND = process.env.SEND === "1", PREVIEW = process.env.PREVIEW === "1"
const P = "#650C75", G = "#0B992F", Y = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const GUIDE = "https://www.lompoclocals.com/partner-guide.html"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const unsubToken = (email) => crypto.createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (email) => `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

const TO = process.env.TO || ""  // the store's email, given to us at the meeting
const biz = { name: "Grocery Outlet Lompoc", slug: "grocery-outlet-lompoc" }
const claimUrl = `https://www.lompoclocals.com/signup?claim=${biz.slug}&plan=standard${TO ? `&email=${encodeURIComponent(TO)}` : ""}`
const profileUrl = `https://www.lompoclocals.com/biz/${biz.slug}`

// Real figures, pulled Sep 17 2026.
const F = { members: 19, views30d: "38,421", subs: 75 }

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Grocery Outlet Lompoc is on Lompoc Locals. Here is your page.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>
    <p style="color:#444; line-height:1.6; margin:0 0 14px;">Thank you for the conversation today. As promised, here is everything in one place. <strong>Lompoc Locals</strong> is the #1 local hub in Lompoc: where neighbors find local businesses, read local news, follow Friday night football, and see what's happening in town each week. Your page is live with your store photos, hours, and map pin &mdash; <a href="${profileUrl}" style="color:${P}; font-weight:700;">take a look</a>.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 18px;">A few facts: neighbors opened <strong>${F.views30d} business pages</strong> on Lompoc Locals in the last 30 days, and every Monday morning our email &mdash; local news, this week's events, and members' deals &mdash; lands in local inboxes across town. Members like <strong>Eddie's Grill</strong>, <strong>Vargas Jewelers</strong>, <strong>Lompoc Valley Florist</strong>, and <strong>Sweet Baking Co.</strong> carry the partner badge on the map, sit in the homepage member rail, and have their deals in the Monday email. No grocery store has claimed its page yet; Grocery Outlet would be the first.</p>

    <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Growth membership, built for a store whose deals change weekly</div>
      <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
        <li style="margin-bottom:6px;"><strong>Post this week's best closeout</strong> as a deal &mdash; it goes into the deals feed <em>and</em> the Monday email, town-wide.</li>
        <li style="margin-bottom:6px;"><strong>Announce new arrivals</strong> the moment they hit the floor.</li>
        <li style="margin-bottom:6px;"><strong>Show up first</strong> when a neighbor searches for groceries, produce, or a deal.</li>
        <li><strong>See your numbers</strong> &mdash; page visits, directions, calls, and website clicks each week.</li>
      </ul>
      <p style="color:#1a1a1a; line-height:1.6; margin:0 0 12px; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month, cancel anytime. Claim the page, set a password, add a card &mdash; about three minutes.</p>
      <p style="margin:0;"><a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim Grocery Outlet Lompoc &amp; become a member</a></p>
    </div>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;"><strong>Week one, once you're in:</strong> a Member Spotlight video from your own photos on Instagram, TikTok, and Facebook, and your first deal in the Monday email. We can set the first deal up together; just reply to this email.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 16px;">Everything the platform does for a business like yours is in the <a href="${GUIDE}" style="color:${P}; font-weight:700;">partner guide</a>.</p>
    <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team · hello@lompoclocals.com</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">You're getting this because Grocery Outlet Lompoc is listed on Lompoc Locals and we spoke today. <a href="${unsubUrl(TO || "hello@lompoclocals.com")}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or reply &ldquo;unsubscribe&rdquo;.<br>${POSTAL}</div>
    </div>
  </div>
</div>`

if (/\bfree\b/i.test(html)) { console.error("✗ 'free' found in the email — fix the copy"); process.exit(1) }
const subject = `Grocery Outlet Lompoc is on Lompoc Locals — your page and the claim link`
const to = PREVIEW ? "hello@lompoclocals.com" : TO
if (!SEND) { console.log(`DRY RUN → ${to || "(no TO yet)"}\n${subject}\n${claimUrl}`); process.exit(0) }
if (!to) { console.error("✗ set TO=<store email> for a real send"); process.exit(1) }
const res = await fetch("https://api.resend.com/emails", {
  method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "Lompoc Locals <hello@lompoclocals.com>", to, reply_to: "hello@lompoclocals.com", subject: PREVIEW ? `[PROOF] ${subject}` : subject, html,
    headers: { "List-Unsubscribe": `<${unsubUrl(to)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }),
})
const body = await res.json().catch(() => ({}))
console.log(res.ok ? `✓ sent → ${to} (${body.id})` : `✗ FAILED ${JSON.stringify(body)}`)
if (res.ok && !PREVIEW) appendFileSync("/Users/kreatip/Projects/lompoc-deals/scripts/data/campaign-sent.log", to + "\n")
