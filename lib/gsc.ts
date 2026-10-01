import { createSign } from "node:crypto"
import { sql } from "drizzle-orm"

/**
 * Google Search Console — Search Analytics API, no SDK.
 * docs/superpowers/specs/2026-09-30-keyword-positions-design.md
 *
 * Auth is a service account added as a user on the GSC property. We sign an
 * RS256 JWT with Node's crypto, trade it for an access token, and cache the
 * token in module scope until 5 minutes before it expires. No googleapis, no
 * google-auth-library — a 40-line token dance is not worth 30 MB of deps.
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT_JSON — the service-account key JSON, base64 (one line)
 *   GSC_SITE_URL             — sc-domain:lompoclocals.com
 * Both missing → gscConfigured() is false and every entry point says so.
 *
 * scripts/gsc-pull.mjs duplicates the token code on purpose (plain Node, no TS).
 */

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
export const GSC_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3/sites"
const TOKEN_TTL_SEC = 3600
const REFRESH_MARGIN_SEC = 300

export type ServiceAccount = { client_email: string; private_key: string }

export type GscRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type GscDimension = "date" | "query" | "page" | "country" | "device"

export function gscConfigured(): boolean {
  return Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON && process.env.GSC_SITE_URL)
}

export function gscSiteUrl(): string {
  const site = process.env.GSC_SITE_URL
  if (!site) throw new Error("GSC_SITE_URL not set")
  return site
}

/** Decode the base64 (or, leniently, raw JSON) service-account key from env. */
export function loadServiceAccount(raw = process.env.GSC_SERVICE_ACCOUNT_JSON): ServiceAccount {
  if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON not set")
  const text = raw.trim().startsWith("{") ? raw.trim() : Buffer.from(raw.trim(), "base64").toString("utf8")
  let parsed: Partial<ServiceAccount>
  try {
    parsed = JSON.parse(text) as Partial<ServiceAccount>
  } catch {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid base64 JSON")
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key")
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key }
}

const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")

/**
 * The signed assertion Google's token endpoint accepts for a service account:
 * header {alg:RS256,typ:JWT}, claims {iss, scope, aud, iat, exp}, RSA-SHA256
 * over "header.claims". Pure — unit-tested in lib/gsc.test.ts.
 */
export function buildServiceAccountJwt(sa: ServiceAccount, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: GSC_SCOPE,
      aud: GSC_TOKEN_URL,
      iat: nowSec,
      exp: nowSec + TOKEN_TTL_SEC,
    })
  )
  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${claims}`)
  const signature = b64url(signer.sign(sa.private_key))
  return `${header}.${claims}.${signature}`
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function gscAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt - REFRESH_MARGIN_SEC > now) return cachedToken.token
  const sa = loadServiceAccount()
  const assertion = buildServiceAccountJwt(sa, now)
  const res = await fetch(GSC_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  })
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string }
  if (!res.ok || !body.access_token) {
    throw new Error(`GSC token request failed: ${res.status} ${body.error ?? ""} ${body.error_description ?? ""}`.trim())
  }
  cachedToken = { token: body.access_token, expiresAt: now + (body.expires_in ?? TOKEN_TTL_SEC) }
  return cachedToken.token
}

export type GscQueryParams = {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  dimensions: GscDimension[]
  rowLimit?: number
  startRow?: number
}

/** One page of searchanalytics.query. Google caps rowLimit at 25,000. */
export async function gscQuery(params: GscQueryParams): Promise<GscRow[]> {
  const token = await gscAccessToken()
  const url = `${GSC_API}/${encodeURIComponent(gscSiteUrl())}/searchAnalytics/query`
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions,
      rowLimit: params.rowLimit ?? 25000,
      startRow: params.startRow ?? 0,
      dataState: "all",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  })
  const body = (await res.json().catch(() => ({}))) as { rows?: GscRow[]; error?: { message?: string } }
  if (!res.ok) throw new Error(`GSC query failed: ${res.status} ${body.error?.message ?? ""}`.trim())
  return body.rows ?? []
}

/** Every row for the window — loops on startRow until a short page comes back. */
export async function gscQueryAll(params: Omit<GscQueryParams, "startRow">): Promise<GscRow[]> {
  const rowLimit = params.rowLimit ?? 25000
  const all: GscRow[] = []
  for (let startRow = 0; ; startRow += rowLimit) {
    const rows = await gscQuery({ ...params, rowLimit, startRow })
    all.push(...rows)
    if (rows.length < rowLimit) break
  }
  return all
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** [startDate, endDate] covering the last `days` days up to today (UTC). */
export function pullWindow(days: number, today = new Date()): { startDate: string; endDate: string } {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const start = new Date(end.getTime() - (days - 1) * 86_400_000)
  return { startDate: isoDate(start), endDate: isoDate(end) }
}

export type PullResult = { startDate: string; endDate: string; fetched: number; upserted: number }

/**
 * Fetch date × query × page for the last `days` days and upsert into gsc_daily.
 * Throws when the credential is missing — callers decide whether that is a
 * skip (cron) or an exit 1 (scripts).
 */
export async function pullGscDays(days = 4): Promise<PullResult> {
  if (!gscConfigured()) throw new Error("GSC_SERVICE_ACCOUNT_JSON not set")
  const { startDate, endDate } = pullWindow(days)
  const rows = await gscQueryAll({ startDate, endDate, dimensions: ["date", "query", "page"] })
  const upserted = await upsertGscRows(rows)
  return { startDate, endDate, fetched: rows.length, upserted }
}

const BATCH = 500

async function upsertGscRows(rows: GscRow[]): Promise<number> {
  if (rows.length === 0) return 0
  const { db } = await import("@/db/client")
  const { gscDaily } = await import("@/db/schema")
  let n = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH).map((r) => ({
      date: r.keys[0],
      query: r.keys[1],
      page: r.keys[2],
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: r.ctr,
      position: r.position,
      fetchedAt: new Date(),
    }))
    await db
      .insert(gscDaily)
      .values(chunk)
      .onConflictDoUpdate({
        target: [gscDaily.date, gscDaily.query, gscDaily.page],
        set: {
          clicks: sql`excluded.clicks`,
          impressions: sql`excluded.impressions`,
          ctr: sql`excluded.ctr`,
          position: sql`excluded.position`,
          fetchedAt: sql`excluded.fetched_at`,
        },
      })
    n += chunk.length
  }
  return n
}
