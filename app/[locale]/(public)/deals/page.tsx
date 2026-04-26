import { Link } from "@/i18n/navigation"
import { ArrowRight, Tag } from "lucide-react"
import { getDealsGroupedByCategory, getSiteStats } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealCard } from "@/components/deal-card"
import { CategoryStrip } from "@/components/category-strip"
import { SearchBar } from "@/components/search-bar"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deals.page")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: t("metaKeywords").split(","),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: t("ogImageAlt") }],
    },
  }
}

export default async function DealsPage() {
  const [categorizedDeals, viewer, stats, t] = await Promise.all([
    getDealsGroupedByCategory(6),
    getViewer(),
    getSiteStats(),
    getTranslations("deals.page"),
  ])

  return (
    <>
      {/* ─── PAGE HEADER ─── */}
      <section className="border-b bg-accent/30 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Tag className="h-3 w-3 text-primary" />
            {t("badge")}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {t("heading")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("subheading", { count: stats.activeDeals })}
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
          <p>{t("noDeals")}</p>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-10 space-y-14">
          {categorizedDeals.map((cat) => {
            const dealWord = cat.deals.length === 1 ? t("dealSingular") : t("dealPlural")
            return (
              <section key={cat.slug}>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      {cat.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("dealsAvailable", { count: cat.deals.length, dealWord })}
                    </p>
                  </div>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {t("seeAll")}
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
            )
          })}
        </div>
      )}
    </>
  )
}
