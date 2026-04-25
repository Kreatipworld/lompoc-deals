import { Link } from "@/i18n/navigation"
import { Calendar, MapPin, Tag } from "lucide-react"
import type { FeedDisplayItem } from "@/lib/feed-queries"

function formatPrice(cents: number | null): string | null {
  if (cents === null) return null
  if (cents === 0) return "Free"
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function formatEventDate(d: Date | null): string | null {
  if (!d) return null
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function typeLabel(type: FeedDisplayItem["type"]): string {
  if (type === "for_sale") return "For sale"
  if (type === "info") return "Info"
  return "Event"
}

export function FeedCard({ item }: { item: FeedDisplayItem }) {
  const priceStr = formatPrice(item.priceCents)
  const eventStr = item.source === "event" ? formatEventDate(item.startsAt) : null

  return (
    <Link
      href={item.href}
      className="group relative block overflow-hidden rounded-2xl border bg-card shadow-sm transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-lg"
    >
      {item.isNew && (
        <span className="animate-feed-new-pulse absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
          New
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
        </div>
      ) : null}

      <div className="p-4">
        <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          {item.type === "event" && <Calendar className="h-3 w-3" />}
          {item.type === "for_sale" && <Tag className="h-3 w-3" />}
          {typeLabel(item.type)}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          {item.title}
        </h3>
        {!item.imageUrl && priceStr && (
          <p className="mt-1 text-sm font-bold text-primary">{priceStr}</p>
        )}
        {item.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
        {eventStr && (
          <p className="mt-2 text-xs font-medium text-foreground">{eventStr}</p>
        )}
        {item.address && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.address}
          </p>
        )}
      </div>
    </Link>
  )
}
