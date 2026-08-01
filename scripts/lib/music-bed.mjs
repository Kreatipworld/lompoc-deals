/**
 * A chord-scheduled music bed, synthesised from ffmpeg oscillators.
 *
 * This is `scripts/make-music-bed.mjs` generalised. That script loops one fixed I–V–vi–IV
 * progression out to length and fades it wherever the fade happens to land; the same voicing
 * is used here (root + octave + third + fifth, every voice doubled a fraction of a hertz off
 * so it beats slowly and reads as chorus rather than as a test tone), but the progression is
 * given as a schedule instead. Two things fall out of that:
 *
 *   - the chords can change on the picture cuts, which is the whole reason the bed is here —
 *     a cut that lands on a chord change reads as intended rather than as an edit;
 *   - the last chord can be the tonic with its own release, so the piece finishes instead of
 *     being faded out mid-phrase at whatever bar the runtime happens to end on.
 *
 * Original by construction: oscillators, no sample library, no licence, no attribution.
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const SR = 48000
const DETUNE = 0.55 // Hz offset on the doubled voice — slow beating, reads as chorus
// Lower voices louder, upper voices quieter — otherwise the top of the chord dominates.
const VOICE_GAIN = [0.5, 0.34, 0.22, 0.18]

/** A major. Root, octave up, third, fifth. */
export const CHORDS = {
  A: [110.0, 220.0, 277.18, 329.63],
  E: [82.41, 164.81, 207.65, 246.94],
  "F#m": [92.5, 185.0, 220.0, 277.18],
  D: [73.42, 146.83, 185.0, 220.0],
}

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

const tailOf = (err, n = 8) => err.split("\n").slice(-n).join("\n")

/** One chord, swelling in and releasing out, rendered long enough to overlap the next. */
async function renderChord(freqs, seconds, fadeIn, fadeOut, dest) {
  const inputs = []
  const filters = []
  const labels = []
  let n = 0
  freqs.forEach((f, i) => {
    // A different beat rate per voice. Detuning every voice by the same interval makes the
    // whole chord swell and null together — a hole every couple of seconds that reads as a
    // dropout. Spread the rates and the same trick becomes chorus.
    for (const freq of [f, f + DETUNE * (1 + i * 0.41)]) {
      inputs.push("-f", "lavfi", "-i",
        `sine=frequency=${freq.toFixed(3)}:sample_rate=${SR}:duration=${seconds.toFixed(3)}`)
      filters.push(`[${n}:a]volume=${(VOICE_GAIN[i] / 2).toFixed(3)}[v${n}]`)
      labels.push(`[v${n}]`)
      n++
    }
  })
  filters.push(
    `${labels.join("")}amix=inputs=${n}:normalize=0[sum]`,
    `[sum]afade=t=in:st=0:d=${fadeIn.toFixed(2)}:curve=ipar,` +
      `afade=t=out:st=${Math.max(0, seconds - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(2)}:curve=ipar,` +
      `lowpass=f=1600,highpass=f=55[out]`
  )
  const { code, err } = await run([
    "-y", ...inputs, "-filter_complex", filters.join(";"),
    "-map", "[out]", "-ac", "2", "-ar", String(SR), dest,
  ])
  if (code !== 0) throw new Error(`chord render failed (${code})\n${tailOf(err)}`)
}

/**
 * A soft bell for a picture cut — one partial plus its octave, struck and left to decay.
 *
 * Pitched from the chord it lands on, so it reads as part of the harmony rather than as a
 * click track sitting on top of it.
 */
async function renderAccent(freq, dest, seconds = 1.6) {
  const { code, err } = await run([
    "-y",
    "-f", "lavfi", "-i", `sine=frequency=${freq.toFixed(2)}:sample_rate=${SR}:duration=${seconds}`,
    "-f", "lavfi", "-i", `sine=frequency=${(freq * 2).toFixed(2)}:sample_rate=${SR}:duration=${seconds}`,
    "-filter_complex",
      `[0:a]volume=0.70[a0];[1:a]volume=0.20[a1];[a0][a1]amix=inputs=2:normalize=0,` +
      `afade=t=in:st=0:d=0.014,afade=t=out:st=0:d=${seconds}:curve=exp,lowpass=f=4200[out]`,
    "-map", "[out]", "-ac", "2", "-ar", String(SR), dest,
  ])
  if (code !== 0) throw new Error(`accent render failed (${code})\n${tailOf(err)}`)
}

/** Measured loudness of a file, via ebur128 — there is no ffprobe in this repo. */
export async function measureLoudness(file) {
  const { err } = await run(["-hide_banner", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"])
  // ebur128 prints a running meter and then a summary; the running meter's very first frame
  // reads about -70 LUFS, so take the LAST match — the summary — not the first.
  const grab = (label) => {
    const all = [...err.matchAll(new RegExp(`${label}:\\s*(-?[\\d.]+|-inf)\\s*(LUFS|LU|dBFS)`, "g"))]
    return all.length ? Number(all[all.length - 1][1]) : null
  }
  return { I: grab("I"), LRA: grab("LRA"), peak: grab("Peak") }
}

/**
 * Builds the bed.
 *
 * `schedule` is `[{ chord, dur }]` in play order; `total` is the exact runtime the picture
 * needs. Every chord but the last is rendered with a tail past its own slot so it crossfades
 * into the next one; the last is rendered with a long release that lands on `total`.
 */
export async function buildBed({
  out,
  schedule,
  total,
  lufs = -14,
  accentDb = -20,
  accentAt = [],
  tail = 1.2,
  quiet = false,
}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bed-"))
  const log = (s) => { if (!quiet) console.log(s) }
  try {
    const starts = []
    let acc = 0
    for (const s of schedule) { starts.push(acc); acc += s.dur }

    // Each chord is struck a little BEFORE its slot and released a little after it, so its
    // swell is already at full by the time the picture cuts. Starting it on the seam instead
    // left an audible hole at every cut — the outgoing chord releasing into an incoming one
    // that hadn't arrived yet.
    const lead = Math.min(0.6, tail / 2)
    const chordFiles = []
    const offsets = []
    for (const [i, step] of schedule.entries()) {
      const last = i === schedule.length - 1
      const at = i === 0 ? 0 : starts[i] - lead
      const len = last ? total - at : step.dur + tail + (i === 0 ? 0 : lead)
      const f = path.join(tmp, `c${i}.wav`)
      await renderChord(
        CHORDS[step.chord],
        len,
        i === 0 ? 1.4 : 0.7,
        // The final chord gets a long release so the piece resolves instead of stopping.
        last ? Math.min(len, 2.3) : tail + 0.35,
        f
      )
      chordFiles.push(f)
      offsets.push(at)
    }

    const accentFiles = []
    for (const [k, a] of accentAt.entries()) {
      const f = path.join(tmp, `a${k}.wav`)
      // Two octaves above the chord's third — high enough to read over the pad, quiet enough
      // that it registers as an edge on the cut and not as a note.
      await renderAccent(CHORDS[a.chord][2] * 4, f)
      accentFiles.push({ f, at: a.at })
    }

    const inputs = []
    const filters = []
    const labels = []
    chordFiles.forEach((f, i) => {
      const ms = Math.round(offsets[i] * 1000)
      inputs.push("-i", f)
      filters.push(`[${inputs.length / 2 - 1}:a]adelay=${ms}|${ms}[c${i}]`)
      labels.push(`[c${i}]`)
    })
    accentFiles.forEach(({ f, at }, k) => {
      const ms = Math.round(at * 1000)
      inputs.push("-i", f)
      filters.push(`[${inputs.length / 2 - 1}:a]adelay=${ms}|${ms},volume=${accentDb}dB[k${k}]`)
      labels.push(`[k${k}]`)
    })

    filters.push(
      `${labels.join("")}amix=inputs=${labels.length}:duration=longest:dropout_transition=0:normalize=0,` +
        // Echo for depth, a hair of tremolo for life, then a lid on the top so the pad sits
        // under a voice or under silence without ever getting shrill.
        `aecho=0.7:0.6:340|620:0.26|0.16,tremolo=f=0.22:d=0.08,` +
        `lowpass=f=2200,highpass=f=48,` +
        `apad,atrim=0:${total.toFixed(3)},asetpts=N/SR/TB,` +
        `afade=t=in:st=0:d=1.2,afade=t=out:st=${(total - 0.25).toFixed(3)}:d=0.25[out]`
    )

    const raw = path.join(tmp, "raw.wav")
    let r = await run(["-y", ...inputs, "-filter_complex", filters.join(";"),
      "-map", "[out]", "-ac", "2", "-ar", String(SR), raw])
    if (r.code !== 0) throw new Error(`bed mix failed (${r.code})\n${tailOf(r.err, 14)}`)

    // Measure, then apply the exact gain that lands on the target — rather than loudnorm,
    // which lands about half a LU off here and would then have to be quoted with a caveat.
    // A pad has no transients to tame, so a straight gain is honest: the level moves, the
    // dynamics don't. The limiter is a backstop, not part of the sound.
    const before = await measureLoudness(raw)
    let gain = lufs - before.I
    const headroom = -1 - (before.peak + gain)
    if (headroom < 0) gain += headroom // never push true peak past -1 dBTP

    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
    r = await run(["-y", "-i", raw, "-af",
      `volume=${gain.toFixed(3)}dB,alimiter=limit=0.94:level=disabled`, "-ac", "2", "-ar", String(SR), out])
    if (r.code !== 0) throw new Error(`gain stage failed (${r.code})\n${tailOf(r.err, 14)}`)

    const m = await measureLoudness(out)
    log(`  bed ${schedule.map((s) => s.chord).join(" · ")} — ${total.toFixed(1)}s, ` +
      `${m.I} LUFS integrated, peak ${m.peak} dBFS`)
    return m
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}
