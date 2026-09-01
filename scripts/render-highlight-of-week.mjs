#!/usr/bin/env node
/**
 * HIGHLIGHT OF THE WEEK — a recurring, graphics-forward slot for a business that just joined.
 *
 * The plain highlight (scripts/render-business-highlight.mjs) is a one-off portrait of a member.
 * This is a *series*: the same lockup, the same six beats, the same gold seam between them, every
 * week, on whichever slug is handed to it. Two jobs at once — content for the feed, and something
 * the owner will want to repost.
 *
 * What it takes from the plain highlight, and what it changes
 * ----------------------------------------------------------
 * Kept: photos are downloaded once and served same-origin (a tainted canvas can't toBlob), the
 * crop centres on measured edge energy, frames are painted on a step loop and POSTed as JPEG
 * because headless Chrome gives back empty MediaRecorder video and never fires rAF, and the
 * derived-rectangle trick — a member's photo set is usually one room shot five ways, so beats are
 * cut from sub-rectangles of the photos rather than from the whole frames.
 *
 * Changed, and this is the reason for a second script: the rectangles are no longer hand-written.
 * A weekly slot can't wait on somebody looking at seven photographs and typing four crop configs,
 * so pickRects() finds them — it reads a 160x160 grey map of each photo out of ffmpeg, builds an
 * edge-energy integral image, slides a 3:4 window over it at three scales, and keeps the densest
 * non-overlapping windows. A shelf of trophies and an empty shop floor score an order of magnitude
 * apart, so the picks land on the things worth showing. Nothing about the piece is per-business.
 *
 * What that scorer cannot do, and this was measured rather than assumed: tell a shop from a car
 * park. On Vargas the highest-energy rectangle in the cover photograph is the glass storefront —
 * mullions and reflections carry more detail than the room does, and energy, uniformity, blown
 * highlights and colourfulness all rank it first. So the opening beat doesn't ask. It shows the
 * cover photograph WHOLE, as a plate over a blurred blow-up of itself: nothing sliced, nothing
 * chosen, and a better establishing shot than any crop would have been. The crops do the middle of
 * the piece, where the picture is a texture behind a headline and a wrong guess costs little.
 *
 * Everything printed comes out of the row at render time. The membership line is derived, not
 * assumed: plan_override gives Growth/Plus, and "new this week" is only said when the owner
 * account (or, for a page we listed ourselves, the row) is genuinely days old.
 *
 * Usage:
 *   node scripts/render-highlight-of-week.mjs vargas-jewelers-trophies-awards
 *   node scripts/render-highlight-of-week.mjs <slug> --only=tt --week=2026-07-27
 *   node scripts/render-highlight-of-week.mjs <slug> --series=week     (the dated weekly slot)
 *   default --series=spotlight: "MEMBER SPOTLIGHT", undated, with the member's logo
 */
import http from "node:http"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn, spawnSync } from "node:child_process"
import ffmpegPath from "ffmpeg-static"
import { neon } from "@neondatabase/serverless"
import { buildBed } from "./lib/music-bed.mjs"
import { assertNoPriceFraming, detailSentence, neighbourhood, streetLine } from "./lib/voice.mjs"

const FPS = 30
const VIDEO_DIR = "content/social/video"
const REPO = process.cwd()
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const SHAPES = {
  ig: { w: 1080, h: 1350, suffix: "4x5" },
  tt: { w: 1080, h: 1920, suffix: "9x16" },
}

const SLUG = process.argv[2]
if (!SLUG || SLUG.startsWith("--")) {
  console.error("usage: node scripts/render-highlight-of-week.mjs <business-slug> [--only=ig,tt] [--week=YYYY-MM-DD]")
  process.exit(1)
}
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").slice(k.length + 3)
const ONLY = arg("only").split(",").filter(Boolean)
const WEEK_ARG = arg("week")

/**
 * Two series share one film. "spotlight" (default) is the standing Member Spotlight — no week
 * stamp, nothing that says "this week", so several can run in one week. "week" is the original
 * Highlight of the Week slot, kept for when a single weekly pick is wanted.
 */
const SERIES_BY_KEY = {
  week: { key: "highlight-of-week", label: "HIGHLIGHT OF THE WEEK", big: "HIGHLIGHT", small: "OF THE WEEK",
      stamp: true, welcomeNew: "New this week on Lompoc Locals.", welcomeOld: "Now on Lompoc Locals.",
      eyebrowNew: "NEW THIS WEEK", eyebrowOld: "THIS WEEK'S HIGHLIGHT" },
  spotlight: { key: "member-spotlight", label: "MEMBER SPOTLIGHT", big: "MEMBER", small: "SPOTLIGHT",
      stamp: false, welcomeNew: "New on Lompoc Locals.", welcomeOld: "Now on Lompoc Locals.",
      eyebrowNew: "NEW MEMBER", eyebrowOld: "ON LOMPOC LOCALS" },
  // Non-members get the same film without the member claim — "MEMBER" never
  // appears for a business that is not paying ([[member-spotlight-format]]).
  lompoc: { key: "lompoc-spotlight", label: "LOMPOC SPOTLIGHT", big: "LOMPOC", small: "SPOTLIGHT",
      stamp: false, welcomeNew: "Now on Lompoc Locals.", welcomeOld: "Now on Lompoc Locals.",
      eyebrowNew: "ON LOMPOC LOCALS", eyebrowOld: "ON LOMPOC LOCALS" },
}
const SERIES = SERIES_BY_KEY[arg("series") || "spotlight"] ?? SERIES_BY_KEY.spotlight

const dbUrl = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(dbUrl)

/** The member's own logo, when the row has one — it signs the end card and the info panel. */
async function cacheLogo(url, dir) {
  if (!url || !/^https?:\/\//.test(url)) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 500) return null
    const ext = /\.svg/i.test(url) ? "svg" : /\.png/i.test(url) ? "png" : "jpg"
    fs.writeFileSync(path.join(dir, `logo.${ext}`), buf)
    return `logo.${ext}`
  } catch { return null }
}

/* ------------------------------------------------------------------ *
 * The row
 * ------------------------------------------------------------------ */

const photoUrl = (p) => {
  const u = typeof p === "string" ? p : p?.url || p?.src
  return u && /^https?:\/\//.test(u) ? u : null
}

/**
 * Seed and scraper accounts own most of the directory. A page they own is a page we listed, not a
 * page an owner claimed — and the difference is the whole emotional point of this series, so it is
 * read off the owner's email domain rather than assumed from owner_user_id being non-null.
 */
const INTERNAL_OWNER = /@[\w.-]+\.(system|test|internal|local)$/i

const PLAN_LABEL = { premium: "PLUS MEMBER", standard: "GROWTH MEMBER" }

async function loadBusiness(slug) {
  const [row] = await sql`
    select b.id, b.name, b.slug, b.address, b.about, b.hours_json, b.photos_json, b.status,
           b.plan_override, b.owner_user_id, b.created_at, b.cover_url, b.logo_url,
           c.name as category,
           u.email as owner_email, u.created_at as owner_created_at
    from businesses b
    left join categories c on c.id = b.category_id
    left join users u on u.id = b.owner_user_id
    where b.slug = ${slug}`
  if (!row) throw new Error(`no business with slug "${slug}"`)
  if (row.status !== "approved") throw new Error(`${slug} is ${row.status}, not approved`)
  const photos = (row.photos_json || []).map(photoUrl).filter(Boolean)
  if (!photos.length) throw new Error(`${slug} has no usable photos`)

  const claimed = !!row.owner_email && !INTERNAL_OWNER.test(row.owner_email)
  // When an owner claimed the page, the day they made their account is the day the business
  // joined. When we listed it ourselves, the row's own birthday is the honest answer.
  const joined = new Date(claimed ? row.owner_created_at : row.created_at)
  const days = Math.floor((Date.now() - joined.getTime()) / 86400000)

  return { ...row, photos, claimed, joined, daysSinceJoin: days }
}

/** Downloads each photo once so the player can load them same-origin. */
async function cachePhotos(urls, dir) {
  fs.mkdirSync(dir, { recursive: true })
  const kept = []
  await Promise.all(
    urls.map(async (u, i) => {
      try {
        const res = await fetch(u)
        if (!res.ok) return
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 2000) return
        fs.writeFileSync(path.join(dir, `p${i}.jpg`), buf)
        kept[i] = `p${i}.jpg`
      } catch {
        /* a dead photo url is one fewer beat, not a failed render */
      }
    })
  )
  return kept
}

/* ------------------------------------------------------------------ *
 * Derived rectangles, found rather than written
 * ------------------------------------------------------------------ */

function probeSize(file) {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-i", file], { encoding: "utf8" })
  const m = r.stderr.match(/Stream #.*?Video:.*?,\s(\d+)x(\d+)/)
  return m ? { w: +m[1], h: +m[2] } : null
}

/** A square grey thumbnail of a photo, straight out of ffmpeg as raw bytes. */
function greyMap(file, N) {
  const r = spawnSync(
    ffmpegPath,
    ["-v", "error", "-i", file, "-vf", `scale=${N}:${N},format=gray`,
     "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
    { maxBuffer: 1 << 26 }
  )
  return r.stdout && r.stdout.length >= N * N ? r.stdout : null
}

const GRID = 160
const CROP_AR = 0.75 // 3:4 — covers cleanly into both 9:16 (keeps 75% of width) and 4:5 (94% of height)

/** An integral image over a GRID x GRID map, and the box-sum that reads it. */
function integral(map) {
  const S = new Float64Array((GRID + 1) * (GRID + 1))
  for (let y = 0; y < GRID; y++) {
    let run = 0
    for (let x = 0; x < GRID; x++) {
      run += map[y * GRID + x]
      S[(y + 1) * (GRID + 1) + x + 1] = S[y * (GRID + 1) + x + 1] + run
    }
  }
  return (x0, y0, x1, y1) =>
    S[y1 * (GRID + 1) + x1] - S[y0 * (GRID + 1) + x1] - S[y1 * (GRID + 1) + x0] + S[y0 * (GRID + 1) + x0]
}

/**
 * The best non-overlapping 3:4 windows in a photograph.
 *
 * Edge energy stands in for subject, the same assumption the plain highlight's focal-point finder
 * makes: a rail of chains or a shelf of trophies carries dense detail, an empty floor carries
 * almost none. Windows are scored on MEAN energy so sizes compare, then three corrections that
 * were each put in after looking at what the score picked without them:
 *
 *   • size — a mild pull toward the largest window, because these are rectangles cut out of a
 *     1600px photo and every step down in size is a step up in visible upscaling;
 *   • blown highlights — a crop that is a third clipped to white is a crop of a window, and the
 *     fraction that is clipped is what it loses;
 *   • centre — a soft horizontal pull toward the middle of the frame. What a photographer pointed
 *     the camera at is in the middle; the left and right edges are doorframes and walls. Soft
 *     enough that a genuinely better edge crop still wins.
 *
 * None of the three is load-bearing for the opening beat — see the note at the top of the file.
 */
function analysePhoto(file, want) {
  const size = probeSize(file)
  const grey = size && greyMap(file, GRID)
  if (!size || !grey) return { graphic: false, rects: [] }

  const E = new Float64Array(GRID * GRID)
  const B = new Float64Array(GRID * GRID)
  let flat = 0
  for (let y = 0; y < GRID - 1; y++) {
    for (let x = 0; x < GRID - 1; x++) {
      const i = y * GRID + x
      const e = Math.abs(grey[i] - grey[i + 1]) + Math.abs(grey[i] - grey[i + GRID])
      E[i] = e * e
      B[i] = grey[i] > 244 ? 1 : 0
      if (e <= 1) flat++
    }
  }

  // Some members have no photographs at all and carry a rendered logo card instead — the platform
  // makes one for service-area businesses, and Terrones Plumbing is the template. Cropping a card
  // slices the wordmark, which is the one thing on it, so cards are found and never cropped.
  // The test is the fraction of the picture that is perfectly flat: a rendered card is three
  // quarters flat fill, a photograph is a twentieth (measured across the directory, cards land
  // around 0.78 and photographs between 0.05 and 0.15).
  const flatFrac = flat / ((GRID - 1) * (GRID - 1))
  if (flatFrac > 0.45) return { graphic: true, rects: [] }

  const box = integral(E)
  const blown = integral(B)
  const photoMean = box(0, 0, GRID, GRID) / (GRID * GRID)
  if (!photoMean) return { graphic: false, rects: [] }

  const hMax = Math.min(size.h, size.w / CROP_AR)
  const cand = []
  for (const s of [1.0, 0.84, 0.7]) {
    const h = Math.round(hMax * s)
    const w = Math.round(h * CROP_AR)
    if (w > size.w || h > size.h || w < 240) continue
    const stepX = Math.max(8, Math.round((size.w - w) / 12)) || size.w
    const stepY = Math.max(8, Math.round((size.h - h) / 8)) || size.h
    for (let y = 0; y + h <= size.h; y += stepY) {
      for (let x = 0; x + w <= size.w; x += stepX) {
        const gx0 = Math.round((x / size.w) * GRID)
        const gy0 = Math.round((y / size.h) * GRID)
        const gx1 = Math.max(gx0 + 1, Math.round(((x + w) / size.w) * GRID))
        const gy1 = Math.max(gy0 + 1, Math.round(((y + h) / size.h) * GRID))
        const cells = (gx1 - gx0) * (gy1 - gy0)
        const mean = box(gx0, gy0, gx1, gy1) / cells
        if (mean < photoMean * 0.45) continue
        const blowFrac = blown(gx0, gy0, gx1, gy1) / cells
        const off = Math.abs(x + w / 2 - size.w / 2) / (size.w / 2)
        const score =
          mean *
          (0.62 + 0.38 * s * s) *
          (1 - 0.62 * Math.min(1, blowFrac / 0.30)) *
          (1 - 0.30 * off * off)
        if (score <= 0) continue
        cand.push({ rect: [x, y, w, h], score, mean })
      }
      if (size.h - h < stepY) break
    }
  }
  cand.sort((a, b) => b.score - a.score)

  const iou = (a, b) => {
    const ix = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]))
    const iy = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]))
    const inter = ix * iy
    return inter / (a[2] * a[3] + b[2] * b[3] - inter)
  }
  const kept = []
  for (const c of cand) {
    if (kept.length >= want) break
    if (kept.every((k) => iou(k.rect, c.rect) < 0.28)) kept.push(c)
  }
  return { graphic: false, rects: kept }
}

/** Cuts one rectangle out with ffmpeg. */
function cutRect(dir, src, dest, [x, y, w, h]) {
  const r = spawnSync(
    ffmpegPath,
    ["-y", "-v", "error", "-i", path.join(dir, src), "-vf", `crop=${w}:${h}:${x}:${y}`, "-q:v", "2",
     path.join(dir, dest)],
    { encoding: "utf8" }
  )
  if (r.status !== 0) throw new Error(`crop ${dest} failed: ${r.stderr}`)
}

/**
 * Two rectangles per photograph, then interleaved so consecutive beats come from different
 * photographs where there are different photographs to come from. A business with one usable
 * photo still gets three distinct beats out of it; a business with eight gets its best eight.
 */
function deriveCrops(files, dir, graphic) {
  const perPhoto = []
  files.forEach((f, i) => {
    if (!f) return
    const { graphic: isCard, rects } = analysePhoto(path.join(dir, f), 2)
    if (isCard) graphic.add(i)
    for (const c of rects) perPhoto.push({ ...c, from: i })
  })
  perPhoto.sort((a, b) => b.score - a.score)

  const out = []
  const used = new Set()
  const pool = [...perPhoto]
  while (pool.length) {
    let k = pool.findIndex((c) => !used.has(c.from))
    if (k < 0) { k = 0; used.clear() }
    const c = pool.splice(k, 1)[0]
    used.add(c.from)
    out.push(c)
  }

  return out.map((c, i) => {
    const dest = `crop-${i}.jpg`
    cutRect(dir, files[c.from], dest, c.rect)
    return { ...c, file: dest }
  })
}

/* ------------------------------------------------------------------ *
 * What the beats say
 * ------------------------------------------------------------------ */

const DAYS = [
  ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"],
  ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"],
]

const clock = (t) => {
  const [h, m] = String(t).split(":").map(Number)
  if (!Number.isFinite(h)) return null
  const ap = h >= 12 ? "pm" : "am"
  const hh = h % 12 === 0 ? 12 : h % 12
  return m ? `${hh}:${String(m).padStart(2, "0")}${ap}` : `${hh}${ap}`
}

/**
 * Opening hours in one line: consecutive days sharing a time become a range, everything else is
 * listed, and the shut days are named at the end. Only an unbroken run is ever described as a
 * range — a shop open Mon–Wed and Fri advertised as "Mon–Fri" is a closed door on a Thursday for
 * somebody who drove across town.
 */
function hoursCompact(hours) {
  if (!hours || typeof hours !== "object") return null
  const slots = DAYS.map(([k, label]) => {
    const v = hours[k]
    return v?.open && v?.close ? { label, key: `${v.open}-${v.close}`, text: `${clock(v.open)}–${clock(v.close)}` } : { label, key: null }
  })
  if (!slots.some((s) => s.key)) return null

  const parts = []
  const shut = []
  let i = 0
  while (i < slots.length) {
    if (!slots[i].key) { shut.push(slots[i].label); i++; continue }
    let j = i
    while (j + 1 < slots.length && slots[j + 1].key === slots[i].key) j++
    parts.push(`${i === j ? slots[i].label : `${slots[i].label}–${slots[j].label}`} ${slots[i].text}`)
    i = j + 1
  }
  if (shut.length && shut.length < 4) parts.push(`Closed ${shut.join(", ")}`)
  return parts.join("  ·  ")
}

const TOWN_LABEL = {
  "old-town": "Old Town Lompoc",
  "north-h": "North H Street, Lompoc",
  central: "Central Avenue, Lompoc",
  east: "East side, Lompoc",
  village: "Vandenberg Village",
  grid: "Lompoc, California",
}
/** Which part of town, for the strap and the band label. Address-less members are service-area
 *  members, and the service area is the two places this platform covers. */
const placeLabel = (address) =>
  streetLine(address) ? TOWN_LABEL[neighbourhood(address)] || "Lompoc, California" : "Lompoc & Vandenberg"

/**
 * City and state off the row's own address line, for the WHERE row.
 *
 * The neighbourhood label can't be used there: "640 N H St" set against "North H Street, Lompoc"
 * printed the street twice in one line.
 */
function cityLine(address) {
  const parts = String(address || "").split(",").map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) return `${parts[1]}, ${parts[2].replace(/\s*\d{5}(-\d{4})?$/, "").trim()}`
  if (parts.length === 2) return parts[1].replace(/\s*\d{5}(-\d{4})?$/, "").trim()
  return "Lompoc, CA"
}

// Abbreviations that end in a period without ending a sentence. Same list voice.mjs guards its own
// first-sentence split with; "Sta. Rita Hills" is the one that bites.
const ABBREV = /\b(?:Sta|St|Ave|Blvd|Rd|Dr|Ste|Hwy|Mt|Inc|Co|Corp|Ltd|Jr|Sr|vs|etc|approx|No)\.$/i
function sentences(text) {
  const out = []
  let cur = ""
  for (const p of String(text || "").split(/(?<=[.!?])\s+/)) {
    cur = cur ? `${cur} ${p}` : p
    if (!ABBREV.test(cur.trim())) { out.push(cur.trim()); cur = "" }
  }
  if (cur.trim()) out.push(cur.trim())
  return out.filter(Boolean)
}

/**
 * What the business does, in its own about text.
 *
 * detailSentence() gives the first sentence with the name and the street address taken out — which
 * for a lot of rows is four words ("A full-service jewelry store."). When it lands that short the
 * second sentence is put through the same stripper and appended, because the second sentence is
 * usually where the specifics live. Nothing is written here; both halves are the member's own copy.
 */
const STREET_ADDRESS = /\b\d{2,5}\s+(?:[NSEW]\.?\s+)?[\w'-]+(?:\s+[\w'-]+)?\s+(?:St|Ave|Rd|Blvd|Dr|Way|Ln|Ct|Hwy|Street|Avenue|Road)\b/i

// detailSentence() takes the business name off the front of the sentence, which is right when what
// follows is a noun phrase ("A full-service jewelry store.") and wrong when what follows is the
// verb ("Has been Lompoc's one-stop shop for flooring…"). When it lands on a verb the name goes
// back in — the sentence is then the member's own, unedited.
const DANGLING_VERB =
  /^(?:Has|Have|Had|Is|Are|Was|Were|Serves?|Offers?|Specializes?|Provides?|Brings?|Blends?|Carries|Sells?|Runs?|Makes?|Opened|Founded|Builds?|Handles?)\b/

function aboutLine(name, about) {
  let first = detailSentence(name, about)
  // A name that can't match anything: detailSentence then strips the address clause and leaves the
  // business name where the member wrote it.
  if (first && DANGLING_VERB.test(first)) first = detailSentence(" ", sentences(about)[0] || "") || first
  if (!first || first.length >= 62) return first

  // The second sentence is quoted, not rewritten. detailSentence() is built for sentence one — it
  // strips a leading business name, and on a sentence that doesn't have one it ate a comma out of
  // a list ("silver jewelry estate pieces"). So this only trims: the trailing aside after an em
  // dash goes, and a sentence carrying a street address is skipped rather than edited, because the
  // beat before it already put the address on screen.
  let second = sentences(String(about || "").split(/\n\s*\n/)[0])[1]
  if (!second || STREET_ADDRESS.test(second)) return first
  const dash = second.search(/\s+[—–]\s+/)
  if (dash > 40) second = `${second.slice(0, dash).replace(/[,\s]+$/, "")}.`
  if (second.length < 30 || second.length > 130) return first
  if (!/[.!?]$/.test(second)) second += "."
  return `${first} ${second}`
}

/** Monday of the week being published, as a stamp. */
function weekStamp(iso) {
  const d = iso ? new Date(`${iso}T12:00:00`) : new Date()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `WEEK OF ${monday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}`
}

/**
 * The six beats. Same shape every week — that repetition is the series — with the words coming out
 * of the row and a beat dropping quietly when the row can't support it.
 *
 * Pool indices 0 and 1 are two whole pictures for the plates; the crops start at 2.
 *
 * Why the first two picture beats are plates and only the third is a full-bleed crop: on a 9:16
 * frame a full-bleed crop of a 16:9 photograph throws away about two thirds of its width, and
 * whether that is fine or fatal depends entirely on what the photograph is of. A shop interior
 * survives it. A photograph of the member's own sign does not — Oliveira's name beat came back
 * reading "eira … Restora" in letters a foot tall. Since nothing in the file can tell those two
 * cases apart, the beats that carry the business's identity show a picture whole, and the one beat
 * that crops is the one where the picture is a texture under a heavy scrim and four lines of copy.
 */
function buildBeats(biz, nCrops, nBands) {
  const detail = aboutLine(biz.name, biz.about)
  const beats = [
    { kind: "hero", bg: "purple", photo: 0, dur: nCrops ? 3.4 : 3.6 },
    { kind: "name", bg: "purple", photo: 1, plate: true, dur: nCrops ? 3.2 : 3.4 },
  ]
  // A member with nothing but a rendered logo card has no rectangles at all, so the copy beat
  // becomes a flat field — and the beats run a little longer, because there are fewer of them.
  if (detail) {
    beats.push(nCrops
      ? { kind: "line", bg: "purple", photo: 2, head: detail, dur: 3.5 }
      : { kind: "line", bg: "purple", flat: true, head: detail, dur: 3.6 })
  }
  if (nBands) beats.push({ kind: "bands", bg: "purple", dur: 2.8 })
  beats.push({ kind: "panel", bg: "cream", dur: nCrops ? 3.6 : 3.8 })
  beats.push({ kind: "end", bg: "purple", dur: nCrops ? 3.5 : 3.6 })
  return beats
}

/** I–V–vi–IV–V–I in A major: it opens on the tonic, travels, and cadences home over the end frame. */
const PROGRESSION = ["A", "E", "F#m", "D", "E", "A"]
const chordFor = (i, n) => (i === n - 1 ? "A" : PROGRESSION[i % (PROGRESSION.length - 1)])

/* ------------------------------------------------------------------ *
 * The player
 * ------------------------------------------------------------------ */

const PLAYER = (W, H, spec) => /* html */ `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#650C75;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS};
const spec = ${JSON.stringify(spec)};
const cv = document.getElementById('c');
const OFF = document.createElement('canvas'); OFF.width=W; OFF.height=H;
// g is reassigned for a moment at every seam so the outgoing frame can wipe to a real painting of
// the incoming beat rather than to a flat colour. Every paint routine reads it by closure.
let g = cv.getContext('2d');
const OFFG = OFF.getContext('2d');

const CREAM='#FAF5EC', INK='#241629', PURPLE='#650C75', GOLD='#EFC618', GREEN='#0B992F';
const C = {cream:CREAM, ink:INK, purple:PURPLE, gold:GOLD, green:GREEN, white:'#ffffff'};

const easeOut   = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
const clamp01   = t => t < 0 ? 0 : t > 1 ? 1 : t;
const lerp = (a,b,t) => a + (b-a)*t;

const TALL = H > W * 1.5;
const PAD = Math.round(W * 0.082);
const LINE_HEIGHT = 1.06;
const GRAIN_ALPHA = 0.03;
const MARK_ASPECT = 314 / 402;
// TikTok and Reels paint their caption, handle and button rail over the bottom of a 9:16 frame.
// Nothing that has to be read lives down there.
const SAFE_BOTTOM = TALL ? Math.round(H * 0.175) : Math.round(H * 0.072);
const TOP = TALL ? Math.round(H * 0.052) : Math.round(H * 0.042);

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

let MARK_W, LOGO = null, PHOTOS = [], BANDS = [], FOCUS = [], GRAIN;

/** The member's logo on a white plate, contained, never stretched. Returns the plate height. */
function logoPlate(cx,y,maxH,maxW,alpha){
  if(!LOGO||alpha<=0.01) return 0;
  const pad=Math.round(W*0.022);
  const ar=LOGO.naturalWidth/LOGO.naturalHeight;
  let h=maxH, w=h*ar;
  if(w>maxW-pad*2){ w=maxW-pad*2; h=w/ar; }
  const pw=Math.round(w+pad*2), ph=Math.round(h+pad*2);
  g.save(); g.globalAlpha=alpha;
  g.fillStyle='#FFFFFF'; roundRect(Math.round(cx-pw/2),y,pw,ph,Math.round(W*0.018)); g.fill();
  g.drawImage(LOGO,Math.round(cx-w/2),y+pad,Math.round(w),Math.round(h));
  g.restore();
  return ph;
}

function makeGrain(){
  const o=document.createElement('canvas'); o.width=260; o.height=260;
  const x=o.getContext('2d'), d=x.createImageData(260,260);
  for(let i=0;i<d.data.length;i+=4){
    const v=120+Math.random()*135;
    d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255;
  }
  x.putImageData(d,0,0); return o;
}
function grain(alpha){
  g.save(); g.globalAlpha=alpha; g.globalCompositeOperation='overlay';
  for(let y=0;y<H;y+=260) for(let x=0;x<W;x+=260) g.drawImage(GRAIN,x,y);
  g.restore();
}

/** object-fit: cover, centred on (fx,fy) of the source, never past an edge. */
function coverAt(img,x,y,w,h,fx,fy){
  if(!img) return;
  const s=Math.max(w/img.width,h/img.height);
  const dw=img.width*s, dh=img.height*s;
  const dx=Math.min(x, Math.max(x+w-dw, x+w/2-fx*dw));
  const dy=Math.min(y, Math.max(y+h-dh, y+h/2-fy*dh));
  g.drawImage(img,dx,dy,dw,dh);
}

/**
 * Where the subject of a photograph is. Edge energy stands in for subject; the centroid of it,
 * pulled most of the way back to the middle so one busy corner can't yank the frame, is what a
 * full-bleed crop centres on. Cheap by design — 72px wide, once per picture at load.
 */
function focusOf(img){
  if(!img || !img.width) return {fx:0.5,fy:0.5};
  const w=72, h=Math.max(8,Math.round(72*img.height/img.width));
  const o=document.createElement('canvas'); o.width=w; o.height=h;
  const x=o.getContext('2d',{willReadFrequently:true});
  x.drawImage(img,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data;
  const lum=i=>0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
  let sx=0, sy=0, tot=0;
  for(let j=1;j<h-1;j++) for(let i=1;i<w-1;i++){
    const c=j*w+i;
    const e=Math.abs(lum(c)-lum(c+1))+Math.abs(lum(c)-lum(c+w));
    const wt=e*e;
    sx+=wt*(i+0.5); sy+=wt*(j+0.5); tot+=wt;
  }
  if(!tot) return {fx:0.5,fy:0.5};
  return { fx: lerp(0.5, sx/tot/w, 0.55), fy: lerp(0.5, sy/tot/h, 0.55) };
}

/* ---------- type ---------- */

function wrapWords(words,font,maxW){
  g.font=font;
  const lines=[[]];
  for(const w of words){
    const test=[...lines[lines.length-1],w].join(' ');
    if(g.measureText(test).width>maxW && lines[lines.length-1].length) lines.push([w]);
    else lines[lines.length-1].push(w);
  }
  return lines;
}
const font = (weight,size) => weight+' '+size+'px "Plus Jakarta Sans", sans-serif';

/** The biggest size at or under max whose wrap still fits in maxLines. Long names shrink; short
 *  names stay big. Nothing here has to be checked by a person before it ships. */
function fitBlock(text,{max,min,weight,maxW,maxLines}){
  for(let s=max;s>=min;s-=2){
    if(wrapWords(text.split(' '),font(weight,s),maxW).length<=maxLines) return s;
  }
  return min;
}
/** One line, shrunk until it fits. A wrapped url reads as broken. */
function fitLine(text,{max,min,weight,maxW}){
  for(let s=max;s>=min;s-=2){
    g.font=font(weight,s);
    if(g.measureText(text).width<=maxW) return s;
  }
  return min;
}
/** The size at which every word in a block fits the column. A page url is one unbreakable word:
 *  no wrap can rescue it, so it is shrunk instead. */
function fitWord(text,{max,min,weight,maxW}){
  const words=text.split(' ');
  for(let s=max;s>=min;s-=2){
    g.font=font(weight,s);
    if(words.every(w=>g.measureText(w).width<=maxW)) return s;
  }
  return min;
}
/** The same, for a letterspaced line — tracking has to be in the measurement or a long street
 *  name runs off the frame. */
function fitTracked(text,{max,min,weight,maxW,trackRatio}){
  for(let s=max;s>=min;s-=2){
    g.font=font(weight,s);
    const track=Math.round(s*trackRatio);
    if(trackedW(text,track)<=maxW) return {size:s,track};
  }
  g.font=font(weight,min);
  return {size:min,track:Math.round(min*trackRatio)};
}

// Letterspaced caps are the series' one typographic signature, so they are drawn glyph by glyph
// rather than trusting ctx.letterSpacing — measurement has to be exact for the pills and rules.
function trackedW(text,track){
  let w=0; for(const ch of text) w += g.measureText(ch).width + track;
  return Math.max(0, w - track);
}
function drawTracked(text,x,y,track){
  let cx=x; for(const ch of text){ g.fillText(ch,cx,y); cx += g.measureText(ch).width + track }
}

/** Lines fade up into place, one after another, always in their final colour — a ghosted preview
 *  of the finished headline reads as a rendering fault. */
function reveal(text,{y,size,weight,colour,maxW,x,p,stagger,align}){
  const f=font(weight,size);
  const lines=wrapWords(text.split(' '),f,maxW);
  g.font=f; g.textBaseline='alphabetic'; g.textAlign='left';
  const lh=size*LINE_HEIGHT;
  let yy=y;
  lines.forEach((line,i)=>{
    const t=clamp01((p - i*stagger)/0.26);
    if(t>0){
      const str=line.join(' ');
      const xx = align==='center' ? x-g.measureText(str).width/2 : x;
      g.save();
      g.globalAlpha=easeOut(t);
      g.fillStyle=colour;
      g.fillText(str,xx,yy+(1-easeOut(t))*size*0.16);
      g.restore();
    }
    yy+=lh;
  });
  return yy-y;
}
const blockH = (text,size,maxW,weight) =>
  wrapWords(text.split(' '),font(weight||'800',size),maxW).length*size*LINE_HEIGHT;

function roundRect(x,y,w,h,r){
  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}

/* ---------- the series identity ---------- */

/**
 * The bug: a solid gold pill with the series name in purple caps, top left, on every beat but the
 * end frame. Solid rather than outlined because it has to survive being laid over a photograph and
 * then shrunk to the size of a feed thumbnail — an outline at that size is a smudge.
 */
function bug(alpha){
  if(alpha<=0.01) return;
  const size=Math.round(W*0.026), track=Math.round(W*0.0075);
  g.save(); g.globalAlpha=alpha;
  g.font=font('800',size); g.textBaseline='alphabetic';
  const tw=trackedW(spec.series.label,track);
  const px=Math.round(W*0.030), h=Math.round(size*2.15);
  g.fillStyle=GOLD; roundRect(PAD,TOP,tw+px*2,h,h/2); g.fill();
  g.fillStyle=PURPLE; drawTracked(spec.series.label,PAD+px,TOP+h/2+size*0.36,track);
  g.restore();
  return TOP+h;
}

/**
 * The full lockup, first beat only: a gold rule that draws itself, HIGHLIGHT at display size, OF
 * THE WEEK letterspaced in gold beneath a second rule, then the week stamp. Sized so the two
 * words still separate at feed-thumbnail scale, which is the only size that decides whether a
 * recurring slot gets recognised.
 */
function lockup(p){
  const maxW=W-PAD*2;
  const big=Math.round(W*0.132), small=Math.round(W*0.052), stamp=Math.round(W*0.024);
  const track=Math.round(W*0.020), stampTrack=Math.round(W*0.008);
  let y=TOP+Math.round(W*0.012);

  const rule=easeOut(clamp01(p/0.16));
  g.fillStyle=GOLD; g.fillRect(PAD,y,maxW*rule,Math.round(W*0.010));
  y+=Math.round(W*0.010)+Math.round(W*0.048);

  g.textBaseline='alphabetic'; g.textAlign='left';
  const a1=easeOut(clamp01((p-0.06)/0.20));
  g.save(); g.globalAlpha=a1; g.fillStyle=CREAM;
  g.font=font('800',big);
  g.fillText(spec.series.big,PAD,y+big*0.80+(1-a1)*big*0.14);
  g.restore();
  y+=big*0.98;

  const a2=easeOut(clamp01((p-0.14)/0.20));
  g.save(); g.globalAlpha=a2; g.fillStyle=GOLD;
  g.font=font('800',small);
  drawTracked(spec.series.small,PAD,y+small*0.80+(1-a2)*small*0.20,track);
  g.restore();
  y+=small*1.30;
  if(!spec.series.stamp) return y;

  const a3=easeOut(clamp01((p-0.26)/0.22));
  g.save(); g.globalAlpha=a3*0.78; g.fillStyle=CREAM;
  g.fillRect(PAD,y,Math.round(W*0.11),3);
  g.font=font('700',stamp);
  drawTracked(spec.series.stamp,PAD+Math.round(W*0.15),y+stamp*0.38,stampTrack);
  g.restore();
  return y+stamp;
}

/* ---------- photographs ---------- */

/** A neutral scrim, not a brand wash — the photographs keep their own colour. */
function scrims(bottom,top){
  const grd=g.createLinearGradient(0,H*0.26,0,H);
  grd.addColorStop(0,'rgba(18,10,22,0)');
  grd.addColorStop(1,'rgba(18,10,22,'+bottom.toFixed(3)+')');
  g.fillStyle=grd; g.fillRect(0,H*0.26,W,H*0.74);
  const t=g.createLinearGradient(0,0,0,H*0.42);
  t.addColorStop(0,'rgba(18,10,22,'+top.toFixed(3)+')');
  t.addColorStop(1,'rgba(18,10,22,0)');
  g.fillStyle=t; g.fillRect(0,0,W,H*0.42);
}

/** The one photographic move in the piece: a slow push. Direction alternates between photo beats
 *  so three consecutive pushes don't read as one long zoom. */
const focusIndex = new Map();
function bleed(img,p,dir){
  const k=easeInOut(clamp01(p));
  const s = dir>0 ? lerp(1.0,1.075,k) : lerp(1.075,1.0,k);
  const f = focusIndex.get(img) || {fx:0.5,fy:0.5};
  g.save();
  g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
  coverAt(img,0,0,W,H,f.fx,f.fy);
  g.restore();
}

/* ---------- beats ---------- */

/** The blurred field a plate sits on: the same photograph, blown up and thrown out of focus, so
 *  the frame stays photographic instead of turning into a letterbox. */
function backdrop(img,p){
  const s=lerp(1.30,1.38,easeInOut(p));
  g.save();
  g.filter='blur(72px)';
  g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
  coverAt(img,0,0,W,H,0.5,0.5);
  g.restore();
  g.fillStyle='rgba(18,10,22,0.62)'; g.fillRect(0,0,W,H);
}

function plate(img,box,p){
  g.save();
  g.shadowColor='rgba(0,0,0,0.55)';
  g.shadowBlur=Math.round(W*0.055);
  g.shadowOffsetY=Math.round(W*0.014);
  g.fillStyle='#000'; g.fillRect(box.x,box.y,box.w,box.h);
  g.restore();
  g.save();
  g.beginPath(); g.rect(box.x,box.y,box.w,box.h); g.clip();
  const s=lerp(1.0,1.045,easeInOut(p));
  const dw=box.w*s, dh=box.h*s;
  g.drawImage(img, box.x+(box.w-dw)/2, box.y+(box.h-dh)/2, dw, dh);
  g.restore();
  g.save();
  g.strokeStyle='rgba(239,198,24,0.55)'; g.lineWidth=Math.round(W*0.005);
  g.strokeRect(box.x+g.lineWidth/2,box.y+g.lineWidth/2,box.w-g.lineWidth,box.h-g.lineWidth);
  g.restore();
}

/**
 * The opening beat: the cover photograph WHOLE, in a gold-edged plate on a blurred field, with the
 * series lockup above it and the welcome line beneath.
 *
 * Whole, not cropped, on purpose. This is the only beat where a bad rectangle would be fatal, and
 * the rectangle finder measurably can't be trusted with it (see the file header). Showing the
 * photograph the member's own page leads with, uncut, is also simply the better establishing shot.
 */
function paintHero(b,p){
  const img=PHOTOS[b.photo];
  g.fillStyle=PURPLE; g.fillRect(0,0,W,H);
  if(img) backdrop(img,p);

  const ceiling=lockup(p)+Math.round(W*0.062);

  const size=Math.round(W*0.070);
  const text=spec.welcome;
  const h=blockH(text,size,W-PAD*2);
  const floor=H-SAFE_BOTTOM-h-Math.round(W*0.075);

  if(img){
    let bw=W*0.92, bh=bw*img.height/img.width;
    if(bh>floor-ceiling){ bh=floor-ceiling; bw=bh*img.width/img.height; }
    plate(img,{x:(W-bw)/2, y:ceiling+(floor-ceiling-bh)/2, w:bw, h:bh},p);
  }

  reveal(text,{y:H-SAFE_BOTTOM-h+size*0.80,size,weight:'800',colour:CREAM,
    maxW:W-PAD*2,x:PAD,p:clamp01((p-0.34)/0.66),stagger:0.10});
  grain(GRAIN_ALPHA);
}

/**
 * The name, on a purple panel that rises out of the bottom of the picture. A name over a scrim
 * would have been one less moving part, but the panel is what makes the frame read as designed
 * rather than as a caption — and it guarantees the name is legible over any photograph, which a
 * scrim tuned by eye on one business does not.
 */
function paintName(b,p){
  const img=PHOTOS[b.photo];
  g.fillStyle=PURPLE; g.fillRect(0,0,W,H);
  // b.plate: the picture is a rendered logo card, which is shown whole or not at all. The plate is
  // laid in after the panel height is known, further down.
  if(!b.plate){ bleed(img,p,-1); scrims(0.45,0.52) }
  else if(img) backdrop(img,p);

  const nameSize=fitBlock(spec.biz.name,{max:Math.round(W*0.092),min:Math.round(W*0.050),
    weight:'800',maxW:W-PAD*2,maxLines:3});
  const nh=blockH(spec.biz.name,nameSize,W-PAD*2);
  const strap=fitTracked(spec.biz.strap.toUpperCase(),{max:Math.round(W*0.036),
    min:Math.round(W*0.022),weight:'700',maxW:W-PAD*2,trackRatio:0.14});

  // The panel swallows the whole safe margin, so the platform's caption rail lands on flat purple
  // rather than on the bottom of a photograph — and the name is guaranteed to sit clear of it.
  const padTop=Math.round(W*0.085), gap=Math.round(W*0.055), padBottom=Math.round(W*0.022);
  const panelH=SAFE_BOTTOM+padTop+nh+gap+strap.size+padBottom;
  const rise=easeOut(clamp01(p/0.30));
  const py=H-panelH*rise;

  if(b.plate && img){
    const ceiling=TOP+Math.round(W*0.135), floor=H-panelH-Math.round(W*0.075);
    let bw=W*0.86, bh=bw*img.height/img.width;
    if(bh>floor-ceiling){ bh=floor-ceiling; bw=bh*img.width/img.height; }
    plate(img,{x:(W-bw)/2, y:ceiling+(floor-ceiling-bh)/2, w:bw, h:bh},p);
  }

  g.fillStyle=PURPLE; g.fillRect(0,py,W,H-py+2);
  g.fillStyle=GOLD; g.fillRect(0,py,W,Math.round(W*0.009));

  const top=H-panelH+padTop;
  reveal(spec.biz.name,{y:top+nameSize*0.80,size:nameSize,weight:'800',colour:CREAM,
    maxW:W-PAD*2,x:PAD,p:clamp01((p-0.22)/0.78),stagger:0.09});

  const a=easeOut(clamp01((p-0.46)/0.30));
  g.save(); g.globalAlpha=a; g.fillStyle=GOLD;
  g.font=font('700',strap.size); g.textBaseline='alphabetic';
  drawTracked(spec.biz.strap.toUpperCase(),PAD,top+nh+gap+strap.size*0.82+(1-a)*18,strap.track);
  g.restore();

  cornerLogo(bug(easeOut(clamp01(p/0.18))),p);
  grain(GRAIN_ALPHA);
}

/** What they do, in their own about text, with a gold rule that grows down beside it. */
function paintLine(b,p){
  g.fillStyle=PURPLE; g.fillRect(0,0,W,H);
  if(!b.flat){
    bleed(PHOTOS[b.photo],p,1);
    scrims(0.86,0.50);
  }

  const x=PAD+Math.round(W*0.052);
  const size=fitBlock(b.head,{max:Math.round(W*0.068),min:Math.round(W*0.042),
    weight:'800',maxW:W-x-PAD,maxLines:b.flat?6:4});
  const h=blockH(b.head,size,W-x-PAD);
  // With no photograph under it the copy sits in the middle of the field rather than hard against
  // the safe margin — anchored low over nothing, it reads as a caption that lost its picture.
  const top=b.flat
    ? Math.max(TOP+Math.round(W*0.155),(H-SAFE_BOTTOM-h)/2)
    : H-SAFE_BOTTOM-h;

  const grow=easeOut(clamp01((p-0.10)/0.34));
  g.fillStyle=GOLD;
  g.fillRect(PAD,top+size*0.14,Math.round(W*0.009),h*grow*0.92);

  reveal(b.head,{y:top+size*0.80,size,weight:'800',colour:CREAM,
    maxW:W-x-PAD,x,p:clamp01((p-0.06)/0.94),stagger:0.09});

  cornerLogo(bug(easeOut(clamp01(p/0.18))),p);
  grain(GRAIN_ALPHA);
}

/**
 * Three bands (two on the 4:5 cut, where three would be strips), each from a different photograph,
 * sliding in from alternating sides.
 *
 * This beat exists because the derived crops are all 3:4 and the originals are all 16:9 — the wide
 * frames are wasted everywhere else in the piece and are exactly the right shape here. A band is
 * about 2.7:1, so a 16:9 source keeps around two thirds of its height: cropped, but never past
 * recognition.
 */
function paintBands(b,p){
  g.fillStyle=PURPLE; g.fillRect(0,0,W,H);
  const n=BANDS.length;
  const labelRoom=Math.round(W*0.135);
  const top=Math.round(H*0.135), bottom=H-SAFE_BOTTOM-labelRoom;
  const gap=Math.round(W*0.022);
  const bh=(bottom-top-gap*(n-1))/n;

  for(let i=0;i<n;i++){
    const t=easeOut(clamp01((p - i*0.10)/0.30));
    if(t<=0) continue;
    const y=top+i*(bh+gap);
    const dx=(1-t)*W*1.05*(i%2===0?1:-1);
    g.save();
    g.beginPath(); g.rect(0,y,W,bh); g.clip();
    g.globalAlpha=t;
    g.translate(dx,0);
    const band=BANDS[i];
    const s=lerp(1.0,1.05,easeInOut(p));
    g.translate(W/2,y+bh/2); g.scale(s,s); g.translate(-W/2,-(y+bh/2));
    coverAt(band.img,0,y,W,bh,0.5,band.fy);
    g.restore();
    g.save(); g.globalAlpha=t*0.55; g.fillStyle=GOLD;
    g.fillRect(0,y+bh-Math.round(W*0.004),W,Math.round(W*0.004));
    g.restore();
  }

  const a=easeOut(clamp01((p-0.34)/0.30));
  const label=spec.biz.place.toUpperCase();
  const fit=fitTracked(label,{max:Math.round(W*0.042),min:Math.round(W*0.024),
    weight:'800',maxW:W-PAD*2,trackRatio:0.24});
  g.save(); g.globalAlpha=a; g.fillStyle=GOLD;
  g.font=font('800',fit.size); g.textBaseline='alphabetic';
  drawTracked(label,(W-trackedW(label,fit.track))/2,bottom+labelRoom*0.62,fit.track);
  g.restore();

  cornerLogo(bug(easeOut(clamp01(p/0.18))),p);
  grain(GRAIN_ALPHA);
}

/**
 * The payload: where, when, and where to read the rest. A cream field, because five purple beats
 * in a row is a wash and because the one thing in the piece somebody might act on should not be
 * the darkest frame in it.
 */
/** Their mark, top-right, level with the series bug — on the beats an owner would screenshot. */
function cornerLogo(bugBottom,p){
  if(!LOGO||!bugBottom) return;
  const h=Math.round(bugBottom-TOP), pad=Math.round(W*0.016);
  const ar=LOGO.naturalWidth/LOGO.naturalHeight;
  let lh=Math.round(h*1.35), lw=lh*ar; const maxLw=Math.round(W*0.30);
  if(lw>maxLw){ lw=maxLw; lh=lw/ar; }
  const a=easeOut(clamp01((p-0.05)/0.22));
  g.save(); g.globalAlpha=a;
  const pw=Math.round(lw+pad*2), ph=Math.round(lh+pad*2);
  const x=W-PAD-pw, yy=TOP+Math.round((h-ph)/2);
  g.fillStyle='#FFFFFF'; roundRect(x,yy,pw,ph,Math.round(W*0.012)); g.fill();
  g.strokeStyle='rgba(36,22,41,0.10)'; g.lineWidth=2; roundRect(x,yy,pw,ph,Math.round(W*0.012)); g.stroke();
  g.drawImage(LOGO,x+pad,yy+pad,Math.round(lw),Math.round(lh));
  g.restore();
}

function paintPanel(b,p){
  g.fillStyle=CREAM; g.fillRect(0,0,W,H);

  const nameSize=fitBlock(spec.biz.name,{max:Math.round(W*0.066),min:Math.round(W*0.038),
    weight:'800',maxW:W-PAD*2,maxLines:2});
  const labelSize=Math.round(W*0.024);
  const rows=spec.details;

  // Sized per row, because a page url is one unbreakable word: wrapping can't save it, so it is
  // shrunk until it fits. The first cut ran the address of the page off the right of the frame.
  const sized=rows.map(r=>{
    const size=fitWord(r.value,{max:Math.round(W*0.044),min:Math.round(W*0.026),weight:'600',maxW:W-PAD*2});
    const vh=blockH(r.value,size,W-PAD*2,'600');
    return {...r,size,h:labelSize*1.9+vh+Math.round(W*0.054)};
  });
  const nh=blockH(spec.biz.name,nameSize,W-PAD*2);
  const total=nh+Math.round(W*0.078)+sized.reduce((a,v)=>a+v.h,0);
  // Centred in the room between the bug and the safe margin, not in the frame — a block centred
  // in the frame sits under the bug on the 4:5 cut.
  const boxTop=TOP+Math.round(W*0.155), boxBottom=H-SAFE_BOTTOM;
  let y=Math.max(boxTop,boxTop+(boxBottom-boxTop-total)/2);

  g.textBaseline='alphabetic'; g.textAlign='left';
  reveal(spec.biz.name,{y:y+nameSize*0.80,size:nameSize,weight:'800',colour:PURPLE,
    maxW:W-PAD*2,x:PAD,p:clamp01(p/0.5),stagger:0.06});
  y+=nh+Math.round(W*0.026);
  const ruleA=easeOut(clamp01((p-0.08)/0.22));
  g.fillStyle=GOLD; g.fillRect(PAD,y,(W-PAD*2)*ruleA,Math.round(W*0.008));
  y+=Math.round(W*0.052);

  sized.forEach((r,i)=>{
    const a=easeOut(clamp01((p - 0.14 - i*0.10)/0.26));
    g.save(); g.globalAlpha=a;
    g.translate(0,(1-a)*20);
    if(i) { g.fillStyle='rgba(36,22,41,0.14)'; g.fillRect(PAD,y,W-PAD*2,2) }
    g.fillStyle=PURPLE; g.font=font('800',labelSize);
    drawTracked(r.label,PAD,y+labelSize*1.55,Math.round(W*0.007));
    g.fillStyle=INK; g.font=font('600',r.size);
    let vy=y+labelSize*1.9+r.size*0.82;
    for(const line of wrapWords(r.value.split(' '),font('600',r.size),W-PAD*2)){
      g.fillText(line.join(' '),PAD,vy); vy+=r.size*1.22;
    }
    g.restore();
    y+=r.h;
  });

  cornerLogo(bug(easeOut(clamp01(p/0.18))),p);
  grain(GRAIN_ALPHA);
}

/**
 * The end frame, built to be reposted by the owner: the series name, then their name at display
 * size in gold, their membership, and the address of their page. The wordmark signs it and does
 * not compete with it.
 */
function paintEnd(b,p){
  g.fillStyle=PURPLE; g.fillRect(0,0,W,H);
  const maxW=W-PAD*2;

  const serSize=Math.round(W*0.030), serTrack=Math.round(W*0.010);
  const eyeSize=Math.round(W*0.030), eyeTrack=Math.round(W*0.009);
  const nameSize=fitBlock(spec.biz.name,{max:Math.round(W*0.086),min:Math.round(W*0.046),
    weight:'800',maxW,maxLines:3});
  const nh=blockH(spec.biz.name,nameSize,maxW);
  const chipSize=Math.round(W*0.026);
  const chipH=Math.round(chipSize*2.2);
  const markH=Math.round(W*0.135);
  const urlSize=fitLine(spec.biz.url,{max:Math.round(W*0.034),min:Math.round(W*0.022),weight:'700',maxW});
  // The member's logo sits on a white plate above their name; its height is what the plate
  // would be at the logo's own aspect, so the block is measured before anything is drawn.
  const logoMaxH=Math.round(W*0.150), logoPad=Math.round(W*0.022);
  let logoH=0;
  if(LOGO){ const ar=LOGO.naturalWidth/LOGO.naturalHeight; let h=logoMaxH, w=h*ar;
    if(w>maxW*0.7-logoPad*2){ w=maxW*0.7-logoPad*2; h=w/ar; } logoH=Math.round(h+logoPad*2); }
  const gapL=Math.round(W*0.045);

  const gapA=Math.round(W*0.055), gapB=Math.round(W*0.075), gapC=Math.round(W*0.090);
  const total=serSize+gapA+eyeSize+Math.round(W*0.040)+(logoH?logoH+gapL:0)+nh+
    (spec.chip?gapB+chipH:0)+gapC+markH+Math.round(W*0.050)+urlSize;
  // Measured, then centred as one block between the top of the frame and the safe margin. Pinning
  // the mark to a fixed fraction of the height left the 9:16 url 800px off the bottom.
  const boxTop=Math.round(H*0.075), boxBottom=H-SAFE_BOTTOM;
  let y=Math.max(boxTop,boxTop+(boxBottom-boxTop-total)/2);

  g.textBaseline='alphabetic'; g.textAlign='left';

  const a0=easeOut(clamp01(p/0.18));
  g.save(); g.globalAlpha=a0; g.fillStyle=GOLD;
  g.font=font('800',serSize);
  const sw=trackedW(spec.series.label,serTrack);
  drawTracked(spec.series.label,(W-sw)/2,y+serSize*0.85,serTrack);
  g.fillRect((W-Math.round(W*0.16))/2,y+serSize*1.65,Math.round(W*0.16)*a0,3);
  g.restore();
  y+=serSize+gapA;

  const a1=easeOut(clamp01((p-0.10)/0.20));
  g.save(); g.globalAlpha=a1; g.fillStyle='rgba(250,245,236,0.88)';
  g.font=font('700',eyeSize);
  const ew=trackedW(spec.eyebrow,eyeTrack);
  drawTracked(spec.eyebrow,(W-ew)/2,y+eyeSize*0.85,eyeTrack);
  g.restore();
  y+=eyeSize+Math.round(W*0.040);

  if(logoH){
    const aL=easeOut(clamp01((p-0.12)/0.22));
    g.save(); g.translate(0,(1-aL)*16);
    logoPlate(W/2,y,logoMaxH,maxW*0.7,aL);
    g.restore();
    y+=logoH+gapL;
  }

  reveal(spec.biz.name,{y:y+nameSize*0.80,size:nameSize,weight:'800',colour:GOLD,
    maxW,x:W/2,p:clamp01((p-0.14)/0.86),stagger:0.09,align:'center'});
  y+=nh;

  if(spec.chip){
    y+=gapB;
    const a2=easeOut(clamp01((p-0.36)/0.24));
    g.save(); g.globalAlpha=a2;
    g.font=font('800',chipSize);
    const track=Math.round(W*0.008);
    const tw=trackedW(spec.chip,track), px=Math.round(W*0.034);
    g.fillStyle=GOLD; roundRect((W-tw-px*2)/2,y,tw+px*2,chipH,chipH/2); g.fill();
    g.fillStyle=PURPLE; drawTracked(spec.chip,(W-tw)/2,y+chipH/2+chipSize*0.36,track);
    g.restore();
    y+=chipH;
  }

  y+=gapC;
  const a3=easeOut(clamp01((p-0.44)/0.26));
  g.save(); g.globalAlpha=a3;
  g.drawImage(MARK_W,(W-markH*MARK_ASPECT)/2,y,markH*MARK_ASPECT,markH);
  g.restore();
  y+=markH+Math.round(W*0.050);

  const a4=easeOut(clamp01((p-0.54)/0.26));
  g.save(); g.globalAlpha=a4; g.fillStyle='rgba(255,255,255,0.90)';
  g.font=font('700',urlSize); g.textAlign='center';
  g.fillText(spec.biz.url,W/2,y+urlSize*0.85);
  g.textAlign='left';
  g.restore();

  grain(GRAIN_ALPHA);
}

function paintBeat(b,p){
  if(b.kind==='hero')  return paintHero(b,p);
  if(b.kind==='name')  return paintName(b,p);
  if(b.kind==='line')  return paintLine(b,p);
  if(b.kind==='bands') return paintBands(b,p);
  if(b.kind==='panel') return paintPanel(b,p);
  return paintEnd(b,p);
}

/* ---------- run ---------- */

const toJpeg = () => new Promise(r => cv.toBlob(r,'image/jpeg',0.94));

(async () => {
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  LOGO = spec.logo ? await load('/p/'+spec.logo) : null;
  PHOTOS = await Promise.all(spec.photos.map(f => load('/p/'+f)));
  const ORIG = await Promise.all(spec.bandPhotos.map(b => load('/p/'+b.file)));
  // A null fy means "wherever this photograph's subject is" — measured, so a band centres on the
  // counter rather than on whatever happens to be halfway down the frame. A number means the band
  // is one of several slices of the same picture and the height was chosen for us.
  BANDS = spec.bandPhotos
    .map((b,i)=>({img:ORIG[i], fy: b.fy === null ? focusOf(ORIG[i]).fy : b.fy}))
    .filter(b=>b.img);
  FOCUS = PHOTOS.map(focusOf);
  PHOTOS.forEach((img,i)=>{ if(img) focusIndex.set(img,FOCUS[i]) });
  GRAIN = makeGrain();
  await document.fonts.load('800 140px "Plus Jakarta Sans"');
  await document.fonts.load('700 44px "Plus Jakarta Sans"');
  await document.fonts.load('600 44px "Plus Jakarta Sans"');
  await document.fonts.ready;

  const total=spec.beats.reduce((a,b)=>a+b.dur,0);
  const frames=Math.round(total*FPS);
  const WIPE=0.34;
  const BAND=Math.round(W*0.018);

  for(let i=0;i<frames;i++){
    const t=i/FPS;
    let acc=0, idx=0;
    for(let k=0;k<spec.beats.length;k++){
      if(t < acc+spec.beats[k].dur){ idx=k; break; }
      acc+=spec.beats[k].dur; idx=k;
    }
    const beat=spec.beats[idx], local=t-acc;
    paintBeat(beat,local/beat.dur);

    // The seam: the incoming beat, painted for real on an offscreen canvas, wiped in behind a
    // gold leading edge. The gold bar is the series' signature — the same gesture every week, in
    // the same colour as the lockup — and the direction alternates so the eye can't predict it by
    // the third cut.
    const next=spec.beats[idx+1];
    const toEnd=beat.dur-local;
    if(next && toEnd<WIPE){
      const w=easeInOut(1-toEnd/WIPE);
      const keep=g; g=OFFG; paintBeat(next,0.015); g=keep;
      g.save();
      if(idx%2===0){
        const y=H-H*w;
        g.beginPath(); g.rect(0,y,W,H-y+2); g.clip();
        g.drawImage(OFF,0,0);
        g.restore();
        g.fillStyle=GOLD; g.fillRect(0,y-BAND,W,BAND);
      } else {
        const x=W-W*w;
        g.beginPath(); g.rect(x,0,W-x+2,H); g.clip();
        g.drawImage(OFF,0,0);
        g.restore();
        g.fillStyle=GOLD; g.fillRect(x-BAND,0,BAND,H);
      }
    }

    const blob=await toJpeg();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function serve(photoDir, W, H, spec, onFrame) {
  let finished = false
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    if (url.pathname === "/player.html") {
      res.writeHead(200, { "content-type": "text/html" })
      return res.end(PLAYER(W, H, spec))
    }
    if (url.pathname.startsWith("/brand/")) {
      const f = path.join(REPO, "public/brand", path.basename(url.pathname))
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      res.writeHead(200, { "content-type": "image/svg+xml" })
      return res.end(fs.readFileSync(f))
    }
    if (url.pathname.startsWith("/p/")) {
      const f = path.join(photoDir, path.basename(url.pathname))
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      const ct = /\.png$/i.test(f) ? "image/png" : /\.svg$/i.test(f) ? "image/svg+xml" : "image/jpeg"
      res.writeHead(200, { "content-type": ct })
      return res.end(fs.readFileSync(f))
    }
    if (url.pathname === "/frame" && req.method === "POST") {
      const chunks = []
      req.on("data", (c) => chunks.push(c))
      req.on("end", () => {
        onFrame(url.searchParams.get("n"), Buffer.concat(chunks))
        res.writeHead(200); res.end("ok")
      })
      return
    }
    if (url.pathname === "/done") { finished = true; res.writeHead(200); return res.end("ok") }
    res.writeHead(404); res.end()
  })
  return { server, done: () => finished }
}

async function drive(server, done, W, H, timeoutSec) {
  await new Promise((r) => server.listen(0, r))
  const port = server.address().port
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
    `--window-size=${W},${H}`,
    `http://localhost:${port}/player.html`,
  ], { stdio: "ignore" })
  const deadline = Date.now() + timeoutSec * 1000
  while (!done() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200))
  chrome.kill()
  server.close()
}

async function renderVideo(key, spec, photoDir, bedPath, outFile) {
  const { w: W, h: H } = SHAPES[key]
  const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `how-${key}-`))
  let written = 0

  const { server, done } = serve(photoDir, W, H, spec, (n, buf) => {
    fs.writeFileSync(path.join(frameDir, `f-${n}.jpg`), buf)
    written++
  })
  await drive(server, done, W, H, expected * 0.8 + 240)

  if (written < expected) {
    fs.rmSync(frameDir, { recursive: true, force: true })
    throw new Error(`${key}: painted only ${written}/${expected} frames`)
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  // A silent upload gets demoted on both platforms and gives nothing back to a viewer who taps
  // for sound. The bed is built once for both shapes and cut to the length of the picture.
  const code = await new Promise((r) => {
    const ff = spawn(ffmpegPath, [
      "-y", "-framerate", String(FPS),
      "-i", path.join(frameDir, "f-%05d.jpg"),
      ...(bedPath ? ["-i", bedPath] : []),
      "-c:v", "libx264", "-preset", "slow", "-crf", "19",
      ...(bedPath ? ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"] : []),
      "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      "-t", seconds.toFixed(3), outFile,
    ], { stdio: "ignore" })
    ff.on("close", r)
  })
  fs.rmSync(frameDir, { recursive: true, force: true })
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${outFile}`)

  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1)
  console.log(`  ✓ ${path.basename(outFile).padEnd(52)} ${W}x${H}  ${seconds.toFixed(1)}s  ${mb} MB` +
    (bedPath ? "  + music" : "  (silent)"))
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

const biz = await loadBusiness(SLUG)
const plan = PLAN_LABEL[biz.plan_override] || null
console.log(`${biz.name} — ${biz.category || "uncategorised"}, ${biz.photos.length} photos, ` +
  `${plan ? plan.toLowerCase() : "free listing"}, ` +
  `${biz.claimed ? "owner-claimed" : "listed by us"}, joined ${biz.daysSinceJoin}d ago`)

const photoDir = fs.mkdtempSync(path.join(os.tmpdir(), "how-photos-"))
const files = await cachePhotos(biz.photos, photoDir)
const logoFile = await cacheLogo(biz.logo_url, photoDir)
if (logoFile) console.log(`logo: ${biz.logo_url}`)
const live = files.filter(Boolean)
if (!live.length) throw new Error(`${SLUG}: no photo downloaded`)

// The opening plate is the photograph the page itself leads with — the one editorial judgement
// about a member's pictures that already exists in the row. Falling back to the first photo, which
// is the order the page shows them in anyway.
const coverAt = biz.photos.findIndex((u) => u === biz.cover_url)
const heroFile = files[coverAt] || live[0]

const graphic = new Set()
const crops = deriveCrops(files, photoDir, graphic)
console.log(`photos: ${live.length}/${biz.photos.length} cached, ${crops.length} rectangles found` +
  (crops.length ? `, best ${crops[0].rect[2]}×${crops[0].rect[3]} from photo ${crops[0].from}` : "") +
  `, plate from ${coverAt >= 0 ? `cover (photo ${coverAt})` : "first photo"}` +
  (graphic.size ? `, ${graphic.size} logo card${graphic.size > 1 ? "s" : ""} left uncropped` : ""))

// The second plate is a different picture from the first where there is one — otherwise the first
// two beats are the same photograph twice.
const secondFile = live.find((f) => f !== heroFile) || heroFile

// The pool the player loads: two whole pictures for the plates, the derived rectangles for the
// copy beat, and the untouched wide originals for the band beat, which is the only place a 16:9
// frame is the right shape.
const pool = [heroFile, secondFile, ...crops.map((c) => c.file)]
const bandSources = []
// A rendered card is never banded either: three slices of a logo is three slices of a logo.
const distinct = files.map((f, i) => (f ? i : -1)).filter((i) => i >= 0 && !graphic.has(i))
const WANT_BANDS = 3 // trimmed to 2 on the 4:5 cut below, where three would be strips
for (let i = 0; distinct.length && i < WANT_BANDS; i++) {
  const src = distinct[i % distinct.length]
  // With fewer photographs than bands, the bands are taken from different heights of the same
  // picture instead — the top and the bottom of a shop interior are genuinely different content.
  // With enough photographs, each band is centred on its own picture's subject (null = measure it).
  const fy = distinct.length >= WANT_BANDS ? null : [0.26, 0.5, 0.76][Math.floor(i / distinct.length) % 3]
  bandSources.push({ file: files[src], fy })
}

const beats = buildBeats(biz, crops.length, bandSources.length)

const street = streetLine(biz.address)
const place = placeLabel(biz.address)
const strap = [biz.category, place].filter(Boolean).join(" · ")
const url = `lompoclocals.com/biz/${biz.slug}`

// "New this week" is only printed when it is true of this row — the owner claimed the page, or we
// listed it, inside the last ten days. The slot runs weekly, so anything older gets a line that is
// true of any member on any week instead.
const isNew = biz.daysSinceJoin <= 10
const welcome = isNew ? SERIES.welcomeNew : SERIES.welcomeOld
const eyebrow = isNew ? SERIES.eyebrowNew : SERIES.eyebrowOld

// Three rows at most, and no filler: a row that says "Retail" under a headline that already said
// what the shop is earns nothing. WHAT only appears when the row can't supply both of the others.
const details = []
// A row with no address is a service-area member — the platform's own model for them, and the
// reason voice.mjs has a "No storefront" opener. The two places we cover are the two named.
if (street) details.push({ label: "WHERE", value: `${street}, ${cityLine(biz.address)}` })
else details.push({ label: "SERVING", value: "Lompoc & Vandenberg — no storefront" })
const hrs = hoursCompact(biz.hours_json)
if (hrs) details.push({ label: "HOURS", value: hrs })
if (details.length < 2 && biz.category) details.unshift({ label: "WHAT", value: biz.category })
details.push({ label: "THE PAGE", value: url })

for (const t of [welcome, strap, place, ...details.map((d) => d.value), ...beats.map((b) => b.head)]) {
  if (t) assertNoPriceFraming(t, `${SLUG} highlight-of-week`)
}

const seconds = beats.reduce((a, b) => a + b.dur, 0)
console.log(`\nbeats (${seconds.toFixed(1)}s):`)
beats.forEach((b, i) => console.log(`  ${i + 1}. ${String(b.dur.toFixed(1)).padStart(4)}s  ` +
  `${b.kind.padEnd(6)} ${b.head || (b.kind === "hero" ? welcome : b.kind === "name" ? biz.name : "")}`))
console.log(`  details: ${details.map((d) => `${d.label} ${d.value}`).join("  |  ")}`)

const base = {
  photos: pool,
  series: { label: SERIES.label, big: SERIES.big, small: SERIES.small,
    stamp: SERIES.stamp ? weekStamp(WEEK_ARG) : null },
  logo: logoFile,
  biz: { name: biz.name, strap, place, url },
  welcome, eyebrow, details,
  chip: plan,
  beats,
}

const schedule = beats.map((b, i) => ({ chord: chordFor(i, beats.length), dur: b.dur }))
const accentAt = []
let mark = 0
schedule.forEach((s, i) => {
  mark += s.dur
  if (i < schedule.length - 1) accentAt.push({ at: mark, chord: schedule[i + 1].chord })
})
const audioDir = fs.mkdtempSync(path.join(os.tmpdir(), "how-audio-"))
const bedPath = path.join(audioDir, "bed.wav")
console.log("")
await buildBed({ out: bedPath, schedule, total: seconds, lufs: -14, accentAt })

console.log("")
for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  const { suffix, h, w } = SHAPES[key]
  const bandPhotos = h > w * 1.5 ? bandSources : bandSources.slice(0, 2)
  await renderVideo(key, { ...base, bandPhotos },
    photoDir, bedPath, path.join(VIDEO_DIR, `${SERIES.key}-${biz.slug}-${suffix}.mp4`))
}

fs.rmSync(photoDir, { recursive: true, force: true })
fs.rmSync(audioDir, { recursive: true, force: true })
