import Link from "next/link"
import { ArrowRight, MapPin, Mail, Sparkles } from "lucide-react"
import { getActiveDeals, getSiteStats } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { CategoryStrip } from "@/components/category-strip"
import { SearchBar } from "@/components/search-bar"

export const metadata = {
  title: "Lompoc Deals — local coupons, specials, and announcements",
  description:
    "The latest deals from Lompoc, California businesses. Updated daily.",
}

export default async function HomePage() {
  const [deals, viewer, stats] = await Promise.all([
    getActiveDeals(),
    getViewer(),
    getSiteStats(),
  ])

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO — Search-first (Airbnb-inspired)
         ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        {/* Soft cream gradient bg */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-[hsl(40_38%_98%)] via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -left-32 top-0 -z-10 h-[460px] w-[460px] rounded-full bg-primary/12 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-20 top-20 -z-10 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl"
        />

        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="h-3 w-3" />
            Lompoc, California
          </div>

          {/* Headline — medium, not massive (search-first) */}
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Where to next <br className="sm:hidden" />
            <span className="italic text-primary">in Lompoc?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Coupons, specials, and announcements from the local businesses you
            already love.
          </p>

          {/* BIG search bar — the centerpiece */}
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar size="lg" />
          </div>

          {/* Quick stats inline */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {stats.activeDeals} active deals
            </span>
            <span className="text-foreground/30">·</span>
            <span>{stats.businesses} local businesses</span>
            <span className="text-foreground/30">·</span>
            <span>Updated daily</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          STICKY CATEGORY STRIP (Airbnb-style icon stacks)
         ───────────────────────────────────────────────── */}
      <CategoryStrip />

      {/* ─────────────────────────────────────────────────
          DEAL GRID
         ───────────────────────────────────────────────── */}
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
                href="/signup"
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
