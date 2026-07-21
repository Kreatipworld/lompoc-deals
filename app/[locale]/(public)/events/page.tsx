import { and, eq, gte } from "drizzle-orm"
import { FeaturedDeals } from "@/components/featured-deals"
import { Calendar, MapPin, Rocket } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { pageAlternates } from "@/lib/seo"
import { PageHeader } from "@/components/page-header"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

// Events sync daily via cron — keep the page fresh without a redeploy
export const revalidate = 300

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

export async function generateMetadata() {
  const t = await getTranslations("eventsPage")
  return {
    // metaTitle carries the brand suffix — bypass the layout template
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: pageAlternates("/events"),
  }
}

type EventRow = typeof events.$inferSelect

async function getUpcoming(): Promise<EventRow[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "approved"), gte(events.startsAt, new Date())))
    .orderBy(events.startsAt)
    .limit(120)
}

/** Collapse recurring series (same title) to their next occurrence. */
function collapseRecurring(rows: EventRow[]): { event: EventRow; extra: number }[] {
  const seen = new Map<string, { event: EventRow; extra: number }>()
  for (const row of rows) {
    const existing = seen.get(row.title)
    if (existing) existing.extra++
    else seen.set(row.title, { event: row, extra: 0 })
  }
  return Array.from(seen.values())
}

function fmtDate(d: Date, locale: string) {
  return d.toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function EventsPage({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations("eventsPage")
  const all = await getUpcoming()
  const launches = all.filter((e) => e.source === "launch-library")
  const others = collapseRecurring(all.filter((e) => e.source !== "launch-library"))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: all.slice(0, 25).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/events/${e.id}`,
      name: e.title,
    })),
  }

  return (
    <>
    <PageHeader title={t("heading")} />
    <main className={`${PAGE_CONTAINER} py-10`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {launches.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t("launchesHeading")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("launchesSub")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {launches.slice(0, 6).map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
              >
                {ev.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.imageUrl}
                    alt={ev.title}
                    className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
                    <Rocket className="h-10 w-10 text-primary/60" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {fmtDate(ev.startsAt, params.locale)}
                  </p>
                  <p className="mt-1 line-clamp-2 font-medium">{ev.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {t("upcomingHeading")}
        </h2>
        {others.length === 0 ? (
          <p className="mt-4 text-muted-foreground">{t("noEvents")}</p>
        ) : (
          <ul className="mt-4 divide-y rounded-2xl border bg-card">
            {others.map(({ event: ev, extra }) => (
              <li key={ev.id}>
                <Link
                  href={`/events/${ev.id}`}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {fmtDate(ev.startsAt, params.locale)}
                      {extra > 0 && (
                        <span className="ml-2 normal-case text-muted-foreground">
                          {t("moreDates", { count: extra })}
                        </span>
                      )}
                    </p>
                    <p className="truncate font-medium">{ev.title}</p>
                    {ev.location && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {ev.location}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
    <FeaturedDeals />
    </>
  )
}
