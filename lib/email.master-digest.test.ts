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
  restaurants: [
    { name: "Burritos Lalo", slug: "burritos-lalo", categoryName: "Food & Drink",
      coverUrl: "/img/lalo.jpg", blurb: "The Original Mexican Food.", address: "119 N H St" },
    { name: "Pizza Garden", slug: "pizza-garden", categoryName: "Food & Drink",
      coverUrl: null, blurb: "Family-owned pizzeria serving Lompoc since 1997.", address: null },
  ],
  feature: { name: "Taqueria Don Tacho", slug: "taqueria-don-tacho", categoryName: "Food & Drink",
    coverUrl: "/img/tacho.jpg", blurb: "A family-run taqueria at 614 N H St.", address: "614 N H St" },
  outdoors: [
    { title: "Lompoc Museum", href: "/activities/lompoc-museum", imageUrl: "/img/museum.jpg",
      subtitle: "On South H Street." },
  ],
  news: [],
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
// the town sections: the digest's reason to exist for a resident who will never redeem a coupon
assert.ok(html.includes("Where to Eat"), "restaurants section header")
assert.ok(html.includes("Burritos Lalo") && html.includes("Pizza Garden"), "both restaurants listed")
assert.ok(html.includes("Family-owned pizzeria serving Lompoc since 1997."), "restaurant blurb rendered")
assert.ok(html.includes("/biz/burritos-lalo"), "restaurant links to its profile")
assert.ok(html.includes("On the Record"), "feature section header")
assert.ok(html.includes("Taqueria Don Tacho"), "feature business named")
assert.ok(html.includes("Worth the Trip"), "outdoors section header")
assert.ok(html.includes("Lompoc Museum") && html.includes("/activities/lompoc-museum"), "outdoors item + link")

// The town content leads; deals follow it. A resident opens this for the town, not the coupons —
// if a deal ever renders above "Where to Eat" the promise on /subscribe is broken again.
assert.ok(html.indexOf("Where to Eat") < html.indexOf("Deals of the Week"), "town content precedes deals")
assert.ok(html.indexOf("Where to Eat") < html.indexOf("On the Record"), "eat → record order")
assert.ok(html.indexOf("On the Record") < html.indexOf("Worth the Trip"), "record → trip order")

// full-edition CTA points at the web edition
assert.ok(html.includes("/this-week"), "links to web edition")
// unsubscribe wired
assert.ok(html.includes("https://x/unsub?token=abc"), "unsub link present")

// Spanish locale swaps labels
const htmlEs = renderMasterDigestHtml(content, "es", opts)
assert.ok(htmlEs.includes("Ofertas de la semana"), "es deals label")
assert.ok(htmlEs.includes("Dónde comer"), "es restaurants label")
assert.ok(htmlEs.includes("En el registro"), "es feature label")
assert.ok(htmlEs.includes("Vale la pena ir"), "es outdoors label")
assert.ok(!htmlEs.includes("Where to Eat"), "es edition has no english section header")

// empty content -> still valid shell, no crash, omits empty sections
const empty: MasterDigestContent = { events: [], deals: [], things: [], partners: [], restaurants: [], feature: null, outdoors: [], news: [] }
const htmlEmpty = renderMasterDigestHtml(empty, "en", opts)
assert.ok(htmlEmpty.includes("The Lompoc Locals"), "empty still renders masthead")
assert.ok(!htmlEmpty.includes("Deals of the Week"), "empty omits deals header")
for (const h of ["Where to Eat", "On the Record", "Worth the Trip"])
  assert.ok(!htmlEmpty.includes(h), `empty omits "${h}" header`)

// single-column Around Town/Neighbors row: only `things` present -> full-width,
// no empty sibling cell (no width="50%" two-col markup should appear)
const onlyThings: MasterDigestContent = {
  events: [],
  deals: [],
  things: [
    { title: "Wine Tasting", href: "/activities/wine", imageUrl: "/img/wine.jpg", subtitle: "Wine" },
  ],
  partners: [],
    restaurants: [],
    feature: null,
    outdoors: [],
    news: [],
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
    restaurants: [],
    feature: null,
    outdoors: [],
    news: [],
}
const htmlOnlyPartners = renderMasterDigestHtml(onlyPartners, "en", opts)
assert.ok(!htmlOnlyPartners.includes('width="50%"'), "single-column row has no 50% cell (partners-only)")
assert.ok(htmlOnlyPartners.includes("One Plant"), "partners content present")
assert.ok(htmlOnlyPartners.includes("Neighbors"), "partners section header present")

console.log("renderMasterDigestHtml: all assertions passed")

// news section renders: top story with excerpt + headline rows + /news link
{
  const withNews: MasterDigestContent = {
    events: [], deals: [], things: [], partners: [], restaurants: [], feature: null, outdoors: [],
    news: [
      { id: 108, slug: "vandenberg-starlink-launch-august-26", title: "Set an Alarm: Falcon 9 Wednesday", excerpt: "The current window and where to watch.", imageUrl: "https://img.example/launch.jpeg", publishedAt: new Date("2026-08-23T00:00:00Z") },
      { id: 104, slug: "vandenberg-food-donation-center", title: "Food Donation Center Opens", excerpt: null, imageUrl: null, publishedAt: new Date("2026-08-22T00:00:00Z") },
    ],
  }
  const h = renderMasterDigestHtml(withNews, "en", { unsubUrl: "https://x/unsub", now: new Date("2026-08-24T16:00:00Z") })
  assert.ok(h.includes("The Local News"), "news kicker")
  assert.ok(h.includes("/blog/vandenberg-starlink-launch-august-26"), "top story link")
  assert.ok(h.includes("Set an Alarm: Falcon 9 Wednesday"), "top story title")
  assert.ok(h.includes("https://img.example/launch.jpeg"), "top story image")
  assert.ok(h.includes("/blog/vandenberg-food-donation-center"), "headline row link")
  assert.ok(h.includes('/news"'), "all-news link")
  const hEs = renderMasterDigestHtml(withNews, "es", { unsubUrl: "https://x/unsub", now: new Date("2026-08-24T16:00:00Z") })
  assert.ok(hEs.includes("Noticias locales"), "es news kicker")
  console.log("news section: all assertions passed")
}
