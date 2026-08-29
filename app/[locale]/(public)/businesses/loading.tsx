export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Section header skeleton */}
      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 skeleton rounded-lg" />
          <div className="h-4 w-64 skeleton rounded" />
        </div>
        <div className="hidden h-4 w-32 skeleton rounded sm:block" />
      </div>

      {/* Card grid skeleton — mirrors actual DealCard layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {/* Image area */}
            <div className="h-48 skeleton" />

            {/* Body */}
            <div className="flex flex-col gap-3 p-5">
              {/* Title + business name */}
              <div className="space-y-2">
                <div className="h-5 w-4/5 skeleton rounded" />
                <div className="h-5 w-3/5 skeleton rounded" />
                <div className="h-4 w-2/5 skeleton rounded" />
              </div>
              {/* Description */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full skeleton rounded" />
                <div className="h-3.5 w-4/5 skeleton rounded" />
              </div>
              {/* Footer row */}
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3 w-24 skeleton rounded" />
                <div className="h-3 w-16 skeleton rounded" />
              </div>
              {/* CTA button */}
              <div className="h-10 w-full skeleton rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
