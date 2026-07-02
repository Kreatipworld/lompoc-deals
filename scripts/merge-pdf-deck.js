/**
 * scripts/merge-pdf-deck.js
 *
 * Merges the individual marketing PDFs into a single pitch deck:
 *   deck-cover → platform-overview → advertise-proposal → brand-guide → engagement-playbook
 * Output: docs/marketing/pdf/lompoc-locals-pitch-deck.pdf
 *
 * Run via the build script (which supplies pdf-lib through npx):
 *   npx --yes --package=pdf-lib node scripts/merge-pdf-deck.js
 */
const fs = require("fs")
const path = require("path")
const { PDFDocument } = require("pdf-lib")

const PDF_DIR = path.resolve(__dirname, "../docs/marketing/pdf")
const ORDER = [
  "deck-cover",
  "platform-overview",
  "advertise-proposal",
  "brand-guide",
  "engagement-playbook",
]

async function main() {
  const deck = await PDFDocument.create()
  for (const name of ORDER) {
    const file = path.join(PDF_DIR, name + ".pdf")
    if (!fs.existsSync(file)) throw new Error("missing " + file)
    const src = await PDFDocument.load(fs.readFileSync(file))
    const pages = await deck.copyPages(src, src.getPageIndices())
    pages.forEach((p) => deck.addPage(p))
  }
  const out = path.join(PDF_DIR, "lompoc-locals-pitch-deck.pdf")
  fs.writeFileSync(out, await deck.save())
  const kb = Math.round(fs.statSync(out).size / 1024)
  console.log(`  ✓ ${path.relative(path.resolve(__dirname, ".."), out)} (${kb} KB, ${deck.getPageCount()} pages)`)
  // deck-cover is an intermediate — remove so only real docs + the deck remain
  fs.rmSync(path.join(PDF_DIR, "deck-cover.pdf"), { force: true })
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
