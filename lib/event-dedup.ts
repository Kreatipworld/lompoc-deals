import { and, eq, gte, lt } from "drizzle-orm"
import { db } from "@/db/client"
import { events } from "@/db/schema"

// Cross-source duplicate guard. Each sync upserts by (source, external_id),
// which can't catch the same real-world event arriving from two feeds — the
// city calendar and Launch Library both list Vandenberg launches under
// different names, and the city calendar itself occasionally re-publishes an
// event under a fresh id. Content-level matching on the same calendar day is
// the only signature both copies share.

const normalize = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()

/** "Starlink Group 17-38" / "Starlink 17-38" → "17-38" */
const missionCode = (t: string) =>
  t.toLowerCase().match(/(?:starlink|group)[^0-9]*([0-9]+-[0-9]+)/)?.[1] ?? null

/**
 * Id of an approved event on the same calendar day that is, by content, the
 * same event — exact normalized title, or the same launch mission code.
 * Null when the incoming event is genuinely new.
 */
export async function findSameDayDuplicate(
  title: string,
  startsAt: Date
): Promise<number | null> {
  const dayStart = new Date(startsAt)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86_400_000)

  const sameDay = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(
      and(
        gte(events.startsAt, dayStart),
        lt(events.startsAt, dayEnd),
        eq(events.status, "approved")
      )
    )

  const n = normalize(title)
  const code = missionCode(title)
  for (const e of sameDay) {
    if (normalize(e.title) === n) return e.id
    if (code && missionCode(e.title) === code) return e.id
  }
  return null
}
