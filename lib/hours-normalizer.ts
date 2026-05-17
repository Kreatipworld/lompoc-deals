import { DAY_KEYS, emptyHours, type DayHours, type Hours } from "./hours"

const LONG_TO_SHORT: Record<string, keyof Hours> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sunday: "sun",
}

/** Parse a single Google-text day value (e.g. "10 AM to 9:30 PM") into a DayHours. */
export function parseDayString(input: string): DayHours {
  const s = input.trim()
  if (!s) return null

  if (/^closed$/i.test(s)) return null

  if (/open\s+24\s+hours/i.test(s) || /24\s*hours/i.test(s)) {
    return { open: "00:00", close: "23:59" }
  }

  const toCount = (s.match(/\bto\b/gi) || []).length
  if (s.includes(",") || toCount > 1) {
    return { raw: s }
  }

  const m = s.match(/^(.+?)\s+to\s+(.+)$/i)
  if (!m) return { raw: s }

  const startRaw = m[1].trim()
  const endRaw = m[2].trim()

  const endPeriod = /pm/i.test(endRaw) ? "PM" : /am/i.test(endRaw) ? "AM" : null
  if (!endPeriod) return { raw: s }

  const startPeriodMatch = /am|pm/i.exec(startRaw)
  const startPeriod = startPeriodMatch ? startPeriodMatch[0].toUpperCase() : endPeriod

  const start = parseClock(startRaw, startPeriod)
  const end = parseClock(endRaw, endPeriod)
  if (!start || !end) return { raw: s }

  return { open: start, close: end }
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

  void DAY_KEYS
  return out
}
