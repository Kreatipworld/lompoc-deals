import assert from "node:assert/strict"
import {
  buildSaleListingLiveEmail,
  buildSaleListingRejectedEmail,
  buildSaleMessageRelayEmail,
  buildSalesVerifyEmail,
} from "./sales-email"

// Run: node_modules/.bin/tsx lib/sales-email.test.ts  (no RESEND_API_KEY needed — builders only)
process.env.AUTH_URL = "https://www.lompoclocals.com"

const live = buildSaleListingLiveEmail({ title: "Oak table <b>", listingId: 42, locale: "en", expiresAt: new Date("2026-10-25T17:00:00Z") })
assert.equal(live.subject, 'Your listing "Oak table <b>" is live')
assert.ok(live.html.includes("https://www.lompoclocals.com/sales/42"), "links to the listing")
assert.ok(live.html.includes("Oak table &lt;b&gt;"), "title is escaped")
assert.ok(live.html.includes("lompoclocals.com") && live.html.includes("#650C75"), "branded shell")
assert.ok(!/\bAndres\b|\bAmador\b/.test(live.html), "no owner name anywhere")

const liveEs = buildSaleListingLiveEmail({ title: "Mesa", listingId: 42, locale: "es", expiresAt: new Date("2026-10-25T17:00:00Z") })
assert.ok(liveEs.html.includes("https://www.lompoclocals.com/es/sales/42"), "Spanish links go to /es")
assert.ok(liveEs.subject.startsWith("Tu anuncio"))

const rejected = buildSaleListingRejectedEmail({ title: "Puppies", reason: "Animals can't be sold here", locale: "en" })
assert.ok(rejected.html.includes("Animals can&#39;t be sold here"), "reason is shown, escaped")
assert.ok(rejected.html.includes("/sales/post"), "invites a corrected post")

const relay = buildSaleMessageRelayEmail({
  listing: { id: 7, title: "Tacoma" },
  buyer: { name: "Rosa", email: "rosa@example.com", phone: "805-555-0100", message: "Still available?\nCan I see it Saturday?" },
  locale: "en",
})
assert.equal(relay.subject, 'Someone is asking about "Tacoma"')
assert.ok(relay.html.includes("mailto:rosa@example.com"))
assert.ok(relay.html.includes("Still available?<br>Can I see it Saturday?"), "line breaks survive")
assert.ok(relay.html.includes("never shown on the site"), "tells the seller their address stays private")
assert.ok(!relay.html.includes("hello@lompoclocals.com"), "the relay body does not advertise hello@ (not copied)")

const verify = buildSalesVerifyEmail({ token: "abc/def", locale: "en" })
assert.ok(verify.html.includes("/api/sales/verify-email?token=abc%2Fdef"), "token is URL-encoded")
assert.ok(!verify.html.includes("<ul"), "no empty bullet list")

console.log("sales-email: all assertions passed")
