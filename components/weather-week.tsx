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

/** Hero band colour by today's condition: fog/cloud cool grey-blue, sun warm gold-purple. */
const BAND: Record<WeatherIcon, string> = {
  sun: "linear-gradient(135deg, #5a0f69 0%, #8a2a7a 55%, #c9891a 100%)",
  "cloud-sun": "linear-gradient(135deg, #4b2a63 0%, #6a4a7f 55%, #b58a3a 100%)",
  cloud: "linear-gradient(135deg, #3a3f55 0%, #55607a 60%, #7a86a0 100%)",
  fog: "linear-gradient(135deg, #34415a 0%, #4f5f7c 60%, #7b8aa5 100%)",
  rain: "linear-gradient(135deg, #22304d 0%, #35507a 60%, #4f78ad 100%)",
  drizzle: "linear-gradient(135deg, #2b3a58 0%, #41587f 60%, #6584ad 100%)",
  storm: "linear-gradient(135deg, #1c1a33 0%, #3b2c5c 60%, #5a3f82 100%)",
  wind: "linear-gradient(135deg, #3c4a5e 0%, #5b6f86 60%, #86a0b8 100%)",
}

/**
 * Weather hero band: today large with the big temperature and the NWS summary,
 * the other six days compact. Always renders — when the forecast is null the
 * band stays with the day names and an "updating" note. Motion is CSS only and
 * stops under prefers-reduced-motion.
 */
/**
 * Weather strip: one compact row — today first and highlighted, then the next six days.
 * Deliberately short (owner, Sep 19 2026: "simplify and make it smaller… less height"):
 * no hero tile, no per-day condition text (the icon carries it), and today's condition
 * rides in the heading line so no tile needs a second row of type.
 */
export function WeatherWeek({ days, labels }: { days: ForecastDay[] | null; labels: Labels }) {
  const tiles: (ForecastDay | { dayKey: ForecastDay["dayKey"]; placeholder: true })[] =
    days && days.length > 0
      ? days
      : (() => {
          const todayIdx = (new Date().getDay() + 6) % 7 // Mon=0
          return ORDER.slice(todayIdx).concat(ORDER.slice(0, todayIdx)).map((k) => ({ dayKey: k, placeholder: true as const }))
        })()

  const first = tiles[0]
  const today = first && !("placeholder" in first) ? first : null
  const band = today ? BAND[today.icon] : "linear-gradient(135deg, #3a2a4d 0%, #5a4a6f 60%, #8a7a9f 100%)"

  return (
    <section aria-label={labels.heading} className="ww-band relative overflow-hidden text-white" style={{ background: band }}>
      <style>{css}</style>
      <div className="ww-shine pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[#EFC618]">
            {labels.heading}
            {today && <span className="ml-2 font-semibold normal-case tracking-normal text-white/80">{labels.conditions[today.icon]}</span>}
          </h2>
          <span className="hidden shrink-0 text-[9px] uppercase tracking-[0.12em] text-white/55 sm:inline">{days ? labels.source : labels.updating}</span>
          {!days && <span className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-white/55 sm:hidden">{labels.updating}</span>}
        </div>

        <ol className="ww-row -mx-4 mt-1.5 flex snap-x gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:grid sm:grid-cols-7 sm:overflow-visible sm:px-0 sm:pb-0">
          {tiles.map((t, i) => {
            const day = "placeholder" in t ? null : t
            const isToday = i === 0
            return (
              <li
                key={t.dayKey + i}
                className={`flex min-w-[68px] shrink-0 snap-start items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 sm:min-w-0 ${
                  isToday ? "border-white/25 bg-white/[0.14]" : "border-white/10 bg-white/[0.06]"
                }`}
              >
                <span className="block h-7 w-7 shrink-0" aria-hidden="true">
                  {day ? <Icon kind={day.icon} size="sm" /> : <span className="ww-dot block h-7 w-7 rounded-full bg-white/15" />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[9px] font-bold uppercase leading-none tracking-[0.12em] ${isToday ? "text-[#EFC618]" : "text-white/65"}`}>
                    {isToday ? labels.today : labels.days[t.dayKey]}
                  </span>
                  {day ? (
                    <span className="mt-0.5 block whitespace-nowrap text-[13px] font-extrabold leading-none tabular-nums">
                      {day.high !== null ? `${day.high}°` : day.low !== null ? `${day.low}°` : "–"}
                      {day.high !== null && day.low !== null && <span className="ml-1 text-[10px] font-medium text-white/60">{day.low}°</span>}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-[11px] text-white/40">—</span>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function Icon({ kind }: { kind: WeatherIcon; size?: "sm" }) {
  const cls = "h-7 w-7"
  switch (kind) {
    case "sun":
      return (
        <svg viewBox="0 0 40 40" className={`ww-sun ${cls}`}>
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
        <svg viewBox="0 0 40 40" className={cls}>
          <circle className="ww-sun-small" cx="15" cy="15" r="7" fill="#EFC618" />
          <path className="ww-cloud" d="M13 30h15a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 13 30z" fill="#ffffff" stroke="#d9d0e2" strokeWidth="1.5" />
        </svg>
      )
    case "cloud":
      return (
        <svg viewBox="0 0 40 40" className={cls}>
          <path className="ww-cloud" d="M11 30h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 30z" fill="#ffffff" stroke="#d9d0e2" strokeWidth="1.5" />
        </svg>
      )
    case "fog":
      return (
        <svg viewBox="0 0 40 40" className={cls}>
          <path className="ww-cloud" d="M11 24h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 24z" fill="#ffffff" stroke="#d9d0e2" strokeWidth="1.5" />
          <g className="ww-mist" stroke="#e6e0ee" strokeWidth="2" strokeLinecap="round">
            <line x1="9" y1="29" x2="29" y2="29" />
            <line x1="13" y1="34" x2="31" y2="34" />
          </g>
        </svg>
      )
    case "rain":
    case "drizzle":
      return (
        <svg viewBox="0 0 40 40" className={cls}>
          <path className="ww-cloud" d="M11 24h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 24z" fill="#ffffff" stroke="#d9d0e2" strokeWidth="1.5" />
          <g stroke="#9cc4ff" strokeWidth="2" strokeLinecap="round">
            {[13, 19, 25, 31].slice(0, kind === "rain" ? 4 : 3).map((x, i) => (
              <line key={x} className="ww-drop" style={{ animationDelay: `${i * 0.28}s` }} x1={x} y1="27" x2={x - 1.5} y2="32" />
            ))}
          </g>
        </svg>
      )
    case "storm":
      return (
        <svg viewBox="0 0 40 40" className={cls}>
          <path className="ww-cloud" d="M11 22h17a6 6 0 0 0 .6-12 8 8 0 0 0-15.2-2A6 6 0 0 0 11 22z" fill="#ffffff" stroke="#d9d0e2" strokeWidth="1.5" />
          <path className="ww-bolt" d="M21 23l-5 8h4l-2 6 6-9h-4l1-5z" fill="#EFC618" />
        </svg>
      )
    case "wind":
    default:
      return (
        <svg viewBox="0 0 40 40" className={cls}>
          <g className="ww-wind" stroke="#e6e0ee" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M8 16h16a4 4 0 1 0-4-4" />
            <path d="M6 22h22a4 4 0 1 1-4 4" />
            <path d="M10 28h10" />
          </g>
        </svg>
      )
  }
}

const css = `
.ww-shine { background: radial-gradient(60% 80% at 85% 0%, rgba(255,255,255,.14), transparent 60%); }
.ww-sun { animation: ww-glow 3.2s ease-in-out infinite; }
.ww-rays { transform-origin: 20px 20px; animation: ww-spin 18s linear infinite; }
.ww-sun-small { animation: ww-glow 3.2s ease-in-out infinite; }
.ww-cloud { animation: ww-drift 5s ease-in-out infinite; }
.ww-drop { animation: ww-fall 1.1s linear infinite; }
.ww-mist { animation: ww-mist 4s ease-in-out infinite; }
.ww-bolt { animation: ww-flash 2.6s ease-in-out infinite; }
.ww-wind { animation: ww-sway 2.8s ease-in-out infinite; }
.ww-dot { animation: ww-glow 1.6s ease-in-out infinite; }
@keyframes ww-spin { to { transform: rotate(360deg); } }
@keyframes ww-glow { 0%,100% { filter: drop-shadow(0 0 0 rgba(239,198,24,0)); opacity: .92 } 50% { filter: drop-shadow(0 0 8px rgba(239,198,24,.95)); opacity: 1 } }
@keyframes ww-drift { 0%,100% { transform: translateX(0) } 50% { transform: translateX(3px) } }
@keyframes ww-fall { 0% { transform: translateY(-2px); opacity: 0 } 25% { opacity: 1 } 100% { transform: translateY(7px); opacity: 0 } }
@keyframes ww-mist { 0%,100% { transform: translateX(-2px); opacity: .6 } 50% { transform: translateX(2px); opacity: 1 } }
@keyframes ww-flash { 0%,88%,100% { opacity: .85 } 92% { opacity: 1; filter: drop-shadow(0 0 5px rgba(239,198,24,.9)) } 96% { opacity: .6 } }
@keyframes ww-sway { 0%,100% { transform: translateX(0) } 50% { transform: translateX(2.5px) } }
@media (prefers-reduced-motion: reduce) {
  .ww-sun, .ww-rays, .ww-sun-small, .ww-cloud, .ww-drop, .ww-mist, .ww-bolt, .ww-wind, .ww-dot { animation: none !important; }
}
`
