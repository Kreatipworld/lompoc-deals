import { Link } from "@/i18n/navigation"
import {
  MapPin,
  ArrowRight,
  Compass,
  Sparkles,
} from "lucide-react"
import { getMapBusinesses, getAllCategories } from "@/lib/queries"
import { LompocMapLoader } from "@/components/lompoc-map-loader"
import { isOpenNow, parseHours } from "@/lib/hours"

export const metadata = {
  title: "Map — Lompoc Deals",
  description:
    "Find Lompoc, California businesses on the map. Coupons, specials, and announcements pinned across town.",
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: { cat?: string }
}) {
  const [allBusinesses, cats] = await Promise.all([
    getMapBusinesses(),
    getAllCategories(),
  ])

  const activeCat = searchParams.cat
  const businesses = activeCat
    ? allBusinesses.filter((b) => b.categorySlug === activeCat)
    : allBusinesses

  const totalAcrossAll = allBusinesses.length

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO — Editorial / Cartographic
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-[hsl(40_38%_97%)] via-background to-background"
        />
        {/* Paper grain */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />
        {/* Coral glow */}
        <div
          aria-hidden
          className="absolute -left-32 top-0 -z-10 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl"
        />

        {/* Compass rose decoration top-right */}
        <svg
          aria-hidden
          viewBox="0 0 400 400"
          className="pointer-events-none absolute -right-20 -top-16 -z-10 h-[460px] w-[460px] text-primary/20 sm:-right-10 sm:-top-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <g transform="translate(200 200)">
            <circle r="170" />
            <circle r="130" />
            <circle r="90" />
            {/* 4 cardinal points (long) */}
            {[0, 90, 180, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <path
                  d="M -18 0 L 0 -160 L 18 0 Z"
                  fill="currentColor"
                  opacity="0.6"
                />
                <path
                  d="M -18 0 L 0 160 L 18 0 Z"
                  fill="currentColor"
                  opacity="0.25"
                />
              </g>
            ))}
            {/* 4 intercardinal points (short) */}
            {[45, 135, 225, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <path d="M -10 0 L 0 -90 L 10 0 Z" opacity="0.5" />
              </g>
            ))}
            {/* Tick marks */}
            {Array.from({ length: 24 }).map((_, i) => (
              <line
                key={i}
                x1="160"
                y1="0"
                x2="170"
                y2="0"
                transform={`rotate(${i * 15})`}
                opacity="0.6"
              />
            ))}
            <circle r="14" fill="currentColor" opacity="0.9" />
          </g>
        </svg>

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:pb-16 sm:pt-20 lg:pt-24">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-8 bg-foreground/30" />
            <span>Map</span>
            <span className="text-foreground/30">·</span>
            <span>Lompoc, California</span>
            <span className="text-foreground/30">·</span>
            <span>34.6391° N · 120.4579° W</span>
          </div>

          {/* Display headline */}
          <h1 className="mt-6 font-display text-[clamp(3rem,10vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
            <span className="block">Find your</span>
            <span className="mt-1 block italic text-primary">spot.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {totalAcrossAll} local{" "}
            {totalAcrossAll === 1 ? "business" : "businesses"} pinned across
            Lompoc. Click a marker — or pick from the list — to see the deals.
          </p>

          {/* Category filter chips */}
          <nav className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/map"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                !activeCat
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-foreground/10 bg-background/70 backdrop-blur transition-colors duration-150 hover:border-primary/40 hover:bg-accent"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              All ({allBusinesses.length})
            </Link>
            {cats.map((c) => {
              const count = allBusinesses.filter(
                (b) => b.categorySlug === c.slug
              ).length
              if (count === 0) return null
              const active = activeCat === c.slug
              return (
                <Link
                  key={c.id}
                  href={`/map?cat=${c.slug}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-foreground/10 bg-background/70 backdrop-blur hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  {c.name}
                  <span className="text-xs opacity-70">· {count}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          MAP + SIDEBAR
         ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
          {/* Sidebar */}
          <aside className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Compass className="h-3 w-3 text-primary" />
                  Listings
                </div>
                <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
                  {businesses.length}{" "}
                  {businesses.length === 1 ? "place" : "places"}
                </h2>
              </div>
              {activeCat && (
                <Link
                  href="/map"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Clear filter
                </Link>
              )}
            </div>

            <ul className="max-h-[60vh] divide-y overflow-y-auto lg:max-h-[680px]">
              {businesses.length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No businesses in this category yet.
                </li>
              ) : (
                businesses.map((b) => {
                  const open = isOpenNow(parseHours(b.hoursJson))
                  return (
                    <li key={b.id}>
                      <Link
                        href={`/biz/${b.slug}`}
                        className="group flex items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-accent/40"
                      >
                        {/* Pin number / icon */}
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MapPin className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-display text-sm font-semibold tracking-tight">
                              {b.name}
                            </h3>
                            {open && (
                              <span className="flex-shrink-0 rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-green-700">
                                Open
                              </span>
                            )}
                          </div>
                          {b.categoryName && (
                            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                              {b.categoryName}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {b.activeDealCount}{" "}
                              {b.activeDealCount === 1 ? "deal" : "deals"}
                            </span>
                            {b.address && (
                              <>
                                <span className="text-muted-foreground/40">
                                  ·
                                </span>
                                <span className="truncate">
                                  {b.address.split(",")[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="mt-2 h-4 w-4 flex-shrink-0 text-muted-foreground [transition:transform_150ms_cubic-bezier(0.23,1,0.32,1),color_150ms_ease] group-hover:translate-x-1 group-hover:text-primary" />
                      </Link>
                    </li>
                  )
                })
              )}
            </ul>
          </aside>

          {/* Map */}
          <div className="overflow-hidden rounded-3xl border shadow-sm">
            <div className="h-[60vh] lg:h-[680px]">
              <LompocMapLoader businesses={businesses} />
            </div>
          </div>
        </div>

        {/* Editorial stat row */}
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-foreground/10 pt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span>Lompoc, California</span>
          <span className="text-foreground/30">·</span>
          <span>{totalAcrossAll} pinned businesses</span>
          <span className="text-foreground/30">·</span>
          <span>OpenStreetMap data</span>
          <span className="text-foreground/30">·</span>
          <span>Updated daily</span>
        </div>
      </div>
    </>
  )
}
