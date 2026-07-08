"use client"

import { Link } from "@/i18n/navigation"
import { Calendar, MapPin, Newspaper, PartyPopper, Tag, Ticket } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"
import { isThisWeekend } from "@/lib/feed-interleave"
import { neighborhoodLabel } from "@/lib/neighborhoods"

function formatPrice(cents: number | null, freeLabel: string): string | null {
  if (cents === null) return null
  if (cents === 0) return freeLabel
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(d: Date | null, withTime: boolean): string | null {
  if (!d) return null
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  })
}

const TYPE_META: Record<
  FeedDisplayItem["type"],
  { labelKey: string; icon: typeof Tag; accent: string }
> = {
  for_sale: { labelKey: "forSale", icon: Tag, accent: "text-primary" },
  garage_sale: { labelKey: "garageSale", icon: Tag, accent: "text-gold-foreground" },
  info: { labelKey: "info", icon: Newspaper, accent: "text-primary" },
  event: { labelKey: "event", icon: Calendar, accent: "text-primary" },
  deal: { labelKey: "deal", icon: Ticket, accent: "text-primary" },
  new_business: { labelKey: "newInTown", icon: PartyPopper, accent: "text-success" },
  blog: { labelKey: "fromTheBlog", icon: Newspaper, accent: "text-muted-foreground" },
}

export function FeedCard({ item }: { item: FeedDisplayItem }) {
  const t = useTranslations("feedCard")
  const locale = useLocale()
  const meta = TYPE_META[item.type]
  const Icon = meta.icon

  const priceStr = formatPrice(item.priceCents, t("free"))
  const dateStr =
    item.type === "garage_sale"
      ? formatDate(item.saleStartsAt, false)
      : item.source === "event"
        ? formatDate(item.startsAt, true)
        : null
  const weekend =
    item.type === "garage_sale" &&
    isThisWeekend(item.saleStartsAt, item.saleEndsAt, new Date())

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={item.href} className="absolute inset-0 z-[1]" aria-label={item.title} />

      {item.isNew && (
        <span className="animate-feed-new-pulse absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
          {t("new")}
        </span>
      )}
      {weekend && (
        <span className="absolute right-0 top-4 z-10 rounded-l-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
          {t("thisWeekend")}
        </span>
      )}

      {item.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.06]"
            loading="lazy"
          />
          {priceStr && (
            <span className="absolute right-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-sm font-bold text-foreground shadow-sm backdrop-blur-sm">
              {priceStr}
            </span>
          )}
          {item.badgeText && (
            <span className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm">
              {item.badgeText}
            </span>
          )}
        </div>
      ) : null}

      <div className="p-4">
        <div className={`mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${meta.accent}`}>
          <Icon className="h-3 w-3" />
          {t(meta.labelKey)}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          {item.title}
        </h3>
        {item.source === "deal" && item.businessName && (
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {t("at", { name: item.businessName })}
          </p>
        )}
        {!item.imageUrl && priceStr && (
          <p className="mt-1 text-sm font-bold text-primary">{priceStr}</p>
        )}
        {!item.imageUrl && item.badgeText && (
          <p className="mt-1 text-sm font-bold text-primary">{item.badgeText}</p>
        )}
        {item.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
        {dateStr && (
          <p className="mt-2 text-xs font-medium text-foreground">{dateStr}</p>
        )}
        {(item.address || item.neighborhood) && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.neighborhood ? neighborhoodLabel(item.neighborhood, locale) : item.address}
          </p>
        )}
      </div>
    </div>
  )
}
