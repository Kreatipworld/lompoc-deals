"use client"

import { useMemo, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { ArrowRight } from "lucide-react"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"
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

/**
 * Round-robin across content buckets so the All scroll is a varied mix
 * (deal → sale → event → news → …) instead of a wall of whichever category
 * currently dominates the data.
 */
function mixAll(list: FeedDisplayItem[]): FeedDisplayItem[] {
  const deals: FeedDisplayItem[] = []
  const sales: FeedDisplayItem[] = []
  const evts: FeedDisplayItem[] = []
  const news: FeedDisplayItem[] = []
  for (const item of list) {
    if (item.type === "deal") deals.push(item)
    else if (item.type === "for_sale" || item.type === "garage_sale") sales.push(item)
    else if (item.type === "event") evts.push(item)
    else news.push(item)
  }
  const buckets = [deals, sales, evts, news]
  const out: FeedDisplayItem[] = []
  while (buckets.some((b) => b.length > 0)) {
    for (const b of buckets) {
      const item = b.shift()
      if (item) out.push(item)
    }
  }
  return out
}

export function FeedExplorer({
  items,
  initialType,
}: {
  items: FeedDisplayItem[]
  initialType: string
}) {
  const t = useTranslations("feed")
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [type, setType] = useState<TypeFilter>(normalizeType(initialType))
  const [view, setView] = useState<ViewMode>("cards")

  const PAGE_SIZE = 24
  const [shown, setShown] = useState(PAGE_SIZE)

  const visible = useMemo(
    () => items.filter((i) => matchesType(i, type)),
    [items, type]
  )

  function sync(nextType: TypeFilter) {
    setShown(PAGE_SIZE)
    const params = new URLSearchParams()
    if (nextType !== "all") params.set("type", nextType)
    const qs = params.toString()
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    )
  }

  const showMoreButton = (total: number) =>
    total > shown ? (
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setShown((s) => s + PAGE_SIZE)}
          className="rounded-full border border-primary/30 bg-background px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {t("showMore")} ({total - shown})
        </button>
      </div>
    ) : null

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
  const restRaw = visible.filter((i) => !featuredIds.has(i.id))
  const rest = type === "all" ? mixAll(restRaw) : restRaw

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
                sync(f.value)
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
          <div key={type} className="space-y-8">
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
              <Reveal preset="stagger" stagger={60} className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {eventsView.city.slice(0, shown).map((item) => (
                  <div key={item.id}>
                    <FeedCard item={item} />
                  </div>
                ))}
              </Reveal>
            )}
            {showMoreButton(eventsView.city.length)}
          </div>
        )
      ) : rest.length === 0 && featured.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t("emptyState")}</p>
      ) : (
        <div key={type} className="space-y-8">
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
            <Reveal preset="stagger" stagger={60} className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.slice(0, shown).map((item) => (
                <div key={item.id}>
                  <FeedCard item={item} />
                </div>
              ))}
            </Reveal>
          )}
          {showMoreButton(rest.length)}
        </div>
      )}
    </div>
  )
}
