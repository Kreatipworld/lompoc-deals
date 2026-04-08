import { sql, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { dealEvents, deals } from "@/db/schema"

/**
 * Bump view counts for the given deal ids in a single SQL update.
 * Also inserts view events into deal_events for windowed funnel queries.
 * Fire-and-forget — never block the page render on this.
 */
export async function bumpViewCounts(dealIds: number[]) {
  if (dealIds.length === 0) return
  try {
    await Promise.all([
      db
        .update(deals)
        .set({ viewCount: sql`${deals.viewCount} + 1` })
        .where(inArray(deals.id, dealIds)),
      db
        .insert(dealEvents)
        .values(dealIds.map((id) => ({ dealId: id, eventType: "view" as const }))),
    ])
  } catch {
    // best-effort
  }
}

export async function bumpClickCount(dealId: number) {
  try {
    await db
      .update(deals)
      .set({ clickCount: sql`${deals.clickCount} + 1` })
      .where(sql`${deals.id} = ${dealId}`)
  } catch {
    // best-effort
  }
}
