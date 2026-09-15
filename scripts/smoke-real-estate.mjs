#!/usr/bin/env node
// smoke-real-estate.mjs — walk the real-estate road in a real browser and fail on
// any client-side error. Runs inside the ship gate against the preview and again
// against production. Server-side 200s are not enough: the owner saw
// "Something went wrong" (the client error boundary) on links that curl says are fine.
//
//   node scripts/smoke-real-estate.mjs --base=https://www.lompoclocals.com
//   node scripts/smoke-real-estate.mjs --base=<preview-url>            (bypass header from VERCEL_AUTOMATION_BYPASS_SECRET)
//   node scripts/smoke-real-estate.mjs --base=... --submit-lead        (submits ONE QA lead; caller deletes it)
//   node scripts/smoke-real-estate.mjs --base=... --verbose
//
// What counts as a failure: a `pageerror` (uncaught exception), `console.error`
// from our origin, a same-origin request answering >= 400, or the error boundary
// (`[data-error-boundary]`) rendering on any visited page. Third-party noise
// (analytics, fonts, Mapbox tiles) is ignored.

import { chromium, devices } from "playwright"

const args = Object.fromEntries(process.argv.slice(2).map((a) => (a.startsWith("--") ? a.slice(2).split("=") : [a, true])).map(([k, v]) => [k, v ?? true]))
const BASE = String(args.base || "https://www.lompoclocals.com").replace(/\/$/, "")
const VERBOSE = !!args.verbose
const SUBMIT_LEAD = !!args["submit-lead"]
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const origin = new URL(BASE).origin

const IGNORED_HOSTS = /vercel-insights|vercel-analytics|va\.vercel-scripts|mapbox\.com|googletagmanager|google-analytics|fonts\.g|images\.buffer/i
// "Failed to fetch RSC payload" is Next falling back to a full navigation when a
// prefetch races a click; the page still loads, so it is noise for this gate.
// "Failed to load resource" carries no URL here; same-origin ≥400 responses are
// caught by the response handler below, so the console line is third-party noise
// (Vercel toolbar 403/429, Google identity on previews).
const IGNORED_CONSOLE = /ResizeObserver loop|third-party cookie|Download the React DevTools|preloaded using link preload|mapbox|WebGL|favicon|Failed to fetch RSC payload|Failed to load resource|identity provider|Provider's accounts list|GSI_LOGGER/i

const failures = []
const log = (...a) => VERBOSE && console.log("   ", ...a)
const fail = (where, what) => {
  failures.push({ where, what })
  console.log(`  ✗ ${where}: ${what}`)
}

const pending = []
const chunkIsMapbox = new Map()
async function stackIsMapbox(page, frame) {
  const m = frame.match(/https?:\/\/[^\s)]+\.js[^\s)]*/)
  if (!m) return false
  const key = m[0].split("?")[0]
  if (!chunkIsMapbox.has(key)) {
    chunkIsMapbox.set(
      key,
      page.request
        .get(m[0])
        .then((r) => r.text())
        .then((t) => /mapbox-gl|mapboxgl/i.test(t))
        .catch(() => false)
    )
  }
  return chunkIsMapbox.get(key)
}

function attach(page, label) {
  page.on("pageerror", (err) => {
    // Previews carry the Vercel toolbar (vercel.live) and its Google identity
    // widget; an exception thrown from a script off our origin is theirs, not ours.
    const stack = String(err?.stack || "")
    const frame = (stack.split("\n").find((l) => /https?:\/\//.test(l)) || "").trim()
    if (frame && !frame.includes(origin)) return
    const where = `${label()} pageerror`
    const what = `${String(err?.message || err).slice(0, 300)}${frame ? `  @ ${frame.slice(0, 160)}` : ""}`
    // mapbox-gl throws inside its own render loop when a map is torn down mid-frame
    // (vec4.transformMat4 on an undefined matrix) — headless-only teardown timing, so
    // an exception whose top frame lives in the mapbox chunk is not a site bug.
    pending.push(
      stackIsMapbox(page, frame).then((mapbox) => {
        if (!mapbox) fail(where, what)
      })
    )
  })
  page.on("console", (msg) => {
    if (msg.type() !== "error") return
    const text = msg.text()
    if (IGNORED_CONSOLE.test(text)) return
    fail(`${label()} console.error`, text.slice(0, 300))
  })
  page.on("response", (res) => {
    const url = res.url()
    if (!url.startsWith(origin) || IGNORED_HOSTS.test(url)) return
    if (url.includes("/_next/image")) return // image optimizer 4xx on a bad remote is a photo problem, reported separately
    if (res.status() >= 400) fail(`${label()} request`, `${res.status()} ${url.replace(origin, "")}`)
  })
  page.on("requestfailed", (req) => {
    const url = req.url()
    if (!url.startsWith(origin) || IGNORED_HOSTS.test(url)) return
    const reason = req.failure()?.errorText || "failed"
    if (/ERR_ABORTED/.test(reason)) return
    fail(`${label()} requestfailed`, `${reason} ${url.replace(origin, "")}`)
  })
}

async function assertNoBoundary(page, where) {
  const boundary = await page.locator("[data-error-boundary]").count()
  if (boundary > 0) fail(where, "error boundary rendered (Something went wrong)")
  const title = await page.title()
  if (/404|not found/i.test(title)) fail(where, `page title looks like a 404: ${title}`)
  // Vercel's SSO wall for previews: without the bypass secret every page is a login
  // form, and every "missing link" below would be a lie about the site.
  if (/^(Login|Log in|Authentication Required)/i.test(title) || (await page.locator("form[action*='vercel.com']").count()) > 0)
    fail(where, `landed on the Vercel login wall — set VERCEL_AUTOMATION_BYPASS_SECRET (node scripts/vercel-gate.mjs bypass)`)
}

async function goto(page, path, where) {
  const url = path.startsWith("http") ? path : BASE + path
  // "load" + a bounded idle wait: previews keep a Vercel toolbar socket open, so
  // waiting for "networkidle" on navigation never resolves there.
  const res = await page.goto(url, { waitUntil: "load", timeout: 60000 }).catch((e) => {
    fail(where, `navigation failed: ${e.message}`)
    return null
  })
  if (res && res.status() >= 400) fail(where, `HTTP ${res.status()} on ${url}`)
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(600)
  await assertNoBoundary(page, where)
  return res
}

async function clickAndCheck(page, locator, where, { expectUrl } = {}) {
  const count = await locator.count()
  if (count === 0) {
    fail(where, "element not found")
    return false
  }
  await locator.first().scrollIntoViewIfNeeded().catch(() => {})
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {}),
    locator.first().click({ timeout: 15000 }).catch((e) => fail(where, `click failed: ${e.message}`)),
  ])
  await page.waitForTimeout(700)
  await assertNoBoundary(page, where)
  if (expectUrl && !expectUrl.test(page.url())) fail(where, `expected url ${expectUrl} but got ${page.url()}`)
  return true
}

async function road(context, deviceLabel) {
  let current = "start"
  const label = () => `[${deviceLabel}] ${current}`
  const page = await context.newPage()
  attach(page, label)

  // 1. /homes
  current = "/homes"
  await goto(page, "/homes", label())
  const cards = page.locator('a[href*="/listings/"]')
  const cardHrefs = [...new Set((await cards.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).filter(Boolean))]
  log("listing links on /homes:", cardHrefs.length)
  if (cardHrefs.length === 0) fail(label(), "no listing cards on /homes")

  // featured agents rail + CTA
  const rail = page.locator('a[href*="/biz/"]').first()
  if ((await rail.count()) === 0) fail(label(), "no agent/profile link on /homes")
  const cta = page.locator('a[href*="/for-businesses/real-estate"]')
  if ((await cta.count()) === 0) fail(label(), "no List-your-homes CTA on /homes")

  // 2. every listing page
  for (const href of cardHrefs) {
    const path = href.replace(origin, "")
    current = path
    await goto(page, path, label())
    // Request a tour → modal
    const tour = page.locator('[data-lead="showing"]').first()
    if (await tour.count()) {
      await tour.click().catch((e) => fail(label(), `Request a tour click: ${e.message}`))
      await page.waitForTimeout(500)
      await assertNoBoundary(page, `${label()} tour modal`)
      const form = page.locator("[data-lead-form]")
      if ((await form.count()) === 0) fail(`${label()} tour modal`, "form did not open")
      else if (SUBMIT_LEAD && path === cardHrefs[0].replace(origin, "")) {
        await form.locator('input[name="name"]').fill("Lompoc Locals QA")
        await form.locator('input[name="email"]').fill("hello@lompoclocals.com")
        const msg = form.locator('textarea[name="message"]')
        if (await msg.count()) await msg.fill("QA test lead — ignore")
        await form.locator('button[type="submit"]').click()
        await page.waitForTimeout(4000)
        await assertNoBoundary(page, `${label()} tour submit`)
        const sent = await page.locator('[data-lead="sent"]').count()
        if (!sent) fail(`${label()} tour submit`, "no success state after submit")
        else log("QA lead submitted on", path)
      }
      await page.keyboard.press("Escape").catch(() => {})
      const closeBtn = page.locator('[data-lead-form] button[aria-label], [data-lead-form] button:has-text("Close"), [data-lead-form] button:has-text("Cancel")').first()
      if (await closeBtn.count()) await closeBtn.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(300)
    } else fail(label(), "Request a tour button missing")
    // Contact agent → modal open/close
    const contact = page.locator('[data-lead="contact"]').first()
    if (await contact.count()) {
      await contact.click().catch((e) => fail(label(), `Contact agent click: ${e.message}`))
      await page.waitForTimeout(400)
      await assertNoBoundary(page, `${label()} contact modal`)
      await page.keyboard.press("Escape").catch(() => {})
      await page.waitForTimeout(300)
    }
    // gallery thumbnails
    const thumbs = page.locator("[data-gallery-thumb], button:has(img[alt*='photo' i])")
    const n = await thumbs.count()
    for (let i = 0; i < Math.min(n, 3); i++) {
      await thumbs.nth(i).click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(200)
    }
    await assertNoBoundary(page, `${label()} gallery`)
    // agent card → profile
    const profile = page.locator('a[href*="/biz/"]').first()
    if ((await profile.count()) === 0) fail(label(), "no profile link on listing page")
  }

  // 3. agent profile
  current = "/homes → featured agent"
  await goto(page, "/homes", label())
  const agentHref = await page.locator('a[href*="/biz/"]').first().getAttribute("href").catch(() => null)
  if (agentHref) {
    current = agentHref.replace(origin, "")
    await goto(page, current, label())
    const contactBtn = page.locator('[data-lead="contact"]').first()
    if (await contactBtn.count()) {
      await contactBtn.click().catch((e) => fail(label(), `profile Contact click: ${e.message}`))
      await page.waitForTimeout(400)
      await assertNoBoundary(page, `${label()} contact modal`)
      await page.keyboard.press("Escape").catch(() => {})
    }
    const listingLink = page.locator('a[href*="/listings/"]').first()
    if ((await listingLink.count()) === 0) fail(label(), "profile shows no listing cards")
  }

  // 4. landing page + guide + signup
  current = "/for-businesses/real-estate"
  await goto(page, current, label())
  const start = page.locator('a[href*="plan=plus"], a[href*="plan=premium"]').first()
  if ((await start.count()) === 0) fail(label(), "Start with Plus link missing")
  const guideLink = page.locator('a[href$="/real-estate/guide"], a[href*="/real-estate/guide"]').first()
  if ((await guideLink.count()) === 0) fail(label(), "guide link missing")
  const addHomes = page.locator('a[href*="/dashboard/properties"]').first()
  if ((await addHomes.count()) === 0) fail(label(), "Already a member → Add homes link missing")

  current = "/for-businesses/real-estate/guide"
  await goto(page, current, label())
  const guideLinks = [...new Set(await page.locator('main a[href^="/"], article a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href"))))]
  for (const h of guideLinks.slice(0, 12)) {
    const r = await context.request.get(BASE + h, { maxRedirects: 5 }).catch(() => null)
    if (!r || r.status() >= 400) fail(`${label()} guide link`, `${r ? r.status() : "ERR"} ${h}`)
  }
  const printBtn = page.locator("button:has-text('Print')").first()
  if ((await printBtn.count()) === 0) fail(label(), "Print button missing")

  current = "/signup/business?plan=plus"
  await goto(page, current, label())
  if ((await page.locator('[data-plan="plus"]').count()) === 0) fail(label(), "Plus note missing on the signup page (?plan=plus)")
  if ((await page.locator('[data-plan="plus"]').textContent().catch(() => "") || "").indexOf("99.99") === -1) fail(label(), "Plus note does not name the $99.99 price")

  // 5. map with home pins
  current = "/map"
  await goto(page, "/map", label())
  const homesChip = page.locator("button:has-text('Homes'), [data-category='homes']").first()
  if (await homesChip.count()) log("Homes chip present on /map")
  else fail(label(), "Homes chip missing on /map")

  // 6. homepage section + category + nav
  current = "/"
  await goto(page, "/", label())
  if ((await page.locator('a[href*="/homes"]').count()) === 0) fail(label(), "homepage has no link to /homes")
  current = "/category/real-estate"
  await goto(page, current, label())
  if ((await page.locator('a[href*="/homes"]').count()) === 0) fail(label(), "Real Estate category has no homes link")

  // 7. Spanish
  for (const p of ["/es/homes", "/es/for-businesses/real-estate", "/es/for-businesses/real-estate/guide", ...cardHrefs.slice(0, 1).map((h) => "/es" + h.replace(origin, ""))]) {
    current = p
    await goto(page, p, label())
  }

  await page.close()
}

async function main() {
  console.log(`▶ real-estate smoke against ${BASE}`)
  const browser = await chromium.launch()
  const extraHTTPHeaders = BYPASS ? { "x-vercel-protection-bypass": BYPASS, "x-vercel-set-bypass-cookie": "true" } : {}
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders })
  await road(desktop, "desktop")
  await Promise.all(pending)
  await desktop.close()
  const phone = await browser.newContext({ ...devices["iPhone 14"], extraHTTPHeaders })
  await road(phone, "iphone")
  await Promise.all(pending)
  await phone.close()
  await browser.close()
  if (failures.length) {
    console.log(`\n✗ real-estate smoke: ${failures.length} failure(s)`)
    process.exit(1)
  }
  console.log("✓ real-estate smoke: clean on desktop and iPhone")
}

main().catch((e) => {
  console.error("smoke crashed:", e)
  process.exit(1)
})
