export function DealCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Image skeleton */}
      <div className="h-52 animate-pulse bg-muted" />

      {/* Body skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Business name */}
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Footer row */}
        <div className="mt-auto flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Button */}
        <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  )
}

export function DealGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  )
}
