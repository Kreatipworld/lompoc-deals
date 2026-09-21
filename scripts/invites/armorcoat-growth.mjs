#!/usr/bin/env node
// Armorcoat Painting LLC (biz 678) — follow-up AFTER he claimed the page himself (Sep 18 2026).
// He signed up as armorcoatllc@icloud.com, his claim is approved, and he is on the free tier.
// So this is NOT a claim invite: it says the page is his and shows the one step left, Growth.
//   node scripts/invites/armorcoat-growth.mjs                       # dry run
//   SEND=1 PREVIEW=1 node scripts/invites/armorcoat-growth.mjs      # proof → hello@
//   SEND=1 AT="2026-09-21T21:00:00.000Z" node scripts/invites/armorcoat-growth.mjs   # scheduled
import { readFileSync } from "node:fs"
import crypto from "node:crypto"
const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY"), secret = pick("AUTH_SECRET")
const SEND = process.env.SEND === "1", PREVIEW = process.env.PREVIEW === "1"
const AT = process.env.AT || ""
const P = "#650C75", G = "#0B992F", Y = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const GUIDE = "https://www.lompoclocals.com/partners"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const unsubToken = (e) => crypto.createHmac("sha256", secret).update(e.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (e) => `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(e)}&t=${unsubToken(e)}`

const TO = process.env.TO || "armorcoatllc@icloud.com"
const profileUrl = "https://www.lompoclocals.com/biz/armorcoat-painting"
const billingUrl = "https://www.lompoclocals.com/dashboard/billing"
const dashUrl = "https://www.lompoclocals.com/dashboard/profile"
const F = { views30d: "38,421" }

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Armorcoat Painting is yours. One step left.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>
    <p style="color:#444; line-height:1.6; margin:0 0 14px;">Thanks for signing up. Your claim went through, so the Armorcoat Painting page on <strong>Lompoc Locals</strong> is now under your account &mdash; <a href="${profileUrl}" style="color:${P}; font-weight:700;">here it is</a>. Your project photos and your number are already on it. You can edit anything from your <a href="${dashUrl}" style="color:${P}; font-weight:700;">dashboard</a>: add your logo, list the services you want to be found for, and fix any detail we got from Google.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 18px;">One step is still open. Your account is not on <strong>Growth</strong> yet, which is the part that puts you in front of neighbors: last month people opened <strong>${F.views30d} business pages</strong> here, and every Monday our email goes out across town with local news, this week's events, and members' offers.</p>

    <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">What Growth turns on</div>
      <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
        <li style="margin-bottom:6px;"><strong>Show up first</strong> when a neighbor searches for a painter in Lompoc.</li>
        <li style="margin-bottom:6px;"><strong>Post an offer</strong> &mdash; it lands in the deals feed <em>and</em> the Monday email.</li>
        <li style="margin-bottom:6px;"><strong>The partner badge</strong> on your page and on the map.</li>
        <li><strong>Your numbers</strong> &mdash; page visits and calls, every week.</li>
      </ul>
      <p style="color:#1a1a1a; line-height:1.6; margin:0 0 12px; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month, cancel anytime. It takes about a minute from your dashboard.</p>
      <p style="margin:0;"><a href="${billingUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Turn on Growth</a></p>
    </div>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;">Once you're on, we build you a Member Spotlight video from your own project photos for Instagram, TikTok and Facebook, and your first offer goes in the Monday email. Local trades already with us: <strong>Clark Builders</strong>, <strong>J's Glass Co</strong>, <strong>Oliveira's Fashion Floors</strong> and <strong>Wm Rieck Plumbing</strong>.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 16px;">Anything you want changed on the page, just reply to this email and we'll do it for you. Everything the platform does for a business like yours is in the <a href="${GUIDE}" style="color:${P}; font-weight:700;">partner guide</a>.</p>
    <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team · hello@lompoclocals.com</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">You're getting this because you claimed Armorcoat Painting LLC on Lompoc Locals. <a href="${unsubUrl(TO)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or reply &ldquo;unsubscribe&rdquo;.<br>${POSTAL}</div>
    </div>
  </div>
</div>`

if (/\bfree\b/i.test(html)) { console.error("✗ 'free' found in the email — fix the copy"); process.exit(1) }
if (process.env.DUMP) { const fs = await import("node:fs"); fs.writeFileSync(process.env.DUMP, html); console.log("dumped", process.env.DUMP) }
const subject = `Armorcoat Painting is yours on Lompoc Locals — one step left`
const to = PREVIEW ? "hello@lompoclocals.com" : TO
if (!SEND) { console.log(`DRY RUN → ${to}\n${subject}\n${billingUrl}`); process.exit(0) }
const res = await fetch("https://api.resend.com/emails", {
  method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "Lompoc Locals <hello@lompoclocals.com>", to, reply_to: "hello@lompoclocals.com",
    subject: PREVIEW ? `[PROOF] ${subject}` : subject, html, ...(AT ? { scheduled_at: AT } : {}),
    headers: { "List-Unsubscribe": `<${unsubUrl(to)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }),
})
const body = await res.json().catch(() => ({}))
console.log(res.ok ? `✓ ${AT ? `scheduled for ${AT}` : "sent"} → ${to} (${body.id})` : `✗ FAILED ${JSON.stringify(body)}`)
