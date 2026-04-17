import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { HOTELS } from "@/lib/hotels-data"
import {
  MapPin,
  Phone,
  Star,
  ArrowRight,
  BedDouble,
  Wifi,
  Car,
  Coffee,
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
  $: "Budget-friendly",
  $$: "Mid-range",
  $$$: "Upscale",
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

        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <BedDouble className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Hotels &amp; Stays
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {HOTELS.length} hotels in Lompoc · Vandenberg · wine country
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-muted-foreground">
            Visiting the Flower Capital of America? Whether you&apos;re here for Vandenberg Space
            Force Base, the Santa Rita Hills wine trail, or the annual Lompoc Flower Festival —
            find the right stay right here.
          </p>
        </div>
      </section>

      {/* HOTEL GRID */}
      <section className="mx-auto max-w-6xl px-4 py-10 pb-16">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {HOTELS.map((hotel) => (
            <li key={hotel.slug}>
              <Link
                href={`/hotels/${hotel.slug}`}
                className="group flex h-full flex-col rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                {/* Cover placeholder */}
                <div className="flex h-36 items-center justify-center rounded-t-2xl bg-gradient-to-br from-primary/10 to-accent">
                  <BedDouble className="h-12 w-12 text-primary/40" />
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  {/* Name + price badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold leading-snug tracking-tight">
                      {hotel.name}
                    </h2>
                    <span className="shrink-0 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {hotel.priceRange} · {PRICE_LABEL[hotel.priceRange]}
                    </span>
                  </div>

                  <StarRating rating={hotel.rating} />

                  <p className="line-clamp-2 text-sm text-muted-foreground">{hotel.description}</p>

                  {/* Top amenities */}
                  <div className="flex flex-wrap gap-1.5">
                    {hotel.amenities.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {AMENITY_ICON[a] ?? null}
                        {a}
                      </span>
                    ))}
                    {hotel.amenities.length > 4 && (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        +{hotel.amenities.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="mt-auto space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                      <span>{hotel.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0 text-primary/60" />
                      {hotel.phone}
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    View details
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* CMO note — will disappear once DB-driven */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Know a Lompoc hotel that should be listed?{" "}
          <Link href="/for-businesses" className="underline underline-offset-2 hover:text-foreground">
            Add your property
          </Link>
        </p>
      </section>
    </>
  )
}
