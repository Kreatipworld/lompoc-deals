import { fetchWeatherForecast } from "@/lib/weather"
import type { WeatherCondition, DayForecast } from "@/lib/weather"
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  Zap,
  CloudFog,
  CloudHail,
  Droplets,
} from "lucide-react"
import type { LucideProps } from "lucide-react"

// ─── Icon mapping ────────────────────────────────────────────────────────────
type IconComponent = React.ComponentType<LucideProps>

const CONDITION_ICON: Record<WeatherCondition, IconComponent> = {
  clear: Sun,
  "mostly-clear": Sun,
  "partly-cloudy": CloudSun,
  overcast: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  showers: CloudHail,
  thunderstorm: Zap,
}

const CONDITION_COLOR: Record<WeatherCondition, string> = {
  clear: "text-amber-500",
  "mostly-clear": "text-amber-400",
  "partly-cloudy": "text-sky-400",
  overcast: "text-slate-400",
  fog: "text-slate-400",
  drizzle: "text-blue-400",
  rain: "text-blue-500",
  snow: "text-sky-300",
  showers: "text-blue-400",
  thunderstorm: "text-violet-500",
}

// ─── Day cell ────────────────────────────────────────────────────────────────
function DayCell({ day, isToday }: { day: DayForecast; isToday: boolean }) {
  const Icon = CONDITION_ICON[day.condition]
  const iconColor = CONDITION_COLOR[day.condition]

  const label = isToday
    ? "Today"
    : day.date.toLocaleDateString("en-US", { weekday: "short" })

  return (
    <div
      className={`flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-3 transition-colors ${
        isToday
          ? "bg-primary/10 ring-1 ring-primary/20"
          : "hover:bg-accent/60"
      }`}
    >
      <span
        className={`text-[11px] font-semibold uppercase tracking-wide ${
          isToday ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>

      <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={1.5} />

      <span className="text-sm font-semibold tabular-nums">
        {day.tempMax}°
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {day.tempMin}°
      </span>

      {day.precipProbability > 20 && (
        <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
          <Droplets className="h-2.5 w-2.5" />
          {day.precipProbability}%
        </span>
      )}
    </div>
  )
}

// ─── Main widget ─────────────────────────────────────────────────────────────
export async function WeatherWidget() {
  let forecast
  try {
    forecast = await fetchWeatherForecast()
  } catch {
    // Silently skip if weather API is unavailable
    return null
  }

  const todayStr = new Date().toDateString()
  const TodayIcon = CONDITION_ICON[forecast.days[0].condition]
  const todayColor = CONDITION_COLOR[forecast.days[0].condition]
  const today = forecast.days[0]

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <TodayIcon className={`h-4 w-4 ${todayColor}`} strokeWidth={1.5} />
            <span className="text-sm font-semibold">
              {today.conditionLabel} · {today.tempMax}°F / {today.tempMin}°F
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Lompoc, CA · 7-day forecast
          </span>
        </div>

        {/* Scrollable day strip */}
        <div className="flex gap-0.5 overflow-x-auto px-3 py-3 scrollbar-none">
          {forecast.days.map((day, i) => (
            <DayCell
              key={day.date.toISOString()}
              day={day}
              isToday={day.date.toDateString() === todayStr}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
