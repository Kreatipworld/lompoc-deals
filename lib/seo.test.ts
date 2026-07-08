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

console.log("seo.test.ts OK")
