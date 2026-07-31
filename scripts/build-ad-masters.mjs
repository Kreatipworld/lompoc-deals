#!/usr/bin/env node
/**
 * Builds the delivery set from the finished spot: one high-bitrate master plus the aspect
 * ratios each placement actually wants, and a poster frame.
 *
 *   master  1080x1920  CRF 16   archive / re-edit source
 *   9x16    1080x1920  CRF 20   Reels, TikTok, Stories, YouTube Shorts
 *   4x5     1080x1350           Instagram + Facebook feed (largest feed real estate)
 *   1x1     1080x1080           square feed placements, some ad units
 *   16x9    1920x1080           YouTube, web hero, anything landscape
 *   poster  1080x1920 JPG       thumbnail / first-frame
 *
 * 4:5 and 1:1 centre-crop, which is safe because the spot keeps its subjects centred and its
 * captions inside the middle band. 16:9 cannot crop — a centre slice of a vertical frame
 * throws away most of the picture — so it sits the full frame over a blurred fill of itself,
 * which is what every platform's own auto-reframe does.
 *
 * Output names derive from the source basename, so this can run over any cut without
 * overwriting another one's variants.
 *
 * Usage:
 *   node scripts/build-ad-masters.mjs [srcMp4] [outDir]
 *   node scripts/build-ad-masters.mjs content/social/video/x.mp4 out --only=4x5
 */
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const SRC = process.argv[2] || "content/social/video/lompoc-locals-spot.mp4"
const OUT = process.argv[3]?.startsWith("--") ? "content/social/video/masters" : process.argv[3] || "content/social/video/masters"
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean)
// Variant filenames hang off the source name, not a hardcoded one.
const STEM = path.basename(SRC, path.extname(SRC))

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

// Audio is already mastered to -14 LUFS in the source; re-encoding it again would only
// stack another lossy generation on top, so every variant copies the same AAC settings
// from the same decode rather than re-normalising.
const AUDIO = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"]

const TARGETS = [
  {
    key: "MASTER",
    name: `${STEM}-MASTER.mp4`,
    label: "master 1080x1920",
    vf: null,
    v: ["-c:v", "libx264", "-preset", "slower", "-crf", "16", "-pix_fmt", "yuv420p"],
  },
  {
    key: "9x16",
    name: `${STEM}-9x16.mp4`,
    label: "9:16 reels/tiktok/shorts",
    vf: null,
    v: ["-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p"],
  },
  {
    key: "4x5",
    name: `${STEM}-4x5.mp4`,
    label: "4:5 ig/fb feed",
    vf: "crop=1080:1350:0:(ih-1350)/2",
    v: ["-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p"],
  },
  {
    key: "1x1",
    name: `${STEM}-1x1.mp4`,
    label: "1:1 square",
    // Not a centred crop: the end card's logo sits above frame centre, and a true centre
    // crop clips the gold dot off the top of the mark. 360 keeps the whole lockup and the
    // URL button — verified frame by frame at 300/360/420.
    vf: "crop=1080:1080:0:360",
    v: ["-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p"],
  },
  {
    key: "16x9",
    name: `${STEM}-16x9.mp4`,
    label: "16:9 youtube/web",
    // Blurred fill behind the untouched vertical frame — nothing is cropped away.
    vf:
      "split=2[bg][fg];" +
      "[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080," +
      "gblur=sigma=42,eq=brightness=-0.09:saturation=0.7[bgo];" +
      "[fg]scale=-2:1080[fgo];" +
      "[bgo][fgo]overlay=(W-w)/2:0",
    v: ["-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p"],
    complex: true,
  },
]

async function main() {
  if (!fs.existsSync(SRC)) throw new Error(`missing source ${SRC}`)
  fs.mkdirSync(OUT, { recursive: true })
  console.log(`source: ${SRC}\n`)

  const targets = ONLY.length ? TARGETS.filter((t) => ONLY.includes(t.key)) : TARGETS
  if (!targets.length) throw new Error(`--only matched nothing; keys are ${TARGETS.map((t) => t.key).join(", ")}`)

  for (const t of targets) {
    const dest = path.join(OUT, t.name)
    const args = ["-y", "-i", SRC]
    if (t.complex) args.push("-filter_complex", t.vf)
    else if (t.vf) args.push("-vf", t.vf)
    args.push(...t.v, ...AUDIO, "-movflags", "+faststart", dest)

    const { code, err } = await run(args)
    if (code !== 0) {
      console.log(`  ✗ ${t.name} — ffmpeg ${code}\n${err.split("\n").slice(-8).join("\n")}`)
      continue
    }
    const { err: probe } = await run(["-i", dest])
    const dim = (probe.match(/, (\d+x\d+)[ ,]/) || [])[1] ?? "?"
    const mb = (fs.statSync(dest).size / 1e6).toFixed(1)
    console.log(`  ✓ ${t.name.padEnd(34)} ${dim.padEnd(10)} ${mb.padStart(5)} MB   ${t.label}`)
  }

  if (ONLY.length) return // a subset build is for one placement, not the whole delivery set

  // Poster: a frame from the opening title, which is the strongest single image in the cut.
  const poster = path.join(OUT, `${STEM}-poster.jpg`)
  await run(["-y", "-ss", "1.6", "-i", SRC, "-frames:v", "1", "-q:v", "2", poster])
  console.log(`  ✓ ${path.basename(poster).padEnd(34)} 1080x1920  ${(fs.statSync(poster).size / 1e6).toFixed(1)} MB   poster frame`)
}

main()
