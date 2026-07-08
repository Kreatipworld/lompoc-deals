import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { HOTELS } from "@/lib/hotels-data"
import { HotelsMap } from "@/components/hotels-map"
import { HotelsFilterGrid } from "@/components/hotels-filter-grid"
import { ActivityTicker } from "@/components/activity-ticker"
import { db } from "@/db/client"
import { activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ArrowRight, Tag, Wine, Rocket, Flower2 } from "lucide-react"
import { pageAlternates } from "@/lib/seo"

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
    alternates: pageAlternates("/hotels"),
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
      {/* ── 1. MAP HEADER — all hotel pins, trimmed to keep hotels above the fold ── */}
      <section className="relative h-[45vh] min-h-[360px] overflow-hidden">
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
        <div className="pointer-events-none absolute inset-x-0 top-12 flex flex-col items-center px-4 text-center sm:top-14">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-4xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] sm:text-base">
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

      {/* ── 2. HOTELS — single filterable photo grid ─────────────────── */}
      <section className="py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {t("hotelsHeading", { count: hotelCount })}
          </h2>

          <div className="mt-4">
            <HotelsFilterGrid
              labels={{
                amenityPool: t("filterPool"),
                amenityBreakfast: t("filterBreakfast"),
                amenityWifi: t("filterWifi"),
                amenityParking: t("filterParking"),
                amenityPets: t("filterPets"),
                milesToDowntown: t("milesToDowntown"),
                emptyTitle: t("filterEmptyTitle"),
                clearFilters: t("filterClear"),
              }}
            />
          </div>
        </div>
      </section>

      {/* ── 3. WHY LOMPOC — three linked reasons ─────────────────────── */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {t("aboutHeading")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <AboutBlock
              icon={<Wine className="h-5 w-5" />}
              title={t("aboutWineTitle")}
              body={t("aboutWineBody")}
              href="/category/wineries"
              cta={t("aboutWineCta")}
            />
            <AboutBlock
              icon={<Rocket className="h-5 w-5" />}
              title={t("aboutSpaceTitle")}
              body={t("aboutSpaceBody")}
              href="/activities"
              cta={t("aboutExploreCta")}
            />
            <AboutBlock
              icon={<Flower2 className="h-5 w-5" />}
              title={t("aboutFlowerTitle")}
              body={t("aboutFlowerBody")}
              href="/activities"
              cta={t("aboutExploreCta")}
            />
          </div>
        </div>
      </section>

      {/* ── 4. LOCAL DEALS HOOK ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-tight">
                {t("dealsHookTitle")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("dealsHookBody")}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/deals"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("dealsHookCta")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/subscribe"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("dealsHookSubscribe")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. WHILE YOU'RE HERE — featured activities ───────────────── */}
      {featuredActivities.length > 0 && (
        <section className="bg-gold/10 py-12 dark:bg-gold/10">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {t("whileHereHeading")}
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

function AboutBlock({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode
  title: string
  body: string
  href: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
