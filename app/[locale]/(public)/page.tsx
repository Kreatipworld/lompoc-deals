import { Link } from "@/i18n/navigation"
import {
  ArrowRight, MapPin, Mail, Sparkles, Tag, Search, Heart, Quote, ChevronDown,
  Building2, ExternalLink, Compass
} from "lucide-react"
import { getFeaturedBusinesses, getAllCategories, getSiteStats, getFeaturedActivities } from "@/lib/queries"
import { SearchBar } from "@/components/search-bar"

export const metadata = {
  title: "Lompoc Local Directory — Find Businesses, Deals & Things To Do in Lompoc, CA",
  description:
    "Explore Lompoc, CA's local business directory — restaurants, shops, services, and more. Browse by category, discover deals, and support local.",
  keywords: [
    "lompoc directory",
    "lompoc businesses",
    "things to do in lompoc",
    "lompoc local businesses",
    "lompoc ca",
    "lompoc deals",
  ],
  openGraph: {
    title: "Lompoc Local Directory — Businesses, Deals & Things To Do",
    description:
      "Explore Lompoc, CA's local business directory — restaurants, shops, services, and more.",
    images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: "Lompoc, California" }],
  },
}

// Category image mapping by slug — Unsplash photos (no text overlay)
const CATEGORY_IMAGES: Record<string, string> = {
  "food-drink":    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
  "retail":        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80",
  "services":      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
  "health-beauty": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  "auto":          "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=800&q=80",
  "entertainment": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
  "real-estate":   "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
  "wineries":      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80",
  "cannabis":      "https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=800&q=80",
  "dispensaries":  "https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=800&q=80",
}

function getCategoryImage(slug: string): string | null {
  return CATEGORY_IMAGES[slug] ?? null
}

export default async function HomePage() {
  const [categories, featuredBusinesses, stats, featuredActivities] = await Promise.all([
    getAllCategories(),
    getFeaturedBusinesses(6),
    getSiteStats(),
    getFeaturedActivities(6),
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
            Lompoc, California
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Explore Lompoc <br className="sm:hidden" />
            <span className="italic text-yellow-300">by category</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            Discover local restaurants, shops, services, and more — all in one place.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              {stats.activeDeals} active deals
            </span>
            <span className="text-white/30">·</span>
            <span>{stats.businesses} local businesses</span>
            <span className="text-white/30">·</span>
            <span>{stats.categories} categories</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          EXPLORE BY CATEGORY — Image card grid
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Explore by category
          </h2>
          <p className="mt-1 text-muted-foreground">
            Find things to do, eat, and discover in Lompoc
          </p>
        </div>

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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover [transition:transform_300ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
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
                  Popular in Lompoc
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Local businesses with active offers right now
                </p>
              </div>
              <Link
                href="/businesses"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
              >
                View all businesses
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={biz.logoUrl}
                        alt={biz.name}
                        className="h-14 w-14 rounded-xl object-cover"
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
                        {biz.activeDealCount} {biz.activeDealCount === 1 ? "deal" : "deals"}
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
                View all businesses
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
                Things to Do in Lompoc
              </h2>
              <p className="mt-1 text-muted-foreground">
                Adventures, history, and hidden gems — all within reach
              </p>
            </div>
            <Link
              href="/activities"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              See all activities
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
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
                See all activities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Link
              href="/map"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Compass className="h-4 w-4 text-primary" />
              Explore the map
            </Link>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────
          HOW IT WORKS — 3-step explainer
         ───────────────────────────────────────────────── */}
      <section className="border-t bg-accent/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              How It Works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Connecting Lompoc locals with businesses since day one.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Browse local deals",
                body: "Find coupons and specials from restaurants, shops, salons, and more — all in one place, all in Lompoc.",
                step: "01",
              },
              {
                icon: Tag,
                title: "Claim your deal",
                body: "Tap Claim, show your phone at the register, and save. No printing, no apps to download.",
                step: "02",
              },
              {
                icon: Heart,
                title: "Support local",
                body: "Every deal claimed is a sale made in Lompoc. Keep your dollars here.",
                step: "03",
              },
            ].map(({ icon: Icon, title, body, step }) => (
              <div
                key={step}
                className="relative flex flex-col items-center rounded-2xl border bg-background p-8 text-center shadow-sm"
              >
                <span className="absolute right-4 top-4 font-display text-5xl font-bold text-muted/30 select-none">
                  {step}
                </span>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
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
              What Lompoc Says
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Real people. Real savings. Real Lompoc.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                quote:
                  "I found a deal for my favorite spot on H Street — saved $12 on my first visit. Now I check every week.",
                name: "Maria R.",
                neighborhood: "Old Town",
              },
              {
                quote:
                  "As a veteran at Vandenberg, this is the easiest way to find what's close by without driving to Santa Maria.",
                name: "James T.",
                neighborhood: "Vandenberg Village",
              },
              {
                quote:
                  "Tres meses usándolo — ya ahorré más de $80. Se lo recomiendo a toda mi familia.",
                name: "Ana L.",
                neighborhood: "Mission Hills",
              },
            ].map(({ quote, name, neighborhood }) => (
              <figure
                key={name}
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
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {/* REPLACE WITH REAL LOMPOC TESTIMONIALS */}
            Placeholder quotes — real testimonials coming soon.
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
              Questions?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Everything you need to know about Lompoc Deals.
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Is Lompoc Deals free to use?",
                a: "Yes, completely. Browsing deals and claiming them is always free for Lompoc residents. No account required to browse.",
              },
              {
                q: "How do I claim a deal?",
                a: 'Click "Claim Deal" on any offer. If it requires an account, sign up in 30 seconds — just your email. Then show your phone at the business.',
              },
              {
                q: "How do businesses post deals?",
                a: "Sign up as a business (free), create your profile, and post your first deal in under 5 minutes. The free plan includes 3 active deals.",
              },
              {
                q: "What does it cost to list my business?",
                a: "Our Free plan is $0 forever — 3 deals, basic profile. Standard is $19.99/month for unlimited deals and priority placement.",
              },
              {
                q: "Is this only for Lompoc?",
                a: "For now, yes. We're 100% focused on Lompoc. That's what makes it work — every deal is from someone local, for someone local.",
              },
              {
                q: "How do I get the weekly deals email?",
                a: "Create a free account and subscribe to the weekly digest. Every Tuesday morning, the top 5 deals go straight to your inbox.",
              },
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
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent to-background p-8 sm:p-12">
          <div
            aria-hidden
            className="absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full bg-primary/10 blur-2xl"
          />
          <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                For business owners
              </div>
              <h3 className="font-display text-3xl font-semibold tracking-tight">
                Own a Lompoc business?
              </h3>
              <p className="mt-3 text-muted-foreground">
                List your business, post your own coupons, and reach locals
                actively looking to spend at home. Free forever for the basics.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link
                href="/for-businesses"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
              >
                List your business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border bg-background px-5 text-sm font-medium [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-accent active:scale-[0.97]"
              >
                <Mail className="h-4 w-4" />
                Weekly digest
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
