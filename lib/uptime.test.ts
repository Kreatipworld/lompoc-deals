import assert from "node:assert/strict"
import { decideAction, formatDowntime, isQuotaError, REALERT_MS, type HealthState } from "./uptime"

const T0 = new Date("2026-08-23T12:00:00Z")
const fail = [{ target: "database", error: "HTTP 402 quota", quota: true }]

// healthy + no prior state → none
assert.equal(decideAction(null, [], T0).kind, "none")

// healthy + was up → none
const up: HealthState = { status: "up", since: "2026-08-23T00:00:00Z", lastAlertAt: null }
assert.equal(decideAction(up, [], T0).kind, "none")

// failure + was up → alert with down state
{
  const a = decideAction(null, fail, T0)
  assert.equal(a.kind, "alert")
  assert.equal(a.state?.status, "down")
  assert.ok(a.state?.reason?.includes("database"))
}

// failure + down, alerted 10 min ago → throttled
{
  const prev: HealthState = {
    status: "down", since: T0.toISOString(),
    lastAlertAt: new Date(T0.getTime() - 10 * 60000).toISOString(), reason: "x",
  }
  assert.equal(decideAction(prev, fail, T0).kind, "none")
}

// failure + down, alerted >=1h ago → realert
{
  const prev: HealthState = {
    status: "down", since: "2026-08-23T10:00:00Z",
    lastAlertAt: new Date(T0.getTime() - REALERT_MS).toISOString(), reason: "x",
  }
  assert.equal(decideAction(prev, fail, T0).kind, "realert")
}

// healthy + was down → recovery with downtime
{
  const prev: HealthState = {
    status: "down", since: new Date(T0.getTime() - 90 * 60000).toISOString(),
    lastAlertAt: T0.toISOString(), reason: "x",
  }
  const a = decideAction(prev, [], T0)
  assert.equal(a.kind, "recovery")
  if (a.kind === "recovery") assert.equal(formatDowntime(a.downtimeMs), "1h 30m")
}

assert.equal(isQuotaError("Server error (HTTP status 402): exceeded the compute time quota"), true)
assert.equal(isQuotaError("connection refused"), false)

console.log("uptime.test.ts: all assertions passed")
