/**
 * scripts/build-marketing-pdfs.js
 *
 * Generates branded PDF versions of the Lompoc Locals marketing/brand docs:
 *   - docs/marketing/advertise-proposal.html   (already print-styled)
 *   - docs/marketing/platform-overview.html     (already print-styled)
 *   - docs/brand/brand-guide.md                 (markdown -> branded HTML)
 *   - docs/brand/engagement-playbook.md         (markdown -> branded HTML)
 *
 * Markdown is rendered to HTML via `npx marked`, wrapped in a brand-styled
 * template, then printed to PDF with headless Chrome.
 *
 * Usage:  node scripts/build-marketing-pdfs.js
 * Output: docs/marketing/pdf/*.pdf
 */
const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const os = require("os")

const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "docs/marketing/pdf")
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "ll-pdf-"))
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

fs.mkdirSync(OUT_DIR, { recursive: true })

const LOGO = `<svg viewBox="64 140 612 398" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lompoc Locals" style="height:44px;width:auto">
<path fill="#efc618" fill-rule="evenodd" d="M257,161.4c-10-17.2-32.1-23.1-49.4-13.1-17.2,10-23.1,32.1-13.1,49.4,10,17.2,32.1,23.1,49.4,13.1,17.2-10,23.1-32.1,13.1-49.4"/>
<path fill="#0b992f" d="M217.6,334.1c40.9-41.5,89.3-69.6,151.4-52.3-49.4-64.1-103.3-64.5-154.4-36.9,5.2,27.4,5.5,58.1,3.1,89.2"/>
<g fill="#650c75"><path d="M297.1,394.7c0,29.4-17.8,47.2-44,47.2s-42.2-20.1-42.2-45.6,17.2-47,43.6-47,42.6,20.6,42.6,45.4ZM232.4,395.9c0,17.6,8.2,29.9,21.8,29.9s21.5-13,21.5-30.5-7.7-29.9-21.7-29.9-21.7,13-21.7,30.5Z"/><path d="M386.3,406.1c-.4-10.8-.8-23.8-.8-36.8h-.4c-2.8,11.4-6.5,24.2-10,34.7l-10.9,35h-15.8l-9.6-34.7c-2.9-10.5-6-23.3-8.1-35h-.3c-.5,12.1-.9,25.9-1.6,37.1l-1.6,34.1h-18.8l5.7-89.6h27l8.8,29.9c2.8,10.4,5.6,21.5,7.6,32.1h.4c2.5-10.4,5.6-22.2,8.5-32.2l9.6-29.8h26.5l4.9,89.6h-19.8l-1.3-34.3Z"/><path d="M423,352c6.3-1.1,15-1.9,27.4-1.9s21.4,2.4,27.4,7.2c5.7,4.5,9.6,12,9.6,20.7s-2.9,16.2-8.2,21.3c-6.9,6.5-17.2,9.4-29.1,9.4s-5.1-.1-6.9-.4v32.1h-20.1v-88.5ZM443,392.7c1.7.4,3.9.5,6.8.5,10.8,0,17.4-5.5,17.4-14.6s-5.7-13.2-15.8-13.2-6.9.4-8.4.8v26.5Z"/><path d="M582.3,394.7c0,29.4-17.8,47.2-44,47.2s-42.2-20.1-42.2-45.6,17.2-47,43.6-47,42.6,20.6,42.6,45.4ZM517.5,395.9c0,17.6,8.2,29.9,21.8,29.9s21.5-13,21.5-30.5-7.7-29.9-21.7-29.9-21.7,13-21.7,30.5Z"/><path d="M661.4,437.9c-3.7,1.9-12.1,3.9-23,3.9-31,0-47-19.3-47-44.8s21.8-47.6,48.9-47.6,18.5,2.1,22.1,4l-4.1,16.1c-4.1-1.7-9.8-3.3-17-3.3-16.1,0-28.6,9.7-28.6,29.7s10.6,29.3,28.7,29.3,12.9-1.3,16.9-2.9l3.1,15.8Z"/></g>
<g fill="#0b992f"><path d="M335.7,467.2h13.9v49.5h24.3v11.6h-38.2v-61.2Z"/><path d="M439.1,497.1c0,20.1-12.2,32.2-30,32.2s-28.8-13.7-28.8-31.1,11.7-32,29.8-32,29,14.1,29,30.9ZM394.9,497.9c0,12,5.6,20.4,14.9,20.4s14.7-8.9,14.7-20.8-5.3-20.4-14.8-20.4-14.8,8.9-14.8,20.8Z"/><path d="M497.7,526.6c-2.5,1.3-8.3,2.6-15.7,2.6-21.1,0-32-13.2-32-30.6s14.9-32.5,33.4-32.5,12.6,1.5,15.1,2.7l-2.8,11c-2.8-1.2-6.7-2.3-11.6-2.3-11,0-19.5,6.6-19.5,20.2s7.3,20,19.6,20,8.8-.9,11.5-2l2.1,10.8Z"/><path d="M526.4,512.6l-4.4,15.7h-14.3l18.7-61.2h18.1l19,61.2h-14.9l-4.7-15.7h-17.5ZM541.9,502.3l-3.8-13c-1.1-3.6-2.2-8.2-3.1-11.8h-.2c-.9,3.6-1.8,8.3-2.8,11.8l-3.6,13h13.5Z"/><path d="M576.2,467.2h13.9v49.5h24.3v11.6h-38.2v-61.2Z"/><path d="M627.6,514.1c3.7,1.9,9.4,3.8,15.3,3.8s9.7-2.6,9.7-6.6-2.9-6-10.3-8.6c-10.2-3.5-16.8-9.2-16.8-18.1s8.7-18.4,23.1-18.4,12,1.5,15.6,3.1l-3.1,11.2c-2.4-1.2-6.8-2.9-12.8-2.9s-8.9,2.7-8.9,5.9,3.4,5.6,11.3,8.6c10.8,4,15.9,9.6,15.9,18.2s-7.9,19-24.7,19-13.9-1.8-17.3-3.7l2.8-11.4Z"/></g>
<path fill="#650c75" d="M250.9,465.7h0s-72.8,0-72.8,0c21.8-102.6,83.4-304.7-107.3-296.1,108.1,59.5,27.8,259.1,6.6,359.2h244v-63.1h-70.5Z"/>
</svg>`

function template(title, bodyHtml) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${title}</title>
<style>
  :root{--purple:#650C75;--green:#0B992F;--gold:#EFC618;--cream:#FAF7F2;--ink:#1F1F1F;--muted:#5b5563}
  *{box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);margin:0;line-height:1.6;font-size:12.5px}
  .page{max-width:820px;margin:0 auto;padding:0 8mm}
  header.brand{display:flex;align-items:center;gap:14px;background:var(--purple);color:#fff;padding:20px 24px;border-radius:16px;margin:0 0 26px}
  header.brand .logo{background:#fff;border-radius:12px;padding:8px 12px;display:flex}
  header.brand .t{font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.85;font-weight:700}
  header.brand .h{font-size:19px;font-weight:800;margin-top:2px}
  h1{color:var(--purple);font-size:26px;font-weight:800;margin:26px 0 6px;line-height:1.15}
  h2{color:var(--purple);font-size:19px;font-weight:800;margin:26px 0 8px;padding-bottom:6px;border-bottom:2px solid #ecdff0}
  h3{color:var(--ink);font-size:15px;font-weight:800;margin:18px 0 4px}
  h1:first-of-type{margin-top:4px}
  p{margin:8px 0}
  a{color:var(--purple);text-decoration:none;font-weight:600}
  strong{color:var(--ink)}
  ul,ol{margin:8px 0 8px 4px;padding-left:20px}
  li{margin:3px 0}
  code{background:#f0ebe1;padding:1px 5px;border-radius:5px;font-size:.92em}
  blockquote{margin:12px 0;padding:8px 16px;border-left:4px solid var(--gold);background:#fffdf3;border-radius:0 8px 8px 0;color:#5a4a05}
  hr{border:0;border-top:1px solid #e7e0e9;margin:22px 0}
  table{border-collapse:collapse;width:100%;margin:12px 0;font-size:12px}
  th{background:var(--purple);color:#fff;text-align:left;padding:8px 10px;font-weight:700}
  td{padding:7px 10px;border-bottom:1px solid #ece7ef;vertical-align:top}
  tr:nth-child(even) td{background:#faf7fb}
  h2,h3,table,ul,ol,blockquote{page-break-inside:avoid}
  h1,h2,h3{page-break-after:avoid}
  @page{margin:14mm}
</style></head>
<body><div class="page">
<header class="brand"><span class="logo">${LOGO}</span><span><span class="t">Lompoc Locals</span><span class="h">${title}</span></span></header>
${bodyHtml}
</div></body></html>`
}

function mdToPdf(mdRel, title, outName) {
  const md = path.join(ROOT, mdRel)
  const body = execSync(`npx --yes marked "${md}"`, { encoding: "utf8", cwd: ROOT })
  const html = template(title, body)
  const htmlPath = path.join(TMP, outName + ".html")
  fs.writeFileSync(htmlPath, html)
  htmlToPdf(htmlPath, outName)
}

function htmlToPdf(htmlPath, outName) {
  const out = path.join(OUT_DIR, outName + ".pdf")
  execSync(
    `"${CHROME}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${out}" "file://${htmlPath}"`,
    { stdio: "ignore" }
  )
  const kb = Math.round(fs.statSync(out).size / 1024)
  console.log(`  ✓ ${path.relative(ROOT, out)} (${kb} KB)`)
}

// Cover page for the combined deck — full A4, brand photo + purple wash
function buildDeckCover() {
  const cover = path.join(ROOT, "docs/marketing/assets/cover-lompoc.jpg")
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  .cv{position:relative;width:100%;min-height:257mm;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:26mm 22mm;
    background:linear-gradient(135deg,rgba(101,12,117,.92),rgba(125,26,144,.84) 55%,rgba(55,4,63,.94)),url('file://${cover}');
    background-size:cover;background-position:center 42%}
  .logo{background:#fff;border-radius:14px;padding:12px 18px;display:inline-flex;width:max-content}
  h1{font-size:44px;font-weight:800;line-height:1.05;margin:0 0 14px}
  .sub{font-size:17px;opacity:.92;max-width:60ch;line-height:1.5}
  .toc{margin-top:26px;font-size:15px;line-height:2.1}
  .toc b{color:#EFC618}
  .foot{font-size:13px;opacity:.85;border-top:1px solid rgba(255,255,255,.25);padding-top:14px}
  .foot .u{color:#EFC618;font-weight:700}
  </style></head><body><div class="cv">
    <span class="logo">${LOGO}</span>
    <div>
      <h1>Advertising &amp; Brand Kit</h1>
      <p class="sub">Everything a Lompoc business needs to get found by the whole valley — the platform, the plan, and the brand behind it.</p>
      <div class="toc">
        <div><b>01</b> &nbsp;Platform Overview — what Lompoc Locals is</div>
        <div><b>02</b> &nbsp;Advertising Proposal — the plan, packages &amp; ad spots</div>
        <div><b>03</b> &nbsp;Brand Guide — logo, palette, voice &amp; tone</div>
        <div><b>04</b> &nbsp;Engagement Playbook — how we grow &amp; convert</div>
      </div>
    </div>
    <div class="foot">Live local. Love Lompoc. &nbsp;·&nbsp; <span class="u">www.lompoclocals.com</span> &nbsp;·&nbsp; Lompoc &amp; Vandenberg, CA</div>
  </div></body></html>`
  const p = path.join(TMP, "deck-cover.html")
  fs.writeFileSync(p, html)
  htmlToPdf(p, "deck-cover")
}

console.log("Building marketing PDFs…")
// Pre-styled HTML docs — print directly
htmlToPdf(path.join(ROOT, "docs/marketing/advertise-proposal.html"), "advertise-proposal")
htmlToPdf(path.join(ROOT, "docs/marketing/platform-overview.html"), "platform-overview")
// Markdown docs — render + wrap + print
mdToPdf("docs/brand/brand-guide.md", "Brand Guide", "brand-guide")
mdToPdf("docs/brand/engagement-playbook.md", "Engagement Playbook", "engagement-playbook")
// Combined deck: cover + the four docs, merged with pdf-lib.
// pdf-lib is installed to a throwaway prefix (NOT added to the project) and
// exposed to the merge script via NODE_PATH — keeps package.json untouched.
buildDeckCover()
console.log("Merging combined pitch deck…")
const pdfLibPrefix = fs.mkdtempSync(path.join(os.tmpdir(), "ll-pdflib-"))
execSync(`npm install pdf-lib --prefix "${pdfLibPrefix}" --no-save --no-audit --no-fund`, { stdio: "ignore" })
execSync(`node "${path.join(__dirname, "merge-pdf-deck.js")}"`, {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, NODE_PATH: path.join(pdfLibPrefix, "node_modules") },
})
fs.rmSync(pdfLibPrefix, { recursive: true, force: true })
console.log("Done → docs/marketing/pdf/")
