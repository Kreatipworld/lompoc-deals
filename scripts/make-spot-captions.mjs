#!/usr/bin/env node
/**
 * Renders the spot's caption plates as transparent PNGs.
 *
 * Timings come from running silencedetect over the narration and mapping each detected
 * phrase to its line — captions land on the words, not on a guess. Most social video is
 * watched muted, so these carry the whole message on their own.
 *
 * Captions stop before the UI beat: that segment paints its own captions, and two sets on
 * screen at once would collide.
 *
 * Usage: node scripts/make-spot-captions.mjs <outDir>
 */
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const OUT = process.argv[2]
if (!OUT) throw new Error("usage: make-spot-captions.mjs <outDir>")

const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

// start/end are absolute seconds in the finished film (narration begins at 0.4s).
export const CAPTIONS = [
  // cap01/cap02 intentionally absent: the title plate holds the lower third until ~2.6s
  // and two stacked cards read as a mistake.
  { id: "cap03", text: "A main street you can walk end to end.", start: 3.42, end: 5.70 },
  { id: "cap04", text: "Wineries you don't have to drive an hour to reach.", start: 5.87, end: 8.45 },
  { id: "cap05", text: "Rockets going up over the valley.", start: 8.69, end: 10.55 },
  { id: "cap06", text: "It was all already here.", start: 10.76, end: 13.55 },
  { id: "cap07", text: "You just couldn't find it in one place.", start: 13.81, end: 15.85 },
  { id: "cap08", text: "Now you can.", start: 16.07, end: 17.15 },
]

const CARD = (text) => `
<div class="cap">
  <div class="bar">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>
</div>`

const HTML = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:transparent; font-family:'Plus Jakarta Sans',sans-serif; }
  .cap { position:relative; width:1080px; height:1920px; display:none; }
  .cap .bar {
    position:absolute; left:90px; right:90px; bottom:430px;
    background:#650C75; color:#fff; border-radius:34px;
    padding:44px 56px; font-size:62px; font-weight:800; line-height:1.18;
    box-shadow:0 18px 44px rgba(0,0,0,.45);
  }
</style></head><body>
${CAPTIONS.map((c) => `<div id="${c.id}">${CARD(c.text)}</div>`).join("\n")}
</body></html>`

async function render(id, dest) {
  const tmp = path.join(OUT, `_cap-${id}.html`)
  fs.writeFileSync(
    tmp,
    HTML.replace("</style>", `#${id} .cap { display:block !important; }</style>`)
  )
  await new Promise((resolve) => {
    const p = spawn(
      CHROME,
      [
        "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--default-background-color=00000000",
        "--virtual-time-budget=9000", "--window-size=1080,1920",
        `--screenshot=${dest}`, `file://${tmp}`,
      ],
      { stdio: "ignore" }
    )
    const kill = setTimeout(() => p.kill(), 60000)
    p.on("close", () => { clearTimeout(kill); resolve() })
  })
  fs.rmSync(tmp, { force: true })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(OUT, { recursive: true })
  for (const c of CAPTIONS) {
    const dest = path.join(OUT, `${c.id}.png`)
    await render(c.id, dest)
    const ok = fs.existsSync(dest)
    console.log(`  ${ok ? "✓" : "✗"} ${c.id}  ${c.start.toFixed(2)}–${c.end.toFixed(2)}s  "${c.text}"`)
  }
}
