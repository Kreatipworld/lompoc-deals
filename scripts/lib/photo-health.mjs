/**
 * Whether an image is fit to be a cover — one definition, shared by the audit and the fixer.
 *
 * These two must never drift: a fixer that scores photos differently from the auditor would
 * "fix" a business into a cover the audit then flags again.
 *
 * Thresholds were measured against a real failure rather than guessed. The first attempt tested
 * each row's min/max spread and caught nothing, because the band that started all this — the top
 * third of Bowl & Soul's old cover — is a dark gradient whose range looks ordinary. Sampling the
 * rows showed the signal is standard deviation: that band ran sd 6-9, while a good photograph of
 * the same subject never dropped below sd 17 except for three rows of blurred counter.
 */
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

/** Below this on the short edge the image is visibly soft even as a thumbnail. */
export const MIN_EDGE = 500
/** A row this uniform carries no detail. */
export const FLAT_SD = 12
/** A detail-less run this deep at the top or bottom is frame the card will cover anyway. */
export const EDGE_BAND_RATIO = 0.22
/** Mostly detail-less overall — an empty image rather than a composed one. */
export const BLANK_ROW_RATIO = 0.5
/** 16:9 is ordinary photography and centre-crops fine; only panoramas and tall strips fail. */
export const MAX_RATIO = 2.4
export const MIN_RATIO = 0.42

export function sd(row) {
  const mean = row.reduce((a, b) => a + b, 0) / row.length
  return Math.sqrt(row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length)
}

/** Decode to a small greyscale grid — enough to find flat bands without decoding full frames. */
export function rowsOf(file, tmpDir, w = 24, h = 30) {
  const out = path.join(tmpDir, `g-${path.basename(file)}.gray`)
  execFileSync(
    ffmpegPath,
    ["-y", "-i", file, "-vf", `scale=${w}:${h}`, "-pix_fmt", "gray", "-f", "rawvideo", out],
    { stdio: "ignore", timeout: 25_000 }
  )
  const buf = fs.readFileSync(out)
  fs.rmSync(out, { force: true })
  return Array.from({ length: h }, (_, y) => [...buf.subarray(y * w, (y + 1) * w)])
}

/** ffmpeg reports dimensions on stderr and exits non-zero when asked for no output. */
export function probeSize(file) {
  try {
    execFileSync(ffmpegPath, ["-i", file, "-hide_banner"], {
      stdio: ["ignore", "ignore", "pipe"], timeout: 25_000,
    })
  } catch (e) {
    const m = String(e.stderr || "").match(/,\s(\d{2,5})x(\d{2,5})[\s,]/)
    if (m) return { w: Number(m[1]), h: Number(m[2]) }
  }
  return null
}

/**
 * @returns {{ size: {w:number,h:number}|null, issues: {issue:string, detail:string}[], detail: number }}
 *   `detail` is mean row standard deviation — how much is actually going on in the picture.
 *   It ranks candidates; the issues decide whether a candidate is eligible at all.
 */
export function evaluate(file, tmpDir) {
  const issues = []
  const size = probeSize(file)
  if (size) {
    const short = Math.min(size.w, size.h)
    if (short < MIN_EDGE) issues.push({ issue: "tiny", detail: `${size.w}x${size.h}` })
    const ratio = size.w / size.h
    if (ratio > MAX_RATIO || ratio < MIN_RATIO)
      issues.push({ issue: "lopsided", detail: `${size.w}x${size.h}` })
  }

  let detail = 0
  try {
    const rows = rowsOf(file, tmpDir)
    const sds = rows.map(sd)
    detail = sds.reduce((a, b) => a + b, 0) / sds.length
    const flatCount = sds.filter((s) => s <= FLAT_SD).length

    let top = 0
    while (top < rows.length && sds[top] <= FLAT_SD) top++
    let bottom = 0
    while (bottom < rows.length && sds[rows.length - 1 - bottom] <= FLAT_SD) bottom++

    if (flatCount / rows.length >= BLANK_ROW_RATIO)
      issues.push({ issue: "blank", detail: `${Math.round((flatCount / rows.length) * 100)}% flat rows` })

    const band = Math.max(top, bottom)
    if (band / rows.length >= EDGE_BAND_RATIO) {
      const parts = []
      if (top) parts.push(`${Math.round((top / rows.length) * 100)}% top`)
      if (bottom) parts.push(`${Math.round((bottom / rows.length) * 100)}% bottom`)
      issues.push({ issue: "letterboxed", detail: parts.join(" + ") })
    }
  } catch {
    /* undecodable — the size check has already spoken, or ffmpeg won't read the format */
  }

  return { size, issues, detail }
}

/** Higher is better. Anything with an issue is unusable as a cover, whatever it scores. */
export function coverScore({ size, issues, detail }) {
  if (issues.length) return -1
  const short = size ? Math.min(size.w, size.h) : 0
  // Resolution matters up to the point a card is filled (1080); past that, detail decides.
  return Math.min(short, 1080) + detail * 8
}
