import { sql, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { deals, analyticsEvents } from "@/db/schema"
import { getSessionId } from "@/lib/analytics/session"

/**
 * Bump view counts for the given deal ids and emit deal_view events.
 * Fire-and-forget — never block the page render on this.
 */
export async function bumpViewCounts(dealIds: number[], userId: number | null = null) {
  if (dealIds.length === 0) return
  try {
    const sid = getSessionId()
    await Promise.all([
      db
        .update(deals)
        .set({ viewCount: sql`${deals.viewCount} + 1` })
        .where(inArray(deals.id, dealIds)),
      db.insert(analyticsEvents).values(
        dealIds.map((id) => ({
          eventName: "deal_view" as const,
          userId,
          sessionId: sid,
          targetType: "deal",
          targetId: id,
          props: {},
        }))
      ),
    ])
  } catch {
    // best-effort
  }
}

export async function bumpClickCount(dealId: number, userId: number | null = null) {
  try {
    const sid = getSessionId()
    await Promise.all([
      db
        .update(deals)
        .set({ clickCount: sql`${deals.clickCount} + 1` })
        .where(sql`${deals.id} = ${dealId}`),
      db.insert(analyticsEvents).values({
        eventName: "deal_click",
        userId,
        sessionId: sid,
        targetType: "deal",
        targetId: dealId,
        props: {},
      }),
    ])
  } catch {
    // best-effort
  }
}
