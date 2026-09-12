"use client"

import { useEffect, useState } from "react"

/**
 * Kickoff countdown. `kickoffIso` is the game's kickoff in ISO-8601 with the
 * Pacific offset baked in by the server; renders the server-side label until
 * mounted so the HTML is stable, then ticks every 30 s.
 */
export function FootballCountdown({
  kickoffIso,
  labels,
}: {
  kickoffIso: string
  labels: { days: string; hours: string; minutes: string; tonight: string; live: string; final: string }
}) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  if (now == null) return <span className="tabular-nums" aria-live="off">…</span>
  const diff = new Date(kickoffIso).getTime() - now
  if (diff <= -3 * 3600_000) return <span>{labels.final}</span>
  if (diff <= 0) return <span className="font-semibold text-green-700">{labels.live}</span>
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (d === 0 && h < 12) return <span className="tabular-nums">{labels.tonight} · {h}{labels.hours} {m}{labels.minutes}</span>
  return (
    <span className="tabular-nums">
      {d > 0 ? `${d}${labels.days} ` : ""}{h}{labels.hours} {m}{labels.minutes}
    </span>
  )
}
