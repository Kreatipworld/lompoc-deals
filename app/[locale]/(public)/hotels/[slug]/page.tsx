import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { HOTELS, getHotelBySlug } from "@/lib/hotels-data"
import { HotelsMap } from "@/components/hotels-map"
import {
  ArrowLeft,
  BedDouble,
  MapPin,
  Phone,
  Globe,
  Star,
  Wifi,
  Car,
  Coffee,
  CheckCircle2,
  ExternalLink,
  Navigation,
} from "lucide-react"

export function generateStaticParams() {
  return HOTELS.map((h) => ({ slug: h.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const hotel = getHotelBySlug(params.slug)
  if (!hotel) return { title: "Hotel — Lompoc Deals" }
  return {
    title: `${hotel.name} — Lompoc Hotel | Lompoc Deals`,
    description: `${hotel.tagline}. ${hotel.description.slice(0, 120)}…`,
    keywords: [
      `${hotel.name.toLowerCase()}`,
      "lompoc hotels",
      "lompoc accommodations",
      "lompoc ca",
    ],
    openGraph: {
      title: `${hotel.name} · Lompoc, CA`,
      description: hotel.tagline,
    },
  }
}

const PRICE_LABEL: Record<string, string> = {
  $: "Budget-friendly",
  $$: "Mid-range",
  $$$: "Upscale",
}

const AMENITY_ICON: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="h-4 w-4" />,
  "Free Parking": <Car className="h-4 w-4" />,
  "Hot Breakfast": <Coffee className="h-4 w-4" />,
  "Continental Breakfast": <Coffee className="h-4 w-4" />,
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
                ? "fill-amber-200 text-amber-400"
                : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">/ 5</span>
    </div>
  )
}

export default function HotelPage({ params }: { params: { slug: string } }) {
  const hotel = getHotelBySlug(params.slug)
  if (!hotel) notFound()

  const otherHotels = HOTELS.filter((h) => h.slug !== hotel.slug)

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-accent via-background to-background"
        />
        {/* Cover image or placeholder */}
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-0">
          <Link
            href="/hotels"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            All hotels
          </Link>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="overflow-hidden rounded-2xl">
            <div className="flex h-52 items-center justify-center bg-gradient-to-br from-primary/10 via-accent to-primary/5 sm:h-64">
              <BedDouble className="h-16 w-16 text-primary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl px-4 py-10 pb-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title block */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-full border bg-secondary px-3 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {hotel.category}
                </span>
                <span className="rounded-full border bg-secondary px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  {hotel.priceRange} · {PRICE_LABEL[hotel.priceRange]}
                </span>
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {hotel.name}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground italic">{hotel.tagline}</p>
              <div className="mt-3">
                <StarRating rating={hotel.rating} />
              </div>
            </div>

            {/* About */}
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed">{hotel.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight mb-4">Amenities</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hotel.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {AMENITY_ICON[amenity] ?? <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            {/* Contact card */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-display font-semibold">Contact &amp; Location</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                  <div>
                    <div>{hotel.address}</div>
                    {hotel.avenue && (
                      <div className="text-xs italic text-muted-foreground/70 mt-0.5">{hotel.avenue}</div>
                    )}
                    {hotel.neighborhood && (
                      <div className="text-xs text-muted-foreground/60 mt-0.5">{hotel.neighborhood}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                  <a href={`tel:${hotel.phone.replace(/\D/g, "")}`} className="hover:text-foreground">
                    {hotel.phone}
                  </a>
                </div>
                {hotel.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4 shrink-0 text-primary/70" />
                    <a
                      href={hotel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Visit website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {hotel.website && (
                <a
                  href={hotel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Book a room
                </a>
              )}
            </div>

            {/* Mini map */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div style={{ height: 200 }}>
                <HotelsMap hotels={[hotel]} />
              </div>
              <div className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <Navigation className="h-3 w-3 shrink-0 text-primary/60" />
                <span>{hotel.address}</span>
              </div>
            </div>

            {/* Other hotels */}
            {otherHotels.length > 0 && (
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="font-display font-semibold mb-3">Other Lompoc Hotels</h3>
                <ul className="space-y-2">
                  {otherHotels.slice(0, 3).map((h) => (
                    <li key={h.slug}>
                      <Link
                        href={`/hotels/${h.slug}`}
                        className="flex items-start gap-2 rounded-lg p-2 text-sm transition hover:bg-accent"
                      >
                        <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                        <span className="font-medium leading-snug">{h.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/hotels"
                  className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
                >
                  See all hotels →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
