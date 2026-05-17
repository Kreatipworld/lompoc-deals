export type CanonicalDayHours = { open: string; close: string }
export type RawDayHours = { raw: string }
export type DayHours = CanonicalDayHours | RawDayHours | null

export type Hours = {
  mon: DayHours
  tue: DayHours
  wed: DayHours
  thu: DayHours
  fri: DayHours
  sat: DayHours
  sun: DayHours
}

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
export const DAY_LABELS: Record<keyof Hours, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
}

export function emptyHours(): Hours {
  return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null }
}

export function isCanonical(d: DayHours): d is CanonicalDayHours {
  return d !== null && "open" in d && "close" in d
}

export function isRaw(d: DayHours): d is RawDayHours {
  return d !== null && "raw" in d
}

/** "09:00" → "9:00 AM"; "17:30" → "5:30 PM" */
export function format12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h >= 12 ? "PM" : "AM"
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${m.toString().padStart(2, "0")} ${period}`
}

export function formatHoursLine(d: DayHours): string {
  if (d === null) return "Closed"
  if (isRaw(d)) return d.raw
  return `${format12h(d.open)} – ${format12h(d.close)}`
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

/** Determine if a business is open right now in Lompoc's timezone. Handles ranges that cross midnight. Returns false for raw-shape days (can't compute). */
export function isOpenNow(hours: Hours | null | undefined): boolean {
  if (!hours) return false
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date())

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? ""
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "NaN", 10)
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "NaN", 10)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false

  const weekdayMap: Record<string, keyof Hours> = {
    Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat",
  }
  const todayKey = weekdayMap[weekday]
  if (!todayKey) return false
  const todayIdx = DAY_KEYS.indexOf(todayKey)
  const yesterdayKey = DAY_KEYS[(todayIdx + DAY_KEYS.length - 1) % DAY_KEYS.length]
  const cur = (hour % 24) * 60 + minute

  const today = hours[todayKey]
  if (isCanonical(today)) {
    const open = toMinutes(today.open)
    const close = toMinutes(today.close)
    if (!Number.isNaN(open) && !Number.isNaN(close)) {
      if (close > open) {
        if (cur >= open && cur < close) return true
      } else if (close < open) {
        if (cur >= open) return true
      }
    }
  }

  const yesterday = hours[yesterdayKey]
  if (isCanonical(yesterday)) {
    const open = toMinutes(yesterday.open)
    const close = toMinutes(yesterday.close)
    if (!Number.isNaN(open) && !Number.isNaN(close) && close < open) {
      if (cur < close) return true
    }
  }

  return false
}

/** Coerce unknown JSON into canonical Hours. Accepts existing canonical shape AND raw-shape entries. Unknown shapes → null per day. */
export function parseHours(json: unknown): Hours {
  const out = emptyHours()
  if (!json || typeof json !== "object") return out
  const obj = json as Record<string, unknown>
  for (const k of DAY_KEYS) {
    const v = obj[k]
    if (v && typeof v === "object") {
      const vo = v as Record<string, unknown>
      if (typeof vo.open === "string" && typeof vo.close === "string") {
        out[k] = { open: vo.open, close: vo.close }
      } else if (typeof vo.raw === "string") {
        out[k] = { raw: vo.raw }
      }
    }
  }
  return out
}
