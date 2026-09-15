/**
 * Uptime monitoring: pure decision logic for the health-check cron.
 * The route (app/api/cron/health-check) runs the checks and sends email;
 * this module decides *what* to do so the behavior is unit-testable.
 */

export type HealthStatus = "up" | "down"

export type HealthState = {
  status: HealthStatus
  /** ISO timestamp of when the current status began */
  since: string
  /** ISO timestamp of the last DOWN alert we emailed, if any */
  lastAlertAt: string | null
  /** Short human reason for the outage (only meaningful when down) */
  reason?: string
}

export type CheckFailure = {
  target: string // "database" | "/" | "/category/food-drink"
  error: string
  /** Neon compute-quota class of error (HTTP 402) — gets a specific fix hint */
  quota: boolean
  /** First ~300 visible characters of the failing page, so the email says what a neighbor saw */
  excerpt?: string
}

/**
 * The pages a neighbor actually opens, each with a marker that only renders
 * when the page's own server component succeeded. Status alone lies twice:
 * the error boundary can answer 200, and "Something went wrong" is in every
 * English payload as a dormant translation string — so we assert the positive
 * marker and the boundary's DOM attribute, never the text.
 *
 * Sep 14 2026: commit c5a36aa 500'd every /category/* page for ~6 minutes and
 * the old check (/ and /deals only) never noticed. This list is the fix.
 */
export const HEALTH_PAGES: ReadonlyArray<{ path: string; marker: string }> = [
  { path: "/", marker: "All of Lompoc" },
  { path: "/businesses", marker: "Find any business in Lompoc" },
  { path: "/category/food-drink", marker: "Lompoc Food &amp; Drink" },
  { path: "/homes", marker: "Homes in Lompoc" },
  { path: "/listings/50", marker: 'data-lead="showing"' },
  { path: "/football", marker: "Lompoc Football" },
  { path: "/news", marker: "Lompoc News" },
  { path: "/map", marker: "Businesses on the map" },
  { path: "/deals", marker: "Deals &amp; Coupons" },
  { path: "/this-week", marker: "This Week in Lompoc" },
  { path: "/biz/empire-real-estate-group-maressa-the-realtor", marker: "Empire Real Estate Group" },
  { path: "/es/", marker: "Todo Lompoc" },
]

/** Attribute rendered by app/[locale]/error.tsx — the one honest sign the boundary is showing. */
export const ERROR_BOUNDARY_MARKER = 'data-error-boundary="root"'

/**
 * Digests that React/Next legitimately emit on healthy pages: client-only
 * components (ssr:false maps) bail out with a named digest; notFound/redirect
 * are control flow. Anything else — a numeric hash — is a real thrown error.
 */
const BENIGN_DIGESTS = /^(BAILOUT_TO_CLIENT_SIDE_RENDERING|NEXT_NOT_FOUND|NEXT_REDIRECT|DYNAMIC_SERVER_USAGE)/

export function findErrorDigests(html: string): string[] {
  const out = new Set<string>()
  for (const m of Array.from(html.matchAll(/data-dgst="([^"]*)"/g))) if (!BENIGN_DIGESTS.test(m[1])) out.add(m[1])
  // Flight payload: E{\"digest\":\"1234567\"} inside self.__next_f.push strings.
  for (const m of Array.from(html.matchAll(/E\{\\"digest\\":\\"([^"\\]*)\\"/g))) if (!BENIGN_DIGESTS.test(m[1])) out.add(m[1])
  return Array.from(out)
}

/** Visible text of a page, trimmed to n chars — what the failing page said. */
export function visibleExcerpt(html: string, n = 300): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
  return text.slice(0, n)
}

/**
 * Judge one fetched page. Pure, so it can be tested with canned HTML and
 * shared between the cron and the pre-promotion check.
 */
export function evaluatePage(
  page: { path: string; marker: string },
  status: number,
  html: string
): CheckFailure | null {
  if (status !== 200) {
    return { target: page.path, error: `HTTP ${status}`, quota: false, excerpt: visibleExcerpt(html) }
  }
  if (html.includes(ERROR_BOUNDARY_MARKER)) {
    return { target: page.path, error: "200 but the error boundary is showing (\"Something went wrong\")", quota: false, excerpt: visibleExcerpt(html) }
  }
  if (!html.includes(page.marker)) {
    const digests = findErrorDigests(html)
    const why = digests.length ? `server error digest ${digests.join(", ")}` : "page content missing"
    return { target: page.path, error: `200 but missing "${page.marker}" — ${why}`, quota: false, excerpt: visibleExcerpt(html) }
  }
  return null
}

export type HealthAction =
  | { kind: "none"; state: HealthState | null }
  | { kind: "alert"; state: HealthState }
  | { kind: "realert"; state: HealthState }
  | { kind: "recovery"; state: HealthState; downtimeMs: number }

/** Re-alert at most once per hour while an outage persists. */
export const REALERT_MS = 60 * 60 * 1000

export function decideAction(
  prev: HealthState | null,
  failures: CheckFailure[],
  now: Date
): HealthAction {
  const ok = failures.length === 0
  const nowIso = now.toISOString()
  const wasDown = prev?.status === "down"

  if (ok && !wasDown) {
    // Healthy and was healthy: nothing to do, no state write needed.
    return { kind: "none", state: null }
  }

  if (ok && wasDown) {
    const downtimeMs = Math.max(0, now.getTime() - new Date(prev!.since).getTime())
    return {
      kind: "recovery",
      state: { status: "up", since: nowIso, lastAlertAt: null },
      downtimeMs,
    }
  }

  const reason = failures.map((f) => `${f.target}: ${f.error}`).join("; ")

  if (!wasDown) {
    return {
      kind: "alert",
      state: { status: "down", since: nowIso, lastAlertAt: nowIso, reason },
    }
  }

  // Still down: throttle repeat alerts.
  const last = prev!.lastAlertAt ? new Date(prev!.lastAlertAt).getTime() : 0
  if (now.getTime() - last >= REALERT_MS) {
    return {
      kind: "realert",
      state: { ...prev!, lastAlertAt: nowIso, reason },
    }
  }
  return { kind: "none", state: null }
}

export function isQuotaError(message: string): boolean {
  return /402|compute time quota|quota.*exceeded|exceeded.*quota/i.test(message)
}

export function formatDowntime(ms: number): string {
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
