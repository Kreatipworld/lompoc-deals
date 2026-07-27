// Harvests publicly posted contact emails from the websites of approved
// businesses that have no email on file. Precision over recall: we only keep
// mailto: targets, same-domain addresses, or consumer-mail addresses found in
// page text — marketing-platform noise is filtered hard.
// Usage: node --env-file=.env.local scripts/outreach/harvest-emails.mjs [--dry] [--limit N]

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const DRY = process.argv.includes("--dry")
const limitIx = process.argv.indexOf("--limit")
const LIMIT = limitIx > -1 ? Number(process.argv[limitIx + 1]) : null

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const FREEMAIL = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "verizon.net", "comcast.net", "me.com", "msn.com"])
const JUNK = /sentry|wixpress|wix\.com|godaddy|secureserver|example\.|@email\.|@domain\.|@yourdomain|@company\.|no-?reply|donotreply|@sentry|\.png$|\.jpe?g$|\.gif$|\.webp$|@2x|react|polyfill|schema\.org|youremail|@test\.|localhost/i

const CONTACT_PATHS = ["", "/contact", "/contact-us", "/contactus", "/about", "/about-us"]

function hostOf(url) {
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "") } catch { return null }
}

async function fetchText(url) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LompocLocals/1.0)" }, redirect: "follow", signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) return null
    const type = res.headers.get("content-type") ?? ""
    if (!type.includes("html")) return null
    return await res.text()
  } catch { return null }
}

function extractEmails(html, siteHost) {
  const found = new Map() // email -> confidence (3 mailto, 2 same-domain, 1 freemail)
  for (const m of html.matchAll(/mailto:([^"'?\s<>]+)/gi)) {
    const e = decodeURIComponent(m[1]).trim().toLowerCase()
    if (EMAIL_RE.test(e) && !JUNK.test(e)) found.set(e, 3)
  }
  for (const m of html.matchAll(EMAIL_RE)) {
    const e = m[0].toLowerCase()
    if (JUNK.test(e) || found.has(e)) continue
    const dom = e.split("@")[1]
    if (siteHost && (dom === siteHost || dom.endsWith(`.${siteHost}`) || siteHost.endsWith(dom))) found.set(e, 2)
    else if (FREEMAIL.has(dom)) found.set(e, 1)
    // anything else (random third-party domains in page source) is dropped
  }
  return [...found.entries()].sort((a, b) => b[1] - a[1]).map(([e]) => e)
}

const rows = await sql`
  SELECT id, slug, name, website FROM businesses
  WHERE status = 'approved' AND email IS NULL AND website IS NOT NULL
  ORDER BY name`
const targets = LIMIT ? rows.slice(0, LIMIT) : rows
console.log(`${targets.length} businesses to harvest${DRY ? " (dry run)" : ""}`)

let hits = 0
const found = []

// modest concurrency to be a polite crawler
const POOL = 8
let i = 0
async function worker() {
  while (i < targets.length) {
    const biz = targets[i++]
    const base = biz.website.startsWith("http") ? biz.website : `https://${biz.website}`
    const host = hostOf(base)
    let emails = []
    for (const path of CONTACT_PATHS) {
      const html = await fetchText(base.replace(/\/$/, "") + path)
      if (!html) continue
      emails = extractEmails(html, host)
      if (emails.length) break
    }
    if (emails.length) {
      hits++
      found.push({ slug: biz.slug, name: biz.name, email: emails[0], all: emails.slice(0, 4) })
      console.log(`  ✓ ${biz.slug} → ${emails[0]}${emails.length > 1 ? ` (+${emails.length - 1})` : ""}`)
      if (!DRY) {
        await sql`
          UPDATE businesses SET
            email = ${emails[0]},
            emails_json = ${JSON.stringify(emails.slice(0, 4))}::jsonb,
            email_source = 'website'
          WHERE id = ${biz.id} AND email IS NULL`
      }
    }
  }
}
await Promise.all(Array.from({ length: POOL }, worker))

console.log(`\ndone: ${hits}/${targets.length} businesses gained an email`)
