import { Link } from "@/i18n/navigation"

export function FunnelStep({ name, count, maxCount }: { name: string; count: number; maxCount: number }) {
  const pct = maxCount === 0 ? 0 : Math.round((count / maxCount) * 100)
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-sm">
        <span>{name}</span>
        <span className="tabular-nums text-muted-foreground">
          {count.toLocaleString()} ({pct}%)
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded bg-muted">
        <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Sparkline({ label, points }: { label: string; points: number[] }) {
  const max = Math.max(1, ...points)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="tabular-nums text-sm">{points[points.length - 1] ?? 0}</span>
      </div>
      <div className="mt-1 flex h-8 items-end gap-[1px]">
        {points.map((p, i) => (
          <div
            key={i}
            className="w-[3px] flex-shrink-0 bg-primary"
            style={{ height: `${Math.max(2, (p / max) * 32)}px`, opacity: 0.6 + (p / max) * 0.4 }}
          />
        ))}
      </div>
    </div>
  )
}

export function BusinessLink({ slug, name }: { slug: string; name: string }) {
  return (
    <Link href={`/biz/${slug}`} className="hover:underline">
      {name}
    </Link>
  )
}
