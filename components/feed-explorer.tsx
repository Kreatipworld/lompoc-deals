"use client"

import { useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"
import { neighborhoodLabel } from "@/lib/neighborhoods"
import { FeedCard } from "@/components/feed-card"
import { Reveal } from "@/components/reveal"

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

  return (
    <div className="space-y-6">
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

      {rest.length === 0 && featured.length === 0 ? (
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
