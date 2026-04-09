export function DealCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Image skeleton */}
      <div className="h-52 skeleton" />

      {/* Body skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Business name */}
        <div className="h-3 w-24 skeleton rounded-full" />
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-5 w-full skeleton rounded-full" />
          <div className="h-5 w-3/4 skeleton rounded-full" />
        </div>
        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full skeleton rounded-full" />
          <div className="h-3.5 w-5/6 skeleton rounded-full" />
        </div>
        {/* Footer row */}
        <div className="mt-auto flex items-center justify-between">
          <div className="h-3 w-20 skeleton rounded-full" />
          <div className="h-3 w-16 skeleton rounded-full" />
        </div>
        {/* Button */}
        <div className="h-10 w-full skeleton rounded-full" />
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
