// Lompoc 7-day forecast from the National Weather Service (free, public domain).
// points → gridpoint forecast; day/night periods collapsed into one row per day.
// Any failure returns null so the page never breaks — the strip shows a
// "Forecast updating…" state instead.

const POINT = "https://api.weather.gov/points/34.6392,-120.4579"
const UA = "LompocLocals (hello@lompoclocals.com)"
const TZ = "America/Los_Angeles"

export type WeatherIcon = "sun" | "cloud-sun" | "cloud" | "fog" | "rain" | "drizzle" | "storm" | "wind"

export type ForecastDay = {
  /** YYYY-MM-DD in Lompoc time */
  date: string
  /** mon … sun */
  dayKey: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
  high: number | null
  low: number | null
  shortForecast: string
  icon: WeatherIcon
  precip: number | null
  isToday: boolean
}

type Period = {
  startTime: string
  isDaytime: boolean
  temperature: number
  temperatureUnit: string
  shortForecast: string
  probabilityOfPrecipitation?: { value: number | null }
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

function pacificDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ })
}

function pacificDayKey(iso: string): ForecastDay["dayKey"] {
  const w = new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" }).toLowerCase().slice(0, 3)
  return (DAY_KEYS.includes(w as never) ? w : "mon") as ForecastDay["dayKey"]
}

/** Map an NWS short forecast to one of our icons (checked most-severe first). */
export function iconFor(shortForecast: string): WeatherIcon {
  const s = shortForecast.toLowerCase()
  if (/thunder|storm/.test(s)) return "storm"
  if (/rain|shower/.test(s)) return "rain"
  if (/drizzle|sprinkle/.test(s)) return "drizzle"
  if (/fog|mist|haze|smoke/.test(s)) return "fog"
  if (/wind|breezy|blustery/.test(s)) return "wind"
  if (/mostly cloudy|cloudy|overcast/.test(s) && !/partly|mostly sunny/.test(s)) return "cloud"
  if (/partly|mostly sunny|mostly clear/.test(s)) return "cloud-sun"
  if (/sunny|clear/.test(s)) return "sun"
  return "cloud"
}

export async function getWeekForecast(): Promise<ForecastDay[] | null> {
  try {
    const headers = { "User-Agent": UA, Accept: "application/geo+json" }
    const point = await fetch(POINT, { headers, next: { revalidate: 86400 } })
    if (!point.ok) return null
    const pj = (await point.json()) as { properties?: { forecast?: string } }
    const url = pj.properties?.forecast
    if (!url) return null
    const res = await fetch(url, { headers, next: { revalidate: 3600 } })
    if (!res.ok) return null
    const fj = (await res.json()) as { properties?: { periods?: Period[] } }
    const periods = fj.properties?.periods ?? []
    if (periods.length === 0) return null

    const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ })
    const byDate = new Map<string, ForecastDay>()
    for (const p of periods) {
      const date = pacificDate(p.startTime)
      const temp = p.temperatureUnit === "C" ? Math.round((p.temperature * 9) / 5 + 32) : p.temperature
      const precip = p.probabilityOfPrecipitation?.value ?? null
      const existing = byDate.get(date)
      if (!existing) {
        byDate.set(date, {
          date,
          dayKey: pacificDayKey(p.startTime),
          high: p.isDaytime ? temp : null,
          low: p.isDaytime ? null : temp,
          shortForecast: p.shortForecast,
          icon: iconFor(p.shortForecast),
          precip,
          isToday: date === today,
        })
      } else {
        if (p.isDaytime) {
          existing.high = existing.high ?? temp
          // The daytime period is the one people care about — let it name the day.
          existing.shortForecast = p.shortForecast
          existing.icon = iconFor(p.shortForecast)
        } else {
          existing.low = existing.low ?? temp
        }
        if (precip !== null) existing.precip = Math.max(existing.precip ?? 0, precip)
      }
    }
    const days = Array.from(byDate.values()).filter((d) => d.date >= today).slice(0, 7)
    return days.length > 0 ? days : null
  } catch {
    return null
  }
}

/** One-line summary for the Monday digest, e.g. "Mon 74°/52° Sunny · Tue 71°/50° Partly cloudy · …" */
export function formatWeekForecastLine(days: ForecastDay[] | null): string {
  if (!days || days.length === 0) return ""
  const label = (k: ForecastDay["dayKey"]) => k.charAt(0).toUpperCase() + k.slice(1)
  return days
    .map((d) => {
      const hi = d.high !== null ? `${d.high}°` : "–"
      const lo = d.low !== null ? `/${d.low}°` : ""
      return `${label(d.dayKey)} ${hi}${lo} ${d.shortForecast}`
    })
    .join(" · ")
}
