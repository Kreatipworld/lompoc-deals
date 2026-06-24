import assert from "node:assert/strict"
import { getFeaturedDeals } from "./featured"

async function main() {
  const featured = await getFeaturedDeals({ limit: 6 })
  assert.ok(Array.isArray(featured), "returns an array")
  assert.ok(featured.length <= 6, "respects limit")
  assert.ok(featured.every((d) => d.featured === true), "only premium/featured deals")
  const bizIds = featured.map((d) => d.business.id)
  assert.equal(new Set(bizIds).size, bizIds.length, "one deal per business")
  console.log(`featured smoke: passed (${featured.length} featured deals)`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
