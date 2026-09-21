#!/usr/bin/env node
// Claim + Plus invite for American Stages Realty & Management (biz 519).
// Currently comped (plan_override 'standard'); this converts the comp into a paid Plus.
// Signed "The Lompoc Locals team" (no owner name), no "free" framing, one CTA.
//   node scripts/invites/american-stages.mjs                    # dry run, writes the HTML
//   SEND=1 PREVIEW=1 node scripts/invites/american-stages.mjs   # proof → hello@
//   TO=... SEND=1 node scripts/invites/american-stages.mjs      # send
//   TO=... AT="2026-09-22T16:00:00.000Z" SEND=1 ...             # Resend schedules it
import { readFileSync, writeFileSync, appendFileSync } from "node:fs"
import crypto from "node:crypto"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY"), secret = pick("AUTH_SECRET")
const SEND = process.env.SEND === "1", PREVIEW = process.env.PREVIEW === "1"
const AT = process.env.AT || ""
const P = "#650C75", G = "#0B992F", Y = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const GUIDE = "https://www.lompoclocals.com/partner-guide.html"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const unsubToken = (e) => crypto.createHmac("sha256", secret).update(e.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (e) => `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(e)}&t=${unsubToken(e)}`

const TO = process.env.TO || "leasing@americanstages.com"   // from their website
const biz = { name: "American Stages Realty & Management", slug: "american-stages-realty-management-inc" }
const claimUrl = `https://www.lompoclocals.com/signup?claim=${biz.slug}&plan=plus&email=${encodeURIComponent(TO)}`
const profileUrl = `https://www.lompoclocals.com/biz/${biz.slug}`
const homesUrl = "https://www.lompoclocals.com/homes"

// Verified Sep 21 2026 — scripts/check-members.mjs and a direct count.
// Deliberately no traffic claim: the honest number is small and the argument
// here does not need one. See the honest-numbers rule.
const F = { members: 21, subs: 86, rentalsLive: 0 }

const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Right now Lompoc Locals has no rentals on it. That should be you.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>

    <p style="color:#444; line-height:1.6; margin:0 0 14px;">Your page is already live on <strong>Lompoc Locals</strong> with your team photo, your office, your logo and your leasing number &mdash; <a href="${profileUrl}" style="color:${P}; font-weight:700;">take a look</a>. Anything you want changed, reply and we'll fix it the same day.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 18px;">We noticed something while we were building it. Your rentals go out as flyers &mdash; a photo of the kitchen, <em>2 bed 1 bath</em>, the address typed across the bottom. That works on a feed for a day. It doesn't work when somebody in town opens their phone at 9pm and searches for a rental in Lompoc.</p>

    <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Plus membership &mdash; built for a brokerage</div>
      <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
        <li style="margin-bottom:6px;"><strong>Post rentals and homes as real listings</strong> &mdash; beds, baths, price, photo gallery, map pin, on <a href="${homesUrl}" style="color:${P}; font-weight:700;">the homes page</a>. Not a flyer. A page that stays findable.</li>
        <li style="margin-bottom:6px;"><strong>Every enquiry comes to you with the listing attached</strong>, so you know which unit they're asking about before you pick up.</li>
        <li style="margin-bottom:6px;"><strong>You'd be first.</strong> There are <strong>${F.rentalsLive} rentals</strong> on the platform today. The whole category is open.</li>
        <li><strong>Your listings and any offer go into the Monday email</strong> that lands with ${F.subs} local inboxes.</li>
      </ul>
      <p style="color:#1a1a1a; line-height:1.6; margin:0 0 12px; font-size:14px;"><strong style="font-size:19px; color:${P};">$99.99</strong>/month, cancel anytime. Claim the page, set a password, add a card &mdash; about three minutes.</p>
      <p style="margin:0;"><a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim American Stages &amp; post your first listing</a></p>
    </div>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;"><strong>${F.members} Lompoc businesses</strong> pay to be on here &mdash; trades, restaurants, shops. You'd be the first brokerage to put actual inventory on it.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;"><strong>Week one, once you're in:</strong> we'll load your current rentals with you and build a short video of one unit for Instagram, TikTok and Facebook from your own photos. Just reply.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;">Everything the platform does for a brokerage is in the <a href="${GUIDE}" style="color:${P}; font-weight:700;">partner guide</a>.</p>
    <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team · hello@lompoclocals.com</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:10px;">${POSTAL}<br><a href="${unsubUrl(TO)}" style="color:#aaa;">Unsubscribe</a></div>
    </div>
  </div>
</div>`

// Never pitch "free" to a business.
if (/\bfree\b/i.test(html)) { console.error("REFUSING: the word 'free' appears in this email."); process.exit(1) }

const subject = "Lompoc has nowhere to list a rental. You have the rentals."
const to = PREVIEW ? "hello@lompoclocals.com" : TO

writeFileSync("/tmp/american-stages-invite.html", html)
console.log(`  to       ${to}${PREVIEW ? "  (PREVIEW)" : ""}`)
console.log(`  subject  ${subject}`)
console.log(`  claim    ${claimUrl}`)
console.log(`  profile  ${profileUrl}`)
console.log(`  preview  /tmp/american-stages-invite.html`)
if (!SEND) { console.log("\n  dry run — nothing sent. Add SEND=1 to send."); process.exit(0) }

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "Lompoc Locals <hello@lompoclocals.com>",
    to: [to], subject, html,
    ...(AT ? { scheduled_at: AT } : {}),
  }),
})
const body = await res.json()
console.log(res.ok ? `  SENT id=${body.id}${AT ? ` scheduled ${AT}` : ""}` : `  FAILED ${res.status} ${JSON.stringify(body)}`)
if (res.ok && !PREVIEW) {
  appendFileSync("docs/marketing/sent-log.csv",
    `${new Date().toISOString()},${biz.slug},${to},plus-claim,${body.id}\n`)
}
