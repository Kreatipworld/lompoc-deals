#!/usr/bin/env node
/**
 * Renders each .card in a social-kit HTML file to its own PNG using headless Chrome.
 *
 *   node scripts/render-social-cards.mjs
 *   node scripts/render-social-cards.mjs docs/social-kit/cards-week2.html docs/social-kit/images/week2
 *
 * Card size comes from the class on the element: .ig = 1080x1350, .tt = 1080x1920,
 * .av = 1000x1000. Add a size to SIZES below if you introduce a new one.
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const SRC = process.argv[2] || "docs/social-kit/cards-week2.html"
const OUT = process.argv[3] || "docs/social-kit/images/week2"

const SIZES = { ig: [1080, 1350], tt: [1080, 1920], av: [1000, 1000] }

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if (!fs.existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME_PATH to override.`)
  process.exit(1)
}

const html = fs.readFileSync(SRC, "utf8")

// Each card looks like: <div class="card ig grain" id="week-events" ...>
const cards = [...html.matchAll(/<div class="card ([^"]*)"\s+id="([^"]+)"/g)].map(
  ([, classes, id]) => {
    const key = Object.keys(SIZES).find((k) => classes.split(/\s+/).includes(k))
    if (!key) throw new Error(`Card #${id} has no known size class (${classes})`)
    return { id, size: SIZES[key] }
  }
)

if (!cards.length) {
  console.error(`No cards found in ${SRC}`)
  process.exit(1)
}

fs.mkdirSync(OUT, { recursive: true })
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "social-cards-"))

console.log(`Rendering ${cards.length} cards from ${SRC} → ${OUT}/\n`)

for (const { id, size } of cards) {
  const [w, h] = size
  // Isolate one card: hide the rest, strip page chrome so the card fills the viewport.
  const isolated = html.replace(
    "</style>",
    `.card { display:none !important; }
     #${id} { display:block !important; margin:0 !important; }
     body { background:#fff; margin:0; }
     </style>`
  )
  const tmpFile = path.join(tmpDir, `${id}.html`)
  fs.writeFileSync(tmpFile, isolated)

  const outFile = path.join(OUT, `${id}.png`)
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      "--virtual-time-budget=6000", // let webfonts + images settle
      `--window-size=${w},${h}`,
      `--screenshot=${outFile}`,
      `file://${tmpFile}`,
    ],
    { stdio: "ignore" }
  )

  const kb = Math.round(fs.statSync(outFile).size / 1024)
  console.log(`  ✓ ${id}.png  ${w}×${h}  ${kb}kb`)
}

fs.rmSync(tmpDir, { recursive: true, force: true })
console.log(`\nDone. ${cards.length} PNGs in ${OUT}/`)
