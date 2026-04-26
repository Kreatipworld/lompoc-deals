import { Link } from "@/i18n/navigation"
import {
  ArrowRight, MapPin, Mail, Sparkles, Tag, Search, Heart, Quote, ChevronDown,
  Building2, ExternalLink, Compass
} from "lucide-react"
import { getFeaturedBusinesses, getAllCategories, getSiteStats, getFeaturedActivities, getFeaturedDeals } from "@/lib/queries"
import { SearchBar } from "@/components/search-bar"
import { SafeImage } from "@/components/safe-image"
import { DealsCarousel } from "@/components/deals-carousel"
import { AnimeReveal } from "@/components/anime-reveal"
import { AnimatedCounter } from "@/components/animated-counter"
import { Reveal } from "@/components/reveal"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "home" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: [
      "lompoc directory",
      "lompoc businesses",
      "things to do in lompoc",
      "lompoc local businesses",
      "lompoc ca",
      "lompoc deals",
    ],
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: "Lompoc, California" }],
    },
  }
}

// Category image mapping by slug — local Lompoc business photos
const CATEGORY_IMAGES: Record<string, string> = {
  "food-drink":    "/categories/food-drink.jpg",
  "retail":        "/categories/retail.jpg",
  "services":      "/categories/services.jpg",
  "health-beauty": "/categories/health-beauty.jpg",
  "auto":          "/categories/auto.jpg",
  "entertainment": "/categories/entertainment.jpg",
  "real-estate":   "/categories/real-estate.jpg",
  "wineries":      "/categories/wineries.jpg",
  "cannabis":      "/categories/dispensaries.jpg",
  "dispensaries":  "/categories/dispensaries.jpg",
  "other":         "/categories/other.jpg",
}

function getCategoryImage(slug: string): string | null {
  return CATEGORY_IMAGES[slug] ?? null
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const [categories, featuredBusinesses, stats, featuredActivities, featuredDeals, t] = await Promise.all([
    getAllCategories(),
    getFeaturedBusinesses(6),
    getSiteStats(),
    getFeaturedActivities(6),
    getFeaturedDeals(6),
    getTranslations({ locale: params.locale, namespace: "home" }),
  ])

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO — Search-first with Lompoc image background
         ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: "url('/lompoc-hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/60"
        />

        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" />
            {t("location")}
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            {t("heroTitle")} <br className="sm:hidden" />
            <span className="italic text-yellow-300">{t("heroHighlight")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {t("heroSubheadline")}
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <AnimatedCounter value={stats.activeDeals} duration={1200} delay={600} /> {t("statActiveDeals")}
            </span>
            <span className="text-white/30">·</span>
            <span><AnimatedCounter value={stats.businesses} duration={1400} delay={700} /> {t("statLocalBusinesses")}</span>
            <span className="text-white/30">·</span>
            <span><AnimatedCounter value={stats.categories} duration={1000} delay={800} /> {t("statCategories")}</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FEATURED DEALS CAROUSEL
         ───────────────────────────────────────────────── */}
      <DealsCarousel deals={featuredDeals} />

      {/* ─────────────────────────────────────────────────
          EXPLORE BY CATEGORY — Image card grid
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <AnimeReveal direction="up" delay={0} duration={600} className="mb-8">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            {t("liveLoveHeading")}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {t("liveLoveSubheading")}
          </p>
        </AnimeReveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat, i) => {
            const image = getCategoryImage(cat.slug)
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                style={{ animationDelay: `${i * 55}ms` }}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] flex flex-col items-center justify-center text-white shadow-sm animate-fade-up card-lift hover:shadow-lg hover:-translate-y-1"
              >
                {/* Photo background */}
                {image ? (
                  <SafeImage
                    src={image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover [transition:transform_300ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                    fallback={<div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600" />}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600" />
                )}
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 [transition:background-color_220ms_ease]" />
                {/* Stronger bottom gradient for label */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />

                <div className="relative flex flex-col items-end justify-end h-full w-full px-4 pb-4">
                  <span className="font-display text-base font-bold leading-tight drop-shadow-sm">
                    {cat.name}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FEATURED BUSINESSES — "Popular in Lompoc"
         ───────────────────────────────────────────────── */}
      {featuredBusinesses.length > 0 && (
        <section className="border-t bg-accent/20 py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  {t("popularInLompoc")}
                </h2>
                <p className="mt-1 text-muted-foreground">
                  {t("businessesSubheading")}
                </p>
              </div>
              <Link
                href="/businesses"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
              >
                {t("viewAllBusinesses")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBusinesses.map((biz, i) => (
                <Link
                  key={biz.id}
                  href={`/biz/${biz.slug}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="group flex gap-4 rounded-2xl border bg-background p-4 shadow-sm animate-fade-up card-lift hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* Logo / placeholder */}
                  <div className="flex-shrink-0">
                    {biz.logoUrl ? (
                      <SafeImage
                        src={biz.logoUrl}
                        alt={biz.name}
                        className="h-14 w-14 rounded-xl object-cover"
                        fallback={
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Building2 className="h-7 w-7" />
                          </div>
                        }
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-7 w-7" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-semibold leading-tight group-hover:text-primary transition-colors">
                        {biz.name}
                      </h3>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50 mt-0.5 group-hover:text-primary transition-colors" />
                    </div>
                    {biz.categoryName && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {biz.categoryName}
                      </p>
                    )}
                    {biz.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {biz.description}
                      </p>
                    )}
                    {biz.activeDealCount > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Tag className="h-2.5 w-2.5" />
                        {biz.activeDealCount} {biz.activeDealCount === 1 ? t("deal") : t("deals")}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/businesses"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("viewAllBusinesses")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────
          THINGS TO DO — Featured activities
         ───────────────────────────────────────────────── */}
      {featuredActivities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                {t("activitiesHeading")}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {t("activitiesSubheading")}
              </p>
            </div>
            <Link
              href="/activities"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              {t("seeAllActivities")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredActivities.map((activity, i) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.slug}`}
                style={{ animationDelay: `${i * 70}ms` }}
                className="group relative overflow-hidden rounded-2xl border bg-background shadow-sm animate-fade-up card-lift hover:shadow-lg hover:-translate-y-1"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-accent">
                  {activity.imageUrl && (
                    <SafeImage
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="h-full w-full object-cover [transition:transform_300ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {activity.seasonality && (
                    <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                      {activity.seasonality}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold leading-snug group-hover:text-primary transition-colors">
                    {activity.title}
                  </h3>
                  {activity.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                  {activity.address && (
                    <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {activity.address.split(",")[0]}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="sm:hidden">
              <Link
                href="/activities"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("seeAllActivities")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Link
              href="/map"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Compass className="h-4 w-4 text-primary" />
              {t("exploreMap")}
            </Link>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────
          HOW IT WORKS — 3-step explainer
         ───────────────────────────────────────────────── */}
      <section className="border-t bg-accent/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <AnimeReveal direction="up" delay={0} duration={600} className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {t("howItWorks.title")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("howItWorks.subtitle")}
            </p>
          </AnimeReveal>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                icon: Search,
                title: t("howItWorks.step1Title"),
                body: t("howItWorks.step1Body"),
                step: "01",
              },
              {
                icon: Tag,
                title: t("howItWorks.step2Title"),
                body: t("howItWorks.step2Body"),
                step: "02",
              },
              {
                icon: Heart,
                title: t("howItWorks.step3Title"),
                body: t("howItWorks.step3Body"),
                step: "03",
              },
            ].map(({ icon: Icon, title, body, step }, i) => (
              <AnimeReveal key={step} direction="up" delay={i * 80} duration={560}>
                <div className="relative flex flex-col items-center rounded-2xl border bg-background p-8 text-center shadow-sm">
                  <span className="absolute right-4 top-4 font-display text-5xl font-bold text-muted/30 select-none">
                    {step}
                  </span>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </div>
              </AnimeReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          TESTIMONIALS — What Lompoc Says
         ───────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {t("testimonials.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("testimonials.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                quote: t("testimonials.quote1"),
                name: t("testimonials.name1"),
                neighborhood: t("testimonials.neighborhood1"),
              },
              {
                quote: t("testimonials.quote2"),
                name: t("testimonials.name2"),
                neighborhood: t("testimonials.neighborhood2"),
              },
              {
                quote: t("testimonials.quote3"),
                name: t("testimonials.name3"),
                neighborhood: t("testimonials.neighborhood3"),
              },
            ].map(({ quote, name, neighborhood }, i) => (
              <AnimeReveal key={name} direction="up" delay={i * 80} duration={560}>
              <figure
                className="flex flex-col rounded-2xl border bg-accent/40 p-6"
              >
                <Quote className="mb-3 h-5 w-5 text-primary/40" />
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-2 border-t pt-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{neighborhood}</p>
                  </div>
                </figcaption>
              </figure>
              </AnimeReveal>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("testimonials.placeholder")}
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FAQ — 6 questions
         ───────────────────────────────────────────────── */}
      <section className="border-t bg-accent/20 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {t("faq.title")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("faq.subtitle")}
            </p>
          </div>
          <div className="space-y-3">
            {[
              { q: t("faq.q1"), a: t("faq.a1") },
              { q: t("faq.q2"), a: t("faq.a2") },
              { q: t("faq.q3"), a: t("faq.a3") },
              { q: t("faq.q4"), a: t("faq.a4") },
              { q: t("faq.q5"), a: t("faq.a5") },
              { q: t("faq.q6"), a: t("faq.a6") },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border bg-background open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium hover:bg-accent/50 rounded-xl group-open:rounded-b-none transition-colors">
                  {q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t px-5 py-4 text-sm text-muted-foreground leading-relaxed">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          BUSINESS CTA
         ───────────────────────────────────────────────── */}
      <section className="mx-auto mb-16 max-w-6xl px-4">
        <Reveal preset="scaleIn" className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent to-background p-8 sm:p-12">
          <div
            aria-hidden
            className="absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full bg-primary/10 blur-2xl"
          />
          <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                {t("forBusinessOwners")}
              </div>
              <h3 className="font-display text-3xl font-semibold tracking-tight">
                {t("ownABusiness")}
              </h3>
              <p className="mt-3 text-muted-foreground">
                {t("businessCta")}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link
                href="/for-businesses"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
              >
                {t("listYourBusiness")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border bg-background px-5 text-sm font-medium [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-accent active:scale-[0.97]"
              >
                <Mail className="h-4 w-4" />
                {t("weeklyDigest")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
