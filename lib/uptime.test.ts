import assert from "node:assert/strict"
import { decideAction, evaluatePage, findErrorDigests, visibleExcerpt, formatDowntime, isQuotaError, HEALTH_PAGES, ERROR_BOUNDARY_MARKER, REALERT_MS, type HealthState } from "./uptime"

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

// ── page evaluation (Sep 14 2026: /category/* 500'd and the old check missed it) ──
{
  const page = { path: "/category/food-drink", marker: "Lompoc Food &amp; Drink" }

  // healthy page: marker present, benign bailout digest ignored
  const healthy = `<html><body><h1>Lompoc Food &amp; Drink</h1><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template><script>self.__next_f.push([1,"error\\":\\"Something went wrong"])</script></body></html>`
  assert.equal(evaluatePage(page, 200, healthy), null)
  assert.deepEqual(findErrorDigests(healthy), [])

  // hard 500
  const f500 = evaluatePage(page, 500, "<html><body><h1>Something went wrong</h1><p>We've been notified.</p></body></html>")
  assert.equal(f500?.error, "HTTP 500")
  assert.ok(f500?.excerpt?.startsWith("Something went wrong"))

  // 200 wearing the error boundary
  const soft = evaluatePage(page, 200, `<div ${ERROR_BOUNDARY_MARKER}><h1>Something went wrong</h1></div>`)
  assert.ok(soft?.error.includes("error boundary"))

  // 200, marker missing, real digest in the flight payload
  const digestHtml = `<html><body><div>loading</div><script>self.__next_f.push([1,"3:E{\\"digest\\":\\"1234567890\\"}\\n"])</script></body></html>`
  assert.deepEqual(findErrorDigests(digestHtml), ["1234567890"])
  const missing = evaluatePage(page, 200, digestHtml)
  assert.ok(missing?.error.includes("1234567890"), missing?.error)

  // excerpt strips tags/scripts and caps at 300 chars
  assert.equal(visibleExcerpt("<script>x</script><h1>Hi &amp; bye</h1>"), "Hi & bye")
  assert.equal(visibleExcerpt("<p>" + "a".repeat(400) + "</p>").length, 300)

  // every configured page has a path and a marker
  for (const p of HEALTH_PAGES) assert.ok(p.path.startsWith("/") && p.marker.length > 3, p.path)
}

console.log("uptime.test.ts: page evaluation ok")
