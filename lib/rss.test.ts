import assert from "node:assert/strict"
import { parseRssItems } from "./rss"

const xml = `<?xml version="1.0"?><rss><channel>
<item><title><![CDATA[Lompoc opens new park &amp; trail]]></title><link>https://example.com/park</link><pubDate>Mon, 24 Aug 2026 07:00:00 GMT</pubDate><description><![CDATA[<p>The city cut the ribbon&#8217;s today.</p>]]></description></item>
<item><title>No link item</title></item>
<item><title>Vandenberg launch</title><guid>https://example.com/launch</guid></item>
</channel></rss>`

const items = parseRssItems(xml)
assert.equal(items.length, 2)
assert.equal(items[0].title, "Lompoc opens new park & trail")
assert.equal(items[0].link, "https://example.com/park")
assert.ok(items[0].description?.includes("ribbon's"))
assert.equal(items[0].pubDate?.getUTCHours(), 7)
assert.equal(items[1].link, "https://example.com/launch")
console.log("rss: all assertions passed")
