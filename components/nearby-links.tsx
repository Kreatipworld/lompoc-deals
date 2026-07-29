import { Link } from "@/i18n/navigation"
import { MapPin, Compass, Tag } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import type { NearbyBusiness, NearbyActivity } from "@/lib/queries"

/**
 * Localized distance. Under a quarter mile, "a 5-min walk" reads better than "0.2 mi" —
 * and the phrasing differs enough between languages that the caller supplies both strings.
 */
export type DistanceLabels = { shortWalk: string; miles: (value: string) => string }

function distanceLabel(miles: number, labels: DistanceLabels): string {
  if (miles < 0.25) return labels.shortWalk
  return labels.miles(miles < 10 ? miles.toFixed(1) : String(Math.round(miles)))
}

/**
 * Businesses around a place. This is the link between the two halves of the site:
 * someone reading about a park leaves knowing where to eat next to it.
 */
export function NearbyBusinesses({
  businesses,
  heading,
  subheading,
  browseAllLabel,
  distanceLabels,
}: {
  businesses: NearbyBusiness[]
  heading: string
  subheading: string
  browseAllLabel: string
  distanceLabels: DistanceLabels
}) {
  if (!businesses.length) return null

  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="font-display text-xl font-bold tracking-tight">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {businesses.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/biz/${b.slug}`}
              className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-accent">
                {b.photoUrl && (
                  <SafeImage
                    src={b.photoUrl}
                    alt={b.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold leading-tight group-hover:text-primary">
                  {b.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {b.categoryName && <span>{b.categoryName}</span>}
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {distanceLabel(b.miles, distanceLabels)}
                  </span>
                  {b.activeDealCount > 0 && (
                    <span className="flex items-center gap-1 font-medium text-green">
                      <Tag className="h-3 w-3" />
                      {b.activeDealCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/businesses"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        {browseAllLabel} →
      </Link>
    </section>
  )
}

/** Other places to go, nearest first. Keeps people moving between place pages. */
export function NearbyPlaces({
  places,
  heading,
  distanceLabels,
}: {
  places: NearbyActivity[]
  heading: string
  distanceLabels: DistanceLabels
}) {
  if (!places.length) return null

  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="font-display text-xl font-bold tracking-tight">{heading}</h2>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {places.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/activities/${p.slug}`}
              className="group block overflow-hidden rounded-xl border transition-colors hover:bg-accent"
            >
              <div className="aspect-[4/3] w-full bg-accent">
                {p.imageUrl ? (
                  <SafeImage
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Compass className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-2 text-sm font-semibold leading-tight group-hover:text-primary">
                  {p.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {distanceLabel(p.miles, distanceLabels)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
