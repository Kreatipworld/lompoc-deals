import assert from "node:assert/strict"
import { pageAlternates } from "./seo"

// standard path
assert.deepEqual(pageAlternates("/businesses"), {
  canonical: "/businesses",
  languages: {
    en: "/businesses",
    es: "/es/businesses",
    "x-default": "/businesses",
  },
})

// dynamic path
assert.deepEqual(pageAlternates("/biz/some-slug").canonical, "/biz/some-slug")
assert.equal(pageAlternates("/biz/some-slug").languages!.es, "/es/biz/some-slug")

// home: es variant must not end with a trailing slash after the prefix
assert.deepEqual(pageAlternates("/"), {
  canonical: "/",
  languages: { en: "/", es: "/es", "x-default": "/" },
})

// es locale: canonical must be self-referential, not the English URL
assert.equal(pageAlternates("/businesses", "es").canonical, "/es/businesses")
assert.equal(pageAlternates("/", "es").canonical, "/es")
// en (explicit + default) keeps the unprefixed canonical
assert.equal(pageAlternates("/businesses", "en").canonical, "/businesses")
assert.equal(pageAlternates("/businesses").canonical, "/businesses")
// languages map is locale-independent
assert.deepEqual(pageAlternates("/map", "es").languages, {
  en: "/map",
  es: "/es/map",
  "x-default": "/map",
})

console.log("seo.test.ts OK")
