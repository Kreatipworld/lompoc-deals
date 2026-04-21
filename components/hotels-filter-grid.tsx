"use client"

import { useState, useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { HOTELS, type Hotel } from "@/lib/hotels-data"
import { MapPin, ArrowRight, BedDouble } from "lucide-react"

// ── Filter definitions ──────────────────────────────────────────────────────

type FilterChip = { id: string; label: string; icon?: string }

const PRICE_FILTERS: FilterChip[] = [
  { id: "price-$", label: "$" },
  { id: "price-$$", label: "$$" },
  { id: "price-$$$", label: "$$$" },
]

const AMENITY_FILTERS: FilterChip[] = [
  { id: "amenity-pool", label: "Pool" },
  { id: "amenity-breakfast", label: "Breakfast" },
  { id: "amenity-wifi", label: "Free Wi-Fi" },
  { id: "amenity-parking", label: "Parking" },
  { id: "amenity-pets", label: "Pet-Friendly" },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

const COVER_GRADIENT: Record<string, string> = {
  $: "from-emerald-500/20 via-teal-400/10 to-cyan-300/10",
  $$: "from-amber-500/25 via-orange-400/15 to-yellow-300/10",
  $$$: "from-violet-600/25 via-purple-500/15 to-fuchsia-400/10",
}

function ratingLabel(r: number): string {
  const v = r * 2 // convert 0-5 → 0-10
  if (v >= 9.5) return "Exceptional"
  if (v >= 9.0) return "Superb"
  if (v >= 8.5) return "Very Good"
  if (v >= 8.0) return "Good"
  return "Rated"
}

function matchesFilter(hotel: Hotel, active: Set<string>): boolean {
  if (active.size === 0) return true
  for (const id of Array.from(active)) {
    if (id.startsWith("price-")) {
      const tier = id.slice("price-".length)
      if (hotel.priceRange !== tier) return false
    } else if (id === "amenity-pool") {
      if (!hotel.amenities.some((a) => a.toLowerCase().includes("pool"))) return false
    } else if (id === "amenity-breakfast") {
      if (!hotel.amenities.some((a) => a.toLowerCase().includes("breakfast"))) return false
    } else if (id === "amenity-wifi") {
      if (!hotel.amenities.some((a) => a.toLowerCase().includes("wi-fi") || a.toLowerCase().includes("wifi"))) return false
    } else if (id === "amenity-parking") {
      if (!hotel.amenities.some((a) => a.toLowerCase().includes("parking"))) return false
    } else if (id === "amenity-pets") {
      if (!hotel.amenities.some((a) => a.toLowerCase().includes("pet"))) return false
    }
  }
  return true
}

// ── Hotel card ───────────────────────────────────────────────────────────────

function HotelGridCard({ hotel }: { hotel: Hotel }) {
  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(123,79,158,0.16),0_4px_12px_rgba(31,31,31,0.08)] hover:border-primary/20"
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click() }}
    >
      {/* Image placeholder with gradient */}
      <div className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${COVER_GRADIENT[hotel.priceRange]}`}>
        <BedDouble className="h-10 w-10 text-foreground/10 transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" />
        {/* Wishlist button — visible on hover */}
        <button
          aria-label={`Save ${hotel.name} to wishlist`}
          onClick={(e) => e.preventDefault()}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:text-brand-terracotta group-hover:opacity-100"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M10 17s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.65-7 9-7 9z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
          {hotel.category === "boutique" ? "Boutique" : hotel.priceRange === "$$$" ? "Upscale" : hotel.priceRange === "$$" ? "Mid-Range" : "Budget"}
        </div>
        <h3 className="font-display text-sm font-bold leading-snug tracking-tight line-clamp-2">{hotel.name}</h3>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
          <span className="text-[11px] text-muted-foreground truncate">{hotel.avenue ?? hotel.address}</span>
        </div>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 3).map((a) => (
            <span key={a} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {a}
            </span>
          ))}
        </div>

        {/* Footer: rating pill + price */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-[11px] font-semibold text-sage-800">
            {(hotel.rating * 2).toFixed(1)} · {ratingLabel(hotel.rating)}
          </span>
          <span className="text-[11px] font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center gap-0.5">
            View <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function HotelsFilterGrid() {
  const [active, setActive] = useState<Set<string>>(new Set())

  const filtered = useMemo(
    () => HOTELS.filter((h) => matchesFilter(h, active)),
    [active]
  )

  function toggleFilter(id: string) {
    setActive((prev) => {
      const next = new Set(prev)
      // Price filters are exclusive
      if (id.startsWith("price-")) {
        Array.from(next).forEach((key) => {
          if (key.startsWith("price-")) next.delete(key)
        })
      }
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allActive = active.size === 0

  return (
    <section>
      {/* ── Sticky filter bar ─────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 border-b bg-background/92 backdrop-blur-md">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {/* All Hotels chip */}
            <button
              aria-pressed={allActive}
              onClick={() => setActive(new Set())}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                allActive
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              All Hotels
            </button>

            {/* Divider */}
            <span className="h-5 w-px shrink-0 bg-border" />

            {/* Price tier chips */}
            {PRICE_FILTERS.map((f) => (
              <button
                key={f.id}
                aria-pressed={active.has(f.id)}
                onClick={() => toggleFilter(f.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  active.has(f.id)
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Divider */}
            <span className="h-5 w-px shrink-0 bg-border" />

            {/* Amenity chips */}
            {AMENITY_FILTERS.map((f) => (
              <button
                key={f.id}
                aria-pressed={active.has(f.id)}
                onClick={() => toggleFilter(f.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  active.has(f.id)
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hotel grid ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-muted-foreground">No hotels match the selected filters.</p>
            <button
              onClick={() => setActive(new Set())}
              className="mt-3 text-xs font-semibold text-primary underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> hotel{filtered.length !== 1 ? "s" : ""}
                {active.size > 0 && " matching filters"}
              </p>
              {active.size > 0 && (
                <button
                  onClick={() => setActive(new Set())}
                  className="text-[11px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div
              role="list"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((hotel) => (
                <HotelGridCard key={hotel.slug} hotel={hotel} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
