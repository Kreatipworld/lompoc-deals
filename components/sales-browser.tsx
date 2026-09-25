"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Search, X } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SaleCard } from "@/components/sale-card"
import { SALE_CATEGORIES, type SaleCategory } from "@/lib/sales"
import type { SaleCardData } from "@/lib/sales-queries"

type Filter = "free" | "under100" | null

/** Word-prefix match over title + description (never a raw substring — "search matches words"). */
function matches(item: SaleCardData, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = `${item.title} ${item.description} ${item.descriptionEs ?? ""} ${item.area ?? ""}`.toLowerCase().split(/[^a-z0-9áéíóúñü]+/i)
  return words.every((w) => hay.some((h) => h.startsWith(w)))
}

/**
 * The /sales grid: category chips, three quick filters, instant search. The
 * page is ISR; everything here runs on the visitor's phone over the list the
 * server rendered — no request per keystroke.
 */
export function SalesBrowser({ items, category }: { items: SaleCardData[]; category?: SaleCategory }) {
  const t = useTranslations("sales")
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>(null)

  const shown = useMemo(() => {
    return items.filter((i) => {
      if (filter === "free" && !(i.priceType === "free" || i.category === "free")) return false
      if (filter === "under100" && !(i.priceCents != null && i.priceCents < 10_000)) return false
      return matches(i, q)
    })
  }, [items, q, filter])

  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
      active ? "border-primary bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(101,12,117,0.25)]" : "border-border/80 bg-card hover:border-primary/40 hover:bg-accent"
    }`
  // A key that changes whenever the visible set changes, so the grid re-enters softly instead of snapping.
  const gridKey = `${category ?? "all"}|${filter ?? ""}|${q.trim().toLowerCase()}`

  return (
    <div data-sales-browser>
      {/* Category chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href="/sales" className={chip(!category)}>
          {t("browse.all")}
        </Link>
        {SALE_CATEGORIES.map((c) => (
          <Link key={c} href={`/sales/c/${c}`} className={chip(category === c)}>
            {t(`categories.${c}.name`)}
          </Link>
        ))}
      </div>

      {/* Search + quick filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("browse.searchPlaceholder")}
            aria-label={t("browse.searchPlaceholder")}
            className="h-11 w-full rounded-full border border-border/80 bg-card pl-10 pr-10 text-base outline-none ring-primary/30 focus:ring-2 sm:text-sm"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label={t("browse.clear")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <div className="flex gap-2">
          {(
            [
              ["free", t("browse.filterFree")],
              ["under100", t("browse.filterUnder100")],
            ] as [Exclude<Filter, null>, string][]
          ).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter((f) => (f === key ? null : key))} className={chip(filter === key)} aria-pressed={filter === key}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground" data-sales-count={shown.length}>
        {t("browse.count", { count: shown.length })}
      </p>

      {shown.length === 0 ? (
        <div key={gridKey} className="mt-4 animate-in fade-in duration-300 rounded-3xl border border-dashed border-primary/25 bg-gradient-to-b from-secondary/40 to-transparent px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold tracking-tight">{q ? t("browse.noMatchTitle") : t("browse.emptyTitle")}</p>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {q ? t("browse.noMatch", { q }) : category ? t(`categories.${category}.empty`) : t("browse.empty")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/sales/post" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95">
              {q ? t("postCta") : t("browse.emptyCta")}
            </Link>
            {(q || category) && (
              <Link href="/sales" className="inline-flex min-h-[44px] items-center rounded-full border border-border/80 bg-card px-6 text-sm font-semibold transition hover:bg-accent">
                {t("browse.all")}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div key={gridKey} className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((item, i) => (
            <div key={item.id} className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300" style={{ animationDelay: `${Math.min(i, 11) * 35}ms` }}>
              <SaleCard item={item} priority={i < 4} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
