import { Link } from "@/i18n/navigation"
import {
  Store,
  MapPin,
  Phone,
  Globe,
  ArrowRight,
  Tag,
  Flame,
  ArrowUpRight,
} from "lucide-react"
import {
  getDirectoryBusinesses,
  getAllCategories,
  getSiteStats,
} from "@/lib/queries"
import { filterOpenNow } from "@/lib/hours"
import { SearchBar } from "@/components/search-bar"
import { AnimeReveal } from "@/components/anime-reveal"
import { BusinessAvatar } from "@/components/business-avatar"
import { TiltCard } from "@/components/motion/tilt-card"
import { PageHeader } from "@/components/page-header"
import { DirectoryRail } from "@/components/directory/directory-rail"
import { BackToTop } from "@/components/back-to-top"
import { getTranslations } from "next-intl/server"
import { categoryLabel } from "@/lib/category-label"
import type { Metadata } from "next"
import { pageAlternates } from "@/lib/seo"

// Members change photos, hours, and deals all day; a page built once at deploy
// time showed stale cards for weeks. Regenerate at most every 10 minutes, and
// business saves bust it immediately (lib/revalidate-business).
export const revalidate = 600

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("businesses.directory")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/businesses", params.locale),
  }
}

/**
 * How many businesses each category shows before deferring to its own page.
 *
 * This page used to render all 472 listings at once: 11,781 words and a 3.45s response, the
 * slowest and heaviest page on the site by some margin (the median elsewhere is 355ms). Every
 * category already links to /category/<slug>, which lists the whole set and is in the sitemap, so
 * the full dump bought nothing but weight — and it would only get worse as listings are added.
 */
const PREVIEW_PER_CATEGORY = 6

/** A face for every category tile. Slugs come from the categories table. */
const CATEGORY_EMOJI: Record<string, string> = {
  "food-drink": "🍽️", services: "🔧", retail: "🛍️", auto: "🚗", wineries: "🍷",
  "health-beauty": "💇", "real-estate": "🏠", entertainment: "🎉", dispensaries: "🌿", other: "✨",
}

export default async function BusinessesPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams?: { open?: string }
}) {
  const [allBusinesses, cats, stats, t, tc, tu, tn] = await Promise.all([
    getDirectoryBusinesses(params.locale),
    getAllCategories(),
    getSiteStats(),
    getTranslations("businesses.directory"),
    getTranslations("categoryLabels"),
    getTranslations("hoursUi"),
    getTranslations("nav"),
  ])

  const openNow = searchParams?.open === "1"
  const businesses = openNow ? filterOpenNow(allBusinesses) : allBusinesses

  const grouped = new Map<
    string,
    { id: number; name: string; slug: string; items: typeof businesses }
  >()
  for (const c of cats) {
    grouped.set(c.slug, { id: c.id, name: categoryLabel(tc, c.slug, c.name), slug: c.slug, items: [] })
  }
  for (const b of businesses) {
    if (b.categorySlug && grouped.has(b.categorySlug)) {
      grouped.get(b.categorySlug)!.items.push(b)
    }
  }

  const populatedCategories = Array.from(grouped.values()).filter(
    (g) => g.items.length > 0
  )

  // Within every category, surface the businesses running active deals first —
  // active (often paying) businesses earn the top of their section.
  for (const g of populatedCategories) {
    g.items.sort(
      (a, b) => b.activeDealCount - a.activeDealCount || a.name.localeCompare(b.name)
    )
  }

  // Sort category sections so the busiest neighborhoods lead, biggest first.
  populatedCategories.sort((a, b) => b.items.length - a.items.length)

  // Members first inside every category (Growth/Plus), then the busiest, then A–Z.
  for (const g of populatedCategories) {
    g.items.sort((a, b) => b.tier - a.tier || b.activeDealCount - a.activeDealCount || a.name.localeCompare(b.name))
  }

  // "Most active" highlight strip — the businesses with the most live deals.
  const mostActive = [...businesses]
    .filter((b) => b.activeDealCount > 0)
    .sort(
      (a, b) => b.activeDealCount - a.activeDealCount || a.name.localeCompare(b.name)
    )
    .slice(0, 6)

  const dealLabel = (n: number) =>
    `${n} ${n === 1 ? t("dealSingular") : t("dealPlural")}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: businesses.slice(0, 25).map((b, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${process.env.AUTH_URL ?? "http://localhost:3000"}/biz/${b.slug}`,
              name: b.name,
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title={t("headingGeo")}
        meta={
          <>
            {t("statBarBusinesses", { count: stats.businesses })}
            {" · "}
            {t("statBarActiveDeals", { count: stats.activeDeals })}
          </>
        }
      >
        <div className="w-full flex-shrink-0 sm:w-80">
          <SearchBar size="lg" scrim />
        </div>
      </PageHeader>

      {/* ═══════════════════════════════════════════════════
          CATEGORY TILES — the front door: pick a category, see faces
         ═══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <AnimeReveal direction="up" duration={520}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{t("tilesHeading")}</h2>
            <a href={`/api/surprise?locale=${params.locale}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("surpriseMe")}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </AnimeReveal>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {populatedCategories.map((g, gi) => {
            const dealCount = g.items.reduce((n, b) => n + b.activeDealCount, 0)
            const faces = g.items.slice(0, 3)
            return (
              <AnimeReveal key={g.slug} as="li" direction="up" delay={Math.min(gi, 9) * 40} duration={480}>
                <a
                  href={`#${g.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
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
                      {dealCount > 0 ? (
                        <span className="font-semibold text-success">{dealLabel(dealCount)}</span>
                      ) : (
                        `${g.items.length} ${g.items.length === 1 ? t("businessSingular") : t("businessPlural")}`
                      )}
                    </p>
                  </div>
                  <div className="mt-auto flex -space-x-2">
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
                </a>
              </AnimeReveal>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {([["/map", tn("map")], ["/hotels", tn("hotels")], ["/feed", tn("neighborhood")]] as const).map(([href, label]) => (
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

      {/* ═══════════════════════════════════════════════════
          STICKY RAIL — follows the reader, one tap to any section
         ═══════════════════════════════════════════════════ */}
      <div className="mt-6 sm:mt-8">
        <DirectoryRail
          sections={populatedCategories.map((g) => ({ id: g.slug, label: g.name, count: g.items.length }))}
          hasMostActive={mostActive.length > 0}
          mostActiveLabel={tu("mostActive")}
          openNow={openNow}
          openNowLabel={t("openNowFilter")}
          surpriseLabel={t("surpriseMe")}
          surpriseHref={`/api/surprise?locale=${params.locale}`}
        />
      </div>
      <BackToTop />

      {/* ═══════════════════════════════════════════════════
          MOST ACTIVE — featured strip of deal-heavy businesses
         ═══════════════════════════════════════════════════ */}
      {mostActive.length > 0 && (
        <section id="most-active" className="scroll-mt-32 border-b bg-gradient-to-b from-gold/[0.06] to-transparent">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
            <AnimeReveal direction="up" duration={560}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  {/* Eyebrow + subtitle collapse on mobile so this reads as one
                      line before the business strip; unchanged at sm: and up. */}
                  <div className="hidden items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-foreground sm:inline-flex">
                    <Flame className="h-3.5 w-3.5" />
                    {tu("mostActive")}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {tu("mostActiveHeading")}
                  </h2>
                  <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                    {tu("mostActiveSub")}
                  </p>
                </div>
                <Link
                  href="/deals"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {t("ctaBrowseDeals")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </AnimeReveal>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mostActive.map((b, bi) => (
                <AnimeReveal key={b.id} as="li" direction="up" delay={bi * 50} duration={520}>
                  <TiltCard className="h-full rounded-2xl">
                  <Link
                    href={`/biz/${b.slug}`}
                    className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-gold/40 bg-card p-4 shadow-sm ring-1 ring-gold/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      aria-hidden
                      className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-xl transition-opacity group-hover:opacity-80"
                    />
                    <BusinessAvatar
                      logoUrl={b.logoUrl}
                      photoUrl={b.photoUrl}
                      name={b.name}
                      className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl"
                      icon={<Store className="h-6 w-6 text-primary/70" />}
                    />
                    <div className="relative min-w-0 flex-1">
                      <h3 className="truncate font-display text-lg font-bold leading-tight tracking-tight">
                        {b.name}
                      </h3>
                      {b.categoryName && (
                        <p className="truncate text-xs text-muted-foreground">{b.categoryName}</p>
                      )}
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-gold-foreground">
                        <Tag className="h-3 w-3" />
                        {dealLabel(b.activeDealCount)}
                      </span>
                    </div>
                    <ArrowUpRight className="relative h-4 w-4 flex-shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                  </TiltCard>
                </AnimeReveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          DIRECTORY LISTINGS — grouped by category
         ═══════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-8 sm:py-10">
        <p className="text-sm text-muted-foreground">
          {businesses.length} {businesses.length === 1 ? t("businessSingular") : t("businessPlural")}
        </p>

        {populatedCategories.map((g) => {
          const dealCount = g.items.filter((b) => b.activeDealCount > 0).length
          return (
            <section key={g.slug} id={g.slug} className="scroll-mt-32">
              <AnimeReveal direction="up" delay={0} duration={560}>
                <div className="mb-6 flex items-end justify-between gap-4 border-b pb-3">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      {g.name}
                    </h2>
                    <span className="font-display text-lg font-bold text-primary/30">
                      {g.items.length}
                    </span>
                    {dealCount > 0 && (
                      <span className="hidden items-center gap-1 text-xs font-semibold text-success sm:inline-flex">
                        <Tag className="h-3 w-3" />
                        {dealCount} {dealCount === 1 ? tu("withDealOne") : tu("withDealMany")}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/category/${g.slug}`}
                    className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {t("seeAll")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </AnimeReveal>

              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.slice(0, PREVIEW_PER_CATEGORY).map((b, bi) => {
                  const hasDeals = b.activeDealCount > 0
                  return (
                    <AnimeReveal
                      key={b.id}
                      as="li"
                      direction="up"
                      delay={Math.min(bi, 8) * 45}
                      duration={520}
                    >
                      <TiltCard className="h-full rounded-2xl">
                      <Link
                        href={`/biz/${b.slug}`}
                        className={`group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                          hasDeals ? "border-gold/40 ring-1 ring-gold/15 hover:border-gold/60" : "hover:border-primary/30"
                        }`}
                      >
                        {hasDeals && (
                          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-gold-foreground shadow-sm">
                            <Tag className="h-3 w-3" />
                            {dealLabel(b.activeDealCount)}
                          </span>
                        )}

                        <div className="flex items-start gap-3">
                          <BusinessAvatar
                            logoUrl={b.logoUrl}
                            photoUrl={b.photoUrl}
                            name={b.name}
                            className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-105"
                            icon={<Store className="h-6 w-6 text-primary/70" />}
                          />
                          <div className={`flex-1 overflow-hidden ${hasDeals ? "pr-16" : ""}`}>
                            <h3 className="font-display text-lg font-bold leading-tight tracking-tight line-clamp-2">
                              {b.name}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {b.tier > 0 && (
                                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                                  {t("memberBadge")}
                                </span>
                              )}
                              {b.categoryName && (
                                <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  {b.categoryName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {b.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {b.description}
                          </p>
                        )}

                        <div className="mt-auto space-y-1 text-xs text-muted-foreground">
                          {b.address && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary/60" />
                              <span className="truncate">{b.address}</span>
                            </div>
                          )}
                          {b.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 flex-shrink-0 text-primary/60" />
                              {b.phone}
                            </div>
                          )}
                          {b.website && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3 w-3 flex-shrink-0 text-primary/60" />
                              <span className="truncate">
                                {b.website.replace(/^https?:\/\//, "")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end border-t pt-3 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          {t("viewProfile")}
                          <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                      </TiltCard>
                    </AnimeReveal>
                  )
                })}
              </ul>

              {g.items.length > PREVIEW_PER_CATEGORY && (
                <div className="mt-5 flex justify-center">
                  <Link
                    href={`/category/${g.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    {t("seeAll")} {g.items.length} {g.name}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM CTA — List your business
         ═══════════════════════════════════════════════════ */}
      <section className="border-t bg-secondary/30">
        <AnimeReveal direction="up" delay={0} duration={600}>
          <div className="mx-auto max-w-6xl px-4 py-8 text-center sm:py-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("ctaHeading")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              {t("ctaBody")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/partners"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.97]"
              >
                {t("ctaListFree")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
                className="inline-flex h-12 items-center gap-2 rounded-full border bg-background px-7 text-base font-semibold transition-colors hover:bg-accent"
              >
                <Tag className="h-4 w-4" />
                {t("ctaBrowseDeals")}
              </Link>
            </div>
          </div>
        </AnimeReveal>
      </section>
    </>
  )
}
