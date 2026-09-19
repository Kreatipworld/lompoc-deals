import { chromium, devices } from "playwright"
const out = "/private/tmp/claude-501/-Users-kreatip-Projects-lompoc-deals/21ca815e-5545-44f0-a07f-2b47f95204ac/scratchpad"
const BASE = process.argv[2] || "https://www.lompoclocals.com"
const TARGETS = (process.argv[3] || "map,homes,hotels,wineries,garage").split(",")
const PAGES = {
  map: { path: "/map", pin: ".mapboxgl-marker", popup: "[data-map-sheet], .mapboxgl-popup" },
  homes: { path: "/homes", pin: ".mapboxgl-marker", popup: "[data-map-sheet], .mapboxgl-popup" },
  hotels: { path: "/hotels", pin: ".mapboxgl-marker", popup: "[data-map-sheet], .mapboxgl-popup" },
  wineries: { path: "/category/wineries", pin: "[data-category-pin]", popup: "[data-map-sheet], .mapboxgl-popup" },
  garage: { path: "/garage-sales", pin: ".mapboxgl-marker", popup: "[data-map-sheet], .mapboxgl-popup" },
}
const browser = await chromium.launch()
const ctx = await browser.newContext(devices["iPhone 14"]); const page = await ctx.newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
for (const key of TARGETS) {
  const t = PAGES[key]
  await page.goto(BASE + t.path, { waitUntil: "load", timeout: 60000 })
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(2500)
  const pins = page.locator(t.pin)
  const n = await pins.count()
  let visible = "n/a", inside = "n/a"
  if (n) {
    const container = page.locator(".mapboxgl-map").first()
    await container.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(500)
    const idx = Math.min(2, n - 1)
    await pins.nth(idx).click({ force: true }).catch((e) => errs.push("click " + e.message.split("\n")[0]))
    await page.waitForTimeout(1200)
    const pop = page.locator(t.popup).first()
    visible = (await pop.count()) ? await pop.isVisible() : false
    if (visible) {
      const pb = await pop.boundingBox(); const cb = await container.boundingBox()
      inside = pb && cb ? (pb.x >= cb.x - 1 && pb.y >= cb.y - 1 && pb.x + pb.width <= cb.x + cb.width + 1 && pb.y + pb.height <= cb.y + cb.height + 1) : "?"
    }
    await page.screenshot({ path: `${out}/pin-${key}.png`, fullPage: false })
  }
  console.log(`[${key}] pins=${n} popupVisible=${visible} fullyInsideMap=${inside} errors=${errs.length}`)
  errs.length = 0
}
await browser.close()
