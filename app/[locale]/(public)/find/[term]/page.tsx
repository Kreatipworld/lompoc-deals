import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { ArrowRight, Store, CalendarDays, MapPin, Tag } from "lucide-react"
import { and, eq, gte, lte } from "drizzle-orm"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { FIND_TERMS, findTermBySlug } from "@/lib/find-terms"
import { searchAll } from "@/lib/search"
import { memberTiers } from "@/lib/member-tier"
import { getActiveDeals } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { pageAlternates, seoDescription, seoTitle, siteUrl } from "@/lib/seo"
import { categoryLabel } from "@/lib/category-label"
import { SearchBar } from "@/components/search-bar"
import { SafeImage } from "@/components/safe-image"
import { DealGrid } from "@/components/deal-card"

/**
 * /find/<term> — a curated landing page for a word people search for. Same
 * matcher as /search, members first, our own intro. Indexable, in the sitemap,
 * bilingual. Unknown terms 404 (no loading.tsx here — soft-404 trap).
 */
export const revalidate = 600
export const dynamicParams = true

export function generateStaticParams() {
  return FIND_TERMS.map((t) => ({ term: t.slug }))
}

type Params = { locale: string; term: string }

function loc(locale: string): "en" | "es" {
  return locale === "es" ? "es" : "en"
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, term } = await params
  const t = findTermBySlug(term)
  if (!t) return {}
  const l = loc(locale)
  return {
    title: seoTitle(t.title[l]),
    description: seoDescription(t.intro[l], ""),
    alternates: pageAlternates(`/find/${t.slug}`, locale),
    openGraph: { title: t.title[l], description: seoDescription(t.intro[l], "", 200), locale: l === "es" ? "es_US" : "en_US" },
  }
}

export default async function FindTermPage({ params }: { params: Promise<Params> }) {
  const { locale, term } = await params
  const t = findTermBySlug(term)
  if (!t) notFound()
  const l = loc(locale)
  const [tf, tc, viewer] = await Promise.all([
    getTranslations({ locale, namespace: "find" }),
    getTranslations({ locale, namespace: "categoryLabels" }),
    getViewer(),
  ])

  if (t.kind === "events") {
    const now = new Date()
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const rows = await db
      .select({ id: events.id, title: events.title, titleEs: events.titleEs, location: events.location, startsAt: events.startsAt, category: events.category })
      .from(events)
      .where(and(eq(events.status, "approved"), gte(events.startsAt, new Date(now.getTime() - 6 * 60 * 60 * 1000)), lte(events.startsAt, week)))
      .orderBy(events.startsAt)
      .limit(24)
    const seen = new Set<string>()
    const list = rows.filter((r) => (seen.has(r.title) ? false : (seen.add(r.title), true)))
    const fmt = new Intl.DateTimeFormat(l === "es" ? "es-US" : "en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Header t={t} l={l} eyebrow={tf("eyebrow")} />
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/this-week" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <CalendarDays className="h-4 w-4" />
            {tf("thisWeekCta")}
          </Link>
          <Link href="/events" className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
            {tf("allEventsCta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ev) => (
            <li key={ev.id}>
              <Link href={`/events/${ev.id}`} className="group flex h-full flex-col gap-1 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{fmt.format(ev.startsAt)}</p>
                <p className="font-display text-lg font-bold leading-tight group-hover:text-primary">{l === "es" && ev.titleEs ? ev.titleEs : ev.title}</p>
                {ev.location && (
                  <p className="mt-auto flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />{ev.location}</p>
                )}
              </Link>
            </li>
          ))}
          {list.length === 0 && <li className="text-sm text-muted-foreground">{tf("noEvents")}</li>}
        </ul>
        <MoreTerms current={t.slug} l={l} heading={tf("moreHeading")} />
      </main>
    )
  }

  const results = await searchAll(t.query, l)
  const tiers = await memberTiers(results.businesses.map((b) => b.id))
  const businesses = [...results.businesses].sort((a, b) => (tiers.get(b.id) ?? 0) - (tiers.get(a.id) ?? 0))
  const ids = new Set(businesses.map((b) => b.id))
  const deals = (await getActiveDeals(200, l)).filter((d) => ids.has(d.business.id)).slice(0, 6)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t.title[l],
    itemListElement: businesses.slice(0, 25).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}${l === "es" ? "/es" : ""}/biz/${b.slug}`,
      name: b.name,
    })),
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Header t={t} l={l} eyebrow={tf("eyebrow")} />

      <p className="mt-6 text-sm text-muted-foreground">
        {tf("count", { count: businesses.length })}
        {t.category && (
          <>
            {" · "}
            <Link href={`/category/${t.category}`} className="font-semibold text-primary hover:underline">
              {tf("browseCategory")}
            </Link>
          </>
        )}
      </p>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => {
          const member = (tiers.get(b.id) ?? 0) > 0
          return (
            <li key={b.id}>
              <Link
                href={`/biz/${b.slug}`}
                className={`group flex h-full items-start gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${member ? "border-primary/30 ring-1 ring-primary/10" : ""}`}
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                  <SafeImage
                    src={b.logoUrl ?? undefined}
                    alt={b.name}
                    className="h-full w-full object-cover"
                    fallback={<div className="flex h-full w-full items-center justify-center"><Store className="h-5 w-5 text-muted-foreground/50" /></div>}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold leading-tight group-hover:text-primary">{b.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {member && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{tf("memberBadge")}</span>}
                    {b.categoryName && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{categoryLabel(tc, b.categorySlug, b.categoryName)}</span>
                    )}
                  </div>
                  {b.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>}
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-primary" />
              </Link>
            </li>
          )
        })}
        {businesses.length === 0 && <li className="text-sm text-muted-foreground">{tf("noResults")}</li>}
      </ul>

      {deals.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><Tag className="h-4 w-4 text-primary" />{tf("dealsHeading")}</h2>
          <DealGrid deals={deals} viewer={viewer} fromPath={`/find/${t.slug}`} variant="tripadvisor" />
        </section>
      )}

      <section className="mt-10 rounded-2xl border bg-secondary/30 p-5">
        <p className="mb-3 font-semibold">{tf("searchElse")}</p>
        <div className="max-w-md"><SearchBar size="lg" /></div>
      </section>

      <MoreTerms current={t.slug} l={l} heading={tf("moreHeading")} />
    </main>
  )
}

function Header({ t, l, eyebrow }: { t: NonNullable<ReturnType<typeof findTermBySlug>>; l: "en" | "es"; eyebrow: string }) {
  return (
    <header>
      <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        <MapPin className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.title[l]}</h1>
      <p className="mt-3 max-w-3xl text-base text-muted-foreground">{t.intro[l]}</p>
    </header>
  )
}

function MoreTerms({ current, l, heading }: { current: string; l: "en" | "es"; heading: string }) {
  return (
    <section className="mt-10 border-t pt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</p>
      <div className="flex flex-wrap gap-2">
        {FIND_TERMS.filter((x) => x.slug !== current).map((x) => (
          <Link key={x.slug} href={`/find/${x.slug}`} className="rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary">
            {x.title[l]}
          </Link>
        ))}
      </div>
    </section>
  )
}
