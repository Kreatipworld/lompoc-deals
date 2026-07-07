/** Pure feed-composition helpers. No DB access — unit-testable. */

/** A for-sale post with a sale start date is a garage sale. */
export function isGarageSale(type: string, saleStartsAt: Date | null): boolean {
  return type === "for_sale" && saleStartsAt !== null
}

/**
 * True when the sale window overlaps the upcoming Fri 00:00 – Sun 23:59:59
 * weekend relative to `now` (if `now` is already Fri–Sun, that's the current
 * weekend). Uses local server time — close enough for a badge.
 */
export function isThisWeekend(
  saleStartsAt: Date | null,
  saleEndsAt: Date | null,
  now: Date
): boolean {
  if (!saleStartsAt) return false
  const day = now.getDay() // 0 Sun … 6 Sat
  // days until Friday; Sat(6)/Sun(0) belong to the weekend already under way
  const untilFriday = day === 0 ? -2 : day === 6 ? -1 : 5 - day
  const friday = new Date(now)
  friday.setDate(now.getDate() + untilFriday)
  friday.setHours(0, 0, 0, 0)
  const sundayEnd = new Date(friday)
  sundayEnd.setDate(friday.getDate() + 2)
  sundayEnd.setHours(23, 59, 59, 999)
  const saleEnd = saleEndsAt ?? saleStartsAt
  return saleStartsAt <= sundayEnd && saleEnd >= friday
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
