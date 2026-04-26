import type { FeedDisplayItem } from "@/lib/feed-queries"
import { Reveal } from "@/components/reveal"
import { FeedCard } from "@/components/feed-card"
import { getTranslations } from "next-intl/server"

export async function FeedMasonry({ items }: { items: FeedDisplayItem[] }) {
  const t = await getTranslations("feed")
  const featured = items.filter((i) => i.isFeatured).slice(0, 2)
  const featuredIds = new Set(featured.map((i) => i.id))
  const rest = items.filter((i) => !featuredIds.has(i.id))

  return (
    <div className="space-y-8">
      {featured.length > 0 && (
        <Reveal preset="scaleIn" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {featured.map((item) => (
            <div key={item.id}>
              <FeedCard item={item} />
            </div>
          ))}
        </Reveal>
      )}

      {rest.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {t("emptyState")}
        </p>
      ) : (
        <Reveal
          preset="stagger"
          stagger={80}
          className="columns-1 gap-4 sm:columns-2 lg:columns-3"
        >
          {rest.map((item) => (
            <div key={item.id} className="mb-4 break-inside-avoid">
              <FeedCard item={item} />
            </div>
          ))}
        </Reveal>
      )}
    </div>
  )
}
