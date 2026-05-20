import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

// Mapbox-verified coordinates for each hotel, keyed by slug.
const CORRECTED: Record<string, { lat: number; lng: number }> = {
  "embassy-suites-lompoc":      { lat: 34.6558, lng: -120.4588 },
  "hilton-garden-inn-lompoc":   { lat: 34.6559, lng: -120.4577 },
  "quality-inn-lompoc":         { lat: 34.6639, lng: -120.4588 },
  "holiday-inn-express-lompoc": { lat: 34.6624, lng: -120.4589 },
  "hampton-inn-lompoc":         { lat: 34.6575, lng: -120.4588 },
  "cabrillo-inn-lompoc":        { lat: 34.6389, lng: -120.4451 },
  "days-inn-lompoc":            { lat: 34.6610, lng: -120.4578 },
  "surestay-best-western-lompoc": { lat: 34.6640, lng: -120.4577 },
  "civic-center-motel-lompoc":  { lat: 34.6389, lng: -120.4470 },
  "ocairns-inn-lompoc":         { lat: 34.6574, lng: -120.4576 },
  "inn-of-lompoc":              { lat: 34.6389, lng: -120.4453 },
  "lotus-of-lompoc":            { lat: 34.6392, lng: -120.4411 },
  "village-inn-lompoc":         { lat: 34.6518, lng: -120.4578 },
  "motel-6-lompoc":             { lat: 34.6630, lng: -120.4587 },
  "red-roof-inn-lompoc":        { lat: 34.6609, lng: -120.4578 },
}

const file = resolve(process.cwd(), "lib/hotels-data.ts")

async function main() {
  const text = await readFile(file, "utf-8")
  let updated = text
  let patched = 0

  for (const [slug, coords] of Object.entries(CORRECTED)) {
    // Find each hotel block by its slug line, then replace the subsequent lat: and lng: lines.
    const blockRegex = new RegExp(
      String.raw`(slug:\s*"${slug}"[\s\S]*?)lat:\s*-?\d+(?:\.\d+)?,(\s*\n\s*)lng:\s*-?\d+(?:\.\d+)?,`,
      "m"
    )
    const before = updated
    updated = updated.replace(
      blockRegex,
      (_match, head: string, gap: string) =>
        `${head}lat: ${coords.lat},${gap}lng: ${coords.lng},`
    )
    if (updated !== before) patched++
    else console.log(`  WARN no match for ${slug}`)
  }

  await writeFile(file, updated, "utf-8")
  console.log(`Patched ${patched}/${Object.keys(CORRECTED).length} hotels.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
