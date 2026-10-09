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
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()

// Words that carry no identity: venue boilerplate repeats across unrelated events.
const STOP = new Set(["the", "a", "an", "at", "of", "and", "in", "on", "for", "to", "with", "lompoc", "public", "library", "annual", "event", "night", "day"])
const tokens = (t: string) => new Set(normalize(t).split(" ").filter((w) => w.length > 1 && !STOP.has(w)))

/**
 * Two titles for one event, as different feeds and hand curation spell them:
 * "Wednesday Wonders" vs "Wednesday Wonders at the Lompoc Public Library".
 * One title's words inside the other's, two distinctive words shared, or at least half
 * of them shared. Only ever applied to events that also start within 15 minutes.
 */
function similarTitles(a: string, b: string): boolean {
  const ta = tokens(a), tb = tokens(b)
  if (ta.size === 0 || tb.size === 0) return false
  let shared = 0
  ta.forEach((w) => { if (tb.has(w)) shared++ })
  const smaller = Math.min(ta.size, tb.size)
  return shared === smaller || shared >= 2 || shared / (ta.size + tb.size - shared) >= 0.5
}

/** "Eye on I, 113 W Ocean Ave, Lompoc" → "eye on i" (the venue name before the address). */
const venueOf = (loc: string | null | undefined) => (loc ? normalize(loc.split(",")[0]) : "") || null

/** "Starlink Group 17-38" / "Starlink 17-38" → "17-38" */
const missionCode = (t: string) =>
  t.toLowerCase().match(/(?:starlink|group)[^0-9]*([0-9]+-[0-9]+)/)?.[1] ?? null

/**
 * Id of an approved event on the same calendar day that is, by content, the
 * same event — exact normalized title, the same launch mission code, or a
 * similar title starting within 15 minutes.
 * Null when the incoming event is genuinely new.
 */
export async function findSameDayDuplicate(
  title: string,
  startsAt: Date,
  /** Venue line; the same venue at the same time is the same event whatever it is called. */
  location?: string | null
): Promise<number | null> {
  const dayStart = new Date(startsAt)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86_400_000)

  const sameDay = await db
    .select({ id: events.id, title: events.title, startsAt: events.startsAt, location: events.location })
    .from(events)
    .where(
      and(
        gte(events.startsAt, dayStart),
        lt(events.startsAt, dayEnd),
        eq(events.status, "approved")
      )
    )

  const venue = venueOf(location)
  const n = normalize(title)
  const code = missionCode(title)
  for (const e of sameDay) {
    if (normalize(e.title) === n) return e.id
    if (code && missionCode(e.title) === code) return e.id
    // Same start (within 15 min) and a similar title or the same venue: the same event
    // under another name (a band's own listing vs the venue's three-act bill).
    if (Math.abs(e.startsAt.getTime() - startsAt.getTime()) <= 15 * 60_000) {
      if (similarTitles(e.title, title)) return e.id
      if (venue && venueOf(e.location) === venue) return e.id
    }
  }
  return null
}
