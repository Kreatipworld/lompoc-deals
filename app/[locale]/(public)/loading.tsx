export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Section header skeleton */}
      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="hidden h-4 w-32 animate-pulse rounded bg-muted sm:block" />
      </div>

      {/* Card grid skeleton — mirrors actual DealCard layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {/* Image area */}
            <div className="h-48 animate-pulse bg-muted" />

            {/* Body */}
            <div className="flex flex-col gap-3 p-5">
              {/* Title + business name */}
              <div className="space-y-2">
                <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/5 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
              </div>
              {/* Description */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
              </div>
              {/* Footer row */}
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
              {/* CTA button */}
              <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
