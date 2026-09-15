"use client"

import { useMemo, useState } from "react"
import { Link } from "@/i18n/navigation"
import { Store, Search, Tag, ArrowRight } from "lucide-react"
import { BusinessAvatar } from "@/components/business-avatar"

export type CategoryListItem = {
  id: number
  name: string
  slug: string
  description: string | null
  address: string | null
  logoUrl: string | null
  photoUrl: string | null
  activeDealCount: number
  tier: number
  openNow: boolean | null
}

const PAGE = 30

/**
 * The category listing: search within the category (words in name or
 * description), Members first / A–Z, and a compact card list that grows 30 at
 * a time. Owner (Sep 14 2026): no more mile-long pages.
 */
export function CategoryList({
  items,
  labels,
}: {
  items: CategoryListItem[]
  labels: {
    searchWithin: string
    sortMembers: string
    sortAz: string
    showMore: string
    count: (n: number) => string
    member: string
    deal: (n: number) => string
    openNow: string
    noMatch: string
  }
}) {
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<"members" | "az">("members")
  const [limit, setLimit] = useState(PAGE)

  const filtered = useMemo(() => {
    const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
    let list = items
    if (words.length) {
      list = items.filter((b) => {
        const hay = `${b.name} ${b.description ?? ""}`.toLowerCase()
        return words.every((w) => hay.includes(w))
      })
    }
    return [...list].sort((a, b) =>
      sort === "members"
        ? b.tier - a.tier || b.activeDealCount - a.activeDealCount || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name)
    )
  }, [items, q, sort])

  const shown = filtered.slice(0, limit)

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:top-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }}
              placeholder={labels.searchWithin}
              className="h-11 w-full rounded-full border bg-card pl-9 pr-4 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </label>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border bg-card p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSort("members")}
                className={`rounded-full px-3 py-1.5 ${sort === "members" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {labels.sortMembers}
              </button>
              <button
                type="button"
                onClick={() => setSort("az")}
                className={`rounded-full px-3 py-1.5 ${sort === "az" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {labels.sortAz}
              </button>
            </div>
            <span className="whitespace-nowrap text-xs text-muted-foreground">{labels.count(filtered.length)}</span>
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{labels.noMatch}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {shown.map((b) => (
            <li key={b.id}>
              <Link
                href={`/biz/${b.slug}`}
                className={`group flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  b.tier > 0 ? "border-primary/25" : ""
                }`}
              >
                <BusinessAvatar
                  logoUrl={b.logoUrl}
                  photoUrl={b.photoUrl}
                  name={b.name}
                  className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl"
                  icon={<Store className="h-6 w-6 text-primary/70" />}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-display text-base font-bold leading-tight">{b.name}</h3>
                    {b.openNow && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-success" title={labels.openNow} aria-label={labels.openNow} />}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{b.description ?? b.address ?? ""}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {b.tier > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{labels.member}</span>
                    )}
                    {b.activeDealCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                        <Tag className="h-3 w-3" />
                        {labels.deal(b.activeDealCount)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > shown.length && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-5 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-accent"
          >
            {labels.showMore} ({filtered.length - shown.length})
          </button>
        </div>
      )}
    </div>
  )
}
