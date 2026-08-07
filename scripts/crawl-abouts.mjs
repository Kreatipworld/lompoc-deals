// Crawl websites of approved businesses missing an about; dump clean text per biz.
import { neon } from "@neondatabase/serverless"
import { writeFileSync } from "node:fs"

const sql = neon(process.env.DATABASE_URL)
const rows = await sql.query(`
  select b.id, b.name, b.slug, b.address, b.website, c.name as category
  from businesses b left join categories c on c.id = b.category_id
  where b.status = 'approved' and b.about is null and b.website is not null
  order by b.id`)
console.log("targets:", rows.length)

const clean = (html) => html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z#0-9]+;/gi, " ")
  .replace(/\s+/g, " ").trim()

async function fetchText(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LompocLocals/1.0; +https://www.lompoclocals.com)" } })
    if (!res.ok) return { err: `http ${res.status}` }
    const ct = res.headers.get("content-type") || ""
    if (!ct.includes("html")) return { err: `not html: ${ct.slice(0,30)}` }
    const html = await res.text()
    // also try an /about page if linked
    let aboutText = ""
    const m = html.match(/href="([^"]*about[^"]*)"/i)
    if (m) {
      try {
        const aboutUrl = new URL(m[1], res.url).href
        const r2 = await fetch(aboutUrl, { signal: AbortSignal.timeout(10000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; LompocLocals/1.0)" } })
        if (r2.ok) aboutText = clean(await r2.text()).slice(0, 2500)
      } catch {}
    }
    return { text: clean(html).slice(0, 3500), aboutText }
  } catch (e) { return { err: String(e.message || e).slice(0, 80) } }
}

const out = []
let done = 0
const queue = [...rows]
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const b = queue.shift()
    const r = await fetchText(b.website)
    out.push({ ...b, ...r })
    done++
    if (done % 25 === 0) console.log("crawled", done)
  }
}))
const okCount = out.filter((o) => o.text && o.text.length > 200).length
writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
console.log("done. usable:", okCount, "failed/thin:", out.length - okCount)
