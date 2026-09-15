import { Link } from "@/i18n/navigation"
import { Store, ArrowRight, Clock, Sparkles, Search } from "lucide-react"
import {
  getDirectoryBusinesses,
  getAllCategories,
  getSiteStats,
  getPartnerBusinesses,
} from "@/lib/queries"
import { isOpenNow, parseHours, DAY_KEYS } from "@/lib/hours"
import { FIND_TERMS } from "@/lib/find-terms"
import { SearchBar } from "@/components/search-bar"
import { AnimeReveal } from "@/components/anime-reveal"
import { BusinessAvatar } from "@/components/business-avatar"
import { getTranslations } from "next-intl/server"
import { categoryLabel } from "@/lib/category-label"
import type { Metadata } from "next"
import { pageAlternates } from "@/lib/seo"

// Members change photos, hours, and deals all day; regenerate at most every 10
// minutes, and business saves bust it immediately (lib/revalidate-business).
export const revalidate = 600

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("businesses.directory")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/businesses", params.locale),
  }
}

/** A face for every category tile. Slugs come from the categories table. */
const CATEGORY_EMOJI: Record<string, string> = {
  "food-drink": "🍽️", services: "🔧", retail: "🛍️", auto: "🚗", wineries: "🍷",
  "health-beauty": "💇", "real-estate": "🏠", entertainment: "🎉", construction: "🏗️", other: "✨",
}

/** Chips under the search: the words people actually search, each with its own page. */
const POPULAR_SLUGS = [
  "tacos", "pizza", "coffee", "mexican-food", "plumbing", "hair-and-barber", "auto-repair",
  "waxing", "wine-tasting", "football", "things-to-do-tonight", "pest-control", "notary",
]

/**
 * The directory hub. Sep 14 2026 (owner): "the categories don't go to their
 * proper listings… I don't like the big scrolling… make it easier and effective."
 * So: search first, ten category tiles that link to the real category pages,
 * three short rails (members, popular searches, open now), the CTA. Two phone
 * screens, no anchors, no long scroll. The listings live on /category/<slug>.
 */
export default async function BusinessesPage({ params }: { params: { locale: string } }) {
  const [allBusinesses, cats, stats, members, t, tc, tn, tHomes] = await Promise.all([
    getDirectoryBusinesses(params.locale),
    getAllCategories(),
    getSiteStats(),
    getPartnerBusinesses(params.locale),
    getTranslations("businesses.directory"),
    getTranslations("categoryLabels"),
    getTranslations("nav"),
    getTranslations("homes"),
  ])

  // Category tiles: count + three faces (members first, so member covers lead).
  const bySlug = new Map<string, typeof allBusinesses>()
  for (const b of allBusinesses) {
    if (!b.categorySlug) continue
    if (!bySlug.has(b.categorySlug)) bySlug.set(b.categorySlug, [])
    bySlug.get(b.categorySlug)!.push(b)
  }
  const tiles = cats
    .map((c) => ({ slug: c.slug, name: categoryLabel(tc, c.slug, c.name), items: bySlug.get(c.slug) ?? [] }))
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length)

  // Open now: only businesses whose hours are known and say open at this moment.
  const openNow = allBusinesses
    .filter((b) => {
      const hours = parseHours(b.hoursJson)
      const known = DAY_KEYS.some((k) => hours[k] !== null)
      return known && isOpenNow(hours)
    })
    .slice(0, 8)

  const popular = POPULAR_SLUGS.map((slug) => FIND_TERMS.find((f) => f.slug === slug)).filter(Boolean) as typeof FIND_TERMS
  const locale = params.locale === "es" ? "es" : "en"

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: tiles.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${process.env.AUTH_URL ?? "http://localhost:3000"}/category/${g.slug}`,
              name: g.name,
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />

      {/* ── Search-first header ─────────────────────────────────────── */}
      <section className="border-b bg-gradient-to-b from-primary/[0.06] to-transparent">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-8 sm:pb-8 sm:pt-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{t("headingGeo")}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("hubHeading")}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {t("hubSub", { businesses: stats.businesses, deals: stats.activeDeals })}
          </p>
          <div className="mt-5 max-w-2xl">
            <SearchBar size="lg" scrim />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.slice(0, 6).map((f) => (
              <Link
                key={f.slug}
                href={`/find/${f.slug}`}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Search className="h-3 w-3" />
                {f.title[locale]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category tiles → real category pages ─────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{t("tilesHeading")}</h2>
          <a href={`/api/surprise?locale=${params.locale}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {t("surpriseMe")}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((g, gi) => {
            const faces = g.items.slice(0, 3)
            return (
              <AnimeReveal key={g.slug} as="li" direction="up" delay={Math.min(gi, 9) * 35} duration={420}>
                <Link
                  href={`/category/${g.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl leading-none transition-transform duration-200 group-hover:scale-110" aria-hidden>
                      {CATEGORY_EMOJI[g.slug] ?? "📍"}
                    </span>
                    <span className="font-display text-lg font-bold text-primary/30">{g.items.length}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold leading-tight">{g.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {g.items.length} {g.items.length === 1 ? t("businessSingular") : t("businessPlural")}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {faces.map((b) => (
                        <BusinessAvatar
                          key={b.id}
                          logoUrl={b.logoUrl}
                          photoUrl={b.photoUrl}
                          name={b.name}
                          className="h-7 w-7 overflow-hidden rounded-full ring-2 ring-card"
                          icon={<Store className="h-3 w-3 text-primary/70" />}
                        />
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              </AnimeReveal>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {([["/map", tn("map")], ["/homes", tHomes("pill")], ["/hotels", tn("hotels")], ["/football", "Lompoc Football"]] as const).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Members rail ─────────────────────────────────────────────── */}
      {members.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{t("membersHeading")}</h2>
              <p className="text-sm text-muted-foreground">{t("membersSub")}</p>
            </div>
            <Link href="/partners" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
              {t("ctaListFree")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {members.map((b) => (
              <li key={b.id} className="w-40 flex-shrink-0 snap-start sm:w-auto">
                <Link href={`/biz/${b.slug}`} className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    <BusinessAvatar
                      logoUrl={null}
                      photoUrl={b.photoUrl ?? b.logoUrl}
                      name={b.name}
                      className="h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
                      icon={<Store className="h-6 w-6 text-primary/70" />}
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      {t("memberBadge")}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold leading-tight">{b.name}</p>
                    {b.categoryName && <p className="truncate text-xs text-muted-foreground">{b.categoryName}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Popular searches + Open now ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              <Sparkles className="mr-1.5 inline h-5 w-5 text-gold" />
              {t("popularHeading")}
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">{t("popularSub")}</p>
            <div className="flex flex-wrap gap-2">
              {popular.map((f) => (
                <Link
                  key={f.slug}
                  href={`/find/${f.slug}`}
                  className="inline-flex items-center rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  {f.title[locale]}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              <Clock className="mr-1.5 inline h-5 w-5 text-success" />
              {t("openNowHeading")}
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">{t("openNowSub")}</p>
            {openNow.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("openNowEmpty")}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {openNow.map((b) => (
                  <li key={b.id}>
                    <Link href={`/biz/${b.slug}`} className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 transition-colors hover:border-primary/40">
                      <BusinessAvatar
                        logoUrl={b.logoUrl}
                        photoUrl={b.photoUrl}
                        name={b.name}
                        className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg"
                        icon={<Store className="h-4 w-4 text-primary/70" />}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-tight">{b.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{b.categoryName}</p>
                      </div>
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-success" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-secondary/40 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{t("ctaHeading")}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("ctaBody")}</p>
          </div>
          <Link
            href="/partners"
            className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            {t("ctaListFree")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
