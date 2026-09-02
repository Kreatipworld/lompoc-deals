import assert from "node:assert/strict"
import { normalizeReferrer } from "./referrer"

assert.equal(normalizeReferrer("https://www.facebook.com/somepage"), "Facebook")
assert.equal(normalizeReferrer("https://l.facebook.com/l.php?u=x"), "Facebook")
assert.equal(normalizeReferrer("https://m.facebook.com/"), "Facebook")
assert.equal(normalizeReferrer("https://www.instagram.com/lompocdeals"), "Instagram")
assert.equal(normalizeReferrer("https://l.instagram.com/?u=x"), "Instagram")
assert.equal(normalizeReferrer("https://www.google.com/search?q=lompoc"), "Google")
assert.equal(normalizeReferrer("android-app://com.google.android.googlequicksearchbox/"), "Google")
assert.equal(normalizeReferrer("https://t.co/abc"), "Twitter/X")
assert.equal(normalizeReferrer("https://twitter.com/x"), "Twitter/X")
assert.equal(normalizeReferrer("https://duckduckgo.com/"), "Other search")
assert.equal(normalizeReferrer("https://lompoc-deals.vercel.app/en"), "Direct") // same-origin (legacy)
assert.equal(normalizeReferrer("https://www.lompoclocals.com/feed"), "Direct") // same-origin (current)
assert.equal(normalizeReferrer(""), "Direct")
assert.equal(normalizeReferrer(null), "Direct")
assert.equal(normalizeReferrer(undefined), "Direct")
assert.equal(normalizeReferrer("https://some-random-blog.com/post"), "Other")

// host-based matching: query strings and lookalike hosts must NOT false-positive
assert.equal(normalizeReferrer("https://example.com/search?q=x.com"), "Other")
assert.equal(normalizeReferrer("https://example.com/?ref=facebook.com"), "Other")
assert.equal(normalizeReferrer("https://notgoogle.evil.com/"), "Other")
assert.equal(normalizeReferrer("https://x.com/someone"), "Twitter/X")
assert.equal(normalizeReferrer("https://www.google.co.uk/search"), "Google")
assert.equal(normalizeReferrer("not a url"), "Other")

console.log("referrer.test: all passed")

// ── classifySource: in-site + UTM aware buckets for the member dashboard ──────
import { classifySource } from "./referrer"

const site = "https://www.lompoclocals.com"
assert.equal(classifySource({ referrer: `${site}/` }), "homepage")
assert.equal(classifySource({ referrer: `${site}/en` }), "homepage")
assert.equal(classifySource({ referrer: `${site}/es/` }), "homepage")
assert.equal(classifySource({ referrer: `${site}/category/food-drink` }), "category")
assert.equal(classifySource({ referrer: `${site}/es/category/entertainment` }), "category")
assert.equal(classifySource({ referrer: `${site}/businesses` }), "directory")
assert.equal(classifySource({ referrer: `${site}/en/search?q=tacos` }), "search")
assert.equal(classifySource({ referrer: `${site}/deals` }), "deals")
assert.equal(classifySource({ referrer: `${site}/events/some-event` }), "events")
assert.equal(classifySource({ referrer: `${site}/news/story` }), "news")
assert.equal(classifySource({ referrer: `${site}/map` }), "map")
assert.equal(classifySource({ referrer: `${site}/partners` }), "site_other")
assert.equal(classifySource({ referrer: "https://lompoc-deals.vercel.app/en/category/x" }), "category")
// UTM wins over referrer
assert.equal(classifySource({ referrer: `${site}/`, utmSrc: "email", utmMed: "outreach" }), "email")
assert.equal(classifySource({ referrer: null, utmSrc: "fb", utmMed: "paid" }), "facebook")
assert.equal(classifySource({ referrer: null, utmSrc: "facebook" }), "facebook")
assert.equal(classifySource({ referrer: null, utmSrc: "ig", utmMed: "social" }), "instagram")
assert.equal(classifySource({ referrer: null, utmSrc: "digest" }), "email")
// external referrers
assert.equal(classifySource({ referrer: "https://www.google.com/" }), "google")
assert.equal(classifySource({ referrer: "https://l.facebook.com/l.php?u=x" }), "facebook")
assert.equal(classifySource({ referrer: "https://www.instagram.com/x" }), "instagram")
assert.equal(classifySource({ referrer: "https://duckduckgo.com/" }), "other_search")
assert.equal(classifySource({ referrer: "https://some-blog.com/post" }), "other")
assert.equal(classifySource({ referrer: null }), "direct")
assert.equal(classifySource({ referrer: "" }), "direct")
assert.equal(classifySource({ referrer: "not a url" }), "other")
console.log("referrer.test.ts: classifySource ok")
