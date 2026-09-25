// Skeleton for the two listing routes only (/sales and /sales/c/[category]).
// It lives in a route group so it never wraps /sales/[id] or /sales/post —
// a loading boundary above a page that calls notFound() or redirect() streams
// a 200 shell first (the soft-404 trap, docs memory Sep 2026).
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="space-y-2">
        <div className="h-9 w-56 skeleton rounded-lg" />
        <div className="h-4 w-96 max-w-full skeleton rounded" />
      </div>
      <div className="mt-8 flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-9 w-24 shrink-0 skeleton rounded-full" />)}
      </div>
      <div className="mt-4 h-11 w-full skeleton rounded-full" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card">
            <div className="aspect-[4/3] skeleton" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-1/3 skeleton rounded" />
              <div className="h-4 w-4/5 skeleton rounded" />
              <div className="h-3 w-1/2 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
