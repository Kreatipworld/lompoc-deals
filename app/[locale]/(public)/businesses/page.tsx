import { Link } from "@/i18n/navigation"
import {
  Store,
  MapPin,
  Phone,
  Globe,
  ArrowRight,
  Tag,
  Sparkles,
  TrendingUp,
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
import { AnimatedCounter } from "@/components/animated-counter"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("businesses.directory")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams?: { open?: string }
}) {
  const [allBusinesses, cats, stats, t] = await Promise.all([
    getDirectoryBusinesses(),
    getAllCategories(),
    getSiteStats(),
    getTranslations("businesses.directory"),
  ])

  const openNow = searchParams?.open === "1"
  const businesses = openNow ? filterOpenNow(allBusinesses) : allBusinesses

  const grouped = new Map<
    string,
    { id: number; name: string; slug: string; items: typeof businesses }
  >()
  for (const c of cats) {
    grouped.set(c.slug, { id: c.id, name: c.name, slug: c.slug, items: [] })
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
      {/* ═══════════════════════════════════════════════════
          HERO — Full-bleed editorial with animated headline
         ═══════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden">
        {/* Deep gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-br from-[hsl(273_33%_12%)] via-[hsl(270_26%_10%)] to-[hsl(273_33%_8%)]"
        />

        {/* Radial glow — primary purple */}
        <div
          aria-hidden
          className="absolute -left-48 top-0 -z-10 h-[700px] w-[700px] rounded-full bg-primary/25 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute -right-48 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]"
        />

        {/* Animated flower SVG — decorative, clipped top-right */}
        <svg
          aria-hidden
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[700px] w-[700px] text-primary/10 sm:-right-16 sm:-top-16"
          fill="currentColor"
        >
          <g transform="translate(300 300)">
            {Array.from({ length: 8 }).map((_, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-160"
                rx="90"
                ry="180"
                transform={`rotate(${i * 45})`}
                opacity="0.6"
              />
            ))}
            <circle r="80" fill="currentColor" opacity="0.9" />
          </g>
        </svg>

        {/* Grain overlay */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:pb-24 sm:pt-28 lg:pb-28 lg:pt-36">
          {/* Eyebrow */}
          <AnimeReveal direction="up" delay={0} duration={600}>
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
              <span className="h-px w-8 bg-white/30" />
              <span>{t("eyebrow")}</span>
              <span className="text-white/20">·</span>
              <span>{t("eyebrowLocation")}</span>
              <span className="text-white/20">·</span>
              <span>{t("eyebrowEst")}</span>
            </div>
          </AnimeReveal>

          {/* Display headline */}
          <AnimeReveal direction="up" delay={80} duration={700}>
            <h1 className="relative mt-6 font-display text-[clamp(3.2rem,11vw,8.5rem)] font-bold leading-[0.9] tracking-[-0.04em] text-white">
              <span className="block">{t("heroLine1")}</span>
              <span className="mt-1 block italic text-gold">
                {t("heroLine2")}
              </span>
            </h1>
          </AnimeReveal>

          {/* Description + stats */}
          <AnimeReveal direction="up" delay={160} duration={700}>
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <p className="max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
                {t("heroBody")}
              </p>

              {/* Stat cluster */}
              <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-4">
                <div className="text-right">
                  <div className="font-display text-[5rem] font-bold leading-none tracking-tight text-white">
                    <AnimatedCounter value={stats.businesses} duration={1400} delay={400} />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    {t("statLocalBusinesses")}
                  </div>
                </div>
              </div>
            </div>
          </AnimeReveal>

          {/* Search */}
          <AnimeReveal direction="up" delay={240} duration={700}>
            <div className="mt-10 max-w-2xl">
              <SearchBar size="lg" scrim />
            </div>
          </AnimeReveal>

          {/* Stat bar */}
          <AnimeReveal direction="up" delay={400} duration={700}>
            <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
              <span className="text-white/60">{t("statBarBusinesses", { count: stats.businesses })}</span>
              <span className="text-white/10">·</span>
              <span>{t("statBarActiveDeals", { count: stats.activeDeals })}</span>
              <span className="text-white/10">·</span>
              <span>{t("statBarCategories", { count: stats.categories })}</span>
              <span className="text-white/10">·</span>
              <span>{t("statBarUpdatedDaily")}</span>
            </div>
          </AnimeReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STICKY JUMP-NAV — anchor to each category with counts
         ═══════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="hidden flex-shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex">
            <Store className="h-3.5 w-3.5 text-primary" />
            Browse
          </span>
          <div className="scrollbar-none -mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1">
            {mostActive.length > 0 && (
              <a
                href="#most-active"
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-sm font-semibold text-gold-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <Flame className="h-3.5 w-3.5" />
                Most active
              </a>
            )}
            {populatedCategories.map((g) => (
              <a
                key={g.slug}
                href={`#${g.slug}`}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {g.name}
                <span className="text-xs text-muted-foreground">{g.items.length}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          QUICK STATS ROW
         ═══════════════════════════════════════════════════ */}
      <div className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: t("statLocalBusinesses"), value: stats.businesses, icon: <Store className="h-4 w-4" /> },
              { label: t("statActiveDeals"), value: stats.activeDeals, icon: <Tag className="h-4 w-4" /> },
              { label: t("statCategories"), value: stats.categories, icon: <Sparkles className="h-4 w-4" /> },
              { label: t("statUpdated"), value: null, label2: t("statUpdatedValue"), icon: <TrendingUp className="h-4 w-4" /> },
            ].map((s, i) => (
              <AnimeReveal key={s.label} direction="up" delay={i * 60} duration={600}>
                <div className="flex flex-col gap-1 rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {s.icon}
                    {s.label}
                  </div>
                  <div className="font-display text-3xl font-bold tracking-tight">
                    {s.value !== null ? (
                      <AnimatedCounter value={s.value} duration={1200} delay={200 + i * 80} />
                    ) : (
                      s.label2
                    )}
                  </div>
                </div>
              </AnimeReveal>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MOST ACTIVE — featured strip of deal-heavy businesses
         ═══════════════════════════════════════════════════ */}
      {mostActive.length > 0 && (
        <section id="most-active" className="scroll-mt-20 border-b bg-gradient-to-b from-gold/[0.06] to-transparent">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <AnimeReveal direction="up" duration={560}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-foreground">
                    <Flame className="h-3.5 w-3.5" />
                    Most active
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    Where the deals are right now
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Local businesses with the most live offers this week.
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
                </AnimeReveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          DIRECTORY LISTINGS — grouped by category
         ═══════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {businesses.length} {businesses.length === 1 ? t("businessSingular") : t("businessPlural")}
          </p>
          <Link
            href={openNow ? "/businesses" : "/businesses?open=1"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              openNow
                ? "border-success bg-success/10 text-success"
                : "bg-card text-muted-foreground hover:border-foreground/30"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${openNow ? "bg-success" : "bg-muted-foreground/40"}`} />
            {t("openNowFilter")}
          </Link>
        </div>

        {populatedCategories.map((g) => {
          const dealCount = g.items.filter((b) => b.activeDealCount > 0).length
          return (
            <section key={g.slug} id={g.slug} className="scroll-mt-20">
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
                        {dealCount} {dealCount === 1 ? "with a deal" : "with deals"}
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
                {g.items.map((b, bi) => {
                  const hasDeals = b.activeDealCount > 0
                  return (
                    <AnimeReveal
                      key={b.id}
                      as="li"
                      direction="up"
                      delay={Math.min(bi, 8) * 45}
                      duration={520}
                    >
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
                            {b.categoryName && (
                              <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {b.categoryName}
                              </span>
                            )}
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
                    </AnimeReveal>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM CTA — List your business
         ═══════════════════════════════════════════════════ */}
      <section className="border-t bg-secondary/30">
        <AnimeReveal direction="up" delay={0} duration={600}>
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
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
                href="/for-businesses"
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
