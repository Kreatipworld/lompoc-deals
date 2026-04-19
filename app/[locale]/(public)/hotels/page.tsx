import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { HOTELS } from "@/lib/hotels-data"
import { HotelsMap } from "@/components/hotels-map"
import {
  MapPin,
  Phone,
  Star,
  ArrowRight,
  BedDouble,
  Wifi,
  Car,
  Coffee,
  Landmark,
  Navigation,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Lompoc Hotels & Accommodations — Where to Stay | Lompoc Deals",
  description:
    "Find hotels and accommodations in Lompoc, CA. Browse options near Vandenberg Space Force Base, downtown Lompoc, and the Santa Rita Hills wine country.",
  keywords: [
    "lompoc hotels",
    "lompoc accommodations",
    "hotels in lompoc ca",
    "lompoc motels",
    "where to stay lompoc",
    "lompoc california lodging",
  ],
  openGraph: {
    title: "Lompoc Hotels & Accommodations",
    description: "Browse hotels in Lompoc, CA — budget stays to comfortable suites.",
  },
}

const PRICE_LABEL: Record<string, string> = {
  $: "Budget",
  $$: "Mid-range",
  $$$: "Upscale",
}

const PRICE_BADGE_CLASS: Record<string, string> = {
  $: "bg-emerald-50 text-emerald-700 border-emerald-200",
  $$: "bg-amber-50 text-amber-700 border-amber-200",
  $$$: "bg-violet-50 text-violet-700 border-violet-200",
}

const AMENITY_ICON: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="h-3 w-3" />,
  "Free Parking": <Car className="h-3 w-3" />,
  "Hot Breakfast": <Coffee className="h-3 w-3" />,
  "Continental Breakfast": <Coffee className="h-3 w-3" />,
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
                ? "fill-amber-200 text-amber-400"
                : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

// Key landmarks tourists look for
const LANDMARKS = [
  { icon: <Landmark className="h-4 w-4" />, label: "La Purísima Mission", note: "Historic state park" },
  { icon: <Navigation className="h-4 w-4" />, label: "Vandenberg Space Force Base", note: "Main gate on Hwy 1" },
  { icon: <MapPin className="h-4 w-4" />, label: "Lompoc Valley Flower Fields", note: "Apr–Jun peak season" },
  { icon: <MapPin className="h-4 w-4" />, label: "Santa Rita Hills Wine Trail", note: "World-class Pinot Noir" },
]

export default function HotelsPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-accent via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -top-20 right-[-10%] -z-10 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <BedDouble className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Hotels &amp; Stays in Lompoc
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {HOTELS.length} properties · Vandenberg · downtown · wine country
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Visiting the Flower Capital of America? Whether you&apos;re here for Vandenberg Space
            Force Base, the Santa Rita Hills wine trail, or the annual Lompoc Flower Festival —
            find the right stay right here. Use the map to explore by location.
          </p>

          {/* Landmark quick-reference */}
          <div className="mt-5 flex flex-wrap gap-3">
            {LANDMARKS.map((lm) => (
              <div
                key={lm.label}
                className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"
              >
                <span className="text-primary/70">{lm.icon}</span>
                <span className="font-medium text-foreground">{lm.label}</span>
                <span className="hidden sm:inline">· {lm.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAP + LIST LAYOUT */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* ── HOTEL CARDS ── */}
          <div className="flex-1 lg:max-w-[560px]">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {HOTELS.length} places to stay
            </p>
            <ul className="space-y-4">
              {HOTELS.map((hotel) => (
                <li key={hotel.slug}>
                  <Link
                    href={`/hotels/${hotel.slug}`}
                    className="group flex flex-col rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:flex-row"
                  >
                    {/* Cover placeholder */}
                    <div className="flex h-32 shrink-0 items-center justify-center rounded-t-2xl bg-gradient-to-br from-primary/10 to-accent sm:h-auto sm:w-32 sm:rounded-l-2xl sm:rounded-tr-none">
                      <BedDouble className="h-10 w-10 text-primary/30" />
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-4">
                      {/* Name + price */}
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display text-base font-semibold leading-snug tracking-tight">
                          {hotel.name}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${PRICE_BADGE_CLASS[hotel.priceRange]}`}
                        >
                          {hotel.priceRange} · {PRICE_LABEL[hotel.priceRange]}
                        </span>
                      </div>

                      <StarRating rating={hotel.rating} />

                      <p className="line-clamp-2 text-xs text-muted-foreground">{hotel.description}</p>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1">
                        {hotel.amenities.slice(0, 3).map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {AMENITY_ICON[a] ?? null}
                            {a}
                          </span>
                        ))}
                        {hotel.amenities.length > 3 && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground">
                            +{hotel.amenities.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Address + avenue */}
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                          <span>{hotel.address}</span>
                        </div>
                        {hotel.avenue && (
                          <div className="flex items-start gap-1.5 pl-4.5">
                            <span className="italic text-muted-foreground/70">{hotel.avenue}</span>
                          </div>
                        )}
                        {hotel.neighborhood && (
                          <div className="flex items-start gap-1.5 pl-4.5">
                            <span className="text-muted-foreground/60">{hotel.neighborhood}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0 text-primary/60" />
                          {hotel.phone}
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-0.5 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                        View details
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Know a Lompoc hotel that should be listed?{" "}
              <Link href="/for-businesses" className="underline underline-offset-2 hover:text-foreground">
                Add your property
              </Link>
            </p>
          </div>

          {/* ── MAP ── */}
          <div className="lg:sticky lg:top-6 w-full lg:flex-1">
            <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ height: 520 }}>
              <HotelsMap hotels={HOTELS} />
            </div>
            {/* Map legend */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Budget ($)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Mid-range ($$)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-violet-600" />
                <span>Upscale ($$$)</span>
              </div>
              <span className="ml-auto italic">Click a pin to preview</span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
