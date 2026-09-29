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
  // v4 (Sep 28 2026): all-new generated scenes; no caption names a venue over generated footage. Narration starts at 0.4s; times are absolute.
  { id: "v4cap1", text: "A main street you can walk end to end.", start: 4.85, end: 7.25 },
  { id: "v4cap2", text: "Tacos worth crossing town for.", start: 11.60, end: 13.70 },
  { id: "v4cap4", text: "Rockets going up over the valley.", start: 18.35, end: 20.40 },
  { id: "v4cap5", text: "Everything you love was already here.", start: 21.00, end: 24.40 },
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
  /* A scrim rather than a slab — the footage stays visible and the type just sits on it. */
  .cap::before {
    content:''; position:absolute; left:0; right:0; bottom:0; height:780px;
    background:linear-gradient(180deg, rgba(12,4,15,0) 0%, rgba(12,4,15,.55) 55%, rgba(12,4,15,.80) 100%);
  }
  .cap .bar {
    position:absolute; left:96px; right:96px; bottom:470px;
    color:#fff; font-size:66px; font-weight:800; line-height:1.16;
    letter-spacing:-0.5px; text-shadow:0 4px 26px rgba(0,0,0,.6);
  }
  .cap .bar::after {
    content:''; display:block; width:96px; height:7px; border-radius:6px;
    background:#EFC618; margin-top:30px;
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
