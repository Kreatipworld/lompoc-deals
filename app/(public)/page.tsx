import Link from "next/link"
import { Flower2, ArrowRight, Mail } from "lucide-react"
import { getActiveDeals, getSiteStats } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { DealsGate } from "@/components/deals-gate"
import { CategoryChips } from "@/components/category-chips"
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
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-accent via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -top-24 right-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 left-[-10%] -z-10 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Flower2 className="h-3.5 w-3.5" />
              Lompoc, California · The Flower Capital
            </span>

            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Save at the spots <br />
              <span className="text-primary">you already love.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              The freshest coupons, specials, and announcements from local
              Lompoc businesses — all in one feed, updated daily.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <SearchBar size="lg" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/map"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                Browse the map
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Mail className="h-4 w-4" />
                Weekly digest
              </Link>
            </div>
          </div>

          {/* STAT STRIP */}
          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-border rounded-2xl border bg-background/80 p-2 shadow-sm backdrop-blur">
            <Stat label="Businesses" value={stats.businesses} />
            <Stat label="Active deals" value={stats.activeDeals} />
            <Stat label="Categories" value={stats.categories} />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Browse by category
          </h2>
        </div>
        <CategoryChips />
      </section>

      {/* LATEST DEALS */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Latest deals
          </h2>
          <p className="text-sm text-muted-foreground">
            Updated continuously
          </p>
        </div>
        {viewer.isAuthed ? (
          <DealGrid deals={deals} viewer={viewer} fromPath="/" />
        ) : (
          <DealsGate count={stats.activeDeals} fromPath="/" />
        )}
      </section>

      {/* CTA — for businesses */}
      <section className="mx-auto mb-16 max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent to-background p-8 sm:p-12">
          <div
            aria-hidden
            className="absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full bg-primary/10 blur-2xl"
          />
          <div className="relative max-w-xl">
            <h3 className="font-display text-3xl font-semibold tracking-tight">
              Own a Lompoc business?
            </h3>
            <p className="mt-3 text-muted-foreground">
              Post your own coupons, specials, and announcements in minutes.
              Free to list, free forever for the basics.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              List your business
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-3">
      <div className="font-display text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
