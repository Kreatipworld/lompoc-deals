"use client"

import type { DailyPoint } from "@/lib/analytics/business-stats"

export function TrendChart({
  points,
  labels,
}: {
  points: DailyPoint[]
  labels: { profileViews: string; dealViews: string }
}) {
  if (points.length === 0) return null

  const W = 720
  const H = 180
  const PAD = 24
  const max = Math.max(1, ...points.map((p) => Math.max(p.profileViews, p.dealViews)))
  const innerW = W - PAD * 2
  const innerH = H - PAD * 2
  const slot = innerW / points.length
  const barW = Math.max(2, slot / 3)

  const y = (v: number) => PAD + innerH - (v / max) * innerH

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" role="img" aria-label="Daily views trend">
        {/* baseline */}
        <line x1={PAD} y1={PAD + innerH} x2={W - PAD} y2={PAD + innerH} className="stroke-border" strokeWidth={1} />
        {points.map((p, i) => {
          const x = PAD + i * slot + slot / 2
          return (
            <g key={p.date}>
              <rect x={x - barW} y={y(p.profileViews)} width={barW} height={PAD + innerH - y(p.profileViews)} className="fill-primary" rx={1}>
                <title>{`${p.date}: ${p.profileViews} ${labels.profileViews}`}</title>
              </rect>
              <rect x={x + 1} y={y(p.dealViews)} width={barW} height={PAD + innerH - y(p.dealViews)} className="fill-amber" rx={1}>
                <title>{`${p.date}: ${p.dealViews} ${labels.dealViews}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />{labels.profileViews}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber" />{labels.dealViews}</span>
      </div>
    </div>
  )
}
