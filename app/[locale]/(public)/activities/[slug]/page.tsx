import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { MapPin, ArrowLeft, ExternalLink, Lightbulb, CalendarDays, Compass } from "lucide-react"
import { getActivityBySlug, getActivities } from "@/lib/queries"
import { SafeImage } from "@/components/safe-image"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { getTranslations } from "next-intl/server"

// Lazy-load single-pin map to avoid SSR issues with Leaflet
const ActivityMapPin = dynamic(
  () => import("@/components/activity-map-pin"),
  { ssr: false, loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-accent" /> }
)

export async function generateStaticParams() {
  const activities = await getActivities()
  return activities.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const activity = await getActivityBySlug(slug)
  if (!activity) return {}
  return {
    title: `${activity.title} — Things to Do in Lompoc | Lompoc Deals`,
    description: activity.description ?? `Discover ${activity.title} in Lompoc, CA.`,
    openGraph: {
      title: activity.title,
      description: activity.description ?? undefined,
      images: activity.imageUrl ? [{ url: activity.imageUrl }] : undefined,
    },
  }
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: "activityDetail" })

  const CATEGORY_LABELS: Record<string, string> = {
    outdoors: t("outdoors"),
    history: t("history"),
    arts: t("arts"),
    "food-wine": t("foodWine"),
    family: t("family"),
    unique: t("unique"),
  }

  const activity = await getActivityBySlug(slug)
  if (!activity) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/activities"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("thingsToDo")}
      </Link>

      {/* Hero image */}
      {activity.imageUrl && (
        <div className="relative mb-6 overflow-hidden rounded-2xl aspect-[16/7]">
          <SafeImage
            src={activity.imageUrl}
            alt={activity.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {CATEGORY_LABELS[activity.category] ?? activity.category}
            </span>
            {activity.featured && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {t("featured")}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">
            {activity.title}
          </h1>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {activity.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {activity.address}
              </span>
            )}
            {activity.seasonality && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                {activity.seasonality}
              </span>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <p className="mt-6 text-base leading-relaxed text-foreground">
              {activity.description}
            </p>
          )}

          {/* Tips */}
          {activity.tips && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="mb-2 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                <Lightbulb className="h-4 w-4" />
                {t("localTips")}
              </div>
              <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                {activity.tips}
              </p>
            </div>
          )}

          {/* External link */}
          {activity.sourceUrl && (
            <div className="mt-6">
              <a
                href={activity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {t("officialWebsite")}
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Map */}
          {activity.lat && activity.lng && (
            <div className="overflow-hidden rounded-xl border">
              <div className="h-64 w-full">
                <ActivityMapPin
                  lat={activity.lat}
                  lng={activity.lng}
                  title={activity.title}
                />
              </div>
              {activity.address && (
                <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {activity.address}
                </div>
              )}
            </div>
          )}

          {/* Quick facts */}
          <div className="rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold text-sm">{t("quickInfo")}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <dt className="text-muted-foreground min-w-[80px]">{t("category")}</dt>
                <dd className="font-medium">{CATEGORY_LABELS[activity.category] ?? activity.category}</dd>
              </div>
              {activity.seasonality && (
                <div className="flex items-start gap-2">
                  <dt className="text-muted-foreground min-w-[80px]">{t("bestTime")}</dt>
                  <dd className="font-medium">{activity.seasonality}</dd>
                </div>
              )}
              {activity.address && (
                <div className="flex items-start gap-2">
                  <dt className="text-muted-foreground min-w-[80px]">{t("location")}</dt>
                  <dd className="font-medium">{activity.address}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Back CTA */}
          <Link
            href="/activities"
            className="flex items-center gap-2 rounded-xl border p-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Compass className="h-4 w-4 text-primary" />
            {t("seeAll")}
          </Link>
        </div>
      </div>
    </div>
  )
}
