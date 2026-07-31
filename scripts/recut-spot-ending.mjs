#!/usr/bin/env node
/**
 * Recuts the ending of the brand spot so the word "locals" stops landing four times in
 * four seconds.
 *
 * The problem, measured off the finished file (the source B-roll, UI frames and vo-spot.mp3
 * are gone — only the MP4s survive, so this works on the mastered mix):
 *
 *   voice-band RMS envelope, 300–3400 Hz, 50 ms windows
 *     22.30 – 23.20   "Come find your town."
 *     23.65 – 24.60   "Lompoc Locals."          ← 1
 *     25.00 – 26.05   "Made by locals,"         ← 2
 *     26.40 – 26.90   "for locals."             ← 3
 *   plus the LOCALS wordmark and a printed "Made by locals, for locals 💜" on the end card.
 *
 * The fix has to be subtractive: there is no TTS key on this machine, so no new words can be
 * spoken. So the mix is faded out inside the 0.4 s pause that already sits between "Locals."
 * and "Made", and the end card is swapped for #endcard-experience-clean, which is the same
 * card without the footer line. The narration now closes on "Lompoc Locals."
 *
 * The new end card cannot simply be laid over the old one. The finished file already contains
 * the old card cross-fading up from 22.90 s, and the clean card's stack sits ~49 px lower
 * (it is optically centred without the footer), so an overlay double-exposes the headline for
 * half a second. Instead the film is cut at frame 686 — the last frame before the old card
 * appears at all — and the valley photo underneath it is continued from that frame with its
 * own Ken Burns rate (1.12× over 2.6 s) so there is clean picture to cross-fade out of. The
 * new card then fades in on the original timings: offset 22.90 s, 0.55 s, linear 1.00→1.05
 * push measured across the original 4.2 s beat.
 *
 * Usage: node scripts/recut-spot-ending.mjs [srcMp4] [outMp4]
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn, execFileSync } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const SRC = process.argv[2] || "content/social/video/masters/lompoc-locals-spot-MASTER.mp4"
const OUT = process.argv[3] || "content/social/video/lompoc-locals-spot-v2.mp4"
const CARD_HTML = "content/social/cards/cards-experience.html"
const CARD_ID = "endcard-experience-clean"

const FPS = 30
const W = 1080
const H = 1920

// Every number below is in seconds on the original 27.10 s timeline.
const CARD_IN = 687 / 30 // 22.90 — frame 687 is the first frame carrying the old end card
const XFADE = 0.55
const CARD_BEAT = 4.2 // the original end-card segment's full length — sets the zoom rate
const CARD_ZOOM = 1.05
// The shot under the cross-fade: real-valley.jpg, part 10 of the cut — 2.6 s long, 1.12× push,
// entering the timeline at 20.85 s. Continuing it needs its rate at the cut, not from zero.
const PHOTO_IN = 20.85
const PHOTO_DUR = 2.6
const PHOTO_ZOOM = 1.12
const TAIL = 0.9 // clean picture rendered past the cut, so xfade never runs out of input
const TOTAL = 25.8 // new length: the card holds, then fades, and nothing is spoken over it
const VO_FADE_AT = 24.58 // "Locals." has decayed; "Made by locals" has not started
const VO_FADE_LEN = 0.42 // silent by 25.00, which is the exact frame the next word began
const PIC_FADE_AT = 25.0
const PIC_FADE_LEN = 0.8

const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

/** Shoot one card out of the deck, same flags the rest of the social kit is rendered with. */
function renderCard(tmp) {
  const html = fs
    .readFileSync(CARD_HTML, "utf8")
    .replace(
      "</style>",
      `.card{display:none !important;}
       [id="${CARD_ID}"]{display:block !important; margin:0 !important;}
       body{background:#fff; margin:0;}</style>`
    )
  const page = path.join(tmp, "card.html")
  const png = path.join(tmp, "card.png")
  fs.writeFileSync(page, html)
  execFileSync(
    CHROME,
    [
      "--headless=new", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=1", "--default-background-color=00000000",
      "--virtual-time-budget=8000", `--window-size=${W},${H}`,
      `--screenshot=${png}`, `file://${page}`,
    ],
    { stdio: "ignore", timeout: 90_000, killSignal: "SIGKILL" }
  )
  if (!fs.existsSync(png)) throw new Error(`headless Chrome wrote no ${CARD_ID}.png`)
  return png
}

async function main() {
  if (!fs.existsSync(SRC)) throw new Error(`missing source ${SRC}`)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recut-"))
  const png = renderCard(tmp)
  console.log(`  ✓ ${CARD_ID}.png  ${W}×${H}`)

  // The card clip. Same linear push the canvas renderer used: scale = 1 + 0.05 · p, where p
  // runs across the ORIGINAL 4.2 s beat — so at any wall-clock second the card sits at the
  // size it sat at before, even though this clip is shorter.
  const cardDur = TOTAL - CARD_IN
  const frames = Math.round(cardDur * FPS)
  const beatFrames = Math.round(CARD_BEAT * FPS)
  const card = path.join(tmp, "card.mp4")
  {
    const vf =
      `scale=${W * 2}:${H * 2},` +
      `zoompan=z='1+${(CARD_ZOOM - 1).toFixed(3)}*on/${beatFrames}':` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},` +
      `setsar=1,format=yuv420p`
    const { code, err } = await run([
      "-y", "-loop", "1", "-i", png, "-vf", vf, "-t", cardDur.toFixed(2), "-an",
      "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", card,
    ])
    if (code !== 0) throw new Error(`card clip failed (${code})\n${err.split("\n").slice(-8).join("\n")}`)
    console.log(`  ✓ card clip  ${cardDur.toFixed(2)}s  zoom 1.000→${(1 + (CARD_ZOOM - 1) * (frames - 1) / beatFrames).toFixed(3)}`)
  }

  // The last clean frame, and the photo push continued from it. The rate is the original
  // shot's rate divided by how far it had already zoomed, because this frame is the new 1.0×.
  const cutFrame = Math.round(CARD_IN * FPS) - 1
  const zAtCut = 1 + (PHOTO_ZOOM - 1) * ((cutFrame / FPS - PHOTO_IN) / PHOTO_DUR)
  const tailRate = (PHOTO_ZOOM - 1) / PHOTO_DUR / zAtCut
  const still = path.join(tmp, "tail.png")
  const tail = path.join(tmp, "tail.mp4")
  {
    const { code, err } = await run([
      "-y", "-i", SRC, "-vf", `select='eq(n,${cutFrame})'`, "-vsync", "0", "-frames:v", "1", still,
    ])
    if (code !== 0) throw new Error(`tail frame grab failed (${code})\n${err.split("\n").slice(-6).join("\n")}`)
    const tailFrames = Math.round(TAIL * FPS)
    const vf =
      `scale=${W * 2}:${H * 2},` +
      `zoompan=z='1+${tailRate.toFixed(6)}*(on+1)/${FPS}':` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${tailFrames}:s=${W}x${H}:fps=${FPS},` +
      `setsar=1,format=yuv420p`
    const r = await run([
      "-y", "-loop", "1", "-i", still, "-vf", vf, "-t", TAIL.toFixed(2), "-an",
      "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", tail,
    ])
    if (r.code !== 0) throw new Error(`photo tail failed (${r.code})\n${r.err.split("\n").slice(-8).join("\n")}`)
    console.log(`  ✓ photo tail  frame ${cutFrame} (${(cutFrame / FPS).toFixed(3)}s) + ${TAIL}s at ${(tailRate * 100).toFixed(2)}%/s`)
  }

  const filter = [
    `[0:v]trim=0:${CARD_IN.toFixed(4)},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[cut]`,
    `[2:v]format=yuv420p,setsar=1[tail]`,
    // Both xfade inputs must share a timebase; concat hands back AVTB, the card clip keeps
    // the encoder's 1/15360, and xfade refuses to configure across the two.
    `[cut][tail]concat=n=2:v=1:a=0,fps=${FPS},settb=AVTB[base]`,
    `[1:v]fps=${FPS},settb=AVTB[cardv]`,
    `[base][cardv]xfade=transition=fade:duration=${XFADE}:offset=${CARD_IN.toFixed(4)}[vx]`,
    `[vx]fade=t=out:st=${PIC_FADE_AT}:d=${PIC_FADE_LEN}[v]`,
    `[0:a]atrim=0:${TOTAL},asetpts=PTS-STARTPTS,` +
      `afade=t=out:st=${VO_FADE_AT}:d=${VO_FADE_LEN}:curve=qsin[a]`,
  ].join(";")

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const { code, err } = await run([
    "-y", "-i", SRC, "-i", card, "-i", tail, "-filter_complex", filter,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart", "-t", TOTAL.toFixed(2), OUT,
  ])
  fs.rmSync(tmp, { recursive: true, force: true })
  if (code !== 0) {
    console.log(`✗ ffmpeg ${code}\n${err.split("\n").slice(-18).join("\n")}`)
    process.exit(1)
  }
  const mb = (fs.statSync(OUT).size / 1e6).toFixed(1)
  console.log(`\n✓ ${OUT}  ${TOTAL.toFixed(2)}s  ${mb} MB`)
  console.log(`  narration ends on "Lompoc Locals." at 24.60s; mix silent from 25.00s`)
}

main()
