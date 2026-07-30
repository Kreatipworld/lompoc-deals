#!/usr/bin/env node
// Branded, per-business "claim your page" outreach round for unclaimed listings.
// Same look as the Alfie's invite (cream header + full-color logo, free-claim +
// Growth sell, partner-guide invitation), personalized per business: name, its
// real 30-day view count, a category-specific deal example, and its claim link.
//
// EMAIL-APPROVAL RULE: dry-run by default. Nothing sends without SEND=1, and
// the founder must approve the exact content first.
//
//   List targets:        node scripts/send-claim-batch.mjs
//   Preview to hub:       PREVIEW=1 SEND=1 node scripts/send-claim-batch.mjs   (all → hello@)
//   Dump stacked HTML:    DUMP=/path/out.html node scripts/send-claim-batch.mjs
//   Send the round:       SEND=1 node scripts/send-claim-batch.mjs             (each → its own email)
//   Send just one id:     ONLY=224 SEND=1 node scripts/send-claim-batch.mjs
import { readFileSync } from "node:fs"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const key = (env.match(/^RESEND_API_KEY\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!key) { console.error("no RESEND_API_KEY"); process.exit(1) }

const FROM = "Lompoc Locals <hello@lompoclocals.com>"
const SEND = process.env.SEND === "1"
const PREVIEW = process.env.PREVIEW === "1"           // route every email to the hub
const ONLY = process.env.ONLY ? Number(process.env.ONLY) : null
const P = "#650C75"
const LOGO = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png"
const GUIDE = "https://www.lompoclocals.com/partner-guide.html"

// First wave: top commercial, deal-friendly unclaimed listings (30-day views).
const TARGETS = [
  { id: 630, name: "LAUNCHpad", slug: "launchpad-lompoc", email: "lompoclaunchpad@gmail.com", category: "Services", views: 73 },
  { id: 224, name: "In&Out Tires Lpc", slug: "in-out-tires-lpc", email: "inandouttireslpc@gmail.com", category: "Auto", views: 67 },
  { id: 200, name: "One Plant Lompoc", slug: "one-plant-lompoc", email: "info@oneplant.life", category: "Dispensaries", views: 59 },
  { id: 497, name: "Tacos y Mariscos El Culichi", slug: "tacos-y-mariscos-el-culichi", email: "tacosculichi01@yahoo.com", category: "Food & Drink", views: 46 },
  { id: 404, name: "Wm Rieck Plumbing Co", slug: "wm-rieck-plumbing-co", email: "wmrieckplumbing@aol.com", category: "Services", views: 31 },
  { id: 197, name: "Elevate Lompoc", slug: "elevate-lompoc", email: "elevate@elevatelompoc.com", category: "Dispensaries", views: 24 },
  { id: 159, name: "Babcock Winery & Vineyards", slug: "babcock-winery", email: "info@babcockwinery.com", category: "Wineries", views: 23 },
  { id: 368, name: "Fatte's Pizza of Lompoc", slug: "fatte-s-pizza-of-lompoc", email: "german_2737@hotmail.com", category: "Food & Drink", views: 23 },
  { id: 305, name: "Brewer-Clifton Winery", slug: "brewer-clifton-winery", email: "info@brewerclifton.com", category: "Wineries", views: 22 },
  { id: 148, name: "Flying Goat Cellars", slug: "flying-goat-cellars", email: "info@flyinggoatcellars.com", category: "Wineries", views: 21 },
  { id: 515, name: "Altered Aesthetics Beauty Lounge", slug: "altered-aesthetics-beauty-lounge", email: "alteredaestheticsbeautylounge@gmail.com", category: "Health & Beauty", views: 20 },
  { id: 321, name: "Lemos Feed & Pet Supply", slug: "lemos-feed-pet-supply", email: "info@lemospet.com", category: "Retail", views: 19 },
]

// Category → tailored language so each email feels written for that business.
const CAT = {
  "Food & Drink":   { deal: "&ldquo;Taco Tuesday, $2 off&rdquo; or &ldquo;$5 off your first online order&rdquo;", search: "somewhere to eat in Lompoc", noun: "spot" },
  "Wineries":       { deal: "&ldquo;2-for-1 tasting flight this weekend&rdquo;", search: "a tasting room", noun: "winery" },
  "Dispensaries":   { deal: "a first-visit offer for locals", search: "a dispensary", noun: "shop" },
  "Auto":           { deal: "&ldquo;$15 off an oil change or smog check&rdquo;", search: "an auto shop", noun: "shop" },
  "Services":       { deal: "&ldquo;$25 off your first service call&rdquo;", search: "help for a job around the house", noun: "business" },
  "Health & Beauty":{ deal: "&ldquo;20% off your first appointment&rdquo;", search: "a salon or studio", noun: "studio" },
  "Retail":         { deal: "&ldquo;10% off for locals this weekend&rdquo;", search: "a local shop", noun: "shop" },
}
const catFor = (c) => CAT[c] || { deal: "a special just for locals", search: "a local spot", noun: "business" }

const subjectFor = (b) => `Your ${b.name} page on Lompoc Locals — ready to claim (free)`

function htmlFor(b) {
  const c = catFor(b.category)
  const claimUrl = `https://www.lompoclocals.com/signup?claim=${b.slug}`
  const seen = b.views >= 10
    ? `it&rsquo;s already getting found: <strong>${b.views} neighbors looked up ${b.name} here in the last month.</strong>`
    : `neighbors are already finding it.`
  const freeBullets = [
    "Your page becomes yours to run — edit photos, your story, hours, and links any time.",
    `You show up in the directory, on the map, and in local search when neighbors look for ${c.search}.`,
    "Reply to this email any time — a real person here in Lompoc reads it.",
  ]
  const growthBullets = [
    `<strong>Post a deal &mdash; something like ${c.deal}</strong> &mdash; and it drops into the feed <em>and</em> our weekly email digest to locals' inboxes across Lompoc.`,
    `<strong>Show up first in your category</strong> &mdash; when a neighbor searches for ${c.search}, ${b.name} is a name they see.`,
    "<strong>See how many locals viewed your page each week</strong> &mdash; real numbers, so you know what's bringing people in.",
  ]
  const lookups = b.views >= 10 ? `those ${b.views} lookups` : "the neighbors already finding you"
  return `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
    <div style="background:#F7F3E9; padding:22px 24px; border-radius:12px 12px 0 0; text-align:center;">
      <img src="${LOGO}" alt="Lompoc Locals" width="180" height="117" style="display:inline-block;">
    </div>
    <div style="height:6px; background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,${P} 100%);"></div>
    <div style="padding:28px 24px; border:1px solid #eee; border-top:none; border-radius:0 0 12px 12px;">
      <h1 style="font-size:23px; margin:0 0 10px; color:#1a1a1a; font-weight:800; letter-spacing:-0.01em;">${b.name} is on Lompoc Locals.</h1>
      <div style="height:3px; width:52px; background:#EFC618; border-radius:2px; margin:0 0 18px;"></div>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">Hi there &mdash; we're <strong>Lompoc Locals</strong>, a community hub where neighbors find the local spots that make Lompoc, Lompoc. We built a page for ${b.name}, and ${seen}</p>
      <p style="color:#1a1a1a; font-weight:700; margin:0 0 8px; font-size:15px;">Claiming your page is free &mdash; and always will be.</p>
      <ul style="color:#444; line-height:1.7; margin:0 0 22px; padding-left:20px;">
        ${freeBullets.map((x) => `<li style="margin-bottom:6px;">${x}</li>`).join("")}
      </ul>

      <div style="background:#F7F3E9; border:1px solid #E9DFC2; border-radius:12px; padding:20px 22px; margin:0 0 22px;">
        <div style="font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${P}; margin:0 0 8px;">Turn lookups into regulars &mdash; try Growth</div>
        <p style="color:#444; line-height:1.6; margin:0 0 12px;">The attention&rsquo;s already there &mdash; Growth is how you turn ${lookups} into repeat customers:</p>
        <ul style="color:#444; line-height:1.7; margin:0 0 14px; padding-left:20px;">
          ${growthBullets.map((x) => `<li style="margin-bottom:8px;">${x}</li>`).join("")}
        </ul>
        <p style="color:#1a1a1a; line-height:1.6; margin:0; font-size:14px;"><strong style="font-size:19px; color:${P};">$39.99</strong>/month &mdash; and your <strong>first 14 days are free</strong>. Cancel anytime; no long-term anything.</p>
      </div>

      <p style="margin:0 0 8px;">
        <a href="${claimUrl}" style="display:inline-block; background:${P}; color:#ffffff; padding:13px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Claim ${b.name} &amp; start your free trial</a>
      </p>
      <p style="color:#777; line-height:1.5; margin:0 0 22px; font-size:13px;">Claiming your page is always free &mdash; you&rsquo;ll see the option to start Growth free for 14 days right after. No charge to begin.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 16px;">And consider this a personal invitation: <a href="${GUIDE}" style="color:${P}; font-weight:700;">take a look at our partner guide</a> &mdash; it walks through everything Lompoc Locals does for neighborhood spots like yours. No pressure at all; claiming the page is free and yours to keep either way.</p>
      <p style="color:#444; line-height:1.6; margin:0 0 4px;">We're just neighbors trying to help local spots get found. Reply any time; this reaches a real person here in Lompoc.</p>
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
}

let list = TARGETS
if (ONLY) list = list.filter((b) => b.id === ONLY)

if (process.env.DUMP) {
  const { writeFileSync } = await import("node:fs")
  const stacked = list.map((b) =>
    `<div style="margin-bottom:40px;"><div style="font:600 13px system-ui;color:#650C75;margin:0 0 6px;">to: ${b.email} &nbsp;·&nbsp; subj: ${subjectFor(b)}</div>${htmlFor(b)}</div>`
  ).join("")
  writeFileSync(process.env.DUMP, `<!doctype html><html><body style="background:#f2f2f4;padding:24px;">${stacked}</body></html>`)
  console.log(`dumped ${list.length} emails to ${process.env.DUMP}`)
  process.exit(0)
}

console.log(`${SEND ? (PREVIEW ? "PREVIEW→hub" : "SENDING") : "DRY RUN"} — ${list.length} email(s)\n`)
for (const b of list) {
  const to = PREVIEW ? "hello@lompoclocals.com" : b.email
  console.log(`  ${b.name}  →  ${to}`)
  if (!SEND) continue
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, reply_to: "hello@lompoclocals.com", subject: subjectFor(b), html: htmlFor(b) }),
  })
  const body = await res.json().catch(() => ({}))
  console.log(res.ok ? `     ✓ sent (${body.id})` : `     ✗ FAILED: ${JSON.stringify(body)}`)
}
if (!SEND) console.log("\n(dry run — set SEND=1 to send; PREVIEW=1 routes all to hello@)")
