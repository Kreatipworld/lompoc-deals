export type DayHours = { open: string; close: string } | null

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

/** "09:00" → "9:00 AM"; "17:30" → "5:30 PM" */
export function format12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h >= 12 ? "PM" : "AM"
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${m.toString().padStart(2, "0")} ${period}`
}

export function formatHoursLine(d: DayHours): string {
  if (!d) return "Closed"
  return `${format12h(d.open)} – ${format12h(d.close)}`
}

/** Determine if a business is open right now based on its hours and current local time */
export function isOpenNow(hours: Hours | null | undefined): boolean {
  if (!hours) return false
  const now = new Date()
  const dayIdx = now.getDay() // 0 = Sunday
  const dayKey: (keyof Hours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  const today = hours[dayKey[dayIdx]]
  if (!today) return false
  const cur = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = today.open.split(":").map(Number)
  const [ch, cm] = today.close.split(":").map(Number)
  const open = oh * 60 + om
  const close = ch * 60 + cm
  return cur >= open && cur < close
}

/** Best-effort coerce unknown JSON into a valid Hours, missing days = null */
export function parseHours(json: unknown): Hours {
  const out = emptyHours()
  if (!json || typeof json !== "object") return out
  const obj = json as Record<string, unknown>
  for (const k of DAY_KEYS) {
    const v = obj[k]
    if (
      v &&
      typeof v === "object" &&
      "open" in v &&
      "close" in v &&
      typeof (v as { open: unknown }).open === "string" &&
      typeof (v as { close: unknown }).close === "string"
    ) {
      out[k] = {
        open: (v as { open: string }).open,
        close: (v as { close: string }).close,
      }
    }
  }
  return out
}
