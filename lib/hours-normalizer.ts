import { emptyHours, type DayHours, type Hours } from "./hours"

const LONG_TO_SHORT: Record<string, keyof Hours> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sunday: "sun",
}

/** Parse a single "<start> to <end>" range. Returns {open, close} on success, null on failure. */
function parseSingleRange(input: string): { open: string; close: string } | null {
  const m = input.trim().match(/^(.+?)\s+to\s+(.+)$/i)
  if (!m) return null

  const startRaw = m[1].trim()
  const endRaw = m[2].trim()

  const endPeriod = /pm/i.test(endRaw) ? "PM" : /am/i.test(endRaw) ? "AM" : null
  if (!endPeriod) return null

  const startPeriodMatch = /am|pm/i.exec(startRaw)
  const startPeriod = startPeriodMatch ? startPeriodMatch[0].toUpperCase() : endPeriod

  const open = parseClock(startRaw, startPeriod)
  const close = parseClock(endRaw, endPeriod)
  if (!open || !close) return null

  return { open, close }
}

/** Parse a single Google-text day value into a DayHours.
 *  Multi-range strings (e.g. "8 AM to 1 PM, 1:30 to 9 PM") return { raw, ranges } so
 *  isOpenNow can compute the badge while the UI still renders the verbatim string. */
export function parseDayString(input: string): DayHours {
  const s = input.trim()
  if (!s) return null

  if (/^closed$/i.test(s)) return null

  // Strict 24-hour match — only Google's canonical "Open 24 hours" / "Open 24/7" wording.
  // Looser patterns (e.g. "24-hour emergency service") used to false-positive a plumber as 24/7.
  if (/^open\s+24(\s+hours|\/7)$/i.test(s)) {
    return { open: "00:00", close: "23:59" }
  }

  // Multi-range: comma-separated chunks, each a "<start> to <end>" range.
  if (s.includes(",")) {
    const chunks = s.split(",").map((c) => c.trim()).filter(Boolean)
    const ranges: Array<{ open: string; close: string }> = []
    for (const chunk of chunks) {
      const r = parseSingleRange(chunk)
      if (r) ranges.push(r)
    }
    return ranges.length > 0 ? { raw: s, ranges } : { raw: s }
  }

  // Two "to" connectors without a comma — uncommon edge case, keep raw without ranges.
  if ((s.match(/\bto\b/gi) || []).length > 1) {
    return { raw: s }
  }

  // Single range.
  const range = parseSingleRange(s)
  return range ?? { raw: s }
}

function parseClock(input: string, period: string): string | null {
  const cleaned = input.replace(/am|pm/gi, "").trim()
  const m = cleaned.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const minute = m[2] ? parseInt(m[2], 10) : 0
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null

  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}

/** Normalize a Google-text hours object (long keys with string values) into canonical Hours. */
export function normalizeGoogleHours(input: unknown): Hours {
  const out = emptyHours()
  if (!input || typeof input !== "object") return out
  const obj = input as Record<string, unknown>

  for (const [longKey, shortKey] of Object.entries(LONG_TO_SHORT)) {
    const v = obj[longKey]
    if (typeof v === "string") {
      out[shortKey] = parseDayString(v)
    }
  }

  return out
}
