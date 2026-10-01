#!/usr/bin/env node
/**
 * Google Search Console → gsc_daily, by hand. Same pull as /api/cron/gsc-pull
 * but for any window (GSC keeps 16 months; the first backfill is 120 days):
 *
 *   node --env-file=.env.local scripts/gsc-pull.mjs --days 120
 *   node --env-file=.env.local scripts/gsc-pull.mjs            # last 4 days (what the cron does)
 *
 * Dependency-free on purpose: the ~40 lines of service-account token code are
 * duplicated from lib/gsc.ts rather than importing TS. Keep the two in step.
 * docs/superpowers/specs/2026-09-30-keyword-positions-design.md
 */
import { createSign } from "node:crypto"
import { neon } from "@neondatabase/serverless"

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const API = "https://searchconsole.googleapis.com/webmasters/v3/sites"
const ROW_LIMIT = 25000
const BATCH = 500

const daysArg = process.argv.indexOf("--days")
const DAYS = daysArg > -1 ? parseInt(process.argv[daysArg + 1], 10) : 4
if (!Number.isFinite(DAYS) || DAYS < 1 || DAYS > 480) {
  console.error("--days must be between 1 and 480 (GSC keeps 16 months)")
  process.exit(1)
}

const missing = ["DATABASE_URL", "GSC_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"].filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}.`)
  console.error("GSC_SERVICE_ACCOUNT_JSON is the service-account key JSON, base64 on one line; GSC_SITE_URL is sc-domain:lompoclocals.com.")
  console.error("Put them in .env.local and run: node --env-file=.env.local scripts/gsc-pull.mjs --days 120")
  process.exit(1)
}

// ── token (mirror of lib/gsc.ts) ──────────────────────────────────────────
const b64url = (input) => Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")

function loadServiceAccount(raw) {
  const text = raw.trim().startsWith("{") ? raw.trim() : Buffer.from(raw.trim(), "base64").toString("utf8")
  const sa = JSON.parse(text)
  if (!sa.client_email || !sa.private_key) throw new Error("GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key")
  return sa
}

function buildJwt(sa, nowSec) {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSec, exp: nowSec + 3600 }))
  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${claims}`)
  return `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`
}

async function accessToken() {
  const sa = loadServiceAccount(process.env.GSC_SERVICE_ACCOUNT_JSON)
  const assertion = buildJwt(sa, Math.floor(Date.now() / 1000))
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.access_token) throw new Error(`token request failed: ${res.status} ${body.error ?? ""} ${body.error_description ?? ""}`.trim())
  return body.access_token
}

// ── query ─────────────────────────────────────────────────────────────────
async function queryAll(token, startDate, endDate) {
  const url = `${API}/${encodeURIComponent(process.env.GSC_SITE_URL)}/searchAnalytics/query`
  const all = []
  for (let startRow = 0; ; startRow += ROW_LIMIT) {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["date", "query", "page"], rowLimit: ROW_LIMIT, startRow, dataState: "all" }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(`query failed: ${res.status} ${body.error?.message ?? ""}`.trim())
    const rows = body.rows ?? []
    all.push(...rows)
    process.stdout.write(`  ${startDate}..${endDate}: ${all.length} rows\r`)
    if (rows.length < ROW_LIMIT) break
  }
  process.stdout.write("\n")
  return all
}

// ── upsert ────────────────────────────────────────────────────────────────
async function upsert(sql, rows) {
  let n = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const values = []
    const params = []
    chunk.forEach((r, j) => {
      const o = j * 7
      values.push(`($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7})`)
      params.push(r.keys[0], r.keys[1], r.keys[2], Math.round(r.clicks), Math.round(r.impressions), r.ctr, r.position)
    })
    await sql.query(
      `insert into gsc_daily (date, query, page, clicks, impressions, ctr, position) values ${values.join(",")}
       on conflict (date, query, page) do update set
         clicks = excluded.clicks, impressions = excluded.impressions, ctr = excluded.ctr,
         position = excluded.position, fetched_at = now()`,
      params
    )
    n += chunk.length
  }
  return n
}

const iso = (d) => d.toISOString().slice(0, 10)
const today = new Date()
const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

const sql = neon(process.env.DATABASE_URL)
const token = await accessToken()
console.log(`GSC pull for ${process.env.GSC_SITE_URL}, last ${DAYS} day(s), in windows of 30 days:`)

// Long backfills go a month at a time so one window never approaches the row cap.
let total = 0
let fetched = 0
for (let offset = DAYS - 1; offset >= 0; ) {
  const span = Math.min(30, offset + 1)
  const startDate = iso(new Date(end.getTime() - offset * 86_400_000))
  const endDate = iso(new Date(end.getTime() - (offset - span + 1) * 86_400_000))
  const rows = await queryAll(token, startDate, endDate)
  fetched += rows.length
  total += await upsert(sql, rows)
  offset -= span
}
const [{ days, first, last }] = await sql`select count(distinct date)::int as days, min(date)::text as first, max(date)::text as last from gsc_daily`
console.log(`Fetched ${fetched} rows, upserted ${total}. gsc_daily now covers ${days} day(s): ${first} → ${last}.`)
