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
import { CAPTIONS } from "./make-spot-captions.mjs"

const ASSETS = process.argv[2]
const FRAMES = process.argv[3]
const OUT = process.argv[4] || "docs/social-kit/video"
const MUSIC = process.argv[5] || null

const OUT_FILE = "lompoc-locals-spot.mp4"
const VO = "vo-spot.mp3"
const VO_START = 0.4 // narration runs the whole film — no silent stretches to sit through
const XFADE = 0.55
const AMBIENCE_DB = -15 // under the voice, present but never competing
const MUSIC_DB = -5 // the generated bed is already normalised to -20 LUFS, so it needs far
                    // less attenuation than a commercial track would

// Ordered so each shot is on screen while the narration names it. Phrase timings came from
// silencedetect over the VO: "flower fields" 1.6-3.2s, "main street" 3.4-5.6s, "wineries"
// 5.9-8.4s, "rockets" 8.7-10.5s. Durations below place each cut inside its phrase.
// No checkout beat — this is a brand spot about the town, not a how-to.
const ITEMS = [
  { clip: "lpc-aerial.mp4", dur: 2.2, title: "title-experience.png" }, // "This is Lompoc."
  { clip: "lpc-flowers.mp4", dur: 2.6 },  // "Flower fields in June."
  { clip: "lpc-oldtown.mp4", dur: 2.8 },  // "A main street you can walk end to end."
  { clip: "broll-wine.mp4", dur: 2.8 },   // "Wineries you don't have to drive an hour to reach."
  { clip: "broll-rocket.mp4", dur: 3.0 }, // "Rockets going up over the valley."
  { clip: "broll-shop.mp4", dur: 2.4 },   // "Everything you love about this town..."
  { clip: "broll-tacos.mp4", dur: 2.4 },
  { clip: "lpc-rail.mp4", dur: 2.6 },     // "...couldn't find it in one place. Now you can."
  {
    // The only product beat — what it is, not how to use it. Punches, never a scroll.
    ui: [
      { img: "home", dur: 2.6, from: 0.04, to: 0.04, move: "punch", caption: "Every business in town." },
      { img: "events", dur: 2.4, from: 0.06, to: 0.06, move: "punch", caption: "Every event. Every launch." },
    ],
  },
  { clip: "broll-dusk.mp4", dur: 2.6 },
  { ui: [{ img: "endcard-experience", dur: 4.2, from: 0, to: 0, zoom: 1.05, fullBleed: true }] },
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

  // Voice chain: roll off rumble below 85Hz, lift presence around 3kHz so it cuts through
  // the bed, then even it out with a gentle compressor before it hits the mix.
  const audioBits = [
    ...ambFilters,
    `[${parts.length}:a]aformat=channel_layouts=stereo:sample_rates=48000,` +
      `highpass=f=85,equalizer=f=3000:width_type=o:width=1.4:g=2.5,` +
      `equalizer=f=250:width_type=o:width=1:g=-1.5,` +
      `acompressor=threshold=-20dB:ratio=3:attack=6:release=140:makeup=2,` +
      `adelay=${voMs}|${voMs},volume=1.7,asplit=2[vo][vokey]`,
  ]
  const mixLabels = [...ambLabels, "[vo]"]

  let musicInput = []
  if (MUSIC && fs.existsSync(MUSIC)) {
    const idx = parts.length + 1 + ambCount
    musicInput = ["-i", MUSIC]
    // Side-chained to the voice: the bed drops ~5dB whenever she speaks and swells back in
    // the gaps. This is what stops music and narration from fighting each other.
    audioBits.push(
      `[${idx}:a]aformat=channel_layouts=stereo:sample_rates=48000,` +
        `atrim=0:${total.toFixed(2)},afade=t=in:st=0:d=1.5,` +
        `afade=t=out:st=${(total - 2).toFixed(2)}:d=2,volume=${MUSIC_DB}dB[musraw]`,
      `[musraw][vokey]sidechaincompress=threshold=0.05:ratio=4:attack=12:release=320:makeup=1[mus]`
    )
    mixLabels.push("[mus]")
    console.log(`  music ${path.basename(MUSIC)} at ${MUSIC_DB}dB`)
  }

  // Master bus: sum, then normalise to -14 LUFS with -1dBTP, which is what the social
  // platforms target — anything hotter just gets turned down on playback.
  audioBits.push(
    `${mixLabels.join("")}amix=inputs=${mixLabels.length}:duration=longest:dropout_transition=0:normalize=0,` +
      `atrim=0:${total.toFixed(2)},` +
      `loudnorm=I=-14:TP=-1:LRA=9,` +
      `alimiter=limit=0.97[a]`
  )

  // Caption plates ride on top of the cross-faded picture, each fading in and out around
  // its phrase. Inputs come after video, narration, ambience and music.
  const capDir = path.join(ASSETS, "captions")
  const capInputs = []
  const capFilters = []
  let capCount = 0 // count INPUTS, not array slots — each caption pushes "-loop","1","-i",png
  let capLabel = "vbase"
  const capBase = parts.length + 1 + ambCount + (musicInput.length ? 1 : 0)
  capFilters.push(
    `[vmix]fade=t=in:st=0:d=0.8,fade=t=out:st=${(total - 0.8).toFixed(2)}:d=0.8[vbase]`
  )
  CAPTIONS.forEach((c, i) => {
    const png = path.join(capDir, `${c.id}.png`)
    if (!fs.existsSync(png)) return
    const idx = capBase + capCount
    capCount++
    capInputs.push("-loop", "1", "-i", png)
    const dur = c.end - c.start
    // The trailing setpts shifts this caption's frames to its own start time. Without it the
    // overlay stream runs from t=0, so by the time the enable window opens it has ended and
    // eof_action=pass silently shows nothing.
    capFilters.push(
      `[${idx}:v]format=rgba,fps=${FPS},trim=0:${dur.toFixed(2)},setpts=PTS-STARTPTS,` +
        `fade=t=in:st=0:d=0.25:alpha=1,fade=t=out:st=${Math.max(0, dur - 0.3).toFixed(2)}:d=0.3:alpha=1,` +
        `setpts=PTS+${c.start.toFixed(2)}/TB[c${i}]`
    )
    const next = i === CAPTIONS.length - 1 ? "v" : `vc${i}`
    capFilters.push(
      `[${capLabel}][c${i}]overlay=0:0:enable='between(t,${c.start.toFixed(2)},${c.end.toFixed(2)})':` +
        `x=0:y=0:eof_action=pass[${next}]`
    )
    capLabel = next
  })
  if (capLabel === "vbase") capFilters.push(`[vbase]null[v]`)

  const filter = [...chain, ...capFilters, ...audioBits].join(";")

  const dest = path.join(OUT, OUT_FILE)
  const { code, err } = await run([
    "-y", ...inputs, "-i", voPath, ...ambInputs, ...musicInput, ...capInputs,
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
