#!/usr/bin/env node
/**
 * Synthesises an original looping music bed for the spot.
 *
 * Every royalty-free library blocks automated download, and Higgsfield's music model is
 * locked to their game pipeline — so the bed is built here from oscillators instead. It is
 * original by construction: no licence, no attribution, no rights exposure.
 *
 * Musically it's a I–V–vi–IV pad in A major, the standard warm/uplifting progression, with
 * each chord voiced as root + octave + third + fifth. Each voice is doubled a fraction of a
 * hertz off to get chorus movement, because pure sines sound like a test tone. A lowpass
 * takes the edge off, and a short echo gives it room.
 *
 * Usage: node scripts/make-music-bed.mjs <outFile.wav> [totalSeconds]
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const OUT = process.argv[2] || "music-bed.wav"
const TOTAL = Number(process.argv[3] || 30)

const CHORD_SECONDS = 3.6
const SR = 48000
const DETUNE = 0.55 // Hz offset on the doubled voice — slow beating, reads as chorus

// I – V – vi – IV in A major. Root, octave up, third, fifth.
const CHORDS = [
  { name: "A", freqs: [110.0, 220.0, 277.18, 329.63] },
  { name: "E", freqs: [82.41, 164.81, 207.65, 246.94] },
  { name: "F#m", freqs: [92.5, 185.0, 220.0, 277.18] },
  { name: "D", freqs: [73.42, 146.83, 185.0, 220.0] },
]

// Lower voices louder, upper voices quieter — otherwise the top of the chord dominates.
const VOICE_GAIN = [0.5, 0.34, 0.22, 0.18]

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

async function renderChord(chord, dest) {
  const inputs = []
  const filters = []
  const labels = []
  let n = 0

  chord.freqs.forEach((f, i) => {
    for (const freq of [f, f + DETUNE]) {
      inputs.push("-f", "lavfi", "-i",
        `sine=frequency=${freq.toFixed(3)}:sample_rate=${SR}:duration=${CHORD_SECONDS}`)
      filters.push(`[${n}:a]volume=${(VOICE_GAIN[i] / 2).toFixed(3)}[v${n}]`)
      labels.push(`[v${n}]`)
      n++
    }
  })

  filters.push(
    `${labels.join("")}amix=inputs=${n}:normalize=0[sum]`,
    // Slow swell in and out so chords breathe into each other instead of clicking.
    `[sum]afade=t=in:st=0:d=1.1:curve=ipar,` +
      `afade=t=out:st=${(CHORD_SECONDS - 1.3).toFixed(2)}:d=1.3:curve=ipar,` +
      `lowpass=f=1600,highpass=f=55[out]`
  )

  const { code, err } = await run([
    "-y", ...inputs, "-filter_complex", filters.join(";"),
    "-map", "[out]", "-ac", "2", "-ar", String(SR), dest,
  ])
  if (code !== 0) throw new Error(`chord ${chord.name} failed (${code})\n${err.split("\n").slice(-6).join("\n")}`)
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bed-"))
  console.log(`building bed — ${CHORDS.map((c) => c.name).join(" · ")} @ ${CHORD_SECONDS}s each`)

  const files = []
  for (const [i, chord] of CHORDS.entries()) {
    const f = path.join(tmp, `c${i}.wav`)
    await renderChord(chord, f)
    files.push(f)
  }

  // One pass of the progression, then loop it out to length.
  const listFile = path.join(tmp, "list.txt")
  fs.writeFileSync(listFile, files.map((f) => `file '${f}'`).join("\n"))
  const loopOnce = path.join(tmp, "loop.wav")
  let r = await run(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", loopOnce])
  if (r.code !== 0) throw new Error("concat failed")

  const reps = Math.ceil(TOTAL / (CHORD_SECONDS * CHORDS.length))
  r = await run([
    "-y", "-stream_loop", String(reps), "-i", loopOnce,
    "-af",
      // Echo for depth, a hair of tremolo for life, then normalise to a predictable level
      // so the mix stage can place it at a known dB.
      "aecho=0.7:0.6:340|620:0.28|0.18," +
      "tremolo=f=0.22:d=0.10," +
      "lowpass=f=2000," +
      `atrim=0:${TOTAL.toFixed(2)},` +
      "afade=t=in:st=0:d=2,afade=t=out:st=" + (TOTAL - 3).toFixed(2) + ":d=3," +
      "loudnorm=I=-20:TP=-3:LRA=7",
    "-ac", "2", "-ar", String(SR), OUT,
  ])
  fs.rmSync(tmp, { recursive: true, force: true })
  if (r.code !== 0) throw new Error(`final pass failed\n${r.err.split("\n").slice(-10).join("\n")}`)

  const mb = (fs.statSync(OUT).size / 1e6).toFixed(1)
  console.log(`✓ ${OUT}  ${TOTAL}s  ${mb} MB  (${reps + 1} passes of a ${(CHORD_SECONDS * CHORDS.length).toFixed(1)}s loop)`)
}

main()
