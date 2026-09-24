#!/usr/bin/env node
// Claim + Growth invite for Oliveira's Fashion Floors & Restoration (biz 629).
// Comped founding partner since Jul 2026 (plan_override standard); claiming clears the comp — the page pays like everyone else.
// Signed "The Lompoc Locals team" (no owner name), no "free" framing, one CTA.
//   node scripts/invites/oliveiras.mjs                     # dry run
//   SEND=1 PREVIEW=1 node scripts/invites/oliveiras.mjs    # proof → hello@
//   TO=owner@example.com SEND=1 node scripts/invites/oliveiras.mjs                      # send now
//   TO=owner@example.com AT="2026-09-21T21:00:00.000Z" SEND=1 node scripts/invites/oliveiras.mjs  # scheduled (Resend holds it)
import { readFileSync, appendFileSync } from "node:fs"
import crypto from "node:crypto"
const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY"), secret = pick("AUTH_SECRET")
const SEND = process.env.SEND === "1", PREVIEW = process.env.PREVIEW === "1"
const AT = process.env.AT || ""   // ISO 8601; Resend schedules the send server-side
const P = "#650C75", G = "#0B992F", Y = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const GUIDE = "https://www.lompoclocals.com/partners"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const unsubToken = (email) => crypto.createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (email) => `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

const TO = process.env.TO || "makenna@oliveirasonline.com"  // Makenna Oliveira, networking-group contact (emailed Aug 5 2026)
const FIRST = process.env.FIRST || "Makenna"
const biz = { name: "Oliveira's Fashion Floors & Restoration", slug: "oliveiras-fashion-floors-restoration" }
const claimUrl = `https://www.lompoclocals.com/signup?claim=${biz.slug}&plan=standard${TO ? `&email=${encodeURIComponent(TO)}` : ""}`
const profileUrl = `https://www.lompoclocals.com/biz/${biz.slug}`

// Real figures, pulled Sep 23 2026 — engaged sessions only (lib/analytics/engaged.ts), never raw counts.
const F = { members: 29, locals30d: "3,100", views30d: "7,200", ownViews30d: 232 }  // ownViews30d = engaged views of biz 629, Sep 24 2026

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Hi ${FIRST} &mdash; Oliveira's page on Lompoc Locals is ready for you to take over.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>
    <p style="color:#444; line-height:1.6; margin:0 0 14px;">Oliveira's has been on <strong>Lompoc Locals</strong> since July as one of our founding <strong>Official Partners</strong> &mdash; the badge on the map, the spot in the homepage member rail, your showroom and your restoration work in the photos, both phone numbers, your hours, and your 4.7 on Google. <a href="${profileUrl}" style="color:${P}; font-weight:700;">Here's the page</a>. Anything you want changed, reply and we'll fix it the same day.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 14px;">We set it up for you; it's time it was yours. In the last 30 days alone, <strong>${F.ownViews30d} neighbors</strong> opened your page. Claiming it takes about three minutes and puts the page, the offers, and the numbers in your hands.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 18px;">A few facts: more than <strong>${F.locals30d} neighbors</strong> used Lompoc Locals in the last 30 days, opening <strong>${F.views30d}+ pages</strong> between them, and every Monday morning our email &mdash; local news, this week's events, and members' deals &mdash; lands in local inboxes across town. Twenty-nine Lompoc businesses are members &mdash; in your line of work, <strong>Clark Builders</strong>, <strong>J's Glass Co</strong>, <strong>Terrones Plumbing</strong>, and <strong>Wm Rieck Plumbing</strong> &mdash; and their offers go out in the Monday email.</p>

    <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Growth membership &mdash; what claiming the page gives you</div>
      <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
        <li style="margin-bottom:6px;"><strong>Keep the Official Partner badge</strong> and show up first when a neighbor searches for flooring, carpet, water damage, or mold in Lompoc.</li>
        <li style="margin-bottom:6px;"><strong>Two numbers at the top</strong> &mdash; the showroom and the 24/7 emergency line, tap-to-call. At 2am after a burst pipe, that's the call.</li>
        <li style="margin-bottom:6px;"><strong>Post your own offers</strong> &mdash; your <em>10% off flooring installation</em> runs out October 16; after the claim you renew it, change it, or add a carpet-cleaning deal yourself, and it lands in the deals feed <em>and</em> the Monday email, town-wide.</li>
        <li><strong>See your numbers</strong> &mdash; page visits and calls every week.</li>
      </ul>
      <p style="color:#1a1a1a; line-height:1.6; margin:0 0 12px; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month, cancel anytime. Claim the page, set a password, add a card &mdash; about three minutes.</p>
      <p style="margin:0;"><a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim Oliveira's page</a></p>
    </div>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;"><strong>Week one, once you're in:</strong> a Member Spotlight video built from your own showroom and job photos on Instagram, TikTok, and Facebook, and your first offer in the Monday email. Just reply to this email and we'll set it up with you.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 16px;">Everything the platform does for a business like yours is in the <a href="${GUIDE}" style="color:${P}; font-weight:700;">partner guide</a>.</p>
    <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team · hello@lompoclocals.com</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">You're getting this because Oliveira's Fashion Floors & Restoration is listed on Lompoc Locals. <a href="${unsubUrl(TO || "hello@lompoclocals.com")}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or reply &ldquo;unsubscribe&rdquo;.<br>${POSTAL}</div>
    </div>
  </div>
</div>`

if (/\bfree\b/i.test(html)) { console.error("✗ 'free' found in the email — fix the copy"); process.exit(1) }
if (process.env.DUMP) { const fs = await import("node:fs"); fs.writeFileSync(process.env.DUMP, html); console.log("dumped", process.env.DUMP) }
const subject = `${FIRST}, Oliveira's page on Lompoc Locals is ready to be yours`
const to = PREVIEW ? "hello@lompoclocals.com" : TO
if (!SEND) { console.log(`DRY RUN → ${to || "(no TO yet)"}\n${subject}\n${claimUrl}`); process.exit(0) }
if (!to) { console.error("✗ set TO=<store email> for a real send"); process.exit(1) }
const res = await fetch("https://api.resend.com/emails", {
  method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "Lompoc Locals <hello@lompoclocals.com>", to, reply_to: "hello@lompoclocals.com", subject: PREVIEW ? `[PROOF] ${subject}` : subject, html,
    ...(AT ? { scheduled_at: AT } : {}),
    headers: { "List-Unsubscribe": `<${unsubUrl(to)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }),
})
const body = await res.json().catch(() => ({}))
console.log(res.ok ? `✓ ${AT ? `scheduled for ${AT}` : "sent"} → ${to} (${body.id})` : `✗ FAILED ${JSON.stringify(body)}`)
if (res.ok && !PREVIEW) appendFileSync("/Users/kreatip/Projects/lompoc-deals/scripts/data/campaign-sent.log", to + "\n")
