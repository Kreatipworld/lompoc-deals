// Lompoc, CA coordinates
export const LOMPOC_LAT = 34.6391
export const LOMPOC_LON = -120.4579

// WMO Weather Code mapping
// https://open-meteo.com/en/docs#weathervariables
export type WeatherCondition =
  | "clear"
  | "mostly-clear"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "showers"
  | "thunderstorm"

export interface DayForecast {
  date: Date
  conditionCode: number
  condition: WeatherCondition
  conditionLabel: string
  tempMax: number
  tempMin: number
  precipProbability: number
}

export interface WeatherForecast {
  days: DayForecast[]
  fetchedAt: number
}

export function wmoToCondition(code: number): {
  condition: WeatherCondition
  label: string
} {
  if (code === 0) return { condition: "clear", label: "Clear" }
  if (code === 1) return { condition: "mostly-clear", label: "Mostly Clear" }
  if (code === 2) return { condition: "partly-cloudy", label: "Partly Cloudy" }
  if (code === 3) return { condition: "overcast", label: "Overcast" }
  if (code === 45 || code === 48) return { condition: "fog", label: "Foggy" }
  if (code >= 51 && code <= 57) return { condition: "drizzle", label: "Drizzle" }
  if (code >= 61 && code <= 67) return { condition: "rain", label: "Rain" }
  if (code >= 71 && code <= 77) return { condition: "snow", label: "Snow" }
  if (code >= 80 && code <= 82) return { condition: "showers", label: "Showers" }
  if (code === 85 || code === 86) return { condition: "snow", label: "Snow Showers" }
  if (code >= 95) return { condition: "thunderstorm", label: "Thunderstorm" }
  return { condition: "partly-cloudy", label: "Mixed" }
}

interface OpenMeteoResponse {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weathercode: number[]
    precipitation_probability_max: number[]
  }
}

export async function fetchWeatherForecast(): Promise<WeatherForecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LOMPOC_LAT}&longitude=${LOMPOC_LON}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max` +
    `&temperature_unit=fahrenheit` +
    `&timezone=America%2FLos_Angeles` +
    `&forecast_days=7`

  const res = await fetch(url, {
    next: { revalidate: 3600 }, // cache for 1 hour
  })

  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.status}`)
  }

  const data: OpenMeteoResponse = await res.json()
  const { time, temperature_2m_max, temperature_2m_min, weathercode, precipitation_probability_max } =
    data.daily

  const days: DayForecast[] = time.map((dateStr, i) => {
    const { condition, label } = wmoToCondition(weathercode[i])
    return {
      date: new Date(dateStr + "T12:00:00"), // noon local to avoid UTC offset issues
      conditionCode: weathercode[i],
      condition,
      conditionLabel: label,
      tempMax: Math.round(temperature_2m_max[i]),
      tempMin: Math.round(temperature_2m_min[i]),
      precipProbability: precipitation_probability_max[i] ?? 0,
    }
  })

  return { days, fetchedAt: Date.now() }
}
