import assert from "node:assert/strict"
import { buildLocalBusinessJsonLd } from "./business-jsonld"

const base = {
  name: "Test Cafe",
  slug: "test-cafe",
  about: null,
  description: null,
  phone: null,
  address: null,
  lat: null,
  lng: null,
  hoursJson: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  yelpUrl: null,
  googleBusinessUrl: null,
}
const opts = { siteUrl: "https://x.test", amenities: [], photos: [], categorySlug: null }

// minimal: only required keys, no empty/null keys leaked
const min = buildLocalBusinessJsonLd(base, opts)
assert.equal(min["@context"], "https://schema.org")
assert.equal(min["@type"], "LocalBusiness")
assert.equal(min.name, "Test Cafe")
assert.equal(min.url, "https://x.test/biz/test-cafe")
assert.ok(!("telephone" in min))
assert.ok(!("geo" in min))
assert.ok(!("address" in min))
assert.ok(!("aggregateRating" in min))

// food-drink → Restaurant
const food = buildLocalBusinessJsonLd(base, { ...opts, categorySlug: "food-drink" })
assert.equal(food["@type"], "Restaurant")

// full: address parsed, geo, hours, amenities, sameAs, description from about
const full = buildLocalBusinessJsonLd(
  {
    ...base,
    about: "Cozy corner cafe.",
    description: "short",
    phone: "(805) 555-1212",
    address: "123 H St, Lompoc, CA 93436",
    lat: 34.6,
    lng: -120.4,
    hoursJson: { mon: { open: "09:00", close: "17:00" }, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
    instagramUrl: "https://instagram.com/x",
    googleBusinessUrl: "https://g.page/x",
  },
  { ...opts, amenities: ["takeout", "free_wifi"], photos: ["https://x.test/p1.jpg"] }
)
assert.equal(full.description, "Cozy corner cafe.")
assert.equal(full.telephone, "(805) 555-1212")
const addr = full.address as Record<string, string>
assert.equal(addr["@type"], "PostalAddress")
assert.equal(addr.streetAddress, "123 H St, Lompoc, CA 93436")
assert.equal(addr.addressLocality, "Lompoc")
assert.equal(addr.addressRegion, "CA")
assert.equal(addr.postalCode, "93436")
const geo = full.geo as Record<string, unknown>
assert.equal(geo["@type"], "GeoCoordinates")
assert.equal(geo.latitude, 34.6)
const hours = full.openingHoursSpecification as Array<Record<string, string>>
assert.equal(hours.length, 1)
assert.equal(hours[0].dayOfWeek, "Monday")
assert.equal(hours[0].opens, "09:00")
assert.equal(hours[0].closes, "17:00")
const af = full.amenityFeature as Array<Record<string, unknown>>
assert.equal(af.length, 2)
assert.equal(af[0]["@type"], "LocationFeatureSpecification")
assert.equal(af[0].value, true)
assert.deepEqual(full.image, ["https://x.test/p1.jpg"])
assert.deepEqual(full.sameAs, ["https://instagram.com/x", "https://g.page/x"])

console.log("business-jsonld.test: all passed")
