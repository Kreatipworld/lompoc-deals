import { Link } from "@/i18n/navigation"
import { ArrowRight, MapPin, Mail, Sparkles, Tag, CalendarDays, Wine } from "lucide-react"
import { getActiveDeals, getSiteStats } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { CategoryStrip } from "@/components/category-strip"
import { SearchBar } from "@/components/search-bar"
import { WeatherWidget } from "@/components/weather-widget"
import { EventsSection } from "@/components/events-section"
import { WineriesSection } from "@/components/wineries-section"

export const metadata = {
  title: "Lompoc Deals — local coupons, specials, and announcements",
  description:
    "The latest deals from Lompoc, California businesses. Updated daily.",
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
            backgroundImage: "url('/hero-lompoc.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        {/* Dark overlay for text readability */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/60"
        />

        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" />
            Lompoc, California
          </div>

          {/* Headline — medium, not massive (search-first) */}
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-medium text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              {stats.activeDeals} active deals
            </span>
            <span className="text-white/30">·</span>
            <span>{stats.businesses} local businesses</span>
            <span className="text-white/30">·</span>
            <span>Updated daily</span>
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
      <div className="mx-auto max-w-6xl px-4 pt-6">
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
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Latest deals
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing all {deals.length}{" "}
                {deals.length === 1 ? "deal" : "deals"} · sorted by newest
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

          <DealGrid deals={deals} viewer={viewer} fromPath="/" />
        </section>
      )}

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
