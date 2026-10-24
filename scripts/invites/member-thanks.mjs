#!/usr/bin/env node
// Member thank-you (Oct 22 2026, Andres: "email for members thank you … show them the views").
// Builds one branded email per member and writes them as JSON for Orchestra drafts (never sends).
//   node scripts/invites/member-thanks.mjs proof  > out.json   # one sample, addressed to hello@
//   node scripts/invites/member-thanks.mjs all    > out.json   # the approved member list
// Numbers: 250,000+ views = Buffer, Aug–Sep 2026 (verified Oct 2); 4,900+ followers = Sep 30 count.
import { readFileSync } from "node:fs"
import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"

const env = readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
const pick = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, "m")) || [])[1]
const secret = pick("AUTH_SECRET")
const sql = neon(pick("DATABASE_URL"))
const P = "#650C75", G = "#0B992F", Y = "#EFC618"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const POSTAL = "Lompoc Locals · PO Box 880, Lompoc, CA 93438"
const unsubToken = (e) => crypto.createHmac("sha256", secret).update(e.trim().toLowerCase()).digest("base64url").slice(0, 24)
const unsubUrl = (e) => `https://www.lompoclocals.com/api/unsubscribe?e=${encodeURIComponent(e)}&t=${unsubToken(e)}`

// Left out on purpose: Phillip Segura + GL Painting (Andres: leave them alone for now), Terrones (card failing),
// Jasper's (no owner email), Valley Embroidery + WCI (Andres's own), unclaimed comps (LAUNCHpad, Oliveira's, SM Concrete).
const SKIP = [685, 686, 652, 278, 548, 646, 630, 629, 663]
const SUBJECT = "Thank you for being part of Lompoc Locals 💜"

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const tile = (big, small) => `<td style="width:33%; padding:6px;"><div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:16px 8px; text-align:center;"><div style="font-size:24px; font-weight:800; color:${P}; line-height:1.1;">${big}</div><div style="font-size:12px; color:#555; margin-top:6px; line-height:1.35;">${small}</div></div></td>`

function build(b, to) {
  const page = `https://www.lompoclocals.com/biz/${b.slug}`
  const name = esc(b.name)
  const html = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
  <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
    <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
  </div>
  <div style="height:6px; background:linear-gradient(90deg,${Y} 0%,${G} 55%,${P} 100%);"></div>
  <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
    <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">Thank you, ${name}.</h1>
    <div style="height:3px; width:52px; background:${Y}; border-radius:2px; margin:0 0 18px;"></div>
    <p style="color:#444; line-height:1.6; margin:0 0 14px;">Thank you for being a Lompoc Locals member. You're a big part of why Lompoc now has one place to see what's happening in town.</p>
    <div style="border-left:4px solid ${G}; background:#F4FAF5; border-radius:0 10px 10px 0; padding:14px 16px; margin:0 0 18px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${G}; margin:0 0 6px;">Our mission</div>
      <p style="color:#333; line-height:1.6; margin:0 0 10px;">Lompoc Locals exists to <strong>connect our town</strong>. Local news, this week's events, Friday night football, deals, and the businesses that make Lompoc home, all in one place, in English and Spanish.</p>
      <p style="color:#333; line-height:1.6; margin:0;">A town that knows what's happening shows up for each other. Neighbors find the shop down the street, families find something to do this weekend, and local money stays local. <strong>That's the community we're building, and your membership is what keeps it going.</strong></p>
    </div>
    <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 6px;">What we built together</div>
    <table role="presentation" style="width:100%; border-collapse:collapse; margin:0 0 18px;"><tr>
      ${tile("250,000+", "views on our posts in August and September")}
      ${tile("4,900+", "followers on Instagram and Facebook")}
      ${tile("Every week", "new videos on Instagram, Facebook and TikTok")}
    </tr></table>
    <p style="color:#444; line-height:1.6; margin:0 0 18px;">Your page is live and in front of those neighbors every day.</p>
    <p style="margin:0 0 22px;"><a href="${page}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">See your page</a></p>
    <p style="color:#444; line-height:1.6; margin:0 0 6px;">Thank you for growing with us.</p>
    <p style="color:#888; margin:0;">&mdash; The Lompoc Locals team · hello@lompoclocals.com</p>
    <div style="margin-top:26px; padding-top:18px; border-top:1px solid #eee; text-align:center;">
      <div style="margin-bottom:8px;"><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${P}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${Y}; margin:0 3px;"></span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${G}; margin:0 3px;"></span></div>
      <div style="font-size:14px; font-weight:700; color:${P};">lompoclocals.com</div>
      <div style="font-size:12px; color:#999; margin-top:2px;">community &amp; communication for Lompoc, California</div>
      <div style="font-size:11px; color:#aaa; margin-top:12px; line-height:1.5;">You're getting this because ${name} is a Lompoc Locals member. <a href="${unsubUrl(to)}" style="color:#aaa; text-decoration:underline;">Unsubscribe</a> &mdash; or reply &ldquo;unsubscribe&rdquo;.<br>${POSTAL}</div>
    </div>
  </div>
</div>`
  const text = `Thank you, ${b.name}.

Thank you for being a Lompoc Locals member. You're a big part of why Lompoc now has one place to see what's happening in town.

OUR MISSION
Lompoc Locals exists to connect our town. Local news, this week's events, Friday night football, deals, and the businesses that make Lompoc home, all in one place, in English and Spanish.

A town that knows what's happening shows up for each other. Neighbors find the shop down the street, families find something to do this weekend, and local money stays local. That's the community we're building, and your membership is what keeps it going.

What we built together:
- 250,000+ views on our posts in August and September
- 4,900+ followers on Instagram and Facebook
- New videos every week on Instagram, Facebook and TikTok

Your page is live and in front of those neighbors every day:
${page}

Thank you for growing with us.
The Lompoc Locals team · hello@lompoclocals.com

Unsubscribe: ${unsubUrl(to)}
${POSTAL}`
  if (/\bfree\b/i.test(text)) throw new Error("'free' in the copy")
  return { biz_id: b.id, business: b.name, to_email: to, subject: SUBJECT, body_html: html, body_text: text }
}

const rows = await sql`select b.id, b.name, b.slug, coalesce(nullif(u.email, 'scraper@lompocdeals.system'), b.email) as to_email
  from businesses b left join users u on u.id = b.owner_user_id left join subscriptions s on s.user_id = b.owner_user_id
  where b.status = 'approved'
    and (b.plan_override in ('standard','premium') or (s.status in ('active','trialing','past_due') and s.tier in ('standard','premium')))
  order by b.name`
const list = rows.filter((r) => !SKIP.includes(r.id) && r.to_email)
const mode = process.argv[2] || "proof"
const out = mode === "all"
  ? list.map((b) => build(b, b.to_email))
  : [build(list.find((b) => b.slug === "taqueria-don-tacho") || list[0], "hello@lompoclocals.com")]
console.log(JSON.stringify(out))
console.error(`${out.length} email(s); members on list: ${list.length}`)
