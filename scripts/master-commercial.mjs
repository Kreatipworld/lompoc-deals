#!/usr/bin/env node
/**
 * Masters the finished commercial: WOW picture + narration + the existing music bed.
 *
 * The picture already ships with a synthesised bed mixed to -14 LUFS. Laying voice on top of that
 * without ducking buries the words under the swell at 15.4s, so the bed is side-chained to the
 * narration: it drops ~7dB whenever she speaks and comes back up in the gaps. That is what keeps
 * the riser and the drop audible while never fighting the read.
 *
 * The voice chain is the same one the TV spot used: roll off rumble below 85Hz, lift presence
 * around 3kHz so it cuts through a pad, then a slow limiter so consonants don't spike the mix.
 *
 * VO_START is per-language because the takes are different lengths — the read has to finish before
 * the end card resolves, or the last word lands on black.
 *
 * Usage: node scripts/master-commercial.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const VID = "content/social/video"
const VO = `${VID}/vo`
const OUT = VID

// Cuts to master. Each VO was measured after generation; start times are set so the read ends
// ~0.5s before the picture does, leaving the end card a beat of its own.
const CUTS = [
  // Sterling is the picked English read — an American broadcast voice. At 20.07s it is the
  // shortest take, which leaves the end card 2.3s of its own rather than the 0.8s Emily left.
  { lang: "en", vo: "en-male-sterling.wav", voLen: 20.07, start: 0.75 },
  { lang: "es", vo: "es-male-hugo.wav", voLen: 21.88, start: 0.20 },
]
const SHAPES = [
  { src: "lompoc-locals-features-wow-9x16.mp4", tag: "9x16" },
  { src: "lompoc-locals-features-wow-4x5.mp4", tag: "4x5" },
]

const DUCK_DB = 7 // how far the bed drops under the voice

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
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0
}

async function loudness(file) {
  const { err } = await run(["-i", file, "-af", "ebur128=framelog=quiet", "-f", "null", "-"])
  const i = err.match(/I:\s*(-?[\d.]+) LUFS/)
  const tp = err.match(/Peak:\s*(-?[\d.]+) dBFS/)
  return { i: i ? +i[1] : null, tp: tp ? +tp[1] : null }
}

for (const cut of CUTS) {
  const voPath = path.join(VO, cut.vo)
  if (!fs.existsSync(voPath)) throw new Error(`missing narration ${voPath}`)

  for (const shape of SHAPES) {
    const src = path.join(VID, shape.src)
    if (!fs.existsSync(src)) throw new Error(`missing picture ${src}`)
    const total = await duration(src)
    const ms = Math.round(cut.start * 1000)
    const outFile = path.join(OUT, `lompoc-locals-commercial-${cut.lang}-${shape.tag}.mp4`)

    // [1:a] is the narration, [0:a] the picture's existing bed.
    const filter = [
      `[1:a]highpass=f=85,equalizer=f=3000:t=q:w=1.2:g=3,` +
        `adelay=${ms}|${ms},volume=1.35,alimiter=limit=0.94,asplit=2[vo][key]`,
      `[0:a]volume=0dB[bedraw]`,
      `[bedraw][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350:makeup=1` +
        `,volume=${-DUCK_DB + DUCK_DB}dB[bed]`,
      `[bed][vo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,` +
        `loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
    ].join(";")

    const { code, err } = await run([
      "-y", "-i", src, "-i", voPath,
      "-filter_complex", filter,
      "-map", "0:v", "-map", "[a]",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
      "-t", total.toFixed(2),
      outFile,
    ])
    if (code !== 0) {
      console.error(err.split("\n").slice(-12).join("\n"))
      throw new Error(`mux failed for ${outFile}`)
    }
    const l = await loudness(outFile)
    const mb = (fs.statSync(outFile).size / 1e6).toFixed(1)
    const tail = (total - (cut.start + cut.voLen)).toFixed(2)
    console.log(
      `  ✓ ${path.basename(outFile)}  ${total.toFixed(1)}s  ${mb} MB  ` +
        `I=${l.i} LUFS TP=${l.tp} dBFS  · voice ends ${tail}s before picture`
    )
  }
}
