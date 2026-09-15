"use client"

import type { ForecastDay, WeatherIcon } from "@/lib/weather"

type Labels = {
  heading: string
  source: string
  updating: string
  today: string
  days: Record<ForecastDay["dayKey"], string>
  conditions: Record<WeatherIcon, string>
}

const ORDER: ForecastDay["dayKey"][] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

/**
 * Seven compact tiles, today first, with a small animated icon per condition.
 * Always renders: when the forecast is null it shows the day names and an
 * "updating" note instead of disappearing. Motion is CSS only and stops under
 * prefers-reduced-motion.
 */
export function WeatherWeek({ days, labels }: { days: ForecastDay[] | null; labels: Labels }) {
  const tiles: (ForecastDay | { dayKey: ForecastDay["dayKey"]; placeholder: true })[] =
    days && days.length > 0
      ? days
      : (() => {
          const todayIdx = (new Date().getDay() + 6) % 7 // Mon=0
          return ORDER.slice(todayIdx).concat(ORDER.slice(0, todayIdx)).map((k) => ({ dayKey: k, placeholder: true as const }))
        })()

  return (
    <section aria-label={labels.heading} className="border-b border-[#d8cfc0] bg-white">
      <style>{css}</style>
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-edition text-xs font-bold uppercase tracking-[0.2em] text-[#650C75]">{labels.heading}</h2>
          <span className="text-[11px] text-[#7a6f60]">{days ? labels.source : labels.updating}</span>
        </div>
        <ol className="ww-row flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
          {tiles.map((t, i) => {
            const day = "placeholder" in t ? null : t
            const isToday = day ? day.isToday : i === 0
            return (
              <li
                key={t.dayKey + i}
                className={`ww-tile flex min-w-[96px] shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-2.5 text-center sm:min-w-0 ${
                  isToday ? "ww-today border-[#650C75] bg-[#f6ecf8]" : "border-[#e6dcea] bg-[#fbf8fc]"
                }`}
              >
                <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${isToday ? "text-[#650C75]" : "text-[#7a6f60]"}`}>
                  {isToday ? labels.today : labels.days[t.dayKey]}
                </span>
                <span className="my-1.5 block h-9 w-9" aria-hidden="true">
                  {day ? <Icon kind={day.icon} /> : <span className="ww-dot block h-9 w-9 rounded-full bg-[#eee6f0]" />}
                </span>
                {day ? (
                  <>
                    <span className="text-sm font-extrabold tabular-nums text-[#1a1712]">
                      {day.high !== null ? `${day.high}°` : day.low !== null ? `${day.low}°` : "–"}
                      {day.high !== null && day.low !== null && (
                        <span className="ml-1 text-xs font-medium text-[#7a6f60]">{day.low}°</span>
                      )}
                    </span>
                    <span className="mt-0.5 text-[11px] leading-tight text-[#7a6f60]">{labels.conditions[day.icon]}</span>
                    {day.precip !== null && day.precip >= 30 && (
                      <span className="mt-0.5 text-[10px] font-semibold text-[#3b6fd6]">{day.precip}%</span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-[#b3a4ba]">—</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function Icon({ kind }: { kind: WeatherIcon }) {
  switch (kind) {
    case "sun":
      return (
        <svg viewBox="0 0 40 40" className="ww-sun h-9 w-9">
          <circle cx="20" cy="20" r="8" fill="#EFC618" />
          <g className="ww-rays" stroke="#EFC618" strokeWidth="2.4" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1="20" y1="4" x2="20" y2="8" transform={`rotate(${a} 20 20)`} />
            ))}
          </g>
        </svg>
      )
    case "cloud-sun":
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9">
          <circle className="ww-sun-small" cx="15" cy="15" r="7" fill="#EFC618" />
          <path className="ww-cloud" d="M13 30h15a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 13 30z" fill="#ffffff" stroke="#b8a9c2" strokeWidth="1.5" />
        </svg>
      )
    case "cloud":
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9">
          <path className="ww-cloud" d="M11 30h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 30z" fill="#ffffff" stroke="#b8a9c2" strokeWidth="1.5" />
        </svg>
      )
    case "fog":
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9">
          <path className="ww-cloud" d="M11 24h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 24z" fill="#ffffff" stroke="#b8a9c2" strokeWidth="1.5" />
          <g className="ww-mist" stroke="#b8a9c2" strokeWidth="2" strokeLinecap="round">
            <line x1="9" y1="29" x2="29" y2="29" />
            <line x1="13" y1="34" x2="31" y2="34" />
          </g>
        </svg>
      )
    case "rain":
    case "drizzle":
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9">
          <path className="ww-cloud" d="M11 24h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 24z" fill="#ffffff" stroke="#b8a9c2" strokeWidth="1.5" />
          <g stroke="#3b6fd6" strokeWidth="2" strokeLinecap="round">
            {[13, 19, 25, 31].slice(0, kind === "rain" ? 4 : 3).map((x, i) => (
              <line key={x} className="ww-drop" style={{ animationDelay: `${i * 0.28}s` }} x1={x} y1="27" x2={x - 1.5} y2="32" />
            ))}
          </g>
        </svg>
      )
    case "storm":
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9">
          <path className="ww-cloud" d="M11 22h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 22z" fill="#ffffff" stroke="#b8a9c2" strokeWidth="1.5" />
          <path className="ww-bolt" d="M21 23l-5 8h4l-2 6 6-9h-4l1-5z" fill="#EFC618" />
        </svg>
      )
    case "wind":
    default:
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9">
          <g className="ww-wind" stroke="#7a6f60" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M8 16h16a4 4 0 1 0-4-4" />
            <path d="M6 22h22a4 4 0 1 1-4 4" />
            <path d="M10 28h10" />
          </g>
        </svg>
      )
  }
}

const css = `
.ww-sun { animation: ww-glow 3.2s ease-in-out infinite; }
.ww-rays { transform-origin: 20px 20px; animation: ww-spin 18s linear infinite; }
.ww-sun-small { animation: ww-glow 3.2s ease-in-out infinite; }
.ww-cloud { animation: ww-drift 5s ease-in-out infinite; }
.ww-drop { animation: ww-fall 1.1s linear infinite; }
.ww-mist { animation: ww-mist 4s ease-in-out infinite; }
.ww-bolt { animation: ww-flash 2.6s ease-in-out infinite; }
.ww-wind { animation: ww-sway 2.8s ease-in-out infinite; }
.ww-today { animation: ww-pulse 3s ease-in-out infinite; }
.ww-dot { animation: ww-glow 1.6s ease-in-out infinite; }
@keyframes ww-spin { to { transform: rotate(360deg); } }
@keyframes ww-glow { 0%,100% { filter: drop-shadow(0 0 0 rgba(239,198,24,0)); opacity: .9 } 50% { filter: drop-shadow(0 0 6px rgba(239,198,24,.9)); opacity: 1 } }
@keyframes ww-drift { 0%,100% { transform: translateX(0) } 50% { transform: translateX(3px) } }
@keyframes ww-fall { 0% { transform: translateY(-2px); opacity: 0 } 25% { opacity: 1 } 100% { transform: translateY(7px); opacity: 0 } }
@keyframes ww-mist { 0%,100% { transform: translateX(-2px); opacity: .6 } 50% { transform: translateX(2px); opacity: 1 } }
@keyframes ww-flash { 0%,88%,100% { opacity: .85 } 92% { opacity: 1; filter: drop-shadow(0 0 5px rgba(239,198,24,.9)) } 96% { opacity: .6 } }
@keyframes ww-sway { 0%,100% { transform: translateX(0) } 50% { transform: translateX(2.5px) } }
@keyframes ww-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(101,12,117,.18) } 50% { box-shadow: 0 0 0 6px rgba(101,12,117,0) } }
@media (prefers-reduced-motion: reduce) {
  .ww-sun, .ww-rays, .ww-sun-small, .ww-cloud, .ww-drop, .ww-mist, .ww-bolt, .ww-wind, .ww-today, .ww-dot { animation: none !important; }
}
`
