#!/usr/bin/env node
/**
 * Builds one card per calendar post that needs an image, then leaves the deck for
 * render-social-cards.mjs to rasterize.
 *
 * The calendar CSV is the input, not the DB: every card is generated for a post that
 * actually exists, using the same subject that post links to. That way a card can never
 * advertise a business the caption doesn't mention. Photos, addresses and event locations
 * are looked up live so the card shows the same thing the page does.
 *
 * Before this, four "Free in Lompoc" posts shared one launch.png naming a launch from
 * week 1, and four "This Week" posts shared one week-events.png listing week 1's events.
 * Those are now per-week.
 *
 * Usage:
 *   node scripts/build-social-cards.mjs [calendarCsv]
 *   node scripts/render-social-cards.mjs content/social/cards/cards-calendar.html content/social/posts
 *
 * Pass --write-csv to point the calendar's media column at the cards it generates.
 *
 * Everything lands in content/social/ — that folder is the deliverable.
 */
import { neon } from "@neondatabase/serverless"
import fs from "node:fs"
import path from "node:path"
import { nameSuffix, neighbourhoodLabel, streetLine } from "./lib/voice.mjs"

const CSV = process.argv[2]?.endsWith(".csv") ? process.argv[2] : "content/social/calendar.csv"
const WRITE_CSV = process.argv.includes("--write-csv")
const OUT_HTML = "content/social/cards/cards-calendar.html"
const IMG_DIR = "content/social/posts"

/**
 * Two cuts per post, because the platforms genuinely differ: Instagram's feed gives 4:5 the most
 * screen, TikTok is full-screen 9:16. Posting one shape to both wastes half the frame somewhere.
 */
const SIZES = ["ig", "tt"]
const setMedia = (row, cardId) => {
  row.media = `${IMG_DIR}/${cardId}-ig.png`
  row.media_vertical = `${IMG_DIR}/${cardId}-tt.png`
}
const REPO = process.cwd()

const url = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(url)

/* ---------- CSV ---------- */

function parseCsv(text) {
  const rows = []
  let row = [],
    field = "",
    quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') (field += '"'), i++
        else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ",") (row.push(field), (field = ""))
    else if (c === "\n") (row.push(field), rows.push(row), (row = []), (field = ""))
    else if (c !== "\r") field += c
  }
  if (field || row.length) (row.push(field), rows.push(row))
  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""))
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])))
}

const csvCell = (v) => {
  const s = String(v ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

/** Blob URLs pass through; repo-relative paths become file:// so headless Chrome can read them. */
function photoSrc(p) {
  if (!p) return null
  const u = typeof p === "string" ? p : p.url || p.src || null
  if (!u) return null
  if (/^https?:\/\//.test(u)) return u
  return `file://${path.join(REPO, "public", u.replace(/^\//, ""))}`
}

/**
 * Some lead photos can't be used even though they load fine — a menu shot with a price burned
 * into it, for instance, puts an unauthorised price on a card and contradicts the voice rules.
 * There's no way to detect that automatically, so a reviewed override lives here: slug → the
 * photo index to use instead of 0. Add a slug when a rendered card shows a problem.
 */
const PHOTO_OVERRIDE = {
  "tacos-el-tizon-1": 1, // photo 0 has "X 6.99" burned into the frame
}

const firstPhoto = (json, slug) => {
  const arr = Array.isArray(json) ? json : []
  const start = PHOTO_OVERRIDE[slug] ?? 0
  for (let i = start; i < arr.length + start; i++) {
    const s = photoSrc(arr[i % arr.length])
    if (s) return s
  }
  return null
}

const slugFrom = (link, kind) => link.match(new RegExp(`/${kind}/([a-z0-9-]+)`))?.[1] || null
const street = (addr) => streetLine(addr)

/**
 * Event locations arrive as free text and repeat themselves: "Old Town, Old Town Lompoc,
 * South H Street, Lompoc". Everything on this card is in Lompoc, so drop the city and
 * collapse what's left.
 */
function tidyLoc(loc) {
  const out = []
  for (const raw of String(loc || "").split(",")) {
    const p = raw.trim().replace(/\s+Lompoc$/i, "").replace(/\s+CA$/i, "").trim()
    if (!p || /^(lompoc|ca)$/i.test(p)) continue
    if (out.some((o) => o.toLowerCase() === p.toLowerCase())) continue
    out.push(p)
  }
  const s = out.join(", ")
  // Some events carry a truncated location — "Restaurants in" — which reads as a broken card.
  // Better to show no location than a dangling fragment.
  if (s.length < 4 || /\b(in|at|on|of|the|and|near)$/i.test(s)) return ""
  return s
}

/**
 * The CTA has to stay on one line — a wrapped URL reads as broken. Shrink to fit, and if
 * even the floor won't hold it, fall back to the bare domain.
 */
function ctaFor(pathText, width = 912, floor = 30, base = 38) {
  const fits = (size) => pathText.length * (0.55 * size + 1) <= width
  if (fits(base)) return { text: pathText, size: base }
  for (let s = base - 2; s >= floor; s -= 2) if (fits(s)) return { text: pathText, size: s }
  return { text: "lompoclocals.com", size: base }
}
const mark = (white = true) =>
  `file://${path.join(REPO, "public/brand", white ? "lompoc-locals-mark-white.svg" : "lompoc-locals-mark.svg")}`

const iconFor = (title) =>
  /rocket|launch/i.test(title) ? "🚀"
  : /market/i.test(title) ? "🛍️"
  : /music|concert|band/i.test(title) ? "🎶"
  : /art|gallery|mural/i.test(title) ? "🎨"
  : /wine|tasting/i.test(title) ? "🍷"
  : /run|walk|5k/i.test(title) ? "🏃"
  : "📌"

/* ---------- card templates ---------- */

const GRAIN_CSS = `
  :root { --purple:#650C75; --gold:#EFC618; --green:#0B992F; --cream:#FAF5EC; --ink:#241629; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#333; font-family:'Plus Jakarta Sans',sans-serif; }
  .card { position:relative; overflow:hidden; margin:20px auto; }
  .ig { width:1080px; height:1350px; }
  .tt { width:1080px; height:1920px; }
  .grain::after { content:''; position:absolute; inset:0; pointer-events:none; opacity:.07; z-index:50;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); }
  .serif { font-family:Georgia,serif; font-style:italic; }
  .tape { position:absolute; width:220px; height:56px; background:rgba(239,198,24,.85); box-shadow:0 2px 8px rgba(0,0,0,.12); }
  .url { font-weight:800; letter-spacing:1px; }
  .mark { width:150px; }
  .ev { display:flex; gap:26px; align-items:flex-start; padding:22px 0; border-bottom:3px solid rgba(36,22,41,.10); }
  .ev:last-child { border-bottom:none; }
  .ev .icon { font-size:52px; line-height:1; width:68px; flex-shrink:0; }
  .ev .day { color:var(--purple); font-weight:800; font-size:30px; letter-spacing:1px; text-transform:uppercase; }
  .ev .ttl { color:var(--ink); font-weight:700; font-size:40px; line-height:1.15; margin-top:5px; }
  .ev .loc { color:rgba(36,22,41,.55); font-weight:500; font-size:28px; margin-top:6px; }
  .footbar { position:absolute; left:0; right:0; bottom:0; height:130px; background:var(--purple);
    display:flex; align-items:center; justify-content:space-between; padding:0 70px; }
  .footbar .u { color:var(--gold); font-weight:800; font-size:42px; letter-spacing:1px; }
  .shot { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
`

/**
 * No card carries the mark at the top.
 *
 * It used to alternate — every other card stamped the logo in the top-left corner — but scrolled
 * as a profile grid that still reads as a repeating watermark sitting on top of the photograph.
 * Every card already signs itself with the url line at the bottom, and the week card keeps the
 * mark in its footer bar, which is where a signature belongs.
 */


/**
 * Photo card with a bottom-anchored block — the spotlight/place/weekend shape.
 *
 * The wash differs by series. Three series sharing one template meant three of every four cards
 * in the grid were the same purple-bottomed photograph, and a feed of those reads as one post
 * repeated. Same structure, different field: the layout stays recognisable, the tile doesn't.
 */
const WASH = {
  purple: "rgba(101,12,117,.93)",
  green: "rgba(11,153,47,.92)",
  ink: "rgba(24,14,28,.94)",
}
function photoCard(id, { photo, eyebrow, title, meta, cta, ctaColor = "var(--gold)", wash = "purple", slot = 0, size = "ig" }) {
  const bg = photo
    ? `<img class="shot" src="${esc(photo)}">
       <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(36,22,41,.34) 0%, rgba(36,22,41,.18) 32%, ${WASH[wash] || WASH.purple} 100%);"></div>`
    : `<div style="position:absolute; inset:0; background:linear-gradient(175deg, #1b0a20 0%, #4a0857 45%, #650C75 100%);"></div>
       <div style="position:absolute; inset:0; background:radial-gradient(circle at 72% 24%, rgba(239,198,24,.28) 0%, rgba(239,198,24,0) 42%);"></div>`
  // Long names need to shrink or they overrun the card.
  const titleSize = title.length > 26 ? 92 : title.length > 18 ? 108 : 122
  const c = ctaFor(cta)
  // Content is bottom-anchored, so the taller 9:16 frame only needs more breathing room above
  // it — the type scale that works at 1350 still works at 1920.
  void slot
  const pad = size === "tt" ? "150px 84px 190px" : "86px 84px 96px"
  return `
<div class="card ${size} grain" id="${id}">
  ${bg}
  <div style="position:relative; z-index:2; height:100%; display:flex; flex-direction:column; justify-content:flex-end; padding:${pad};">
    <div>
      <div class="serif" style="color:var(--gold); font-size:54px; line-height:1.2;">${esc(eyebrow)}</div>
      <div style="color:#fff; font-size:${titleSize}px; font-weight:800; line-height:1.04; margin-top:14px;">${esc(title)}</div>
      ${meta ? `<div style="color:#f3e6f6; font-size:44px; font-weight:500; margin-top:30px; line-height:1.35;">${meta}</div>` : ""}
      <div class="url" style="color:${ctaColor}; font-size:${c.size}px; margin-top:50px; white-space:nowrap;">${esc(c.text)}</div>
    </div>
  </div>
</div>`
}

// The launch card signs itself with the url line at the bottom, not a mark at the top: the rocket
// and the purple field are already unmistakably ours, and a logo above them just crowds the frame.
function launchCard(id, { name, when, slot = 0, size = "ig" }) {
  void slot
  const pad = size === "tt" ? "150px 84px 190px" : "86px 84px 96px"
  return `
<div class="card ${size} grain" id="${id}">
  <div style="position:absolute; inset:0; background:linear-gradient(175deg, #1b0a20 0%, #4a0857 45%, #650C75 100%);"></div>
  <div style="position:absolute; inset:0; background:radial-gradient(circle at 72% 24%, rgba(239,198,24,.30) 0%, rgba(239,198,24,0) 42%);"></div>
  <div style="position:relative; z-index:2; height:100%; display:flex; flex-direction:column; justify-content:flex-end; padding:${pad};">
    <div>
      <div style="font-size:150px; line-height:1;">🚀</div>
      <div class="serif" style="color:var(--gold); font-size:54px; margin-top:34px;">${esc(when)} — over our valley,</div>
      <div style="color:#fff; font-size:122px; font-weight:800; line-height:1.02; margin-top:14px;">There's a<br>launch.</div>
      <div style="color:#f3e6f6; font-size:${name.length > 34 ? 40 : 46}px; font-weight:500; margin-top:36px; line-height:1.35;">${esc(name)}<br>Vandenberg Space Force Base</div>
      <div style="margin-top:44px; display:inline-block; border:3px solid var(--gold); border-radius:999px; padding:20px 40px; color:var(--gold); font-size:38px; font-weight:800;">Look southwest 👀</div>
      <div class="url" style="color:#fff; font-size:38px; margin-top:52px; opacity:.9;">every launch on lompoclocals.com</div>
    </div>
  </div>
</div>`
}

/**
 * Event lists are unbounded — titles wrap, locations are long, and a five-row week can run
 * off the card and under the footer. So measure before rendering: scale the rows down to fit,
 * and only drop an event if even the smallest scale won't hold them.
 */
const FIT_IG = 855 // 1350 − header block − footbar − breathing room
// 1920 − 230 top pad − ~282 header − 30 list pad − 180 footbar − margin. The first attempt at
// 1330 ignored that the 9:16 header and footbar are both taller, and clipped the last row.
const FIT_TT = 1120
const TEXT_WIDTH = 830 // card width − side padding − icon column

function fitRows(events, limit, maxScale = 1) {
  // Scales up as well as down: the 9:16 frame has ~475px more room than 4:5, and a list sized
  // for the shorter card leaves a dead zone above the footer.
  const up = [1.45, 1.35, 1.25, 1.15, 1.07].filter((s) => s <= maxScale)
  const scales = [...up, 1, 0.94, 0.88, 0.82, 0.76]
  const estimate = (list, s) =>
    list.reduce((sum, e) => {
      const perLine = Math.max(12, Math.floor(TEXT_WIDTH / (0.52 * 40 * s)))
      const titleLines = Math.max(1, Math.ceil(e.title.length / perLine))
      const locLines = e.loc ? Math.max(1, Math.ceil(e.loc.length / Math.floor(TEXT_WIDTH / (0.5 * 28 * s)))) : 0
      return sum + 30 * s + 5 + titleLines * 40 * s * 1.15 + (locLines ? 6 + locLines * 28 * s * 1.3 : 0) + 44 * s + 3
    }, 0)

  for (const s of scales) if (estimate(events, s) <= limit) return { events, scale: s }
  let list = events.slice()
  while (list.length > 2) {
    list = list.slice(0, -1)
    for (const s of scales) if (estimate(list, s) <= limit) return { events: list, scale: s }
  }
  return { events: list, scale: 0.76 }
}

function weekCard(id, { events: all, more, size = "ig" }) {
  const { events, scale } = fitRows(all, size === "tt" ? FIT_TT : FIT_IG, size === "tt" ? 1.45 : 1)
  const dropped = all.length - events.length
  const px = (n) => Math.round(n * scale)
  const rows = events
    .map(
      (e) => `
    <div class="ev" style="padding:${px(22)}px 0;"><div class="icon" style="font-size:${px(52)}px; width:${px(68)}px;">${e.icon}</div><div><div class="day" style="font-size:${px(30)}px;">${esc(e.day)}</div><div class="ttl" style="font-size:${px(40)}px;">${esc(e.title)}</div>${
      e.loc ? `<div class="loc" style="font-size:${px(28)}px;">${esc(e.loc)}</div>` : ""
    }</div></div>`
    )
    .join("")
  const tail = Number(more || 0) + dropped
  more = tail ? String(tail) : ""
  return `
<div class="card ${size} grain" id="${id}" style="background:var(--cream);">
  <div class="tape" style="top:-16px; left:120px; transform:rotate(-2.5deg);"></div>
  <div class="tape" style="top:-16px; right:120px; transform:rotate(2deg);"></div>
  <div style="padding:${size === "tt" ? "230px" : "64px"} 78px 0;">
    <div class="serif" style="color:var(--green); font-size:${size === "tt" ? 52 : 42}px;">what's on</div>
    <div style="color:var(--ink); font-size:${size === "tt" ? 104 : 84}px; font-weight:800; line-height:1.02; margin-top:8px;">This week<br>in Lompoc.</div>
  </div>
  <div style="padding:30px 78px 0;">${rows}</div>
  <div class="footbar" style="height:${size === "tt" ? 180 : 130}px;">
    <div style="text-align:left;">
      ${more ? `<div style="color:#f3e6f6; font-size:26px; font-weight:600;">+${more} more on the calendar</div>` : ""}
      <div class="u">lompoclocals.com</div>
    </div>
  </div>
</div>`
}

/**
 * The run-down card: four photographs, four names, one number.
 *
 * A different shape from the other three on purpose. Spotlights and places are one photo with the
 * type over it, and a run-down that reused that layout would just look like a spotlight of
 * whichever business happened to be first. Here the grid is the point — four real places on one
 * street, or four in one category — so the photos sit in a plain 2×2 and the purple block below
 * carries the count.
 */
function gridCard(id, { eyebrow, count, title, tiles, cta, size = "ig" }) {
  const panel = size === "tt" ? 620 : 470
  const gridH = (size === "tt" ? 1920 : 1350) - panel
  const cells = tiles
    .map(
      (t) => `
      <div style="position:relative; overflow:hidden;">
        ${
          t.photo
            ? `<img class="shot" src="${esc(t.photo)}">`
            : `<div style="position:absolute; inset:0; background:linear-gradient(160deg,#2b0f33,#650C75);"></div>`
        }
        <div style="position:absolute; left:0; right:0; bottom:0; height:52%;
          background:linear-gradient(180deg, rgba(18,10,22,0) 0%, rgba(18,10,22,.86) 100%);"></div>
        <div style="position:absolute; left:26px; right:26px; bottom:22px; color:#fff;
          font-size:31px; font-weight:700; line-height:1.16;">${esc(t.name)}</div>
      </div>`
    )
    .join("")
  // The number leads; the phrase beside it says what's being counted and takes what room is left.
  // "142" next to "North H Street" read as a street address, so the phrase is now a full noun
  // ("businesses on North H Street") and has to wrap without pushing the url off the panel.
  const titleSize = title.length > 26 ? 52 : title.length > 18 ? 60 : 72
  const c = ctaFor(cta)
  return `
<div class="card ${size} grain" id="${id}">
  <div style="position:absolute; top:0; left:0; right:0; height:${gridH}px;
    display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:6px; background:var(--purple);">
    ${cells}
  </div>
  <div style="position:absolute; left:0; right:0; bottom:0; height:${panel}px; background:var(--purple);
    padding:${size === "tt" ? "72px" : "56px"} 78px 0;">
    <div class="serif" style="color:var(--gold); font-size:46px; line-height:1.2;">${esc(eyebrow)}</div>
    <div style="display:flex; align-items:baseline; gap:22px; margin-top:16px;">
      <div style="color:var(--gold); font-size:${size === "tt" ? 132 : 116}px; font-weight:800; line-height:.92;">${esc(count)}</div>
      <div style="color:#fff; font-size:${titleSize}px; font-weight:800; line-height:1.06;">${esc(title)}</div>
    </div>
    <div class="url" style="color:#f3e6f6; font-size:${c.size}px; margin-top:${size === "tt" ? 56 : 40}px; white-space:nowrap;">${esc(c.text)}</div>
  </div>
</div>`
}

/* ---------- build ---------- */

async function main() {
  const rows = parseCsv(fs.readFileSync(CSV, "utf8"))

  // Run-downs name their four businesses in the `subjects` column: their link points at a map or a
  // category page, so unlike a spotlight there's no slug in the URL to look them up by.
  const subjectSlugs = rows.flatMap((r) => (r.subjects || "").split("|").filter(Boolean))
  const bizSlugs = [...new Set([...rows.map((r) => slugFrom(r.link, "biz")), ...subjectSlugs].filter(Boolean))]
  const actSlugs = [...new Set(rows.map((r) => slugFrom(r.link, "activities")).filter(Boolean))]

  const [bizRows, actRows, eventRows] = await Promise.all([
    bizSlugs.length
      ? sql`select b.slug, b.name, b.address, b.photos_json, c.name as category
            from businesses b left join categories c on c.id = b.category_id
            where b.slug = any(${bizSlugs})`
      : [],
    actSlugs.length
      ? sql`select slug, title, address, tips, photos_json from activities where slug = any(${actSlugs})`
      : [],
    sql`select title, location, starts_at from events
        where status='approved' and starts_at between now() - interval '2 days' and now() + interval '60 days'`,
  ])

  const biz = new Map(bizRows.map((r) => [r.slug, r]))
  const act = new Map(actRows.map((r) => [r.slug, r]))
  // Keyed both ways: captions strip the "Rocket Launch:" prefix that the events table keeps.
  const locOf = new Map()
  for (const e of eventRows) {
    const t = e.title.toLowerCase().trim()
    locOf.set(t, e.location)
    locOf.set(t.replace(/^rocket launch:\s*/, ""), e.location)
  }

  const cards = []
  const missing = []

  let slot = -1
  for (const r of rows) {
    const id = null
    if (/^(On the record|Worth the stop|Upcoming launch|Weekend plans|The week ahead|One street|The short list)$/.test(r.series))
      slot++

    if (r.series === "On the record") {
      const slug = slugFrom(r.link, "biz")
      const b = biz.get(slug)
      if (!b) {
        missing.push(`${r.date} spotlight — no business row for "${slug}"`)
        continue
      }
      const photo = firstPhoto(b.photos_json, slug)
      if (!photo) missing.push(`${r.date} spotlight — ${b.name} has no usable photo, card falls back to brand fill`)
      const cardId = `${r.date}-on-the-record`
      for (const size of SIZES) cards.push(
        photoCard(`${cardId}-${size}`, {
          size,
          slot,
          photo,
          // Not the DB category: it has a tattoo studio filed under "Retail", and a card that
          // mislabels a business is worse than one that just says where it is.
          eyebrow: neighbourhoodLabel(b.address),
          title: b.name.replace(/\s+/g, " ").trim(),
          meta: street(b.address) ? esc(street(b.address)) : "",
          cta: `lompoclocals.com/biz/${slug}`,
        })
      )
      setMedia(r, cardId)
      continue
    }

    if (r.series === "Worth the stop") {
      const slug = slugFrom(r.link, "activities")
      const a = act.get(slug)
      if (!a) {
        missing.push(`${r.date} place — no activity row for "${slug}"`)
        continue
      }
      const photo = firstPhoto(a.photos_json, slug)
      if (!photo) missing.push(`${r.date} place — ${a.title} has no usable photo, card falls back to brand fill`)
      const tip = (a.tips || "").split(". ")[0].replace(/\.$/, "")
      const cardId = `${r.date}-worth-the-stop`
      for (const size of SIZES) cards.push(
        photoCard(`${cardId}-${size}`, {
          size,
          slot,
          photo,
          wash: "green",
          eyebrow: "worth the stop —",
          title: a.title.replace(/\s+/g, " ").trim(),
          meta: [nameSuffix(a.title, a.address).replace(/^ — /, ""), tip].filter(Boolean).map(esc).join("<br>"),
          cta: `lompoclocals.com/activities/${slug}`,
        })
      )
      setMedia(r, cardId)
      continue
    }

    if (r.series === "Upcoming launch" || r.series === "Weekend plans") {
      // The caption is the source of truth. A launch weekend reads one way; a weekend with no
      // launch falls back to a free place, and gets the place treatment instead.
      const m = r.text.match(/^(.+?)\n(\w{3}, \w{3} \d+) · Vandenberg Space Force Base$/m)
      if (m) {
        const cardId = `${r.date}-upcoming-launch`
        for (const size of SIZES)
          cards.push(launchCard(`${cardId}-${size}`, { size, slot, name: m[1].trim(), when: m[2].replace(/,/, " ·") }))
        setMedia(r, cardId)
        continue
      }
      const slug = slugFrom(r.link, "activities")
      const a = slug && act.get(slug)
      if (!a) {
        missing.push(`${r.date} free-weekend — caption names no launch and links no activity`)
        continue
      }
      const photo = firstPhoto(a.photos_json, slug)
      if (!photo) missing.push(`${r.date} free-weekend — ${a.title} has no usable photo, card falls back to brand fill`)
      const season = r.text.match(/^([A-Z][^\n]*?)\.$/m)?.[1] || ""
      const cardId = `${r.date}-weekend-plans`
      for (const size of SIZES) cards.push(
        photoCard(`${cardId}-${size}`, {
          size,
          slot,
          photo,
          wash: "ink",
          eyebrow: "this weekend —",
          title: a.title.replace(/\s+/g, " ").trim(),
          meta: [nameSuffix(a.title, a.address).replace(/^ — /, ""), season].filter(Boolean).map(esc).join("<br>"),
          cta: `lompoclocals.com/activities/${slug}`,
        })
      )
      setMedia(r, cardId)
      continue
    }

    if (r.series === "One street" || r.series === "The short list") {
      const byStreet = r.series === "One street"
      const slugs = (r.subjects || "").split("|").filter(Boolean)
      const tiles = slugs
        .map((s) => {
          const b = biz.get(s)
          if (!b) {
            missing.push(`${r.date} ${r.series} — no business row for "${s}"`)
            return null
          }
          const photo = firstPhoto(b.photos_json, s)
          if (!photo) missing.push(`${r.date} ${r.series} — ${b.name} has no usable photo`)
          return { name: b.name.replace(/\s+/g, " ").trim(), photo }
        })
        .filter(Boolean)
      // Four tiles or none. A 2×2 grid with a hole in it reads as a broken image, and the caption
      // has already named four businesses by the time anyone sees the card.
      if (tiles.length < 4) {
        missing.push(`${r.date} ${r.series} — only ${tiles.length} of 4 subjects resolved, card skipped`)
        continue
      }
      const cardId = `${r.date}-${byStreet ? "one-street" : "short-list"}`
      for (const size of SIZES) cards.push(
        gridCard(`${cardId}-${size}`, {
          size,
          eyebrow: byStreet ? "one street —" : "the short list —",
          count: r.count,
          title: r.headline,
          tiles,
          cta: r.link.replace(/^https?:\/\/www\./, "").replace("/en/", "/"),
        })
      )
      setMedia(r, cardId)
      continue
    }

    if (r.series === "The week ahead") {
      const lines = [...r.text.matchAll(/^(\S+) (\w{3}, \w{3} \d+) — (.+)$/gm)].map(([, icon, day, title]) => ({
        icon,
        day: day.replace(/,/, " ·"),
        title: title.trim(),
        loc: tidyLoc(locOf.get(title.trim().toLowerCase()) || ""),
      }))
      if (!lines.length) {
        missing.push(`${r.date} week-ahead — no event lines found in the caption`)
        continue
      }
      const more = r.text.match(/Plus (\d+) more/)?.[1] || ""
      const cardId = `${r.date}-this-week`
      for (const size of SIZES) cards.push(weekCard(`${cardId}-${size}`, { size, events: lines, more }))
      setMedia(r, cardId)
      continue
    }
    void id
  }

  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,700;0,800;1,600&display=swap" rel="stylesheet">
<style>${GRAIN_CSS}</style></head><body>
<!-- Generated by scripts/build-social-cards.mjs from ${path.basename(CSV)}. Do not hand-edit; regenerate. -->
${cards.join("\n")}
</body></html>
`
  fs.writeFileSync(OUT_HTML, html)

  if (WRITE_CSV) {
    // Must match the calendar builder's header, or a rewrite here silently drops the run-down
    // columns and the next card build has nothing to look its four businesses up by.
    const header = [
      "date",
      "time",
      "channels",
      "series",
      "text",
      "link",
      "media",
      "media_vertical",
      "subjects",
      "headline",
      "count",
    ]
    const out = [header.join(","), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(","))].join("\n")
    fs.writeFileSync(CSV, out + "\n")
  }

  console.log(`${cards.length} cards → ${OUT_HTML}`)
  const bySeries = rows.reduce((m, r) => ((m[r.series] = (m[r.series] || 0) + 1), m), {})
  for (const [k, v] of Object.entries(bySeries)) console.log(`  ${String(v).padStart(2)} × ${k}`)
  if (WRITE_CSV) console.log(`media column rewritten in ${CSV}`)
  if (missing.length) {
    console.log(`\n${missing.length} thing(s) to look at:`)
    for (const m of missing) console.log(`  ! ${m}`)
  }
  console.log(`\nNext: node scripts/render-social-cards.mjs ${OUT_HTML} ${IMG_DIR}`)
}

main().then(() => process.exit(0))
