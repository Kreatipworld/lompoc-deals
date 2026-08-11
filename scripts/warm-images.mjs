// Pre-warm the Next image optimizer cache for every business image, so no
// visitor ever sees a cold blank tile. Polite: 6 concurrent, HEAD-equivalent GETs.
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`select logo_url, cover_url, photos_json from businesses where status='approved'`
const jobs = []
for (const r of rows) {
  const photos = typeof r.photos_json === "string" ? r.photos_json.split(",").filter(Boolean)
    : Array.isArray(r.photos_json) ? r.photos_json : []
  photos.forEach((u, i) => jobs.push([u, i === 0 ? 1080 : 384]))
  if (r.logo_url) jobs.push([r.logo_url, 256])
  if (r.cover_url) jobs.push([r.cover_url, 828])
}
const own = (u) => /\.public\.blob\.vercel-storage\.com\//.test(u) || u.startsWith("https://lh3.googleusercontent.com/")
const targets = jobs.filter(([u]) => own(u))
console.log("warming", targets.length, "image transforms")
let ok = 0, bad = 0, done = 0
const workers = Array.from({ length: 6 }, async (_, w) => {
  for (let i = w; i < targets.length; i += 6) {
    const [u, width] = targets[i]
    try {
      const res = await fetch(`https://www.lompoclocals.com/_next/image?url=${encodeURIComponent(u)}&w=${width}&q=70`, { signal: AbortSignal.timeout(30000) })
      res.ok ? ok++ : bad++
      if (res.body) for await (const _ of res.body) {} // drain
    } catch { bad++ }
    if (++done % 300 === 0) console.log(done, "/", targets.length, "ok", ok, "bad", bad)
  }
})
await Promise.all(workers)
console.log("WARM_DONE ok", ok, "bad", bad, "of", targets.length)
