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

// ─── Category labels & icons ──────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  community: { label: "Community", Icon: Users },
  "business-launch": { label: "Business Launch", Icon: Store },
  festival: { label: "Festival", Icon: Music },
  arts: { label: "Arts", Icon: Landmark },
  food: { label: "Food", Icon: Utensils },
  sports: { label: "Sports", Icon: Trophy },
  market: { label: "Market", Icon: ShoppingBag },
  other: { label: "Event", Icon: Tag },
}

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? CATEGORY_META.other
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
}: {
  event: Awaited<ReturnType<typeof getUpcomingEvents>>[number]
}) {
  const { label, Icon } = categoryMeta(event.category)

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

function EmptyEvents() {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
      <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        No upcoming events yet — check back soon!
      </p>
      <Link
        href="/submit-event"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Submit an event
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// ─── Main section (Server Component) ─────────────────────────────────────────

export async function EventsSection() {
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
            Upcoming events
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What&apos;s happening in Lompoc
          </p>
        </div>
        <Link
          href="/submit-event"
          className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          Submit an event
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {evts.length > 0 ? (
          evts.map((e) => <EventCard key={e.id} event={e} />)
        ) : (
          <EmptyEvents />
        )}
      </div>
    </section>
  )
}
