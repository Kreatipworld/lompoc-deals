"use client"

export function MapSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950 to-blue-900">
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(91,33,182,0.3) 50%, transparent 60%)",
          backgroundSize: "200% 100%",
        }}
      />
      {/* Fake terrain lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-10"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {[0, 60, 120, 180, 240, 300, 360].map((y) => (
          <path
            key={y}
            d={`M0 ${y + 30} Q200 ${y} 400 ${y + 20} T800 ${y + 10}`}
            stroke="white"
            strokeWidth="1"
            fill="none"
          />
        ))}
      </svg>
      {/* Loading text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm font-medium text-white/60">Loading Lompoc…</p>
      </div>
    </div>
  )
}
