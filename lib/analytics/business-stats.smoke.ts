import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { db } from "@/db/client"
import { analyticsEvents } from "@/db/schema"
import { sql } from "drizzle-orm"
import { getProfileViews, getTrafficSources, getDailySeries, getOutboundActions, getDealViews } from "./business-stats"

// SAFETY: DATABASE_URL is production. Every row this script writes carries
// props.smoke = <run id> and is removed by that tag alone — never by business.
const runId = `smoke-${randomUUID()}`
const sessionId = randomUUID() // one shared session → 2+ events → passes the engaged filter

async function main() {
  const deal = await db.query.deals.findFirst()
  assert.ok(deal, "need a deal")
  const businessId = deal.businessId
  const tag = { smoke: runId }

  const before = await getProfileViews(businessId, "30d")
  const actionsBefore = await getOutboundActions(businessId, "30d")

  try {
    await db.insert(analyticsEvents).values([
      { eventName: "business_page_viewed", targetType: "business", targetId: businessId, sessionId, props: { ...tag, locale: "en", referrer: "https://www.facebook.com/x" } as never },
      { eventName: "business_page_viewed", targetType: "business", targetId: businessId, sessionId, props: { ...tag, locale: "en", referrer: "https://www.lompoclocals.com/category/food-drink" } as never },
      { eventName: "business_page_viewed", targetType: "business", targetId: businessId, sessionId, props: { ...tag, locale: "en", src: "email", med: "outreach" } as never },
      { eventName: "phone_click", targetType: "business", targetId: businessId, sessionId, props: { ...tag, slug: "x" } as never },
      // a lone crawler-like hit in its own session must NOT count
      { eventName: "business_page_viewed", targetType: "business", targetId: businessId, sessionId: randomUUID(), props: { ...tag, locale: "en" } as never },
    ])

    const views = await getProfileViews(businessId, "30d")
    assert.equal(views - before, 3, `engaged profile views should rise by exactly 3, rose by ${views - before}`)

    const sources = await getTrafficSources(businessId, "30d")
    for (const key of ["facebook", "category", "email"] as const) {
      const row = sources.find((s) => s.source === key)
      assert.ok(row && row.count >= 1, `expected a '${key}' source row`)
    }

    const actions = await getOutboundActions(businessId, "30d")
    assert.equal(actions.total - actionsBefore.total, 1, "phone_click should add one real-world action")
    assert.ok(actions.rows.some((r) => r.action === "phone_click"), "phone_click row present")

    const series = await getDailySeries(businessId, "30d")
    assert.ok(series.length >= 1 && "date" in series[0] && "profileViews" in series[0] && "dealViews" in series[0], "series shape")
    assert.ok(typeof (await getDealViews(businessId, "30d")) === "number", "deal views is a number")
    console.log("business-stats smoke: passed")
  } finally {
    const gone = await db.delete(analyticsEvents).where(sql`${analyticsEvents.props}->>'smoke' = ${runId}`).returning({ id: analyticsEvents.id })
    console.log(`cleaned ${gone.length} tagged rows`)
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
