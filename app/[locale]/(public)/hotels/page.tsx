import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { HOTELS, type Hotel } from "@/lib/hotels-data"
import { HotelsMap } from "@/components/hotels-map"
import { HotelsFilterGrid } from "@/components/hotels-filter-grid"
import { ActivityTicker } from "@/components/activity-ticker"
import { BedDouble, MapPin, Star } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "hotels" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function HotelsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "hotels" })

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* Compact hero */}
      <header className="border-b py-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <BedDouble className="h-3 w-3" />
          {t("heroEyebrow")}
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("heroSubtitle", { count: HOTELS.length })}
        </p>
      </header>

      {/* Filter chips — sticky on scroll */}
      <div className="sticky top-0 z-30 -mx-4 mt-6 border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
        <HotelsFilterGrid />
      </div>

      {/* Side-by-side on desktop: map left, list right. Stacked on mobile. */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Map column */}
        <div className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-96px)]">
          <div className="overflow-hidden rounded-2xl border h-[280px] lg:h-full">
            <HotelsMap hotels={HOTELS} />
          </div>
        </div>

        {/* List column */}
        <div className="space-y-3">
          {HOTELS.map((hotel) => (
            <HotelRow key={hotel.slug} hotel={hotel} t={t} locale={locale} />
          ))}
        </div>
      </div>

      <ActivityTicker />
    </main>
  )
}

const COVER_GRADIENT: Record<string, string> = {
  $: "from-emerald-500/20 via-teal-400/10 to-cyan-300/10",
  $$: "from-amber-500/25 via-orange-400/15 to-yellow-300/10",
  $$$: "from-violet-600/25 via-purple-500/15 to-fuchsia-400/10",
}

function priceLabel(range: string, t: (key: string) => string) {
  if (range === "$$$") return t("priceUpscale")
  if (range === "$$") return t("priceMidRange")
  return t("priceBudget")
}

function ratingLabel(rating: number, t: (key: string) => string) {
  if (rating >= 4.5) return t("ratingExceptional")
  if (rating >= 4.25) return t("ratingSuperb")
  return t("ratingVeryGood")
}

function HotelRow({
  hotel,
  t,
  locale,
}: {
  hotel: Hotel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
  locale: string
}) {
  void locale
  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group flex overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20"
    >
      {/* Thumbnail */}
      <div
        className={`relative flex h-auto w-24 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br sm:w-32 ${COVER_GRADIENT[hotel.priceRange]}`}
      >
        <BedDouble className="h-8 w-8 text-foreground/10 transition-transform duration-[400ms] group-hover:scale-105" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        {/* Top row: name + price chip */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
              {priceLabel(hotel.priceRange, t)}
            </div>
            <h2 className="font-display text-sm font-bold leading-snug tracking-tight sm:text-base">
              {hotel.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{hotel.tagline}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
            {hotel.priceRange}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold">{hotel.rating.toFixed(1)}</span>
          <span className="text-[11px] text-muted-foreground">
            · {ratingLabel(hotel.rating, t)}
          </span>
        </div>

        {/* Amenity chips */}
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hotel.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {a}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{hotel.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Address footer */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
          <span className="truncate">{hotel.avenue ?? hotel.address}</span>
        </div>
      </div>
    </Link>
  )
}
