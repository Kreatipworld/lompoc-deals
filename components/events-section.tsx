import Image from "next/image"
import { getUpcomingEvents } from "@/lib/queries"
import { Link } from "@/i18n/navigation"
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Landmark,
  Utensils,
  Music,
  Users,
  ShoppingBag,
  Trophy,
  Store,
  Tag,
} from "lucide-react"
import { getTranslations } from "next-intl/server"

// ─── Category icon mapping (labels come from translations) ────────────────────

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  community: Users,
  "business-launch": Store,
  festival: Music,
  arts: Landmark,
  food: Utensils,
  sports: Trophy,
  market: ShoppingBag,
  other: Tag,
}

function categoryIcon(cat: string) {
  return CATEGORY_ICON[cat] ?? CATEGORY_ICON.other
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatEventDate(startsAt: Date, endsAt: Date | null) {
  const start = startsAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  })
  const time = startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  })

  if (!endsAt) return `${start} · ${time}`

  const endDay = endsAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  })
  const endTime = endsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  })

  if (start === endDay) return `${start} · ${time} – ${endTime}`
  return `${start} – ${endDay}`
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  label,
}: {
  event: Awaited<ReturnType<typeof getUpcomingEvents>>[number]
  label: string
}) {
  const Icon = categoryIcon(event.category)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
      {/* Image or placeholder */}
      {event.imageUrl ? (
        <div className="relative h-36 overflow-hidden bg-muted">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/10 to-accent">
          <Icon className="h-10 w-10 text-primary/40" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category badge */}
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {label}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {event.title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{formatEventDate(event.startsAt, event.endsAt)}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {event.description}
          </p>
        )}

        {/* Business link */}
        {event.business && (
          <div className="mt-auto pt-2">
            <Link
              href={`/businesses/${event.business.slug}`}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              {event.business.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyEvents({ noEvents, submitLabel }: { noEvents: string; submitLabel: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
      <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        {noEvents}
      </p>
      <Link
        href="/submit-event"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {submitLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// ─── Main section (Server Component) ─────────────────────────────────────────

export async function EventsSection() {
  const t = await getTranslations("eventsSection")

  const CATEGORY_LABEL: Record<string, string> = {
    community: t("community"),
    "business-launch": t("businessLaunch"),
    festival: t("festival"),
    arts: t("arts"),
    food: t("food"),
    sports: t("sports"),
    market: t("market"),
    other: t("event"),
  }

  let evts: Awaited<ReturnType<typeof getUpcomingEvents>> = []
  try {
    evts = await getUpcomingEvents(undefined, 8)
  } catch {
    // If DB is unavailable, skip gracefully
    return null
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {t("heading")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/submit-event"
          className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          {t("submitEvent")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {evts.length > 0 ? (
          evts.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              label={CATEGORY_LABEL[e.category] ?? CATEGORY_LABEL.other}
            />
          ))
        ) : (
          <EmptyEvents noEvents={t("noEvents")} submitLabel={t("submitEvent")} />
        )}
      </div>
    </section>
  )
}
