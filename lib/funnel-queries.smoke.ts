import assert from "node:assert/strict"
import { db } from "@/db/client"
import { analyticsEvents, deals } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getDealFunnel } from "./funnel-queries"

async function main() {
  // Find any deal to attach synthetic events to.
  const deal = await db.query.deals.findFirst()
  assert.ok(deal, "need at least one deal in DB")

  // Insert 2 deal_view events for this deal, dated today.
  await db.insert(analyticsEvents).values([
    { eventName: "deal_view", targetType: "deal", targetId: deal.id, props: {} as never },
    { eventName: "deal_view", targetType: "deal", targetId: deal.id, props: {} as never },
  ])

  const rows7d = await getDealFunnel(deal.businessId, "7d")
  const row = rows7d.find((r) => r.dealId === deal.id)
  assert.ok(row, "deal should appear in funnel")
  assert.ok(row.views >= 2, `expected windowed views >= 2, got ${row.views}`)

  // cleanup
  await db.delete(analyticsEvents).where(eq(analyticsEvents.targetId, deal.id))
  console.log("funnel smoke: passed")
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
