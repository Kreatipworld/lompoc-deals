"use client"

import Masonry from "react-masonry-css"
import type { FeedDisplayItem } from "@/lib/feed-queries"
import { Reveal } from "@/components/reveal"
import { FeedCard } from "@/components/feed-card"

const BREAKPOINTS = {
  default: 3,
  1024: 3,
  640: 2,
  0: 1,
}

export function FeedMasonry({ items }: { items: FeedDisplayItem[] }) {
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
          No posts yet. Be the first to post!
        </p>
      ) : (
        <Reveal preset="stagger" stagger={80}>
          <Masonry
            breakpointCols={BREAKPOINTS}
            className="-ml-4 flex w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {rest.map((item) => (
              <div key={item.id} className="mb-4">
                <FeedCard item={item} />
              </div>
            ))}
          </Masonry>
        </Reveal>
      )}
    </div>
  )
}
