/**
 * Uptime monitoring: pure decision logic for the health-check cron.
 * The route (app/api/cron/health-check) runs the checks and sends email;
 * this module decides *what* to do so the behavior is unit-testable.
 */

import { CATEGORY_GUIDES } from "./category-guides"

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

/**
 * Severity splits a real outage from harmless content drift:
 *  - "outage": the page did not serve — non-200, the error boundary is showing,
 *    the server threw, or the HTML never finished. These page the founder.
 *  - "drift":  the page served fine (200, no error boundary, no thrown error,
 *    complete HTML) but an expected marker string is gone — almost always a
 *    copy/SEO edit, not an outage. These are logged, never emailed, so a word
 *    change on the site can NEVER again set off a false "site is DOWN" alarm.
 */
export type FailureSeverity = "outage" | "drift"

export type CheckFailure = {
  target: string // "database" | "/" | "/category/food-drink"
  error: string
  /** Neon compute-quota class of error (HTTP 402) — gets a specific fix hint */
  quota: boolean
  /** First ~300 visible characters of the failing page, so the email says what a neighbor saw */
  excerpt?: string
  /** outage = real down (emails); drift = content changed but page is alive (logged only) */
  severity: FailureSeverity
}

/**
 * The pages a neighbor actually opens, each with a marker that renders only
 * when the page's own server component succeeded. We never trust status alone:
 * the error boundary answers 200, and "Something went wrong" is a dormant
 * translation string in every English payload.
 *
 * The marker is now only a *drift* signal (see FailureSeverity): if it is gone
 * but the page is otherwise healthy, we log it and move on — we do not cry
 * "down". Real outages are caught by status / error-boundary / thrown-digest /
 * incomplete-HTML, none of which depend on page copy. So keeping a marker
 * up to date is nice (it makes the drift log meaningful) but a stale marker
 * can no longer wake anyone at 2am. Where a marker IS the page's real heading,
 * we read it from the same source the page renders from (CATEGORY_GUIDES), so
 * the two can never disagree again.
 *
 * Sep 14 2026: commit c5a36aa 500'd every /category/* page for ~6 minutes and
 * the old check (/ and /deals only) never noticed. This list is the fix.
 * Oct 19 2026: an SEO heading change ("Lompoc Food & Drink" → "Restaurants in
 * Lompoc, CA") made the monitor email false DOWN alerts for 24h — the marker
 * was a brittle copy string. Hence the severity split and the shared source.
 */
const FOOD_DRINK_H1 = CATEGORY_GUIDES["food-drink"]?.h1.en ?? "Food & Drink"

export const HEALTH_PAGES: ReadonlyArray<{ path: string; marker: string }> = [
  { path: "/", marker: "All of Lompoc" },
  { path: "/businesses", marker: "Find any business in Lompoc" },
  { path: "/category/food-drink", marker: FOOD_DRINK_H1 },
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
 * shared between the cron and the pre-promotion check. Returns null when the
 * page is healthy, or a CheckFailure whose `severity` says whether it is a real
 * outage (emails) or harmless content drift (logged only).
 *
 * Order matters: every hard outage signal is checked before the soft marker,
 * so a broken page is always an outage even if its marker happens to be absent.
 */
export function evaluatePage(
  page: { path: string; marker: string },
  status: number,
  html: string
): CheckFailure | null {
  // ── Hard outage signals: the page did not actually serve ──────────────
  if (status !== 200) {
    return { target: page.path, error: `HTTP ${status}`, quota: false, excerpt: visibleExcerpt(html), severity: "outage" }
  }
  if (html.includes(ERROR_BOUNDARY_MARKER)) {
    return { target: page.path, error: '200 but the error boundary is showing ("Something went wrong")', quota: false, excerpt: visibleExcerpt(html), severity: "outage" }
  }
  const digests = findErrorDigests(html)
  if (digests.length) {
    return { target: page.path, error: `200 but the server threw an error (digest ${digests.join(", ")})`, quota: false, excerpt: visibleExcerpt(html), severity: "outage" }
  }
  if (!html.includes("</html>")) {
    return { target: page.path, error: `200 but the HTML never finished (${html.length} bytes, no closing </html>) — render crashed mid-stream`, quota: false, excerpt: visibleExcerpt(html), severity: "outage" }
  }

  // ── Page served fine. Is its content what we expect? ──────────────────
  if (!html.includes(page.marker)) {
    // The page is alive; only a copy/SEO string moved. Never an outage.
    return {
      target: page.path,
      error: `200, page healthy, but marker "${page.marker}" not found — content/SEO drift; update the marker in lib/uptime.ts`,
      quota: false,
      excerpt: visibleExcerpt(html),
      severity: "drift",
    }
  }
  return null
}

/** Split a batch of failures into the ones that page the founder vs the ones that only get logged. */
export function splitBySeverity(failures: CheckFailure[]): { outages: CheckFailure[]; drifts: CheckFailure[] } {
  return {
    outages: failures.filter((f) => f.severity === "outage"),
    drifts: failures.filter((f) => f.severity === "drift"),
  }
}

export type HealthAction =
  | { kind: "none"; state: HealthState | null }
  | { kind: "alert"; state: HealthState }
  | { kind: "realert"; state: HealthState }
  | { kind: "recovery"; state: HealthState; downtimeMs: number }

/** Re-alert at most once per hour while an outage persists. */
export const REALERT_MS = 60 * 60 * 1000

/**
 * Decide what to do given the previous state and the current OUTAGE failures.
 * Callers must pass only outage-severity failures (see splitBySeverity): drift
 * never changes up/down status and never emails.
 */
export function decideAction(
  prev: HealthState | null,
  outages: CheckFailure[],
  now: Date
): HealthAction {
  const ok = outages.length === 0
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

  const reason = outages.map((f) => `${f.target}: ${f.error}`).join("; ")

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
