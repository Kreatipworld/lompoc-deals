#!/usr/bin/env node
/**
 * Final cut: generated intro B-roll + title plate + the screen-recording body + voiceover.
 *
 *   intro.mp4 (Higgsfield, 720x1280)  ─┐
 *   title.png (transparent overlay)   ─┼─► scaled to 1080x1920, title fades in, cross-fades
 *   body.mp4  (rendered screens)      ─┘   into the body, voiceover laid across the whole thing
 *
 * Usage: node scripts/assemble-signup-video.mjs <assetsDir> <bodyDir> <outDir> [locals|business]
 */
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const ASSETS = process.argv[2]
const BODY = process.argv[3]
const OUT = process.argv[4] || "content/social/video"
const ONLY = process.argv[5]

const CUTS = {
  locals: {
    intro: "intro-locals.mp4",
    title: "title-locals.png",
    vo: "vo-locals.wav",
    body: "lompoc-locals-signup.mp4",
    out: "lompoc-locals-signup.mp4",
  },
  business: {
    intro: "intro-business.mp4",
    title: "title-business.png",
    vo: "vo-business.wav",
    body: "lompoc-locals-claim.mp4",
    out: "lompoc-locals-claim.mp4",
  },
}

const INTRO_LEN = 4.6 // seconds of B-roll kept before the cross-fade into the UI
const XFADE = 0.6 // cross-fade between intro and body
const VO_DELAY_MS = 900 // let the shot breathe before the narration starts

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

/** ffmpeg reports duration on stderr; there's no ffprobe in ffmpeg-static. */
async function duration(file) {
  const { err } = await run(["-i", file])
  const m = err.match(/Duration: (\d+):(\d+):([\d.]+)/)
  if (!m) throw new Error(`could not read duration of ${file}`)
  return +m[1] * 3600 + +m[2] * 60 + +m[3]
}

fs.mkdirSync(OUT, { recursive: true })

for (const key of ONLY ? [ONLY] : Object.keys(CUTS)) {
  const c = CUTS[key]
  const intro = path.join(ASSETS, c.intro)
  const title = path.join(ASSETS, c.title)
  const vo = path.join(ASSETS, c.vo)
  const body = path.join(BODY, c.body)
  for (const f of [intro, title, vo, body]) {
    if (!fs.existsSync(f)) throw new Error(`missing input: ${f}`)
  }

  const bodyLen = await duration(body)
  const voLen = await duration(vo)
  const total = INTRO_LEN - XFADE + bodyLen
  const dest = path.join(OUT, c.out)

  const filter = [
    // Intro: upscale the 720x1280 generation to frame, hold 30fps, fade up from black.
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,` +
      `trim=0:${INTRO_LEN},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.6[bro]`,
    // Title plate fades in over the B-roll, then out just before the cut.
    `[2:v]format=rgba,fps=30,loop=loop=-1:size=1,trim=0:${INTRO_LEN},setpts=PTS-STARTPTS,` +
      `fade=t=in:st=0.5:d=0.7:alpha=1,fade=t=out:st=${(INTRO_LEN - 0.8).toFixed(2)}:d=0.6:alpha=1[ttl]`,
    `[bro][ttl]overlay=0:0:format=auto[intro]`,
    `[1:v]fps=30,setpts=PTS-STARTPTS[body]`,
    `[intro][body]xfade=transition=fade:duration=${XFADE}:offset=${(INTRO_LEN - XFADE).toFixed(2)}[v]`,
    // Narration starts after the establishing shot, then silence is padded to the full length.
    `[3:a]adelay=${VO_DELAY_MS}|${VO_DELAY_MS},volume=1.6,apad,atrim=0:${total.toFixed(2)},` +
      `asetpts=PTS-STARTPTS[a]`,
  ].join(";")

  const args = [
    "-y",
    "-i", intro,
    "-i", body,
    "-loop", "1", "-i", title,
    "-i", vo,
    "-filter_complex", filter,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart",
    "-t", total.toFixed(2),
    dest,
  ]

  const { code, err } = await run(args)
  if (code !== 0) {
    console.log(`✗ ${key} — ffmpeg exited ${code}\n${err.split("\n").slice(-14).join("\n")}`)
    continue
  }
  const mb = (fs.statSync(dest).size / 1e6).toFixed(1)
  console.log(
    `✓ ${c.out}  ${total.toFixed(1)}s  ${mb} MB  ` +
      `(intro ${INTRO_LEN}s + body ${bodyLen.toFixed(1)}s · vo ${voLen.toFixed(1)}s @ +${VO_DELAY_MS}ms)`
  )
}
