import { and, eq, gt, lt, asc } from "drizzle-orm"
import { db } from "@/db/client"
import { events } from "@/db/schema"

/**
 * The launch alert: the one email only this site can send.
 *
 * A weekly digest asks somebody to care about us on our schedule. A launch alert tells them
 * something they already care about, on the town's schedule — a rocket goes up over Vandenberg
 * and half the valley walks outside to watch it. Times slip constantly, which is exactly why the
 * day-before note is worth having, and why "check the calendar" is not a substitute.
 *
 * Everything here comes from the events table, so the email cannot promise a launch that isn't
 * scheduled. It is deliberately not a marketing email — one launch, when, where to stand.
 */
export type LaunchAlert = {
  id: number
  title: string
  startsAt: Date
  location: string | null
}

/** Strip the "Rocket Launch:" prefix the events feed keeps; the subject line already says it. */
export const launchName = (title: string) => title.replace(/^Rocket Launch:\s*/i, "").trim()

/**
 * Launches starting inside the next `hours`. Run daily, a 24–48h window catches each launch once
 * without needing to remember what has already been sent: a launch is only ever in the window on
 * one run, because the run happens once a day.
 */
export async function getUpcomingLaunches(hours = 36): Promise<LaunchAlert[]> {
  const now = new Date()
  const until = new Date(now.getTime() + hours * 60 * 60 * 1000)
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      location: events.location,
    })
    .from(events)
    .where(and(eq(events.status, "approved"), gt(events.startsAt, now), lt(events.startsAt, until)))
    .orderBy(asc(events.startsAt))

  return rows.filter((r) => /rocket launch|falcon|starlink|vandenberg/i.test(r.title))
}

/** "tonight" / "tomorrow night" / "Saturday night", from the reader's point of view. */
export function whenPhrase(startsAt: Date, now = new Date(), locale: "en" | "es" = "en") {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(startsAt) - startOfDay(now)) / 86_400_000)
  if (locale === "es") {
    if (days <= 0) return "esta noche"
    if (days === 1) return "mañana por la noche"
    return `el ${startsAt.toLocaleDateString("es-ES", { weekday: "long" })} por la noche`
  }
  if (days <= 0) return "tonight"
  if (days === 1) return "tomorrow night"
  return `${startsAt.toLocaleDateString("en-US", { weekday: "long" })} night`
}

export const launchTimeLabel = (d: Date, locale: "en" | "es" = "en") =>
  d.toLocaleString(locale === "es" ? "es-ES" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  })
