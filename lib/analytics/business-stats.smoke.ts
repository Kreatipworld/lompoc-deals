import assert from "node:assert/strict"
import { db } from "@/db/client"
import { analyticsEvents, deals } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getProfileViews, getTrafficSources, getDailySeries } from "./business-stats"

async function main() {
  const deal = await db.query.deals.findFirst()
  assert.ok(deal, "need a deal")
  const businessId = deal.businessId

  await db.insert(analyticsEvents).values([
    { eventName: "business_page_viewed", targetType: "business", targetId: businessId, props: { locale: "en", referrer: "https://www.facebook.com/x" } as never },
    { eventName: "business_page_viewed", targetType: "business", targetId: businessId, props: { locale: "en", referrer: "https://www.google.com/search" } as never },
    { eventName: "business_page_viewed", targetType: "business", targetId: businessId, props: { locale: "en" } as never },
  ])

  const views = await getProfileViews(businessId, "30d")
  assert.ok(views >= 3, `expected >=3 profile views, got ${views}`)

  const sources = await getTrafficSources(businessId, "30d")
  const fb = sources.find((s) => s.source === "Facebook")
  assert.ok(fb && fb.count >= 1, "expected a Facebook source row")
  const total = sources.reduce((a, s) => a + s.count, 0)
  assert.ok(total >= 3, "sources should sum to all profile views")

  const series = await getDailySeries(businessId, "30d")
  assert.ok(Array.isArray(series) && series.length >= 1, "series should have points")
  assert.ok("date" in series[0] && "profileViews" in series[0] && "dealViews" in series[0], "series point shape")

  await db.delete(analyticsEvents).where(eq(analyticsEvents.targetId, businessId))
  console.log("business-stats smoke: passed")
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
