/**
 * db/scrape-business-emails.ts
 *
 * Crawls each business's own website (homepage + common contact pages) and
 * extracts publicly-published email addresses, then writes a downloadable CSV.
 *
 * These are emails the businesses themselves publish on their sites — used for
 * B2B outreach inviting them onto Lompoc Locals. When you actually email, follow
 * CAN-SPAM (identify yourself, real address, working unsubscribe).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx db/scrape-business-emails.ts
 *
 * Output:
 *   exports/business-emails-<timestamp>.csv  (one row per business)
 *
 * Env required:
 *   DATABASE_URL — Neon connection string
 */

import "dotenv/config"
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { db } from "./client"
import { businesses } from "./schema"
import { and, isNotNull, ne, asc, eq } from "drizzle-orm"

// ---- tuning ----------------------------------------------------------------

const CONCURRENCY = 10
const FETCH_TIMEOUT_MS = 12_000
// Contact-ish paths we try in addition to the homepage.
const EXTRA_PATHS = ["contact", "contact-us", "about", "about-us"]
const UA =
  "Mozilla/5.0 (compatible; LompocLocalsBot/1.0; +https://www.lompoclocals.com)"

// Email regex — conservative; we filter junk afterward.
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi

// Reject emails that are almost never real human contacts.
const JUNK_DOMAINS = [
  "example.com", "example.org", "sentry.io", "sentry-next.wixpress.com",
  "wix.com", "wixpress.com", "godaddy.com", "squarespace.com", "schema.org",
  "w3.org", "googleapis.com", "gstatic.com", "cloudflare.com", "shopify.com",
  "fontawesome.com", "jquery.com", "yoast.com", "wordpress.org", "gravatar.com",
  "ag-grid.com", "sentry.wixpress.com",
  // placeholder/template domains
  "domain.com", "email.com", "yourdomain.com", "yoursite.com", "yourcompany.com",
  "mysite.com", "website.com", "test.com",
]
const JUNK_LOCALPARTS = [
  "noreply", "no-reply", "donotreply",
  // placeholder/template local parts
  "user", "your", "youremail", "yourname", "name", "email", "username",
  "firstname", "lastname", "you", "test", "sample",
]
// File-extension false positives (e.g. logo@2x.png, hero-image@3x.jpg).
const FILE_EXT_RE = /\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?|ttf)$/i

function looksJunk(email: string): boolean {
  const e = email.toLowerCase()
  if (FILE_EXT_RE.test(e)) return true
  if (/@\d/.test(e)) return true // @2x, @3x image descriptors
  const [local, domain] = e.split("@")
  if (!local || !domain) return true
  if (local.length > 35) return true // license blurbs / minified-code false positives
  if (JUNK_LOCALPARTS.includes(local)) return true
  if (JUNK_DOMAINS.some((d) => domain === d || domain.endsWith("." + d))) return true
  return false
}

function normalizeUrl(raw: string): string | null {
  let u = raw.trim()
  if (!u) return null
  if (!/^https?:\/\//i.test(u)) u = "https://" + u
  try {
    const parsed = new URL(u)
    return parsed.toString()
  } catch {
    return null
  }
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
    })
    if (!res.ok) return null
    const ctype = res.headers.get("content-type") || ""
    if (!ctype.includes("text/html") && !ctype.includes("text/plain")) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function extractEmails(html: string): string[] {
  const found = new Set<string>()
  // mailto: links first (highest signal)
  for (const m of Array.from(html.matchAll(/mailto:([^"'?>\s]+)/gi))) {
    // Strip any extra leading "mailto:" (some sites have malformed mailto:mailto: hrefs).
    const e = decodeURIComponent(m[1]).toLowerCase().replace(/^(?:mailto:)+/, "")
    if (!looksJunk(e)) found.add(e)
  }
  // bare emails in text
  for (const m of Array.from(html.matchAll(EMAIL_RE))) {
    const e = m[0].toLowerCase()
    if (!looksJunk(e)) found.add(e)
  }
  return Array.from(found)
}

async function scrapeSite(homeUrl: string): Promise<string[]> {
  const origin = new URL(homeUrl).origin
  const pages = [homeUrl, ...EXTRA_PATHS.map((p) => `${origin}/${p}`)]
  const emails = new Set<string>()
  for (const page of pages) {
    const html = await fetchText(page)
    if (html) extractEmails(html).forEach((e) => emails.add(e))
    // Stop early once we already have something from a contact page.
    if (emails.size > 0 && page !== homeUrl) break
  }
  return Array.from(emails)
}

function csvField(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

async function runPool<T, R>(
  items: T[],
  worker: (item: T, i: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run))
  return results
}

async function main() {
  console.log("Loading businesses with websites…")
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      website: businesses.website,
      phone: businesses.phone,
      emailSource: businesses.emailSource,
    })
    .from(businesses)
    .where(and(isNotNull(businesses.website), ne(businesses.website, "")))
    .orderBy(asc(businesses.name))

  console.log(`Crawling ${rows.length} sites (concurrency ${CONCURRENCY})…`)

  let done = 0
  const out = await runPool(
    rows,
    async (b) => {
      const url = normalizeUrl(b.website!)
      let emails: string[] = []
      let status = "no-website"
      if (url) {
        try {
          emails = await scrapeSite(url)
          status = emails.length > 0 ? "found" : "none"
          // Persist into the DB, but never clobber an owner-entered email.
          if (emails.length > 0 && b.emailSource !== "owner") {
            await db
              .update(businesses)
              .set({ email: emails[0], emailsJson: emails, emailSource: "scraped" })
              .where(eq(businesses.id, b.id))
          }
        } catch {
          status = "error"
        }
      }
      done++
      if (done % 25 === 0) console.log(`  …${done}/${rows.length}`)
      return { ...b, normalizedUrl: url, emails, status }
    },
    CONCURRENCY,
  )

  // ---- write CSV ----
  mkdirSync(join(process.cwd(), "exports"), { recursive: true })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
  const file = join(process.cwd(), "exports", `business-emails-${stamp}.csv`)

  const header = ["name", "website", "email", "all_emails", "phone", "status"]
  const lines = [header.join(",")]
  for (const r of out) {
    lines.push(
      [
        csvField(r.name),
        csvField(r.normalizedUrl || r.website || ""),
        csvField(r.emails[0] || ""),
        csvField(r.emails.join("; ")),
        csvField(r.phone || ""),
        r.status,
      ].join(","),
    )
  }
  writeFileSync(file, lines.join("\n"), "utf8")

  const withEmail = out.filter((r) => r.emails.length > 0).length
  const writtenToDb = out.filter(
    (r) => r.emails.length > 0 && r.emailSource !== "owner",
  ).length
  console.log("\n──────── summary ────────")
  console.log(`Sites crawled:     ${rows.length}`)
  console.log(`With ≥1 email:     ${withEmail}`)
  console.log(`No email found:    ${rows.length - withEmail}`)
  console.log(`Written to DB:     ${writtenToDb} (email_source='scraped')`)
  console.log(`CSV written to:    ${file}`)
}

main().then(() => process.exit(0))
