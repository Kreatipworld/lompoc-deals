#!/usr/bin/env node
/**
 * "All of Lompoc" — the experience film. Two cuts from one set of assets.
 *
 * The edit alternates generated B-roll with painted UI segments, so the film reads as a place
 * you live in rather than a product tour:
 *
 *   b-roll ─► UI beats ─► b-roll ─► UI beats ─► b-roll ─► closing beat ─► end card
 *
 * UI segments are painted by lib/video-frames.mjs; this script cross-fades everything together
 * and lays the narration across the whole thing.
 *
 * Usage: node scripts/render-experience-video.mjs <assetsDir> <framesDir> <outDir> [full|short]
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"
import { renderSegment, W, H, FPS } from "./lib/video-frames.mjs"

const ASSETS = process.argv[2]
const FRAMES = process.argv[3]
const OUT = process.argv[4] || "docs/social-kit/video"
const ONLY = process.argv[5]

const PURPLE = "#650C75"
const BG = ["#2b0733", "#650C75"]
const XFADE = 0.5

// A clip item trims generated B-roll; a ui item is painted from screenshots.
const EDITS = {
  // Timed against the narration: full 23.1s (+0.7s delay), short 14.2s (+0.6s).
  // Each xfade shortens the running total by 0.5s, which the offset maths below accounts for.
  full: {
    out: "lompoc-locals-experience.mp4",
    vo: "vo-experience-full.mp3",
    voDelay: 700,
    items: [
      { clip: "broll-hook.mp4", dur: 2.8, title: "title-experience.png" },
      {
        ui: [
          { img: "thisweek", dur: 2.2, from: 0.0, to: 0.2, caption: "The whole town, every week.", badge: "THIS WEEK" },
          { img: "events", dur: 2.2, from: 0.02, to: 0.28, caption: "Every launch. Every event.", badge: "EVENTS" },
        ],
      },
      { clip: "broll-rocket.mp4", dur: 2.0 },
      {
        ui: [
          { img: "map", dur: 2.0, from: 0.1, to: 0.4, caption: "See what's around you.", badge: "MAP" },
          { img: "businesses", dur: 2.0, from: 0.03, to: 0.26, caption: "471 local businesses.", badge: "DIRECTORY" },
        ],
      },
      { clip: "broll-tacos.mp4", dur: 1.8 },
      {
        ui: [
          { img: "feed", dur: 2.2, from: 0.05, to: 0.34, caption: "Your neighbors, posting.", badge: "COMMUNITY" },
          { img: "locals", dur: 2.4, from: 0.3, to: 0.58, caption: "Claim it. Show it at the counter.", badge: "COUPONS" },
        ],
      },
      { clip: "broll-counter.mp4", dur: 2.0 },
      {
        ui: [
          { img: "partnerguide", dur: 2.2, from: 0.06, to: 0.3, caption: "Own a business here?", badge: "FOR BUSINESSES" },
          { img: "plans-card", dur: 2.8, from: 0, to: 0, zoom: 1.04, fullBleed: true },
        ],
      },
      { ui: [{ img: "endcard-experience", dur: 2.6, from: 0, to: 0, zoom: 1.05, fullBleed: true }] },
    ],
  },
  short: {
    out: "lompoc-locals-experience-20s.mp4",
    vo: "vo-experience-short.mp3",
    voDelay: 600,
    items: [
      { clip: "broll-hook.mp4", dur: 2.4, title: "title-experience.png" },
      {
        ui: [
          { img: "events", dur: 2.2, from: 0.02, to: 0.26, caption: "Every launch. Every event.", badge: "EVENTS" },
          { img: "businesses", dur: 2.2, from: 0.03, to: 0.26, caption: "471 local businesses.", badge: "DIRECTORY" },
        ],
      },
      { clip: "broll-rocket.mp4", dur: 1.8 },
      {
        ui: [
          { img: "feed", dur: 2.2, from: 0.05, to: 0.34, caption: "Your neighbors, posting.", badge: "COMMUNITY" },
          { img: "locals", dur: 2.6, from: 0.3, to: 0.58, caption: "Claim it. Show it at the counter.", badge: "COUPONS" },
        ],
      },
      { clip: "broll-counter.mp4", dur: 1.8 },
      { ui: [{ img: "endcard-experience", dur: 3.4, from: 0, to: 0, zoom: 1.05, fullBleed: true }] },
    ],
  },
}

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

async function duration(file) {
  const { err } = await run(["-i", file])
  const m = err.match(/Duration: (\d+):(\d+):([\d.]+)/)
  if (!m) throw new Error(`no duration for ${file}`)
  return +m[1] * 3600 + +m[2] * 60 + +m[3]
}

/** Normalise a generated clip to frame size/rate, trim it, and burn in the title if present. */
async function prepClip(item, tmp, index) {
  const src = path.join(ASSETS, item.clip)
  if (!fs.existsSync(src)) throw new Error(`missing clip ${src}`)
  const dest = path.join(tmp, `clip-${index}.mp4`)

  const base =
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},` +
    `trim=0:${item.dur},setpts=PTS-STARTPTS`

  let filter, inputs
  if (item.title) {
    const titlePath = path.join(ASSETS, item.title)
    if (!fs.existsSync(titlePath)) throw new Error(`missing title ${titlePath}`)
    inputs = ["-i", src, "-loop", "1", "-i", titlePath]
    filter =
      `${base}[v0];` +
      `[1:v]format=rgba,fps=${FPS},trim=0:${item.dur},setpts=PTS-STARTPTS,` +
      `fade=t=in:st=0.35:d=0.6:alpha=1,fade=t=out:st=${(item.dur - 0.7).toFixed(2)}:d=0.5:alpha=1[t];` +
      `[v0][t]overlay=0:0:format=auto[v]`
  } else {
    inputs = ["-i", src]
    filter = `${base}[v]`
  }

  const { code, err } = await run([
    "-y", ...inputs, "-filter_complex", filter, "-map", "[v]", "-an",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", dest,
  ])
  if (code !== 0) throw new Error(`clip prep failed (${code})\n${err.split("\n").slice(-8).join("\n")}`)
  return dest
}

async function build(key) {
  const edit = EDITS[key]
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `exp-${key}-`))
  const parts = []

  console.log(`\n── ${key} ──`)
  for (const [i, item] of edit.items.entries()) {
    if (item.clip) {
      parts.push({ file: await prepClip(item, tmp, i), dur: item.dur })
      console.log(`  clip    ${item.clip} → ${item.dur}s${item.title ? " + title" : ""}`)
    } else {
      const file = path.join(tmp, `ui-${i}.mp4`)
      const dur = await renderSegment({
        scenes: item.ui, bg: BG, accent: PURPLE, framesDir: FRAMES, outFile: file,
      })
      parts.push({ file, dur })
      console.log(`  ui      ${item.ui.map((s) => s.img).join(", ")} → ${dur.toFixed(1)}s`)
    }
  }

  // Chain cross-fades. Each xfade shortens the running total by its duration, so the offset
  // for the next one is computed against the accumulated length, not the raw sum.
  const inputs = parts.flatMap((p) => ["-i", p.file])
  const chain = []
  let acc = parts[0].dur
  let label = "0:v"
  for (let i = 1; i < parts.length; i++) {
    const offset = (acc - XFADE).toFixed(3)
    const out = i === parts.length - 1 ? "vmix" : `x${i}`
    chain.push(`[${label}][${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset}[${out}]`)
    acc = acc - XFADE + parts[i].dur
    label = out
  }
  const total = acc

  const voPath = path.join(ASSETS, edit.vo)
  if (!fs.existsSync(voPath)) throw new Error(`missing narration ${voPath}`)
  const voLen = await duration(voPath)

  const filter = [
    ...chain,
    `[vmix]fade=t=in:st=0:d=0.5,fade=t=out:st=${(total - 0.6).toFixed(2)}:d=0.6[v]`,
    // aformat first: a mono source makes adelay emit mono, which reads as a phone recording.
    `[${parts.length}:a]aformat=channel_layouts=stereo,adelay=${edit.voDelay}|${edit.voDelay},` +
      `volume=1.5,apad,atrim=0:${total.toFixed(2)},asetpts=PTS-STARTPTS[a]`,
  ].join(";")

  const dest = path.join(OUT, edit.out)
  const { code, err } = await run([
    "-y", ...inputs, "-i", voPath,
    "-filter_complex", filter, "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart", "-t", total.toFixed(2), dest,
  ])
  fs.rmSync(tmp, { recursive: true, force: true })

  if (code !== 0) {
    console.log(`  ✗ ffmpeg ${code}\n${err.split("\n").slice(-14).join("\n")}`)
    return
  }
  const mb = (fs.statSync(dest).size / 1e6).toFixed(1)
  console.log(`  ✓ ${edit.out}  ${total.toFixed(1)}s  ${mb} MB  (narration ${voLen.toFixed(1)}s)`)
  if (voLen + edit.voDelay / 1000 > total + 0.3) {
    console.log(`  ! narration runs ${(voLen + edit.voDelay / 1000 - total).toFixed(1)}s past the picture`)
  }
}

fs.mkdirSync(OUT, { recursive: true })
for (const key of ONLY ? [ONLY] : Object.keys(EDITS)) await build(key)
