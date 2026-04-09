import { Link } from "@/i18n/navigation"
import { ArrowRight, MapPin, Mail, Sparkles, Tag, CalendarDays, Wine, Search, Heart, Quote, ChevronDown } from "lucide-react"
import { getActiveDeals, getSiteStats } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { CategoryStrip } from "@/components/category-strip"
import { SearchBar } from "@/components/search-bar"
import { WeatherWidget } from "@/components/weather-widget"
import { EventsSection } from "@/components/events-section"
import { WineriesSection } from "@/components/wineries-section"

export const metadata = {
  title: "Lompoc Deals — Find Local Coupons, Deals & Things To Do in Lompoc, CA",
  description:
    "Browse 155+ local business deals in Lompoc, CA — restaurants, salons, services, and more. Free to claim, updated daily. Ofertas locales en Lompoc, CA.",
  keywords: [
    "lompoc deals",
    "lompoc coupons",
    "things to do in lompoc",
    "lompoc local businesses",
    "ofertas en lompoc",
    "lompoc ca",
  ],
  openGraph: {
    title: "Lompoc Deals — Local Coupons & Things To Do",
    description:
      "Browse 155+ deals from Lompoc, CA businesses — restaurants, salons, services, and more. Free to claim.",
    images: [{ url: "/lompoc-flowers-4.jpg", width: 1200, height: 630, alt: "Lompoc, California — flower fields" }],
  },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab =
    params.tab === "events"
      ? "events"
      : params.tab === "wineries"
        ? "wineries"
        : "deals"

  const [deals, viewer, stats] = await Promise.all([
    getActiveDeals(),
    getViewer(),
    getSiteStats(),
  ])

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO — Search-first with Lompoc image background
         ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        {/* Lompoc background image */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: "url('/lompoc-flowers-4.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        {/* Dark overlay for text readability */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/60"
        />

        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" />
            Lompoc, California
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Where to next <br className="sm:hidden" />
            <span className="italic text-yellow-300">in Lompoc?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            Coupons, specials, and announcements from the local businesses you
            already love.
          </p>

          {/* BIG search bar — the centerpiece */}
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar size="lg" />
          </div>

          {/* Quick stats inline */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              {stats.activeDeals} active deals
            </span>
            <span className="text-white/30">·</span>
            <span>{stats.businesses} local businesses</span>
            <span className="text-white/30">·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber/25 px-2.5 py-0.5 text-[10px] font-semibold text-yellow-200 ring-1 ring-yellow-300/30">
              ✦ Updated daily
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          STICKY CATEGORY STRIP (Airbnb-style icon stacks)
         ───────────────────────────────────────────────── */}
      <CategoryStrip />

      {/* ─────────────────────────────────────────────────
          WEATHER WIDGET — single instance, top of content
         ───────────────────────────────────────────────── */}
      <WeatherWidget />

      {/* ─────────────────────────────────────────────────
          TAB STRIP — Deals | Events
         ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex gap-1 rounded-xl border bg-muted/40 p-1 w-fit">
          <Link
            href="/?tab=deals"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "deals"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-4 w-4" />
            Deals
          </Link>
          <Link
            href="/?tab=events"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "events"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Events
          </Link>
          <Link
            href="/?tab=wineries"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "wineries"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wine className="h-4 w-4" />
            Wineries
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────
          TAB CONTENT
         ───────────────────────────────────────────────── */}
      {activeTab === "events" ? (
        <EventsSection />
      ) : activeTab === "wineries" ? (
        <WineriesSection />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Find deals in Lompoc
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {deals.length} {deals.length === 1 ? "deal" : "deals"} available · updated daily
              </p>
            </div>
            <Link
              href="/businesses"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              Browse directory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <DealGrid deals={deals} viewer={viewer} fromPath="/" variant="tripadvisor" />
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
                    <p className="text-xs text-muted-foreground">
                      {neighborhood}
                    </p>
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
          BUSINESS CTA (kept from earlier)
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
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                List your business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border bg-background px-5 text-sm font-medium hover:bg-accent"
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
