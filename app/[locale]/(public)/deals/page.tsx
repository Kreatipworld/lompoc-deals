import { Link } from "@/i18n/navigation"
import { ArrowRight, Tag, MapPin, Compass } from "lucide-react"
import { getDealsGroupedByCategory, getSiteStats, getFeaturedActivities } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealCard } from "@/components/deal-card"
import { SafeImage } from "@/components/safe-image"
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
  const [categorizedDeals, viewer, stats, featuredActivities] = await Promise.all([
    getDealsGroupedByCategory(6),
    getViewer(),
    getSiteStats(),
    getFeaturedActivities(6),
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

      {/* ─── THINGS TO DO ─── */}
      {featuredActivities.length > 0 && (
        <section className="border-b bg-muted/20 py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Compass className="h-3 w-3" />
                  Things to Do in Lompoc
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Local Attractions &amp; Activities
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Discover what makes Lompoc special — from wineries to wildflowers.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredActivities.map((activity) => (
                <article
                  key={activity.id}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-violet-100">
                    <SafeImage
                      src={activity.imageUrl ?? undefined}
                      alt={activity.title}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center">
                          <Compass className="h-12 w-12 text-foreground/20" strokeWidth={1.25} />
                        </div>
                      }
                    />
                    <div className="absolute bottom-2.5 left-2.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium capitalize backdrop-blur shadow-sm">
                      {activity.category.replace(/-/g, " ")}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-3.5">
                    <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight line-clamp-2">
                      {activity.title}
                    </h3>

                    {activity.description && (
                      <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                        {activity.description}
                      </p>
                    )}

                    {activity.tips && (
                      <p className="mt-1.5 line-clamp-2 text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed italic">
                        Tip: {activity.tips}
                      </p>
                    )}

                    {activity.address && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate w-full">
                        <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                        <span className="truncate">{activity.address}</span>
                      </p>
                    )}

                    {activity.seasonality && (
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        Best: {activity.seasonality}
                      </p>
                    )}

                    {activity.sourceUrl && (
                      <div className="mt-auto pt-3">
                        <a
                          href={activity.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 px-4 text-xs font-semibold text-primary [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/10 active:scale-[0.98]"
                        >
                          Learn More
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

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
