export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="space-y-2">
        <div className="h-3 w-24 skeleton rounded" />
        <div className="h-9 w-64 skeleton rounded-lg" />
        <div className="h-4 w-96 max-w-full skeleton rounded" />
      </div>
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-8 w-20 skeleton rounded-full" />)}
      </div>
      <div className="mt-8 h-[320px] skeleton rounded-3xl" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="h-52 skeleton" />
            <div className="space-y-2 p-5">
              <div className="h-5 w-4/5 skeleton rounded" />
              <div className="h-4 w-2/5 skeleton rounded" />
              <div className="h-3.5 w-3/5 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
