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

const TO = process.env.TO || "brie@americanstages.com"   // Brie, given by the owner Sep 21 2026
const FIRST = process.env.FIRST || "Brie"
const biz = { name: "American Stages Realty & Management", slug: "american-stages-realty-management-inc" }
const claimPlus = `https://www.lompoclocals.com/signup?claim=${biz.slug}&plan=plus&email=${encodeURIComponent(TO)}`
const claimGrowth = `https://www.lompoclocals.com/signup?claim=${biz.slug}&plan=standard&email=${encodeURIComponent(TO)}`
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
    <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Hi ${FIRST} &mdash; we'd really like American Stages on Lompoc Locals.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>

    <p style="color:#444; line-height:1.6; margin:0 0 14px;">We've already built your page and it's live &mdash; your team photo, your office, your logo, your leasing number. <a href="${profileUrl}" style="color:${P}; font-weight:700;">Have a look</a> whenever you get a minute, and if anything is wrong just reply and we'll fix it the same day.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 14px;">We wanted to write properly rather than send you a form, because you're not a routine listing to us.</p>

    <div style="background:#ffffff; border-left:3px solid ${Y}; padding:4px 0 4px 18px; margin:0 0 18px;">
      <p style="color:#444; line-height:1.65; margin:0 0 12px;">Lompoc Locals covers most of this town now &mdash; the restaurants, the trades, the shops, Friday night football, the Monday email. <strong>The one thing it doesn't cover yet is housing</strong>, and housing is the thing people here search for most.</p>
      <p style="color:#444; line-height:1.65; margin:0 0 12px;">You're one of very few full-service brokerages actually <em>based</em> in Lompoc that also manages rentals. That combination is the whole problem in one office. A national portal will never keep an accurate list of what's available in this valley this week. You already know it, because it's your inventory.</p>
      <p style="color:#444; line-height:1.65; margin:0;">So for us this isn't about adding one more member. <strong>American Stages is what makes the housing side real</strong> instead of an empty page we're promising people. Whoever goes first sets the standard every other agent in town copies.</p>
    </div>

    <p style="color:#444; line-height:1.6; margin:0 0 18px;">One thing we noticed while building your page. Your rentals go out as flyers &mdash; a photo of the kitchen, <em>2 bed 1 bath</em>, the address typed across the bottom. That's good work and it does its job on a feed for a day. It just can't be found by somebody sitting at home at 9pm searching for a rental in Lompoc.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 6px; font-weight:700; color:#1a1a1a;">There are two ways in. Both are month to month, cancel anytime.</p>
    <p style="color:#777; line-height:1.6; margin:0 0 18px; font-size:14px;">Same three-minute claim either way &mdash; set a password, add a card, the page is yours.</p>

    <!-- PLUS — the one that fits a brokerage -->
    <div style="background:#F7F3E9; border:2px solid ${P}; border-radius:12px; padding:20px 22px; margin:0 0 14px; position:relative;">
      <div style="display:inline-block; background:${P}; color:#fff; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:4px 10px; border-radius:20px; margin:0 0 10px;">Our pick for you</div>
      <div style="font-size:20px; font-weight:800; color:#1a1a1a; margin:0 0 2px;">Plus &mdash; <span style="color:${P};">$99.99</span><span style="font-size:14px; font-weight:600; color:#777;">/month</span></div>
      <div style="font-size:13px; color:#777; margin:0 0 12px;">Everything in Growth, plus your inventory.</div>
      <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
        <li style="margin-bottom:6px;"><strong>Post rentals and homes as real listings</strong> &mdash; beds, baths, price, photo gallery, map pin, on <a href="${homesUrl}" style="color:${P}; font-weight:700;">the homes page</a>. Not a flyer. A page that stays findable.</li>
        <li style="margin-bottom:6px;"><strong>Every enquiry arrives with the listing attached</strong>, so you know which unit they mean before you pick up.</li>
        <li style="margin-bottom:6px;"><strong>Featured placement</strong> on the homes market and the town map.</li>
        <li><strong>You'd be first.</strong> There are <strong>${F.rentalsLive} rentals</strong> on the platform today. The category is wide open.</li>
      </ul>
      <p style="margin:0;"><a href="${claimPlus}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim with Plus &amp; post your listings</a></p>
    </div>

    <!-- GROWTH — the smaller door -->
    <div style="background:#ffffff; border:1px solid #e3e3e3; border-radius:12px; padding:18px 22px; margin:0 0 22px;">
      <div style="font-size:18px; font-weight:800; color:#1a1a1a; margin:0 0 2px;">Growth &mdash; <span style="color:${G};">$39.99</span><span style="font-size:14px; font-weight:600; color:#777;">/month</span></div>
      <div style="font-size:13px; color:#777; margin:0 0 12px;">The page and the audience, without the listings.</div>
      <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
        <li style="margin-bottom:6px;">Your page with hours, photos, contact and the <strong>Official Partner badge</strong> on the map.</li>
        <li style="margin-bottom:6px;">Up to <strong>5 live offers</strong> &mdash; a reduced application fee, a move-in special &mdash; in the deals feed.</li>
        <li style="margin-bottom:6px;">Everything you post lands in the <strong>Monday email</strong> to ${F.subs} local inboxes.</li>
        <li>Views and clicks, reported weekly.</li>
      </ul>
      <p style="margin:0;"><a href="${claimGrowth}" style="display:inline-block; background:#ffffff; color:${P}; border:2px solid ${P}; padding:11px 22px; border-radius:8px; text-decoration:none; font-weight:600;">Claim with Growth</a></p>
    </div>

    <p style="color:#444; line-height:1.6; margin:0 0 16px; font-size:14px;">Start on Growth and move up whenever you want &mdash; but Plus is the one that carries listings, and listings are your business.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;"><strong>${F.members} Lompoc businesses</strong> pay to be on here &mdash; trades, restaurants, shops. You'd be the first brokerage to put real inventory on it.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;"><strong>And we'll do the setting up with you.</strong> In your first week we'll sit down and load your current rentals together, and build a short video of one unit for Instagram, TikTok and Facebook out of your own photos. You don't have to learn anything for that to happen.</p>

    <p style="color:#444; line-height:1.6; margin:0 0 16px;">If it's easier to talk it through first, just reply to this and we'll work around your schedule. Happy to come to the Constellation Road office.</p>

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

const subject = `${FIRST}, Lompoc has nowhere to list a rental \u2014 and you have the rentals`
const to = PREVIEW ? "hello@lompoclocals.com" : TO

writeFileSync("/tmp/american-stages-invite.html", html)
console.log(`  first    ${FIRST}`)
console.log(`  to       ${to}${PREVIEW ? "  (PREVIEW)" : ""}`)
console.log(`  subject  ${subject}`)
console.log(`  plus     ${claimPlus}`)
console.log(`  growth   ${claimGrowth}`)
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
