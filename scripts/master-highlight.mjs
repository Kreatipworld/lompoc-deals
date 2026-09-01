#!/usr/bin/env node
/**
 * Lays the narration into a Highlight of the Week cut.
 *
 * Same voice chain and side-chain as the commercial: the bed drops under the read and swells back
 * in the gaps, so the music is still audible without ever fighting the words.
 *
 * The bit worth knowing is the fit. A generated read lands where it lands — Vargas came back at
 * 20.28s against a 20.0s film — and the tail of a highlight is the URL, which is the one thing that
 * must not be clipped. So when the read is slightly long this nudges the tempo instead of cutting:
 * up to 4% is inaudible on speech, and it buys ~0.8s. Past that it refuses and tells you to shorten
 * the script, because a read sped up 10% sounds like a used-car ad.
 *
 * Usage:
 *   node scripts/master-highlight.mjs <slug>
 *   node scripts/master-highlight.mjs <slug> --vo=content/social/video/vo/x.wav
 */
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const slug = process.argv[2]
if (!slug) throw new Error("usage: master-highlight.mjs <slug> [--vo=path]")
const voArg = (process.argv.find((a) => a.startsWith("--vo=")) || "").slice(5)

const VID = "content/social/video"
const VO_DIR = path.join(VID, "vo")
const SHAPES = ["9x16", "4x5"]

const MAX_TEMPO = 1.04 // beyond this the read stops sounding calm
const HEAD = 0.35 // let the first frame land before anyone speaks
const TAIL = 0.25 // and leave the end card a moment of its own

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

async function loudness(file) {
  const { err } = await run(["-i", file, "-af", "ebur128=framelog=quiet", "-f", "null", "-"])
  const m = err.match(/I:\s*(-?[\d.]+) LUFS/)
  return m ? +m[1] : null
}

const voPath = voArg || path.join(VO_DIR, `highlight-${slug.split("-").slice(0, 2).join("-")}-sterling.wav`)
if (!fs.existsSync(voPath)) throw new Error(`missing narration ${voPath} (pass --vo=…)`)
const voLen = await duration(voPath)

// Either series the renderer produces: the undated Member Spotlight (default) or the weekly slot.
const PREFIXES = ["member-spotlight", "highlight-of-week", "lompoc-spotlight"]
for (const tag of SHAPES) {
  const prefix = PREFIXES.find((pfx) => fs.existsSync(path.join(VID, `${pfx}-${slug}-${tag}.mp4`)))
  if (!prefix) {
    throw new Error(`missing picture for ${slug} (${tag}) — render it first:\n  node scripts/render-highlight-of-week.mjs ${slug}`)
  }
  const src = path.join(VID, `${prefix}-${slug}-${tag}.mp4`)
  const total = await duration(src)
  const budget = total - HEAD - TAIL
  const tempo = voLen > budget ? voLen / budget : 1

  if (tempo > MAX_TEMPO) {
    throw new Error(
      `narration is ${voLen.toFixed(2)}s but only ${budget.toFixed(2)}s fits in the ${total.toFixed(1)}s film.\n` +
        `That needs a ${((tempo - 1) * 100).toFixed(0)}% speed-up, which is audible. Shorten the script instead:\n` +
        `  node scripts/highlight-narration.mjs ${slug} --seconds=${Math.floor(budget)}`
    )
  }

  const ms = Math.round(HEAD * 1000)
  const speed = tempo > 1.001 ? `atempo=${tempo.toFixed(4)},` : ""
  const filter = [
    `[1:a]${speed}highpass=f=85,equalizer=f=3000:t=q:w=1.2:g=3,` +
      `adelay=${ms}|${ms},volume=1.35,alimiter=limit=0.94,asplit=2[vo][key]`,
    `[0:a][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350:makeup=1[bed]`,
    `[bed][vo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,` +
      `loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
  ].join(";")

  const out = path.join(VID, `${prefix}-${slug}-${tag}-vo.mp4`)
  const { code, err } = await run([
    "-y", "-i", src, "-i", voPath,
    "-filter_complex", filter,
    "-map", "0:v", "-map", "[a]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-t", total.toFixed(2), "-movflags", "+faststart", out,
  ])
  if (code !== 0) {
    console.error(err.split("\n").slice(-12).join("\n"))
    throw new Error(`mux failed for ${out}`)
  }

  const l = await loudness(out)
  const spoken = voLen / tempo
  console.log(
    `  ✓ ${path.basename(out)}  ${total.toFixed(1)}s  ` +
      `${(fs.statSync(out).size / 1e6).toFixed(1)} MB  I=${l} LUFS` +
      (tempo > 1.001 ? `  · read nudged ${((tempo - 1) * 100).toFixed(1)}% to fit` : "") +
      `  · ends ${(total - HEAD - spoken).toFixed(2)}s before picture`
  )
}
