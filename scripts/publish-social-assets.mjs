#!/usr/bin/env node
/**
 * Uploads the calendar's media to Vercel Blob and writes a queue file for scheduling.
 *
 * Buffer needs a publicly reachable URL for every image and video — a repo-relative path is
 * useless to it. This uploads each distinct media file once, then emits
 * content/social/queue.json pairing every future post with its public URL, channels and time.
 *
 * Posts already in the past are excluded: Buffer rejects a dueAt that has passed, and a calendar
 * regenerated mid-week always has some.
 *
 * Usage: node scripts/publish-social-assets.mjs [--limit N]
 */
import { put } from "@vercel/blob"
import fs from "node:fs"
import path from "node:path"

const CSV = "content/social/calendar.csv"
const OUT = "content/social/queue.json"
const LIMIT = Number((process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0)

const env = fs.readFileSync(".env.local", "utf8")
const token = (env.match(/^BLOB_READ_WRITE_TOKEN\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!token) {
  console.error("no BLOB_READ_WRITE_TOKEN in .env.local")
  process.exit(1)
}

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

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4" }

/** Local wall-clock, so a 16:00 slot means 4pm in Lompoc rather than 4pm UTC. */
function dueAt(date, time) {
  const [y, m, d] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const local = new Date(y, m - 1, d, hh, mm, 0)
  const off = -local.getTimezoneOffset()
  const sign = off >= 0 ? "+" : "-"
  const pad = (n) => String(Math.abs(n)).padStart(2, "0")
  return (
    `${date}T${pad(hh)}:${pad(mm)}:00` +
    `${sign}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`
  )
}

const rows = parseCsv(fs.readFileSync(CSV, "utf8"))
const now = Date.now()

const future = rows.filter((r) => {
  const t = new Date(dueAt(r.date, r.time)).getTime()
  return t > now + 5 * 60 * 1000 // a little headroom so a due time can't pass mid-upload
})
const skippedPast = rows.length - future.length
const queueRows = LIMIT ? future.slice(0, LIMIT) : future

// TikTok is full-screen, so it takes the 9:16 cut; feed placements take 4:5.
const VERTICAL = new Set(["tiktok"])
const assetFor = (row, channel) =>
  VERTICAL.has(channel) && row.media_vertical ? row.media_vertical : row.media

// Upload each distinct file once, even when several posts share a video.
const uploaded = new Map()
const wanted = new Set()
for (const r of queueRows) for (const ch of r.channels.split(",").filter(Boolean)) wanted.add(assetFor(r, ch))

for (const file of wanted) {
  if (!file || uploaded.has(file)) continue
  if (!fs.existsSync(file)) {
    console.error(`  ! missing ${file}`)
    continue
  }
  const ext = path.extname(file).toLowerCase()
  const res = await put(`social/${path.basename(file)}`, fs.readFileSync(file), {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType: MIME[ext] || "application/octet-stream",
  })
  uploaded.set(file, res.url)
  console.log(`  ✓ ${path.basename(file).padEnd(42)} ${(fs.statSync(file).size / 1048576).toFixed(1)} MB`)
}

// One entry per channel: the asset differs by placement, so a post is no longer one thing.
const queue = queueRows
  .flatMap((r) =>
    r.channels
      .split(",")
      .filter(Boolean)
      .map((channel) => {
        const file = assetFor(r, channel)
        return {
          date: r.date,
          time: r.time,
          dueAt: dueAt(r.date, r.time),
          series: r.series,
          channel,
          text: r.text,
          link: r.link,
          media: file,
          mediaUrl: uploaded.get(file) || null,
          kind: /\.mp4$/i.test(file) ? "video" : "image",
          shape: VERTICAL.has(channel) ? "9:16" : "4:5",
        }
      })
  )
  .filter((q) => q.mediaUrl)

fs.writeFileSync(OUT, JSON.stringify(queue, null, 2) + "\n")

console.log(`\n${queue.length} post(s) → ${OUT}`)
console.log(`  ${uploaded.size} file(s) uploaded to Blob`)
if (skippedPast) console.log(`  ${skippedPast} post(s) skipped — their slot time has already passed`)
// Count against the channel fan-out, not the row count: every row becomes one entry per channel,
// so comparing 20 rows to 40 entries reported "-20 dropped" on a run where nothing was dropped.
const expected = queueRows.reduce((sum, r) => sum + r.channels.split(",").filter(Boolean).length, 0)
const missing = expected - queue.length
if (missing) console.log(`  ${missing} post(s) dropped — no uploadable media`)
console.log(`  ${queue.length} Buffer posts (${queue.filter((q) => q.shape === "9:16").length} at 9:16, ${queue.filter((q) => q.shape === "4:5").length} at 4:5)`)
