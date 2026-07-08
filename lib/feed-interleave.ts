/** Pure feed-composition helpers. No DB access — unit-testable. */

const PACIFIC_TZ = "America/Los_Angeles"
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

/** A for-sale post with a sale start date is a garage sale. */
export function isGarageSale(type: string, saleStartsAt: Date | null): boolean {
  return type === "for_sale" && saleStartsAt !== null
}

/** The instant's calendar date in Lompoc's timezone, as "YYYY-MM-DD" (lexicographically sortable). */
function pacificDateStr(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/** The instant's weekday in Lompoc's timezone, as a 0(Sun)–6(Sat) index. */
function pacificWeekday(d: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    weekday: "short",
  }).format(d)
  return WEEKDAY_INDEX[weekday] ?? 0
}

/**
 * Add `days` to a "YYYY-MM-DD" date string, returning "YYYY-MM-DD". Anchors
 * on UTC noon so the day-add can't be nudged onto an adjacent date by DST.
 */
function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  anchor.setUTCDate(anchor.getUTCDate() + days)
  return anchor.toISOString().slice(0, 10)
}

/**
 * True when the sale window overlaps the upcoming Fri 00:00:00 – Sun
 * 23:59:59.999 weekend **in America/Los_Angeles**, relative to `now` (if
 * `now` is already Fri–Sun Pacific, that's the current weekend). Compares
 * Pacific calendar dates as strings — sales are day-granularity, so this is
 * exact and avoids DST offset math.
 */
export function isThisWeekend(
  saleStartsAt: Date | null,
  saleEndsAt: Date | null,
  now: Date
): boolean {
  if (!saleStartsAt) return false
  const nowDateStr = pacificDateStr(now)
  const dow = pacificWeekday(now) // 0 Sun … 6 Sat
  // days until Friday; Sat(6)/Sun(0) belong to the weekend already under way
  const untilFriday = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow
  const fridayDateStr = addDaysToDateStr(nowDateStr, untilFriday)
  const sundayDateStr = addDaysToDateStr(fridayDateStr, 2)

  const saleEnd = saleEndsAt ?? saleStartsAt
  const saleStartDateStr = pacificDateStr(saleStartsAt)
  const saleEndDateStr = pacificDateStr(saleEnd)

  return saleStartDateStr <= sundayDateStr && saleEndDateStr >= fridayDateStr
}

/**
 * Rations deal cards into the feed: one deal after every 4 non-deal items,
 * never two deals adjacent. Surplus deals are dropped (next load rotates by
 * recency). With no non-deals, returns at most one deal.
 */
export function interleaveDeals<T extends { source: string }>(
  nonDeals: T[],
  deals: T[]
): T[] {
  if (nonDeals.length === 0) return deals.slice(0, 1)
  const out: T[] = []
  let di = 0
  for (let i = 0; i < nonDeals.length; i++) {
    out.push(nonDeals[i])
    if ((i + 1) % 4 === 0 && di < deals.length) out.push(deals[di++])
  }
  return out
}
