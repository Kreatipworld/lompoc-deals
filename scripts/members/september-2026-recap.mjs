#!/usr/bin/env node
// September 2026 member recap — "what we did together" + thank you. Owner asked Sep 29 2026.
// Signed "The Lompoc Locals team" (no owner name), no "free" framing, one CTA, branded HTML.
//   node scripts/members/september-2026-recap.mjs                    # dry run: lists recipients
//   DUMP=/tmp/recap.html node scripts/members/september-2026-recap.mjs   # write the HTML for a Playwright render
//   SEND=1 PREVIEW=1 node scripts/members/september-2026-recap.mjs   # proof → hello@ (rendered for Valley Embroidery)
//   SEND=1 LIST=paying node scripts/members/september-2026-recap.mjs   # real send to paying members (active subscriptions)
//   SEND=1 LIST=all    node scripts/members/september-2026-recap.mjs   # paying + comped founding partners with a real inbox
//   AT="2026-10-01T15:00:00.000Z" adds a Resend scheduled send.
import { readFileSync, appendFileSync, existsSync } from "node:fs"
import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"
const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const key = pick("RESEND_API_KEY"), secret = pick("AUTH_SECRET")
const sql = neon(pick("DATABASE_URL"))
const SEND = process.env.SEND === "1", PREVIEW = process.env.PREVIEW === "1", LIST = process.env.LIST || "paying"
const AT = process.env.AT || ""
const P = "#650C75", G = "#0B992F", Y = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const SENT_LOG = "/Users/kreatip/Projects/lompoc-deals/scripts/data/member-recap-2026-09-sent.log"
const unsubToken = (email) => crypto.createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (email) => `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

// ── September 2026 figures, pulled Sep 29 2026 (Sep 1–28). Sources noted per line; re-pull before a later reuse.
const F = {
  socialViews: "161,000",   // Buffer aggregated: TikTok 59,563 views + Instagram 41,135 views + Facebook 60,760 impressions
  posts: 193,               // Buffer: posts published Sep 1–28 across the three channels
  reactions: "3,998",       // Buffer: likes/reactions
  comments: 231,            // Buffer
  shares: "1,090",          // Buffer
  fbClicks: "2,800",        // Buffer: Facebook link clicks 2,816
  pageViews: "68,600",      // analytics_events page_viewed + business_page_viewed, Sep 1–28 (raw, owner's convention since Sep 24)
  pageViewsAug: "17,000",   // same, August (16,988)
  browsingVisits: "3,450",  // sessions with 2–40 events (a person who kept browsing), Sep (3,456) vs Aug (613)
  searches: 404,            // search_run events (Aug: 230)
  newsStories: 37,          // blog_posts created in September (Aug: 22)
  events: 52,               // approved events starting in September
  digestSubs: 87,           // subscribers table today (66 on Sep 1)
  members: 29,              // active + comped member businesses
  businesses: 460,          // approved listings
}

const rows = await sql.query(`
  select b.id, b.name, b.slug, b.email as biz_email, u.email as owner_email, s.status as sub_status, b.plan_override,
         (select count(*) from deals d where d.business_id = b.id)::int as deals
  from businesses b
  left join users u on u.id = b.owner_user_id
  left join subscriptions s on s.user_id = u.id and s.status in ('active','trialing') and s.tier in ('standard','premium')
  where b.status = 'approved' and (s.id is not null or b.plan_override in ('standard','premium'))
  order by b.name`)
const system = (e) => !e || /@lompocdeals\.(system|internal)$/.test(e)
const recipients = rows.map((r) => {
  const paying = !!r.sub_status
  const to = !system(r.owner_email) ? r.owner_email : r.biz_email
  return { ...r, paying, to, kind: paying ? "paying" : "comp" }
}).filter((r) => r.to && !/thevalleyembroidery@gmail\.com/i.test(r.to))   // our own listing never gets the member mail
const list = recipients.filter((r) => LIST === "all" || r.paying)

const dashboard = "https://www.lompoclocals.com/dashboard?utm_source=email&utm_campaign=member-recap-2026-09"
const html = (biz, to) => `
<div style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:30px 26px 10px; border:1px solid #eee; border-top:none;">
    <div style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${G}; margin:0 0 10px;">September 2026 · Member recap</div>
    <h1 style="font-size:28px; line-height:1.2; margin:0 0 12px; color:#1a1a1a; font-weight:800; letter-spacing:-0.02em;">Thank you, ${biz.name}.<br>Look at what Lompoc did this month.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>
    <p style="color:#444; line-height:1.65; margin:0 0 14px; font-size:16px;">Not long ago a town of 44,000 people had no place of its own online &mdash; just a handful of Facebook groups and a Google box. Today it has one, and you are part of the reason. Every month more neighbors open Lompoc Locals to find a business, read what is happening in town, or check a Friday night score. Here is September, in numbers we can stand behind.</p>
  </div>

  <!-- hero stats -->
  <div style="padding:6px 26px 0; border-left:1px solid #eee; border-right:1px solid #eee;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:separate; border-spacing:8px 0; margin:0 -8px;">
      <tr>
        <td width="33%" style="background:${P}; color:#fff; border-radius:12px; padding:18px 12px; text-align:center; vertical-align:top;">
          <div style="font-size:30px; font-weight:800; letter-spacing:-0.02em; line-height:1;">${F.socialViews}</div>
          <div style="font-size:12px; margin-top:8px; opacity:0.92; line-height:1.35;">video views on TikTok, Instagram &amp; Facebook</div>
        </td>
        <td width="33%" style="background:#F7F3E9; color:#1a1a1a; border-radius:12px; padding:18px 12px; text-align:center; vertical-align:top;">
          <div style="font-size:30px; font-weight:800; letter-spacing:-0.02em; line-height:1; color:${P};">${F.pageViews}</div>
          <div style="font-size:12px; margin-top:8px; color:#555; line-height:1.35;">page views on lompoclocals.com<br><span style="color:${G}; font-weight:700;">4&times; August</span></div>
        </td>
        <td width="33%" style="background:#F7F3E9; color:#1a1a1a; border-radius:12px; padding:18px 12px; text-align:center; vertical-align:top;">
          <div style="font-size:30px; font-weight:800; letter-spacing:-0.02em; line-height:1; color:${P};">${F.reactions}</div>
          <div style="font-size:12px; margin-top:8px; color:#555; line-height:1.35;">likes &amp; reactions on our posts<br><span style="color:${G}; font-weight:700;">${F.shares} shares</span></div>
        </td>
      </tr>
    </table>
  </div>

  <div style="padding:22px 26px 6px; border-left:1px solid #eee; border-right:1px solid #eee;">
    <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 10px;">What the town did in September</div>
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse;">
      ${[
        [F.browsingVisits, "visits where a neighbor kept browsing &mdash; up from 613 in August"],
        [String(F.searches), "searches for a local business, right on the site"],
        [String(F.posts), "posts published, with " + F.comments + " comments from neighbors"],
        [F.fbClicks, "clicks from Facebook through to a page on Lompoc Locals"],
        [String(F.newsStories), "Lompoc news stories written from the sources, in English and Spanish"],
        [String(F.events), "events on the calendar, every Friday night football game covered"],
        [String(F.digestSubs), "inboxes get the Monday email &mdash; 21 more than a month ago"],
      ].map(([n, t]) => `<tr><td style="padding:7px 0; border-bottom:1px solid #f0ece2; width:84px; font-size:22px; font-weight:800; color:${P}; letter-spacing:-0.02em; vertical-align:top;">${n}</td><td style="padding:9px 0 7px 6px; border-bottom:1px solid #f0ece2; color:#444; font-size:14px; line-height:1.45;">${t}</td></tr>`).join("")}
    </table>
  </div>

  <div style="padding:22px 26px 6px; border-left:1px solid #eee; border-right:1px solid #eee;">
    <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 10px;">New this month, built for you</div>
    <ul style="color:#444; line-height:1.65; margin:0; padding-left:20px; font-size:15px;">
      <li style="margin-bottom:6px;"><strong>Friday Night Football</strong> &mdash; a home for the Braves and the Conquistadores: schedules, scores, game-night videos every Friday. Thousands of neighbors, every week, on the same site your page lives on. <a href="https://www.lompoclocals.com/football?utm_source=email&utm_campaign=member-recap-2026-09" style="color:${P}; font-weight:700;">lompoclocals.com/football</a></li>
      <li style="margin-bottom:6px;"><strong>This Week</strong> &mdash; a curated Monday edition: news, events, and members&rsquo; deals, on the site and in the email.</li>
      <li style="margin-bottom:6px;"><strong>Sales</strong> &mdash; a new place for garage sales and things for sale in Lompoc, with an account and a person approving every listing. <a href="https://www.lompoclocals.com/sales?utm_source=email&utm_campaign=member-recap-2026-09" style="color:${P}; font-weight:700;">lompoclocals.com/sales</a></li>
      <li><strong>Member Spotlight videos</strong> &mdash; built from members&rsquo; own photos, posted on TikTok, Instagram and Facebook. Yours is next if we have not done it yet: reply and we schedule it.</li>
    </ul>
  </div>

  <div style="padding:22px 26px 26px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">October starts Thursday</div>
      <p style="color:#1a1a1a; line-height:1.6; margin:0 0 14px; font-size:15px;">${biz.deals > 0
        ? `The deals and announcements you post go into the feed, the Monday email and our videos. Put October&rsquo;s on your page now and it rides every one of them.`
        : `Your page is live at <a href="https://www.lompoclocals.com/biz/${biz.slug}?utm_source=email&utm_campaign=member-recap-2026-09" style="color:${P}; font-weight:700;">lompoclocals.com/biz/${biz.slug}</a>, but it has no deal or announcement yet &mdash; that is what the feed, the Monday email and our videos pick up. One post, two minutes, and October is covered.`}</p>
      <p style="margin:0;"><a href="${dashboard}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Post your October deal or announcement</a></p>
    </div>
    <p style="color:#444; line-height:1.65; margin:20px 0 0; font-size:15px;">Twenty-nine local businesses believed in this before there was anything to look at. That is what built it. Thank you for being one of them &mdash; we are changing how Lompoc finds Lompoc, together.</p>
    <p style="color:#888; margin:16px 0 0;">&mdash; The Lompoc Locals team · hello@lompoclocals.com</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">You're getting this because ${biz.name} is a member of Lompoc Locals. <a href="${unsubUrl(to)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or reply &ldquo;unsubscribe&rdquo;.<br>${POSTAL}</div>
    </div>
  </div>
</div>`

const subject = "September on Lompoc Locals: 161,000 views, and thank you"
const sample = rows.find((r) => r.slug === "valley-embroidery") || list[0]
if (process.env.DUMP) { const fs = await import("node:fs"); fs.writeFileSync(process.env.DUMP, html(sample, "hello@lompoclocals.com")); console.log("dumped", process.env.DUMP) }
for (const r of list) if (/\bfree\b/i.test(html(r, r.to))) { console.error("✗ 'free' found in the email — fix the copy"); process.exit(1) }

if (!SEND) {
  console.log(`DRY RUN — LIST=${LIST}: ${list.length} recipients\n${subject}\n`)
  for (const r of recipients) console.log(`  ${LIST === "all" || r.paying ? "→" : "  (skip)"} ${r.kind.padEnd(6)} ${r.name.padEnd(46)} ${r.to}  deals=${r.deals}`)
  process.exit(0)
}
const already = existsSync(SENT_LOG) ? new Set(readFileSync(SENT_LOG, "utf8").split("\n").filter(Boolean)) : new Set()
const targets = PREVIEW ? [{ ...sample, to: "hello@lompoclocals.com" }] : list.filter((r) => !already.has(r.to))
for (const r of targets) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Lompoc Locals <hello@lompoclocals.com>", to: r.to, reply_to: "hello@lompoclocals.com",
      subject: PREVIEW ? `[PROOF] ${subject}` : subject, html: html(r, r.to), ...(AT ? { scheduled_at: AT } : {}),
      headers: { "List-Unsubscribe": `<${unsubUrl(r.to)}>, <mailto:hello@lompoclocals.com?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }),
  })
  const body = await res.json().catch(() => ({}))
  console.log(res.ok ? `✓ ${AT ? `scheduled ${AT}` : "sent"} → ${r.name} <${r.to}> (${body.id})` : `✗ FAILED ${r.name} ${JSON.stringify(body)}`)
  if (res.ok && !PREVIEW) appendFileSync(SENT_LOG, r.to + "\n")
  await new Promise((f) => setTimeout(f, 600))
}
