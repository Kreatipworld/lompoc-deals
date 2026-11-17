import { Link } from "@/i18n/navigation"
import { ArrowRight, Clock, MapPin, Store } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { routeMapUrl, streetOnly, todayHoursLine, type RouteStop } from "@/lib/find-route"

export type RouteStopItem = {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  member: boolean
  details: RouteStop | undefined
}

export type RouteLabels = {
  stops: string
  mapAlt: string
  mapCredit: string
  today: (hours: string) => string
  closedToday: string
  hoursUnknown: string
  memberBadge: string
  questionHeading: string
  questionBody: string
}

/**
 * The stops of a Route page, numbered in driving order, each with today's hours — the same
 * facts the Route video reads out, kept current from the listing (hours sync monthly).
 * Members get the gold pin on the map and the Member badge, same as everywhere else.
 */
export function RouteStops({ items, labels }: { items: RouteStopItem[]; labels: RouteLabels }) {
  const map = routeMapUrl(items.map((s) => ({ lat: s.details?.lat ?? null, lng: s.details?.lng ?? null, member: s.member })))
  return (
    <section className="mt-6">
      {map && (
        <figure className="overflow-hidden rounded-2xl border bg-muted">
          {/* Mapbox Static Images: one cached request, no map JS on an ISR page. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={map} alt={labels.mapAlt} width={1200} height={640} className="block aspect-[15/8] h-auto w-full object-cover" loading="lazy" decoding="async" />
          <figcaption className="px-3 py-1.5 text-[11px] text-muted-foreground">{labels.mapCredit}</figcaption>
        </figure>
      )}

      <p className="mt-6 text-sm text-muted-foreground">{labels.stops}</p>
      <ol className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((s, i) => {
          const street = streetOnly(s.details?.address ?? null)
          const today = todayHoursLine(s.details?.hoursJson, labels.closedToday)
          return (
            <li key={s.id}>
              <Link
                href={`/biz/${s.slug}`}
                className={`group flex h-full items-start gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${s.member ? "border-primary/30 ring-1 ring-primary/10" : ""}`}
              >
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${s.member ? "bg-[#EFC618] text-[#3a0743]" : "bg-primary text-primary-foreground"}`}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                  <SafeImage
                    src={s.logoUrl ?? undefined}
                    alt={s.name}
                    className="h-full w-full object-cover"
                    fallback={<div className="flex h-full w-full items-center justify-center"><Store className="h-5 w-5 text-muted-foreground/50" /></div>}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold leading-tight group-hover:text-primary">{s.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {s.member && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{labels.memberBadge}</span>}
                    {street && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{street}</span>}
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{today ? (today === labels.closedToday ? today : labels.today(today)) : labels.hoursUnknown}</span>
                  </div>
                  {s.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-primary" />
              </Link>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="font-display text-lg font-bold">{labels.questionHeading}</p>
        <p className="mt-1 text-sm text-muted-foreground">{labels.questionBody}</p>
      </div>
    </section>
  )
}
