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
 * Usage: node scripts/build-ad-masters.mjs [srcMp4] [outDir]
 */
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const SRC = process.argv[2] || "content/social/video/lompoc-locals-spot.mp4"
const OUT = process.argv[3] || "content/social/video/masters"

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
    name: "lompoc-locals-spot-MASTER.mp4",
    label: "master 1080x1920",
    vf: null,
    v: ["-c:v", "libx264", "-preset", "slower", "-crf", "16", "-pix_fmt", "yuv420p"],
  },
  {
    name: "lompoc-locals-spot-9x16.mp4",
    label: "9:16 reels/tiktok/shorts",
    vf: null,
    v: ["-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p"],
  },
  {
    name: "lompoc-locals-spot-4x5.mp4",
    label: "4:5 ig/fb feed",
    vf: "crop=1080:1350:0:(ih-1350)/2",
    v: ["-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p"],
  },
  {
    name: "lompoc-locals-spot-1x1.mp4",
    label: "1:1 square",
    // Not a centred crop: the end card's logo sits above frame centre, and a true centre
    // crop clips the gold dot off the top of the mark. 360 keeps the whole lockup and the
    // URL button — verified frame by frame at 300/360/420.
    vf: "crop=1080:1080:0:360",
    v: ["-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p"],
  },
  {
    name: "lompoc-locals-spot-16x9.mp4",
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

  for (const t of TARGETS) {
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

  // Poster: a frame from the opening title, which is the strongest single image in the cut.
  const poster = path.join(OUT, "lompoc-locals-spot-poster.jpg")
  await run(["-y", "-ss", "1.6", "-i", SRC, "-frames:v", "1", "-q:v", "2", poster])
  console.log(`  ✓ ${path.basename(poster).padEnd(34)} 1080x1920  ${(fs.statSync(poster).size / 1e6).toFixed(1)} MB   poster frame`)
}

main()
