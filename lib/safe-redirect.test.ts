import assert from "node:assert/strict"
import { safeInternalPath } from "./safe-redirect"

// ── Legitimate internal destinations pass through ──
assert.equal(safeInternalPath("/account"), "/account")
assert.equal(safeInternalPath("/dashboard/coupons"), "/dashboard/coupons")
assert.equal(safeInternalPath("/deals/169/claim"), "/deals/169/claim")
assert.equal(safeInternalPath("/biz/valley-embroidery"), "/biz/valley-embroidery")
// query strings and fragments are preserved — they carry real state
assert.equal(safeInternalPath("/category/food-drink?open=1"), "/category/food-drink?open=1")
assert.equal(safeInternalPath("/feed#top"), "/feed#top")

// ── Absolute URLs are rejected (the reported open redirect) ──
for (const evil of [
  "https://evil.com",
  "http://evil.com/path",
  "HTTPS://EVIL.COM",
  "https://lompoclocals.com.evil.com",
]) {
  assert.equal(safeInternalPath(evil), null, `absolute URL must be rejected: ${evil}`)
}

// ── Protocol-relative URLs are rejected: they start with "/" but browsers
//    treat them as external, so a naive startsWith("/") check lets them through ──
for (const evil of ["//evil.com", "//evil.com/path", "/\\evil.com", "/\tevil.com"]) {
  assert.equal(safeInternalPath(evil), null, `protocol-relative must be rejected: ${evil}`)
}

// ── Other schemes are rejected ──
for (const evil of [
  "javascript:alert(1)",
  "JavaScript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)",
  "mailto:a@b.com",
]) {
  assert.equal(safeInternalPath(evil), null, `scheme must be rejected: ${evil}`)
}

// ── Encoded and whitespace evasion attempts are rejected ──
for (const evil of [
  "%2F%2Fevil.com",
  " //evil.com",
  "\n//evil.com",
  "\thttps://evil.com",
  "  https://evil.com  ",
]) {
  assert.equal(safeInternalPath(evil), null, `evasion attempt must be rejected: ${evil}`)
}

// ── Anything not starting with a single "/" is rejected ──
for (const bad of ["account", "", "   ", "?next=/x", "#frag"]) {
  assert.equal(safeInternalPath(bad), null, `relative/garbage must be rejected: ${JSON.stringify(bad)}`)
}

// ── Null/undefined are safe ──
assert.equal(safeInternalPath(null), null)
assert.equal(safeInternalPath(undefined), null)

// ── Whatever comes back is always safe to hand to redirect() ──
const probes = [
  "/account", "https://evil.com", "//evil.com", "javascript:alert(1)",
  null, "", "/dashboard?x=1", "%2F%2Fevil.com",
]
for (const p of probes) {
  const out = safeInternalPath(p as string | null)
  if (out !== null) {
    assert.ok(out.startsWith("/"), `result must be a rooted path: ${out}`)
    assert.ok(!out.startsWith("//"), `result must not be protocol-relative: ${out}`)
    assert.ok(!/^[a-z][a-z0-9+.-]*:/i.test(out), `result must carry no scheme: ${out}`)
  }
}

console.log("safe-redirect: all assertions passed")
