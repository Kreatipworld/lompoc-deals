#!/usr/bin/env node
// One-off Growth invite for Clark Builders, Inc. — the standing claim email plus the
// numbers, the members they'd stand beside, what they're missing, and a meeting offer.
//   node scripts/invites/clark-builders.mjs                 # dry run
//   SEND=1 PREVIEW=1 node scripts/invites/clark-builders.mjs # proof → hello@
//   SEND=1 node scripts/invites/clark-builders.mjs           # real send
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
// Must match app/api/unsubscribe/route.ts exactly (same as send-claim-campaign.mjs).
const unsubToken = (email) => crypto.createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (email) => `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

const biz = { name: "Clark Builders, Inc.", slug: "clark-builders-inc", emails: ["info@clarkbuildersinc.com", "heidi@clarkbuildersinc.com"] }
const claimUrl = `https://www.lompoclocals.com/signup?claim=${biz.slug}`
const profileUrl = `https://www.lompoclocals.com/biz/${biz.slug}`

// Real figures, pulled the day of sending (Aug 26, 2026).
const F = { listed: 452, services: 81, members: 11, views7d: "close to 3,000", subs: 60 }

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Heidi, Clark Builders is on Lompoc Locals — and neighbors are already looking.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>
    <p style="color:#444; line-height:1.6; margin:0 0 14px;">Hi Heidi &mdash; I'm Andres, from <strong>Lompoc Locals</strong>, the local hub where Lompoc finds its businesses, news, and events. We built a page for Clark Builders with your kitchens and decks front and center: <a href="${profileUrl}" style="color:${P}; font-weight:700;">take a look</a>. It's yours to claim, free, and it always will be.</p>

    <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:18px 0 8px;">The numbers, honestly</div>
    <ul style="color:#444; line-height:1.7; margin:0 0 18px; padding-left:20px;">
      <li style="margin-bottom:6px;"><strong>${F.listed} Lompoc businesses</strong> are on the map and in local search &mdash; <strong>${F.services} of them in Services</strong>, your category.</li>
      <li style="margin-bottom:6px;"><strong>${F.views7d} business-page views in the last 7 days</strong>, from real neighbors (we stopped counting bots last week, so that's the clean number).</li>
      <li style="margin-bottom:6px;">Every Monday morning our email &mdash; local news, this week's events, and members' deals &mdash; lands in <strong>${F.subs} local inboxes</strong>, plus every member's. It just started; it grows every week.</li>
    </ul>

    <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Who you'd stand beside</div>
    <p style="color:#444; line-height:1.6; margin:0 0 18px;"><strong>${F.members} Lompoc businesses are Growth members</strong> today &mdash; and the trades are already here: <strong>Wm Rieck Plumbing</strong>, <strong>Terrones Plumbing</strong>, and <strong>J's Glass Co</strong> are three of the most-viewed service pages on the site this week. Rey's Liquor Store claimed their page and joined the day it went live.</p>

    <div style="background:#FFF8E6; border:1px solid ${Y}; border-radius:12px; padding:18px 22px; margin:0 0 20px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#7a5a00; margin:0 0 8px;">What an unclaimed page is missing</div>
      <ul style="color:#444; line-height:1.7; margin:0; padding-left:20px;">
        <li style="margin-bottom:6px;">Right now Clark Builders sits in the list with 80 other service businesses. <strong>Members show up first</strong> when a neighbor searches for a contractor, kitchen, or ADU.</li>
        <li style="margin-bottom:6px;">You can't post anything yet. Members' deals and announcements go into the feed <em>and</em> the Monday email &mdash; a "book a fall remodel consultation" note reaches the whole town.</li>
        <li>No numbers. Members see how many neighbors looked at their page each week.</li>
      </ul>
    </div>

    <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Growth membership</div>
      <p style="color:#1a1a1a; line-height:1.6; margin:0 0 12px; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month &mdash; <strong>first 14 days free</strong>, cancel anytime, no contract. Claim the page, set a password, add a card, and you're a member in about three minutes &mdash; that's exactly how Rieck Plumbing did it.</p>
      <p style="margin:0;"><a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim Clark Builders &amp; start the free trial</a></p>
    </div>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;"><strong>Or let's just meet.</strong> I'm in Lompoc &mdash; I'll come by your office on East Chestnut Court this week for 15 minutes, walk you through the page, and set everything up with you. Reply with a day and time that works and I'll be there.</p>
    <p style="color:#444; line-height:1.6; margin:0 0 16px;">Everything the platform does for a business like yours is in the <a href="${GUIDE}" style="color:${P}; font-weight:700;">partner guide</a>. No pressure either way &mdash; the page is yours to keep, free, regardless.</p>
    <p style="color:#888; margin:16px 0 0;">&mdash; Andres, Lompoc Locals</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">You're getting this because Clark Builders, Inc. is listed on Lompoc Locals. <a href="${unsubUrl(biz.emails[0])}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or reply &ldquo;unsubscribe&rdquo;.<br>${POSTAL}</div>
    </div>
  </div>
</div>`

const subject = `Clark Builders is on Lompoc Locals — the numbers, and a 15-minute visit`
const to = PREVIEW ? "hello@lompoclocals.com" : biz.emails
if (!SEND) { console.log(`DRY RUN → ${[].concat(to).join(", ")}\n${subject}`); process.exit(0) }
const res = await fetch("https://api.resend.com/emails", {
  method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "Lompoc Locals <hello@lompoclocals.com>", to, reply_to: "hello@lompoclocals.com", subject, html,
    headers: { "List-Unsubscribe": `<${unsubUrl(biz.emails[0])}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }),
})
const body = await res.json().catch(() => ({}))
console.log(res.ok ? `✓ sent → ${[].concat(to).join(", ")} (${body.id})` : `✗ FAILED ${JSON.stringify(body)}`)
if (res.ok && !PREVIEW) appendFileSync("/Users/kreatip/Projects/lompoc-deals/scripts/data/campaign-sent.log", biz.emails.join("\n") + "\n")
