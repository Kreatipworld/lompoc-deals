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
  target: string // "database" | "homepage" | "/deals"
  error: string
  /** Neon compute-quota class of error (HTTP 402) — gets a specific fix hint */
  quota: boolean
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
