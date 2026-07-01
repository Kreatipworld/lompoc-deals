import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { HOTELS, type Hotel } from "@/lib/hotels-data"
import { HotelsMap } from "@/components/hotels-map"
import { HotelsFilterGrid } from "@/components/hotels-filter-grid"
import { ActivityTicker } from "@/components/activity-ticker"
import { db } from "@/db/client"
import { activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { BedDouble, MapPin, Star, Wine, Rocket, Flower2 } from "lucide-react"
// Note: page header used to be a scenic flower image; it's now a Mapbox map showing
// all 15 hotel pins. Coordinates verified via Mapbox geocoding (all within 6m of address).

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
  const tCat = await getTranslations({ locale, namespace: "activityCategory" })

  // Fetch featured activities
  let featuredActivities: {
    id: number
    title: string
    slug: string
    category: string
    description: string | null
    imageUrl: string | null
    featured: boolean
  }[] = []
  try {
    featuredActivities = await db
      .select({
        id: activities.id,
        title: activities.title,
        slug: activities.slug,
        category: activities.category,
        description: activities.description,
        imageUrl: activities.imageUrl,
        featured: activities.featured,
      })
      .from(activities)
      .where(eq(activities.featured, true))
      .limit(6)
  } catch {
    // If DB unavailable during build/dev, activities section gracefully hides
  }

  const hotelCount = HOTELS.length

  return (
    <main className="pb-20">
      {/* ── 1. HERO — Mapbox map with all hotel pins ───────────────────── */}
      <section className="relative h-[60vh] min-h-[420px] overflow-hidden md:h-[65vh]">
        {/* The map fills the section. Pointer-events on overlays use pointer-events-none
            where they shouldn't block panning/clicking pins. */}
        <div className="absolute inset-0">
          <HotelsMap hotels={HOTELS} />
        </div>

        {/* Top gradient — improves overlay legibility against the map tiles */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />

        {/* Top-left pill */}
        <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6">
          <span className="pointer-events-auto rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-gray-800 shadow backdrop-blur-sm">
            {t("heroPill")}
          </span>
        </div>

        {/* Title */}
        <div className="pointer-events-none absolute inset-x-0 top-16 flex flex-col items-center px-4 text-center sm:top-20">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] sm:text-base">
            {t("heroSubtitle", { count: hotelCount })}
          </p>
        </div>

        {/* Bottom-left stat card (left so it doesn't collide with Mapbox NavigationControl top-right) */}
        <div className="pointer-events-none absolute bottom-4 left-4 sm:bottom-5 sm:left-6">
          <div className="pointer-events-auto rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow backdrop-blur-sm sm:text-sm">
            {t("heroStats", { count: hotelCount })}
          </div>
        </div>
      </section>

      {/* ── 2. THINGS TO DO ──────────────────────────────────────────── */}
      {featuredActivities.length > 0 && (
        <section className="bg-gold/10 py-12 dark:bg-gold/10">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {t("thingsToDoHeading")}
            </h2>

            {/* Mobile: horizontal scroll-snap; Tablet: 2-col; Desktop: 3-col */}
            <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
              {featuredActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} tCat={tCat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. HOTELS LIST ───────────────────────────────────────────── */}
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {t("hotelsHeading", { count: hotelCount })}
          </h2>

          {/* Filter chips */}
          <div className="mt-4">
            <HotelsFilterGrid />
          </div>

          {/* Grid */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {HOTELS.map((hotel) => (
              <HotelCard key={hotel.slug} hotel={hotel} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ABOUT LOMPOC ──────────────────────────────────────────── */}
      <section className="bg-muted/30 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {t("aboutHeading")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <AboutBlock
              icon={<Wine className="h-5 w-5" />}
              title={t("aboutWineTitle")}
              body={t("aboutWineBody")}
            />
            <AboutBlock
              icon={<Rocket className="h-5 w-5" />}
              title={t("aboutSpaceTitle")}
              body={t("aboutSpaceBody")}
            />
            <AboutBlock
              icon={<Flower2 className="h-5 w-5" />}
              title={t("aboutFlowerTitle")}
              body={t("aboutFlowerBody")}
            />
          </div>
        </div>
      </section>

      {/* ── 6. ACTIVITY TICKER ───────────────────────────────────────── */}
      <ActivityTicker />
    </main>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const CATEGORY_CHIP: Record<string, string> = {
  outdoors: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "food-wine": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  history: "bg-stone-100 text-stone-800 dark:bg-stone-800/60 dark:text-stone-300",
  arts: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  family: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  unique: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
}

const CATEGORY_GRADIENT: Record<string, string> = {
  outdoors: "from-green-400 to-teal-500",
  "food-wine": "from-amber-400 to-orange-500",
  history: "from-stone-400 to-stone-600",
  arts: "from-purple-400 to-fuchsia-500",
  family: "from-pink-400 to-rose-500",
  unique: "from-blue-400 to-indigo-500",
}

function ActivityCard({
  activity,
  tCat,
}: {
  activity: {
    id: number
    title: string
    slug: string
    category: string
    description: string | null
    imageUrl: string | null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tCat: any
}) {
  const chipClass = CATEGORY_CHIP[activity.category] ?? "bg-gray-100 text-gray-700"
  const gradientClass = CATEGORY_GRADIENT[activity.category] ?? "from-gray-400 to-gray-600"

  const catLabel = (() => {
    try {
      return tCat(activity.category)
    } catch {
      return activity.category
    }
  })()

  return (
    <Link
      href={`/activities/${activity.slug}`}
      className="group relative flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:w-auto"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {activity.imageUrl ? (
          <Image
            src={activity.imageUrl}
            alt={activity.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 288px, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />
        )}
        {/* Category chip */}
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${chipClass}`}>
          {catLabel}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{activity.title}</h3>
        {activity.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{activity.description}</p>
        )}
      </div>
    </Link>
  )
}

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

function HotelCard({ hotel }: { hotel: Hotel }) {
  const gradient = COVER_GRADIENT[hotel.priceRange] ?? COVER_GRADIENT["$"]

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
          <h2 className="font-display text-sm font-bold leading-snug text-white sm:text-base">
            {hotel.name}
          </h2>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Star rating */}
        <StarRating rating={hotel.rating} />

        {/* Tagline */}
        <p className="line-clamp-1 text-sm text-muted-foreground">{hotel.tagline}</p>

        {/* Amenity pills */}
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

        {/* Address footer */}
        <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
          <span className="truncate">{hotel.avenue ?? hotel.address}</span>
        </div>
      </div>
    </Link>
  )
}

function AboutBlock({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}
