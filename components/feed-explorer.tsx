"use client"

import { useMemo, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { ArrowRight } from "lucide-react"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"
import { neighborhoodLabel } from "@/lib/neighborhoods"
import { FeedCard } from "@/components/feed-card"
import { Reveal } from "@/components/reveal"

function MapLoadingFallback() {
  const t = useTranslations("feed")
  return (
    <div className="flex h-[520px] items-center justify-center rounded-2xl border bg-muted text-xs text-muted-foreground">
      {t("mapLoading")}
    </div>
  )
}

const FeedMap = dynamic(
  () => import("@/components/feed-map").then((m) => m.FeedMap),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />,
  }
)

type ViewMode = "cards" | "map"

type TypeFilter = "all" | "deal" | "for_sale" | "garage_sale" | "event" | "news"

const TYPE_FILTERS: { value: TypeFilter; labelKey: string }[] = [
  { value: "all", labelKey: "filterAll" },
  { value: "deal", labelKey: "filterDeals" },
  { value: "for_sale", labelKey: "filterForSale" },
  { value: "garage_sale", labelKey: "filterGarageSales" },
  { value: "event", labelKey: "filterEvents" },
  { value: "news", labelKey: "filterNews" },
]

export function normalizeType(raw: string | undefined): TypeFilter {
  if (raw === "info") return "news" // legacy param
  if (raw && ["deal", "for_sale", "garage_sale", "event", "news"].includes(raw))
    return raw as TypeFilter
  return "all"
}

function matchesType(item: FeedDisplayItem, f: TypeFilter): boolean {
  if (f === "all") return true
  if (f === "for_sale") return item.type === "for_sale" || item.type === "garage_sale"
  if (f === "news")
    return item.type === "info" || item.type === "new_business" || item.type === "blog"
  return item.type === f
}

export function FeedExplorer({
  items,
  initialType,
  initialHood,
}: {
  items: FeedDisplayItem[]
  initialType: string
  initialHood: string
}) {
  const t = useTranslations("feed")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [type, setType] = useState<TypeFilter>(normalizeType(initialType))
  const [hood, setHood] = useState<string>(initialHood || "all")
  const [view, setView] = useState<ViewMode>("cards")

  // chips only for neighborhoods that actually have items
  const hoods = useMemo(() => {
    const present = new Set(items.map((i) => i.neighborhood).filter(Boolean) as string[])
    return Array.from(present)
  }, [items])

  const visible = useMemo(
    () =>
      items.filter(
        (i) => matchesType(i, type) && (hood === "all" || i.neighborhood === hood)
      ),
    [items, type, hood]
  )

  function sync(nextType: TypeFilter, nextHood: string) {
    const params = new URLSearchParams()
    if (nextType !== "all") params.set("type", nextType)
    if (nextHood !== "all") params.set("hood", nextHood)
    const qs = params.toString()
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    )
  }

  const chip = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  )

  const featured = visible.filter((i) => i.isFeatured).slice(0, 2)
  const featuredIds = new Set(featured.map((i) => i.id))
  const rest = visible.filter((i) => !featuredIds.has(i.id))

  // Events tab gets the /events treatment: launches first, recurring series
  // collapsed to their next occurrence, everything sorted by date
  const eventsView = useMemo(() => {
    if (type !== "event") return null
    const sorted = [...visible].sort(
      (a, b) => (a.startsAt?.getTime() ?? 0) - (b.startsAt?.getTime() ?? 0)
    )
    const launches = sorted.filter((i) => i.eventSource === "launch-library")
    const seen = new Set<string>()
    const city = sorted.filter((i) => {
      if (i.eventSource === "launch-library") return false
      if (seen.has(i.title)) return false
      seen.add(i.title)
      return true
    })
    return { launches, city }
  }, [visible, type])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) =>
            chip(
              type === f.value,
              t(f.labelKey),
              () => {
                setType(f.value)
                sync(f.value, hood)
              },
              `type-${f.value}`
            )
          )}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border p-1">
          {chip(view === "cards", t("viewCards"), () => setView("cards"), "view-cards")}
          {chip(view === "map", t("viewMap"), () => setView("map"), "view-map")}
        </div>
      </div>

      {hoods.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chip(hood === "all", t("hoodAll"), () => { setHood("all"); sync(type, "all") }, "hood-all")}
          {hoods.map((h) =>
            chip(
              hood === h,
              neighborhoodLabel(h, locale),
              () => {
                setHood(h)
                sync(type, h)
              },
              `hood-${h}`
            )
          )}
        </div>
      )}

      {view === "map" ? (
        visible.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">{t("emptyState")}</p>
        ) : (
          <FeedMap items={visible} />
        )
      ) : eventsView ? (
        eventsView.launches.length === 0 && eventsView.city.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">{t("emptyState")}</p>
        ) : (
          <div key={`${type}-${hood}`} className="space-y-8">
            <div className="flex justify-end">
              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("fullCalendar")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {eventsView.launches.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
                  {t("launchesHeading")}
                </h2>
                <Reveal preset="scaleIn" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {eventsView.launches.slice(0, 6).map((item) => (
                    <div key={item.id}>
                      <FeedCard item={item} />
                    </div>
                  ))}
                </Reveal>
              </div>
            )}
            {eventsView.city.length > 0 && (
              <Reveal preset="stagger" stagger={60} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {eventsView.city.map((item) => (
                  <div key={item.id} className="mb-4 break-inside-avoid">
                    <FeedCard item={item} />
                  </div>
                ))}
              </Reveal>
            )}
          </div>
        )
      ) : rest.length === 0 && featured.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t("emptyState")}</p>
      ) : (
        <div key={`${type}-${hood}`} className="space-y-8">
          {featured.length > 0 && (
            <Reveal preset="scaleIn" className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featured.map((item) => (
                <div key={item.id}>
                  <FeedCard item={item} />
                </div>
              ))}
            </Reveal>
          )}
          {rest.length > 0 && (
            <Reveal preset="stagger" stagger={60} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {rest.map((item) => (
                <div key={item.id} className="mb-4 break-inside-avoid">
                  <FeedCard item={item} />
                </div>
              ))}
            </Reveal>
          )}
        </div>
      )}
    </div>
  )
}
