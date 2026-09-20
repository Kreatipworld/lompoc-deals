/**
 * The events feed lists every occurrence of a recurring event as its own row — the ghost tour
 * appears 14 times, trivia night 7 — so a grid of "what's happening" filled up with the same
 * few titles (owner, Sep 20 2026: "very repetitive"). Collapse them to one card showing the
 * next date, with a cadence label so the repetition becomes useful information instead of noise.
 */

export type Cadence = "daily" | "weekly" | "biweekly" | "monthly" | "multi" | null

export type Recurring = { cadence: Cadence; occurrences: number }

/** Same event, different night: identical title at the same venue. */
const key = (e: { title: string | null; location: string | null }) =>
  `${(e.title ?? "").trim().toLowerCase()}|${(e.location ?? "").trim().toLowerCase()}`

const DAY = 86_400_000

/** Infer the cadence from the gaps between occurrences; undated noise falls back to "multi". */
function cadenceOf(dates: Date[]): Cadence {
  if (dates.length < 2) return null
  const gaps: number[] = []
  for (let i = 1; i < dates.length; i++) gaps.push(dates[i].getTime() - dates[i - 1].getTime())
  const median = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] / DAY
  if (median <= 1.6) return "daily"
  if (median >= 6 && median <= 8) return "weekly"
  if (median >= 13 && median <= 16) return "biweekly"
  if (median >= 27 && median <= 32) return "monthly"
  return "multi"
}

/**
 * Keep the soonest occurrence of each event and attach how often it runs.
 * Input must be sorted by start time ascending.
 */
export function collapseRecurring<T extends { title: string | null; location: string | null; startsAt: Date }>(
  rows: T[]
): (T & Recurring)[] {
  const groups = new Map<string, T[]>()
  for (const r of rows) {
    const k = key(r)
    const g = groups.get(k)
    if (g) g.push(r)
    else groups.set(k, [r])
  }
  const out: (T & Recurring)[] = []
  groups.forEach((g) => {
    const dates = g.map((x: T) => x.startsAt)
    out.push({ ...g[0], cadence: cadenceOf(dates), occurrences: g.length })
  })
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}
