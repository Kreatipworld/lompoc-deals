import { Link } from "@/i18n/navigation"
import { ArrowRight, Tag } from "lucide-react"
import { getDealsGroupedByCategory, getSiteStats } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealCard } from "@/components/deal-card"
import { CategoryStrip } from "@/components/category-strip"
import { SearchBar } from "@/components/search-bar"

export const metadata = {
  title: "Lompoc Deals & Coupons — Browse Local Specials | Lompoc Deals",
  description:
    "Browse current deals and coupons from 155+ Lompoc, CA businesses — restaurants, salons, services, retail, and more. Updated daily, free to claim, no credit card.",
  keywords: [
    "lompoc deals",
    "lompoc coupons",
    "lompoc specials",
    "lompoc discounts",
    "lompoc ca deals",
    "ofertas lompoc",
  ],
  openGraph: {
    title: "Lompoc Deals & Coupons — Local Specials Updated Daily",
    description:
      "Browse current deals from 155+ Lompoc, CA businesses. Free to claim — no credit card needed.",
    images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: "Lompoc, California" }],
  },
}

export default async function DealsPage() {
  const [categorizedDeals, viewer, stats] = await Promise.all([
    getDealsGroupedByCategory(6),
    getViewer(),
    getSiteStats(),
  ])

  return (
    <>
      {/* ─── PAGE HEADER ─── */}
      <section className="border-b bg-accent/30 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Tag className="h-3 w-3 text-primary" />
            Local deals, updated daily
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Deals &amp; Coupons
          </h1>
          <p className="mt-3 text-muted-foreground">
            {stats.activeDeals} active offers from Lompoc businesses — free to claim, no printing required.
          </p>
          <div className="mx-auto mt-6 max-w-xl">
            <SearchBar size="lg" />
          </div>
        </div>
      </section>

      {/* ─── CATEGORY STRIP ─── */}
      <CategoryStrip />

      {/* ─── CATEGORIZED DEALS ─── */}
      {categorizedDeals.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">
          <p>No active deals right now — check back soon!</p>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-10 space-y-14">
          {categorizedDeals.map((cat) => (
            <section key={cat.slug}>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    {cat.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cat.deals.length} {cat.deals.length === 1 ? "deal" : "deals"} available
                  </p>
                </div>
                <Link
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  See all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    viewer={viewer}
                    fromPath="/deals"
                    variant="tripadvisor"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
