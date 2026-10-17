/**
 * "This weekend" in Lompoc time: Friday 00:00 → Monday 00:00 (America/Los_Angeles).
 * On Fri/Sat/Sun it's the weekend we're in; Mon–Thu it's the coming one.
 * Pure (takes `now`) so lib/weekend.test.ts can pin it.
 */
const TZ = "America/Los_Angeles"
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function ptParts(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(d)
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? ""
  return { y: +get("year"), m: +get("month"), d: +get("day"), dow: DOW.indexOf(get("weekday")) }
}

/** UTC instant of 00:00 Pacific on the given calendar date. */
function ptMidnight(y: number, m: number, d: number): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, 8)) // 00:00 PST
  const hour = +new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(guess)
  return new Date(guess.getTime() - hour * 3600_000) // PDT: guess lands at 01:00, step back an hour
}

export function weekendWindow(now: Date = new Date()): { start: Date; end: Date; friday: { y: number; m: number; d: number } } {
  const { y, m, d, dow } = ptParts(now)
  // Days back to Friday when inside the weekend, days ahead otherwise.
  const offset = dow === 5 ? 0 : dow === 6 ? -1 : dow === 0 ? -2 : 5 - dow
  const fri = new Date(Date.UTC(y, m - 1, d + offset))
  const fy = fri.getUTCFullYear(), fm = fri.getUTCMonth() + 1, fd = fri.getUTCDate()
  const mon = new Date(Date.UTC(fy, fm - 1, fd + 3))
  return {
    start: ptMidnight(fy, fm, fd),
    end: ptMidnight(mon.getUTCFullYear(), mon.getUTCMonth() + 1, mon.getUTCDate()),
    friday: { y: fy, m: fm, d: fd },
  }
}

/** "Oct 16–18" / "16–18 oct" (crosses months: "Oct 30–Nov 1"). */
export function weekendLabel(now: Date, locale: "en" | "es"): string {
  const { friday } = weekendWindow(now)
  const fri = new Date(Date.UTC(friday.y, friday.m - 1, friday.d, 12))
  const sun = new Date(Date.UTC(friday.y, friday.m - 1, friday.d + 2, 12))
  const loc = locale === "es" ? "es-US" : "en-US"
  const mon = (d: Date) => new Intl.DateTimeFormat(loc, { month: "short", timeZone: "UTC" }).format(d).replace(".", "")
  const day = (d: Date) => d.getUTCDate()
  const same = fri.getUTCMonth() === sun.getUTCMonth()
  if (locale === "es") return same ? `${day(fri)}–${day(sun)} ${mon(fri)}` : `${day(fri)} ${mon(fri)}–${day(sun)} ${mon(sun)}`
  return same ? `${mon(fri)} ${day(fri)}–${day(sun)}` : `${mon(fri)} ${day(fri)}–${mon(sun)} ${day(sun)}`
}
