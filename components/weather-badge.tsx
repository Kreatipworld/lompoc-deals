import { fetchWeatherForecast } from "@/lib/weather"
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
} from "lucide-react"
import type { WeatherCondition } from "@/lib/weather"
import type { LucideProps } from "lucide-react"

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

/**
 * Compact weather badge for the site header — shows today's high temp + icon.
 * Silently returns null if the weather API is unavailable.
 */
export async function WeatherBadge() {
  let forecast
  try {
    forecast = await fetchWeatherForecast()
  } catch {
    return null
  }

  const today = forecast.days[0]
  const Icon = CONDITION_ICON[today.condition]
  const iconColor = CONDITION_COLOR[today.condition]

  return (
    <div
      title={`${today.conditionLabel} · ${today.tempMax}°F / ${today.tempMin}°F · Lompoc, CA`}
      className="hidden items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium sm:flex"
    >
      <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={1.75} />
      <span>{today.tempMax}°F</span>
    </div>
  )
}
