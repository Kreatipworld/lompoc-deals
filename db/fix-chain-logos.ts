/**
 * db/fix-chain-logos.ts
 *
 * Fetches and uploads official brand logos for national chains using
 * Clearbit's logo API (root domain, not locator subdomains).
 * Only sets logo_url; does NOT touch cover_url or photos_json.
 *
 * Usage:
 *   npx tsx db/fix-chain-logos.ts           # run all
 *   npx tsx db/fix-chain-logos.ts --dry-run # preview, no writes
 */

import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local") })

import { db } from "./client"
import { businesses } from "./schema"
import { eq } from "drizzle-orm"
import { put } from "@vercel/blob"

const DRY_RUN = process.argv.includes("--dry-run")

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadUrl(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow" })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/png"
    if (!contentType.startsWith("image/")) return null
    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer.byteLength < 500) return null // reject tiny/empty responses
    return { buffer: Buffer.from(arrayBuffer), contentType }
  } catch {
    return null
  }
}

async function uploadBuffer(buffer: Buffer, prefix: string, contentType = "image/png"): Promise<string> {
  const ext = contentType.split("/")[1]?.replace(/\+.*/, "") ?? "png"
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const blob = await put(key, buffer, { access: "public", addRandomSuffix: false, contentType })
  return blob.url
}

// ── Chain definitions: id(s) → root brand domain for Clearbit ────────────────

const CHAIN_LOGOS: Array<{ ids: number[]; domain: string; label: string }> = [
  { ids: [74, 330, 340],                label: "Walmart",        domain: "walmart.com" },
  { ids: [75],                          label: "Target",         domain: "target.com" },
  { ids: [57],                          label: "Applebee's",     domain: "applebees.com" },
  { ids: [72],                          label: "Wingstop",       domain: "wingstop.com" },
  { ids: [81],                          label: "Dollar Tree",    domain: "dollartree.com" },
  { ids: [82],                          label: "Ross",           domain: "rossstores.com" },
  { ids: [78],                          label: "HomeGoods",      domain: "homegoods.com" },
  { ids: [143, 351],                    label: "Planet Fitness", domain: "planetfitness.com" },
  { ids: [97, 336, 337, 344],           label: "CVS",            domain: "cvs.com" },
  { ids: [338, 342],                    label: "Walgreens",      domain: "walgreens.com" },
  { ids: [96],                          label: "Rite Aid",       domain: "riteaid.com" },
  { ids: [80],                          label: "Smart & Final",  domain: "smartandfinal.com" },
  { ids: [177],                         label: "Vons",           domain: "vons.com" },
  { ids: [355, 335, 339, 486],          label: "Albertsons",     domain: "albertsons.com" },
  { ids: [107],                         label: "AutoZone",       domain: "autozone.com" },
  { ids: [77],                          label: "Big 5",          domain: "big5sportinggoods.com" },
  { ids: [85],                          label: "Wells Fargo",    domain: "wellsfargo.com" },
  { ids: [94],                          label: "Fantastic Sam's",domain: "fantasticsams.com" },
  { ids: [99],                          label: "Elements Massage",domain: "elementsmassage.com" },
  { ids: [105],                         label: "Jiffy Lube",     domain: "jiffylube.com" },
  { ids: [109],                         label: "Midas",          domain: "midas.com" },
  { ids: [174, 207, 211],               label: "Starbucks",      domain: "starbucks.com" },
  { ids: [374],                         label: "Domino's",       domain: "dominos.com" },
  { ids: [503],                         label: "Burger King",    domain: "burgerking.com" },
  { ids: [504],                         label: "Jack in the Box",domain: "jackinthebox.com" },
  { ids: [505],                         label: "Carl's Jr.",     domain: "carlsjr.com" },
  { ids: [507],                         label: "McDonald's",     domain: "mcdonalds.com" },
  { ids: [509],                         label: "Wendy's",        domain: "wendys.com" },
  { ids: [538],                         label: "Panda Express",  domain: "pandaexpress.com" },
  { ids: [540],                         label: "Taco Bell",      domain: "tacobell.com" },
]

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY

async function fetchGooglePlacesIcon(name: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!GOOGLE_API_KEY) return null
  try {
    const q = encodeURIComponent(`${name} Lompoc CA`)
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${q}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`
    const findRes = await fetch(findUrl)
    if (!findRes.ok) return null
    const findData = (await findRes.json()) as { status: string; candidates: Array<{ place_id: string }> }
    if (findData.status !== "OK" || !findData.candidates?.length) return null

    await sleep(400)
    const placeId = findData.candidates[0].place_id
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=icon&key=${GOOGLE_API_KEY}`
    const detailRes = await fetch(detailUrl)
    if (!detailRes.ok) return null
    const detailData = (await detailRes.json()) as { status: string; result: { icon?: string } }
    if (detailData.status !== "OK" || !detailData.result.icon) return null

    await sleep(200)
    return downloadUrl(detailData.result.icon)
  } catch {
    return null
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌  BLOB_READ_WRITE_TOKEN not set")
    process.exit(1)
  }

  console.log(`🏷  fix-chain-logos${DRY_RUN ? " (DRY RUN)" : ""}\n`)

  let ok = 0
  let fail = 0

  for (const chain of CHAIN_LOGOS) {
    process.stdout.write(`▸ ${chain.label} (${chain.domain})… `)

    // 1. Try Clearbit
    let img = await downloadUrl(`https://logo.clearbit.com/${chain.domain}?size=400`)

    // 2. Fall back to Google Places icon
    if (!img) {
      img = await fetchGooglePlacesIcon(chain.label)
    }

    if (!img) {
      console.log("⚠  no logo found (Clearbit + Google Places both failed)")
      fail++
      await sleep(300)
      continue
    }

    let blobUrl = `[dry-run] clearbit/${chain.domain}`
    if (!DRY_RUN) {
      blobUrl = await uploadBuffer(img.buffer, "logos", img.contentType)
    }

    if (!DRY_RUN) {
      for (const id of chain.ids) {
        await db.update(businesses).set({ logoUrl: blobUrl }).where(eq(businesses.id, id))
      }
    }

    console.log(`✓  → ${blobUrl}`)
    ok++
    await sleep(400)
  }

  console.log(`\n✅  Done. ${ok} logos set, ${fail} failed.`)
  if (DRY_RUN) console.log("   (DRY RUN — no writes made)")
}

main().catch((e) => { console.error(e); process.exit(1) })
