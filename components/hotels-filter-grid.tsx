"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { HOTELS, type Hotel } from "@/lib/hotels-data"
import { MapPin, Star, BedDouble, X } from "lucide-react"

// Labels arrive from the server page (next-intl lives server-side there);
// props must stay serializable, so templates carry a {miles} placeholder.
export type HotelsGridLabels = {
  amenityPool: string
  amenityBreakfast: string
  amenityWifi: string
  amenityParking: string
  amenityPets: string
  milesToDowntown: string // e.g. "{miles} mi to downtown"
  emptyTitle: string
  clearFilters: string
}

type FilterChip = { id: string; label: string }

// ── Distance to downtown (H St & Ocean Ave) ────────────────────────────────
const DOWNTOWN = { lat: 34.6392, lng: -120.4579 }

function milesToDowntown(hotel: Hotel): string {
  const R = 3958.8 // earth radius, miles
  const dLat = ((hotel.lat - DOWNTOWN.lat) * Math.PI) / 180
  const dLng = ((hotel.lng - DOWNTOWN.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((DOWNTOWN.lat * Math.PI) / 180) *
      Math.cos((hotel.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const miles = 2 * R * Math.asin(Math.sqrt(a))
  return miles.toFixed(1)
}

// ── Filtering ────────────────────────────────────────────────────────────────

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

// ── Card (photo-rich — the single hotel card for this page) ─────────────────

const COVER_GRADIENT: Record<string, string> = {
  $: "from-success/20 via-success/10 to-success/5",
  $$: "from-gold/25 via-gold/15 to-gold/10",
  $$$: "from-primary/25 via-primary/15 to-primary/10",
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? "fill-gold text-gold"
              : i === full && half
                ? "fill-gold/50 text-gold"
                : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold">{rating.toFixed(1)}</span>
    </div>
  )
}

function HotelCard({ hotel, labels }: { hotel: Hotel; labels: HotelsGridLabels }) {
  const gradient = COVER_GRADIENT[hotel.priceRange] ?? COVER_GRADIENT["$"]
  const distance = labels.milesToDowntown.replace("{miles}", milesToDowntown(hotel))

  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20"
    >
      {/* Image / cover area (4:3) */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {hotel.coverUrl ? (
          <Image
            src={hotel.coverUrl}
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <BedDouble className="h-10 w-10 text-foreground/10" />
          </div>
        )}

        {/* Price tier chip — top right */}
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {hotel.priceRange}
        </span>

        {/* Hotel name overlay — bottom of image */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-3 pt-8">
          <h3 className="font-display text-sm font-bold leading-snug text-white sm:text-base">
            {hotel.name}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <StarRating rating={hotel.rating} />
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {distance}
          </span>
        </div>

        <p className="line-clamp-1 text-sm text-muted-foreground">{hotel.tagline}</p>

        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
          <span className="truncate">{hotel.avenue ?? hotel.address}</span>
        </div>
      </div>
    </Link>
  )
}

// ── Main component: chips + single filtered grid ────────────────────────────

export function HotelsFilterGrid({ labels }: { labels: HotelsGridLabels }) {
  const [active, setActive] = useState<Set<string>>(new Set())

  const priceFilters: FilterChip[] = [
    { id: "price-$", label: "$" },
    { id: "price-$$", label: "$$" },
    { id: "price-$$$", label: "$$$" },
  ]
  const amenityFilters: FilterChip[] = [
    { id: "amenity-pool", label: labels.amenityPool },
    { id: "amenity-breakfast", label: labels.amenityBreakfast },
    { id: "amenity-wifi", label: labels.amenityWifi },
    { id: "amenity-parking", label: labels.amenityParking },
    { id: "amenity-pets", label: labels.amenityPets },
  ]

  const filtered = useMemo(
    () => HOTELS.filter((h) => matchesFilter(h, active)),
    [active]
  )

  function toggle(id: string) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {[...priceFilters, ...amenityFilters].map((chip) => {
          const isActive = active.has(chip.id)
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => toggle(chip.id)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-card text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {chip.label}
            </button>
          )
        })}
        {active.size > 0 && (
          <button
            type="button"
            onClick={() => setActive(new Set())}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            {labels.clearFilters}
          </button>
        )}
      </div>

      {/* Grid or empty state */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {filtered.map((hotel) => (
            <HotelCard key={hotel.slug} hotel={hotel} labels={labels} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed bg-muted/30 px-6 py-14 text-center">
          <BedDouble className="mx-auto h-9 w-9 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">{labels.emptyTitle}</p>
          <button
            type="button"
            onClick={() => setActive(new Set())}
            className="mt-3 inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40"
          >
            <X className="h-3.5 w-3.5" />
            {labels.clearFilters}
          </button>
        </div>
      )}
    </div>
  )
}
