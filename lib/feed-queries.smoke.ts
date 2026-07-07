import { getFeedItems } from "./feed-queries"

async function main() {
  const items = await getFeedItems()
  const bySource: Record<string, number> = {}
  for (const it of items) bySource[it.source] = (bySource[it.source] ?? 0) + 1
  console.log("total:", items.length, bySource)

  // invariants
  if (items.length > 60) throw new Error("limit exceeded")
  for (let i = 1; i < items.length; i++) {
    if (items[i].source === "deal" && items[i - 1].source === "deal")
      throw new Error(`adjacent deals at ${i}`)
  }
  if (items.filter((i) => i.source === "blog").length > 1)
    throw new Error("more than one blog card")
  for (const it of items) {
    if (it.source === "deal" && !it.href.startsWith("/deals/")) throw new Error("bad deal href")
    if (it.neighborhood !== null && typeof it.neighborhood !== "string")
      throw new Error("bad neighborhood")
  }
  const hoods = new Set(items.map((i) => i.neighborhood).filter(Boolean))
  console.log("neighborhoods present:", Array.from(hoods))
  console.log("feed-queries.smoke.ts OK")
}

main().then(() => process.exit(0))
