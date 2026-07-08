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
