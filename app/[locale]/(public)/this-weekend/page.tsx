import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { and, eq, gte, lt } from "drizzle-orm"
import { ArrowRight, MapPin } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { pageAlternates, siteUrl } from "@/lib/seo"
import { weekendLabel, weekendWindow } from "@/lib/weekend"

/**
 * /this-weekend — "things to do in Lompoc this weekend", with the dates in the
 * title (Oct 17 2026 SEO batch: "lompoc events" searches landed on generic pages at
 * ~#42). ISR hourly, so the dates roll over on their own each Monday.
 */
export const revalidate = 3600

type Params = { locale: string }

function loc(locale: string): "en" | "es" {
  return locale === "es" ? "es" : "en"
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "thisWeekend" })
  const dates = weekendLabel(new Date(), loc(params.locale))
  return {
    title: t("metaTitle", { dates }),
    description: t("metaDescription", { dates }),
    alternates: pageAlternates("/this-weekend", params.locale),
  }
}

export default async function ThisWeekendPage({ params }: { params: Params }) {
  setRequestLocale(params.locale)
  const l = loc(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "thisWeekend" })
  const now = new Date()
  const { start, end } = weekendWindow(now)
  const dates = weekendLabel(now, l)

  const rows = await db
    .select({ id: events.id, title: events.title, titleEs: events.titleEs, location: events.location, startsAt: events.startsAt })
    .from(events)
    .where(and(eq(events.status, "approved"), gte(events.startsAt, start), lt(events.startsAt, end)))
    .orderBy(events.startsAt)
    .limit(60)
    .catch(() => [])
  // Recurring feeds post one row per occurrence; one card per title + day is enough.
  const dayKey = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" })
  const seen = new Set<string>()
  const list = rows.filter((r) => {
    const k = `${r.title}|${dayKey(r.startsAt)}`
    return seen.has(k) ? false : (seen.add(k), true)
  })

  const fmt = new Intl.DateTimeFormat(l === "es" ? "es-US" : "en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("metaTitle", { dates }),
    itemListElement: list.slice(0, 25).map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}${l === "es" ? "/es" : ""}/events/${ev.id}`,
      name: l === "es" && ev.titleEs ? ev.titleEs : ev.title,
    })),
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("h1")}</h1>
        <p className="mt-1 text-sm font-semibold text-primary">{t("sub", { dates, count: list.length })}</p>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">{t("intro")}</p>
      </header>

      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((ev) => (
          <li key={ev.id}>
            <Link href={`/events/${ev.id}`} className="group flex h-full flex-col gap-1 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{fmt.format(ev.startsAt)}</p>
              <p className="font-display text-lg font-bold leading-tight group-hover:text-primary">{l === "es" && ev.titleEs ? ev.titleEs : ev.title}</p>
              {ev.location && (
                <p className="mt-auto flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  {ev.location}
                </p>
              )}
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="text-sm text-muted-foreground">{t("empty")}</li>}
      </ul>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/events" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {t("allEvents")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link href="/this-week" className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
          {t("thisWeek")}
        </Link>
      </div>
    </main>
  )
}
