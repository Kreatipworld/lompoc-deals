import sitemap from "../app/sitemap"

async function main() {
  const entries = await sitemap()
  const urls = entries.map((e) => e.url)
  const has = (frag: string) => urls.some((u) => u.includes(frag))

  if (!has("/hotels/")) throw new Error("missing hotel detail pages")
  if (!has("/activities/")) throw new Error("missing activity detail pages")
  for (const p of ["/feed", "/garage-sales", "/hotels", "/activities", "/locals", "/contact"])
    if (!urls.some((u) => u.endsWith(p))) throw new Error(`missing static ${p}`)
  for (const bad of ["/deals/", "/feed/", "/listings/", "/search", "/events/"])
    if (has(bad)) throw new Error(`excluded family present: ${bad}`)

  const origin = process.env.AUTH_URL ?? "http://localhost:3000"
  if (!urls.every((u) => u.startsWith(origin))) throw new Error("foreign origin in sitemap")

  console.log(`sitemap.smoke.ts OK — ${urls.length} URLs`)
}

main().then(() => process.exit(0))
