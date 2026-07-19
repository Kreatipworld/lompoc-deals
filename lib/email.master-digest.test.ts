import assert from "node:assert/strict"
import { renderMasterDigestHtml } from "./email"
import type { MasterDigestContent } from "./digest"

const NOW = new Date("2026-07-20T15:00:00Z")
const content: MasterDigestContent = {
  events: [
    { id: 5, title: "Falcon 9 Launch", location: "Vandenberg SFB",
      startsAt: new Date("2026-07-23T20:41:00Z"), imageUrl: "/img/launch.jpg" },
    { id: 6, title: "Flower Festival Parade", location: "Ocean Ave",
      startsAt: new Date("2026-07-25T17:00:00Z"), imageUrl: null },
  ],
  deals: [
    { id: 9, type: "coupon", title: "Two-for-One Tri-Tip", description: "All week",
      imageUrl: null, discountText: "20% Off", terms: null,
      expiresAt: new Date("2026-08-01T00:00:00Z"), featured: false,
      business: { id: 1, name: "Big Jayke's", slug: "big-jaykes", logoUrl: null,
        coverUrl: null, categoryName: null, categorySlug: null, address: null, phone: null } },
  ],
  things: [
    { title: "Wine Tasting", href: "/activities/wine", imageUrl: "/img/wine.jpg", subtitle: "Wine" },
  ],
  partners: [
    { name: "One Plant", slug: "one-plant", coverUrl: "/img/op.jpg",
      categoryName: "Dispensary", dealTitle: null, discountText: null },
  ],
}
const opts = { unsubUrl: "https://x/unsub?token=abc", now: NOW }

const html = renderMasterDigestHtml(content, "en", opts)

// masthead + newspaper identity
assert.ok(html.includes("The Lompoc Locals"), "has nameplate")
assert.ok(html.includes("Vol. I"), "has volume line")
// lead is the soonest event
assert.ok(html.includes("Falcon 9 Launch"), "lead headline present")
assert.ok(html.includes("Lead Story") || html.includes("Lead"), "lead label present")
// lead event is NOT duplicated in the calendar list (appears exactly once)
assert.equal(html.split("Falcon 9 Launch").length - 1, 1, "lead not duplicated")
// section headers
assert.ok(html.includes("Calendar"), "events section")
assert.ok(html.includes("Deals of the Week"), "deals section")
assert.ok(html.includes("Two-for-One Tri-Tip"), "deal item")
assert.ok(html.includes("20% Off"), "discount chip")
assert.ok(html.includes("One Plant"), "neighbor item")
// full-edition CTA points at the web edition
assert.ok(html.includes("/this-week"), "links to web edition")
// unsubscribe wired
assert.ok(html.includes("https://x/unsub?token=abc"), "unsub link present")

// Spanish locale swaps labels
const htmlEs = renderMasterDigestHtml(content, "es", opts)
assert.ok(htmlEs.includes("Ofertas de la semana"), "es deals label")

// empty content -> still valid shell, no crash, omits empty sections
const empty: MasterDigestContent = { events: [], deals: [], things: [], partners: [] }
const htmlEmpty = renderMasterDigestHtml(empty, "en", opts)
assert.ok(htmlEmpty.includes("The Lompoc Locals"), "empty still renders masthead")
assert.ok(!htmlEmpty.includes("Deals of the Week"), "empty omits deals header")

// single-column Around Town/Neighbors row: only `things` present -> full-width,
// no empty sibling cell (no width="50%" two-col markup should appear)
const onlyThings: MasterDigestContent = {
  events: [],
  deals: [],
  things: [
    { title: "Wine Tasting", href: "/activities/wine", imageUrl: "/img/wine.jpg", subtitle: "Wine" },
  ],
  partners: [],
}
const htmlOnlyThings = renderMasterDigestHtml(onlyThings, "en", opts)
assert.ok(!htmlOnlyThings.includes('width="50%"'), "single-column row has no 50% cell")
assert.ok(htmlOnlyThings.includes("Wine Tasting"), "things content present")
assert.ok(htmlOnlyThings.includes("Around Town"), "things section header present")

// single-column row: only `partners` present -> same full-width behavior
const onlyPartners: MasterDigestContent = {
  events: [],
  deals: [],
  things: [],
  partners: [
    { name: "One Plant", slug: "one-plant", coverUrl: "/img/op.jpg",
      categoryName: "Dispensary", dealTitle: null, discountText: null },
  ],
}
const htmlOnlyPartners = renderMasterDigestHtml(onlyPartners, "en", opts)
assert.ok(!htmlOnlyPartners.includes('width="50%"'), "single-column row has no 50% cell (partners-only)")
assert.ok(htmlOnlyPartners.includes("One Plant"), "partners content present")
assert.ok(htmlOnlyPartners.includes("Neighbors"), "partners section header present")

console.log("renderMasterDigestHtml: all assertions passed")
