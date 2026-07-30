#!/usr/bin/env node
/**
 * "It was always here" — the 30-second spot.
 *
 * Inverted from the tour videos: roughly 80% real footage, and the product appears exactly
 * twice — one insert mid-film and the end card. That ratio is the difference between an ad
 * and a screen recording.
 *
 * Audio: the generated clips carry their own ambience (room tone, a pour, wind), so it is
 * concatenated and mixed low under the narration. Without it the gaps where a music bed
 * belongs are dead silence. Drop a music file in and it layers on top — see MUSIC below.
 *
 * Usage: node scripts/render-tv-spot.mjs <assetsDir> <framesDir> <outDir> [musicFile]
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
const MUSIC = process.argv[5] || null

const OUT_FILE = "lompoc-locals-spot.mp4"
const VO = "vo-spot.mp3"
const VO_START = 4.0 // narration explains the platform across the film; 4s of town first
const XFADE = 0.55
const AMBIENCE_DB = -17 // under the voice, present but never competing
const MUSIC_DB = -14

// A day in Lompoc, then one plain explanation of what the platform is.
// No checkout beat: the register shot and the coupon walkthrough are deliberately out —
// this is a brand spot about the town, not a how-to.
const ITEMS = [
  { clip: "lpc-aerial.mp4", dur: 3.4, title: "title-experience.png" }, // the valley grid against the fields
  { clip: "lpc-flowers.mp4", dur: 2.6 },
  { clip: "lpc-oldtown.mp4", dur: 2.8 }, // Art Deco corner + sidewalk clock
  { clip: "broll-shop.mp4", dur: 2.4 },
  { clip: "broll-tacos.mp4", dur: 2.4 },
  { clip: "broll-wine.mp4", dur: 2.4 },
  { clip: "lpc-rail.mp4", dur: 2.6 }, // coastal rail toward Surf
  { clip: "broll-rocket.mp4", dur: 3.2 },
  {
    // The only product beat — what it is, not how to use it. Punches, never a scroll.
    ui: [
      { img: "home", dur: 2.6, from: 0.04, to: 0.04, move: "punch", caption: "Every business in town." },
      { img: "events", dur: 2.4, from: 0.06, to: 0.06, move: "punch", caption: "Every event. Every launch." },
    ],
  },
  { clip: "broll-dusk.mp4", dur: 2.6 },
  { ui: [{ img: "endcard-experience", dur: 3.4, from: 0, to: 0, zoom: 1.05, fullBleed: true }] },
]

const PURPLE = "#650C75"
const BG = ["#2b0733", "#650C75"]

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

async function hasAudio(file) {
  const { err } = await run(["-i", file])
  return /Stream #\d+:\d+.*Audio:/.test(err)
}

/** Normalise a clip to frame size/rate and trim it. Keeps audio when the source has it. */
async function prepClip(item, tmp, i) {
  const src = path.join(ASSETS, item.clip)
  if (!fs.existsSync(src)) throw new Error(`missing clip ${src}`)
  const dest = path.join(tmp, `clip-${i}.mp4`)
  const withAudio = await hasAudio(src)

  const base =
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},` +
    `trim=0:${item.dur},setpts=PTS-STARTPTS`

  const parts = []
  let inputs
  if (item.title) {
    const t = path.join(ASSETS, item.title)
    inputs = ["-i", src, "-loop", "1", "-i", t]
    parts.push(
      `${base}[v0]`,
      `[1:v]format=rgba,fps=${FPS},trim=0:${item.dur},setpts=PTS-STARTPTS,` +
        `fade=t=in:st=0.4:d=0.7:alpha=1,fade=t=out:st=${(item.dur - 0.8).toFixed(2)}:d=0.5:alpha=1[t]`,
      `[v0][t]overlay=0:0:format=auto[v]`
    )
  } else {
    inputs = ["-i", src]
    parts.push(`${base}[v]`)
  }

  const map = ["-map", "[v]"]
  if (withAudio) {
    parts.push(
      `[0:a]atrim=0:${item.dur},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=48000,` +
        `afade=t=in:st=0:d=0.3,afade=t=out:st=${Math.max(0, item.dur - 0.4).toFixed(2)}:d=0.4[a]`
    )
    map.push("-map", "[a]", "-c:a", "aac", "-b:a", "160k")
  } else {
    map.push("-an")
  }

  const { code, err } = await run([
    "-y", ...inputs, "-filter_complex", parts.join(";"), ...map,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", dest,
  ])
  if (code !== 0) throw new Error(`clip prep failed (${code})\n${err.split("\n").slice(-8).join("\n")}`)
  return { file: dest, dur: item.dur, audio: withAudio }
}

/** Silent stereo filler so UI segments keep the ambience timeline aligned. */
async function silence(dur, tmp, i) {
  const dest = path.join(tmp, `sil-${i}.m4a`)
  const { code } = await run([
    "-y", "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-t", dur.toFixed(3), "-c:a", "aac", "-b:a", "96k", dest,
  ])
  if (code !== 0) throw new Error("silence generation failed")
  return dest
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spot-"))
  const parts = []

  console.log("── building spot ──")
  for (const [i, item] of ITEMS.entries()) {
    if (item.clip) {
      const p = await prepClip(item, tmp, i)
      parts.push(p)
      console.log(`  clip  ${item.clip.padEnd(22)} ${item.dur}s${p.audio ? " +ambience" : ""}${item.title ? " +title" : ""}`)
    } else {
      const file = path.join(tmp, `ui-${i}.mp4`)
      const dur = await renderSegment({
        scenes: item.ui, bg: BG, accent: PURPLE, framesDir: FRAMES, outFile: file,
      })
      parts.push({ file, dur, audio: false })
      console.log(`  ui    ${item.ui.map((s) => s.img).join(", ").padEnd(22)} ${dur.toFixed(1)}s`)
    }
  }

  // ── video: chained cross-fades ────────────────────────────────────────────
  const inputs = parts.flatMap((p) => ["-i", p.file])
  const chain = []
  let acc = parts[0].dur
  let label = "0:v"
  for (let i = 1; i < parts.length; i++) {
    const out = i === parts.length - 1 ? "vmix" : `x${i}`
    chain.push(`[${label}][${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${(acc - XFADE).toFixed(3)}[${out}]`)
    acc = acc - XFADE + parts[i].dur
    label = out
  }
  const total = acc

  // ── ambience: each part's own sound, butt-joined, delayed to its cut point ──
  // Delays use the same accumulated timeline the cross-fades produce, so a pour lands
  // when the pour is on screen.
  const ambInputs = []
  const ambFilters = []
  const ambLabels = []
  let ambCount = 0 // count of ambience INPUTS, not array slots — ambInputs holds "-i" flags too
  let at = 0
  for (const [i, p] of parts.entries()) {
    if (p.audio) {
      const idx = parts.length + 1 + ambCount // after the video inputs and the narration
      ambCount++
      ambInputs.push("-i", p.file)
      const ms = Math.round(at * 1000)
      ambFilters.push(
        `[${idx}:a]atrim=0:${p.dur},asetpts=PTS-STARTPTS,adelay=${ms}|${ms},` +
          `volume=${AMBIENCE_DB}dB[amb${i}]`
      )
      ambLabels.push(`[amb${i}]`)
    }
    at += i === 0 ? p.dur : p.dur - XFADE
  }

  const voPath = path.join(ASSETS, VO)
  if (!fs.existsSync(voPath)) throw new Error(`missing narration ${voPath}`)
  const voLen = await duration(voPath)
  const voMs = Math.round(VO_START * 1000)

  const audioBits = [
    ...ambFilters,
    `[${parts.length}:a]aformat=channel_layouts=stereo:sample_rates=48000,` +
      `adelay=${voMs}|${voMs},volume=2.0[vo]`,
  ]
  const mixLabels = [...ambLabels, "[vo]"]

  let musicInput = []
  if (MUSIC && fs.existsSync(MUSIC)) {
    const idx = parts.length + 1 + ambCount
    musicInput = ["-i", MUSIC]
    audioBits.push(
      `[${idx}:a]aformat=channel_layouts=stereo:sample_rates=48000,` +
        `atrim=0:${total.toFixed(2)},afade=t=in:st=0:d=1.5,` +
        `afade=t=out:st=${(total - 2).toFixed(2)}:d=2,volume=${MUSIC_DB}dB[mus]`
    )
    mixLabels.push("[mus]")
    console.log(`  music ${path.basename(MUSIC)} at ${MUSIC_DB}dB`)
  }

  audioBits.push(
    `${mixLabels.join("")}amix=inputs=${mixLabels.length}:duration=longest:dropout_transition=0:normalize=0,` +
      `atrim=0:${total.toFixed(2)},alimiter=limit=0.95[a]`
  )

  const filter = [
    ...chain,
    `[vmix]fade=t=in:st=0:d=0.8,fade=t=out:st=${(total - 0.8).toFixed(2)}:d=0.8[v]`,
    ...audioBits,
  ].join(";")

  const dest = path.join(OUT, OUT_FILE)
  const { code, err } = await run([
    "-y", ...inputs, "-i", voPath, ...ambInputs, ...musicInput,
    "-filter_complex", filter, "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart", "-t", total.toFixed(2), dest,
  ])
  fs.rmSync(tmp, { recursive: true, force: true })

  if (code !== 0) {
    console.log(`✗ ffmpeg ${code}\n${err.split("\n").slice(-18).join("\n")}`)
    process.exit(1)
  }
  const mb = (fs.statSync(dest).size / 1e6).toFixed(1)
  console.log(`\n✓ ${OUT_FILE}  ${total.toFixed(1)}s  ${mb} MB  (narration ${voLen.toFixed(1)}s from ${VO_START}s)`)
  if (!MUSIC) console.log(`  no music bed — re-run with a track as the 4th argument to mix one in`)
}

main()
