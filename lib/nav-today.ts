import { unstable_cache } from "next/cache"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { and, eq, sql } from "drizzle-orm"

/**
 * Is there an approved event happening today (Pacific time)? Drives the dot on
 * the "This Week" nav tab so the header itself reflects what is going on in town.
 * Cached 10 minutes; never throws — a nav dot must not take the page down.
 */
export const hasEventToday = unstable_cache(
  async (): Promise<boolean> => {
    try {
      const rows = await db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.status, "approved"),
            sql`(${events.startsAt} at time zone 'America/Los_Angeles')::date <= (now() at time zone 'America/Los_Angeles')::date`,
            sql`(coalesce(${events.endsAt}, ${events.startsAt}) at time zone 'America/Los_Angeles')::date >= (now() at time zone 'America/Los_Angeles')::date`
          )
        )
        .limit(1)
      return rows.length > 0
    } catch {
      return false
    }
  },
  ["nav-event-today"],
  { revalidate: 600 }
)
