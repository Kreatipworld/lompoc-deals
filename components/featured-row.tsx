import { getTranslations } from "next-intl/server"
import { getFeaturedDeals } from "@/lib/featured"
import { DealCard } from "@/components/deal-card"
import type { Viewer } from "@/lib/viewer"

export async function FeaturedRow({
  viewer,
  categorySlug,
  fromPath,
}: {
  viewer: Viewer
  categorySlug?: string
  fromPath?: string
}) {
  const deals = await getFeaturedDeals({ categorySlug, limit: 6 })
  if (deals.length === 0) return null // empty state: render nothing (launch-safe)

  const t = await getTranslations("featured")
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          ⭐ {t("title")}
        </h2>
        <span className="text-sm text-muted-foreground">{t("subtitle")}</span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal, i) => (
          <DealCard
            key={deal.id}
            deal={deal}
            viewer={viewer}
            fromPath={fromPath}
            staggerIndex={i}
          />
        ))}
      </div>
    </section>
  )
}
