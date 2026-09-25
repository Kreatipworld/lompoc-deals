import assert from "node:assert/strict"
import {
  acceptsMessages,
  canPostAnother,
  canSendMessage,
  canTransition,
  categoriesForKind,
  computeExpiresAt,
  formatSalePrice,
  isPubliclyVisible,
  pacificToUtc,
  validateListing,
  type ListingInput,
} from "./sales"

// Run: node_modules/.bin/tsx lib/sales.test.ts

const item = (over: Partial<ListingInput> = {}): ListingInput => ({
  kind: "item",
  category: "furniture",
  title: "Oak dining table, seats six",
  description: "Solid oak, a few scratches on one leg. Pickup only, north side.",
  photos: ["https://x.public.blob.vercel-storage.com/sales/1/a.jpg"],
  priceCents: 12_000,
  priceType: "fixed",
  condition: "good",
  attrs: null,
  address: null,
  area: "North side, near Ryon Park",
  startsAt: null,
  endsAt: null,
  contactPhone: null,
  showPhone: false,
  ...over,
})

const garage = (over: Partial<ListingInput> = {}): ListingInput =>
  item({
    kind: "garage-sale",
    category: "garage-sales",
    title: "Multi-family garage sale",
    photos: [],
    priceCents: null,
    condition: null,
    area: null,
    address: "414 W Ocean Ave, Lompoc, CA 93436",
    startsAt: new Date("2026-10-03T15:00:00Z"),
    endsAt: new Date("2026-10-03T20:00:00Z"),
    ...over,
  })

// ── ZIP fence ──
assert.deepEqual(validateListing(garage()), [], "a Lompoc garage sale is valid")
assert.ok(validateListing(garage({ address: "1 Main St, Santa Maria, CA 93454" })).includes("addressZip"), "93454 is outside the fence")
assert.ok(validateListing(garage({ address: "Ocean Ave, Lompoc" })).includes("addressZip"), "no ZIP → refused")
assert.ok(validateListing(garage({ address: "" })).includes("addressRequired"))
assert.deepEqual(validateListing(garage({ address: "100 Community Loop, Vandenberg SFB, CA 93437" })), [], "Vandenberg 93437 is inside")
assert.deepEqual(validateListing(garage({ address: "10 Base Rd, Lompoc, CA 93438" })), [], "93438 is inside")

// ── photo / price rules ──
assert.deepEqual(validateListing(item()), [])
assert.ok(validateListing(item({ photos: [] })).includes("photosRequired"), "an item needs a photo")
assert.deepEqual(validateListing(item({ photos: [], priceType: "free", priceCents: null })), [], "free items need no photo")
assert.deepEqual(validateListing(item({ photos: [], category: "free", priceType: "free", priceCents: null })), [], "the free category needs no photo")
assert.ok(validateListing(item({ photos: Array(9).fill("u") })).includes("photosTooMany"), "max 8 photos")
assert.ok(validateListing(item({ priceCents: null })).includes("priceRequired"))
assert.ok(validateListing(item({ priceCents: 0 })).includes("priceInvalid"))
assert.ok(validateListing(item({ priceCents: 12.5 })).includes("priceInvalid"), "cents are integers")
assert.ok(validateListing(item({ condition: null })).includes("conditionRequired"))
assert.ok(validateListing(item({ area: "" })).includes("areaRequired"), "items carry an area, not an address")
assert.ok(validateListing(item({ title: "Buy at www.example.com" })).includes("titleLink"), "no links in the title")
assert.ok(validateListing(item({ title: "Ok" })).includes("titleShort"))
assert.ok(validateListing(item({ description: "short" })).includes("descriptionShort"))
assert.ok(validateListing(item({ category: "vehicles" })).includes("category"), "an item cannot sit in Vehicles")
assert.ok(validateListing(item({ contactPhone: "805-12" })).includes("phoneInvalid"))
assert.deepEqual(validateListing(item({ contactPhone: "(805) 555-0100", showPhone: true })), [])

// ── vehicles ──
const truck = item({ kind: "vehicle", category: "vehicles", title: "2014 Toyota Tacoma", priceCents: 1_850_000, attrs: { year: 2014, make: "Toyota", model: "Tacoma", mileage: 121_000 } })
assert.deepEqual(validateListing(truck), [])
assert.ok(validateListing({ ...truck, attrs: null }).includes("vehicleAttrs"))
assert.ok(validateListing({ ...truck, attrs: { year: 1850, make: "Toyota", model: "Tacoma" } }).includes("vehicleAttrs"))
assert.ok(validateListing({ ...truck, attrs: { year: 2014, make: "", model: "Tacoma" } }).includes("vehicleAttrs"))

// ── garage sale dates ──
assert.ok(validateListing(garage({ startsAt: null, endsAt: null })).includes("datesRequired"))
assert.ok(validateListing(garage({ startsAt: new Date("2026-10-03T20:00:00Z"), endsAt: new Date("2026-10-03T15:00:00Z") })).includes("datesOrder"))

// ── categories per kind ──
assert.deepEqual(categoriesForKind("garage-sale"), ["garage-sales"])
assert.deepEqual(categoriesForKind("vehicle"), ["vehicles"])
assert.ok(!categoriesForKind("item").includes("vehicles") && categoriesForKind("item").includes("furniture"))

// ── pending cap + relay rate limit ──
assert.equal(canPostAnother(4), true)
assert.equal(canPostAnother(5), false, "5 pending is the cap")
assert.equal(canSendMessage(4), true)
assert.equal(canSendMessage(5), false, "5 per listing per email per day")

// ── expiry ──
const approved = new Date("2026-09-25T17:00:00Z")
assert.equal(computeExpiresAt("item", approved, null).toISOString(), "2026-10-25T17:00:00.000Z", "+30 days")
assert.equal(computeExpiresAt("garage-sale", approved, new Date("2026-10-03T20:00:00Z")).toISOString(), "2026-10-03T20:00:00.000Z", "garage sales end with the sale")

// ── status transitions ──
assert.equal(canTransition("pending", "active", "admin"), true)
assert.equal(canTransition("pending", "rejected", "admin"), true)
assert.equal(canTransition("pending", "active", "owner"), false, "a seller cannot approve themselves")
assert.equal(canTransition("pending", "active", "public"), false)
assert.equal(canTransition("active", "hidden", "admin"), true)
assert.equal(canTransition("active", "sold", "owner"), true)
assert.equal(canTransition("active", "expired", "system"), true)
assert.equal(canTransition("active", "expired", "owner"), false)
assert.equal(canTransition("hidden", "active", "admin"), true)
assert.equal(canTransition("rejected", "active", "admin"), false, "rejected goes back through pending")
assert.equal(canTransition("sold", "rejected", "admin"), false)

assert.equal(isPubliclyVisible("active"), true)
assert.equal(isPubliclyVisible("sold"), true)
assert.equal(isPubliclyVisible("pending"), false)
assert.equal(isPubliclyVisible("hidden"), false)
assert.equal(isPubliclyVisible("rejected"), false)
assert.equal(acceptsMessages("active", new Date(Date.now() + 86_400_000)), true)
assert.equal(acceptsMessages("active", new Date(Date.now() - 1)), false, "past expiry takes no messages")
assert.equal(acceptsMessages("sold", new Date(Date.now() + 86_400_000)), false)

// ── price label ──
const labels = { free: "FREE", obo: "OBO" }
assert.equal(formatSalePrice({ kind: "item", priceCents: 125_000, priceType: "fixed", category: "furniture" }, labels), "$1,250")
assert.equal(formatSalePrice({ kind: "item", priceCents: 125_000, priceType: "obo", category: "furniture" }, labels), "$1,250 OBO")
assert.equal(formatSalePrice({ kind: "item", priceCents: null, priceType: "free", category: "free" }, labels), "FREE")
assert.equal(formatSalePrice({ kind: "garage-sale", priceCents: null, priceType: "fixed", category: "garage-sales" }, labels), null)

// ── Pacific wall clock ──
assert.equal(pacificToUtc("2026-10-03", "08:00")?.toISOString(), "2026-10-03T15:00:00.000Z", "PDT is UTC-7")
assert.equal(pacificToUtc("2026-12-12", "08:00")?.toISOString(), "2026-12-12T16:00:00.000Z", "PST is UTC-8")
assert.equal(pacificToUtc("2026-13-01", "08:00"), null)
assert.equal(pacificToUtc("2026-10-03", "8:00")?.toISOString(), "2026-10-03T15:00:00.000Z")

console.log("sales: all assertions passed")
