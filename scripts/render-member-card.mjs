#!/usr/bin/env node
/**
 * Renders the service-area member cover card (1600×900).
 *
 * A member with no street address and no photos of their own still needs a cover,
 * or their profile and every card that links to it render blank. This is the same
 * card Terrones Plumbing uses: brand stripe, their logo, who they serve.
 *
 * Only facts go on it. No "licensed", no "25+ years", no claims the owner has not
 * published themselves.
 *
 *   node scripts/render-member-card.mjs --logo <url|path> --out <file> \
 *     --serving "Serving Lompoc & Vandenberg" --line "Pest control"
 */
import { chromium } from "playwright"
import { readFileSync } from "node:fs"

const arg = (k, d = "") => {
  const i = process.argv.indexOf(`--${k}`)
  return i > -1 ? process.argv[i + 1] : d
}
const logo = arg("logo")
const out = arg("out")
const serving = arg("serving", "Serving Lompoc & Vandenberg")
const line = arg("line", "")
const logoPx = Number(arg("logopx", "300"))
if (!logo || !out) {
  console.error("usage: --logo <url|path> --out <file> [--serving ...] [--line ...] [--logopx 300]")
  process.exit(1)
}

// Inline the logo so the render never depends on a network fetch mid-screenshot.
let src = logo
if (!/^https?:/.test(logo)) {
  const ext = logo.split(".").pop().toLowerCase()
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
  src = `data:${type};base64,${readFileSync(logo).toString("base64")}`
}

const PURPLE = "#650C75", GOLD = "#EFC618", GREEN = "#0B992F", CREAM = "#f7f1e8", INK = "#241629"

const html = `<!doctype html><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1600px;height:900px;background:${CREAM};font-family:'Plus Jakarta Sans',system-ui,sans-serif;
       display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
  .bar{position:absolute;left:0;right:0;height:18px;display:flex}
  .bar.t{top:0}.bar.b{bottom:0}
  .bar i{flex:1}
  .bar.t i:nth-child(1){background:${PURPLE}}.bar.t i:nth-child(2){background:${GOLD}}.bar.t i:nth-child(3){background:${GREEN}}
  .bar.b i:nth-child(1){background:${GREEN}}.bar.b i:nth-child(2){background:${GOLD}}.bar.b i:nth-child(3){background:${PURPLE}}
  img{width:${logoPx}px;height:auto;border-radius:24px;box-shadow:0 18px 50px rgba(36,22,41,.18)}
  h1{margin-top:60px;font-size:54px;font-weight:800;color:${INK};letter-spacing:-1.2px;text-align:center}
  p{margin-top:18px;font-size:38px;font-weight:600;color:${PURPLE};text-align:center}
</style>
<div class="bar t"><i></i><i></i><i></i></div>
<img src="${src}" alt="">
<h1>${serving}</h1>
${line ? `<p>${line}</p>` : ""}
<div class="bar b"><i></i><i></i><i></i></div>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: "networkidle" })
await page.waitForTimeout(400)
await page.screenshot({ path: out, type: out.endsWith(".png") ? "png" : "jpeg", ...(out.endsWith(".png") ? {} : { quality: 92 }) })
await browser.close()
console.log(out)
