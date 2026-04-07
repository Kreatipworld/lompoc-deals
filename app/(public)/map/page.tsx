import Link from "next/link"
import { MapPin, ArrowRight, Flower2 } from "lucide-react"
import { getMapBusinesses } from "@/lib/queries"
import { LompocMapLoader } from "@/components/lompoc-map-loader"

export const metadata = {
  title: "Map — Lompoc Deals",
  description: "Find Lompoc businesses and their deals on the map.",
}

export default async function MapPage() {
  const businesses = await getMapBusinesses()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <MapPin className="h-3 w-3" />
          Lompoc, California
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Discover local businesses
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {businesses.length}{" "}
          {businesses.length === 1 ? "business" : "businesses"} pinned. Click a
          marker — or pick from the list — to see their deals.
        </p>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* Business list */}
        <aside className="rounded-3xl border bg-card p-3 shadow-sm">
          <div className="px-3 py-2">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              All businesses
            </h2>
          </div>
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto lg:max-h-[640px]">
            {businesses.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No businesses listed yet.
              </li>
            ) : (
              businesses.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/biz/${b.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-primary/30 hover:bg-accent"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent">
                      <Flower2 className="h-5 w-5 text-primary/70" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-semibold">
                        {b.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.activeDealCount}{" "}
                        {b.activeDealCount === 1 ? "active deal" : "active deals"}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </aside>

        {/* Map */}
        <div className="overflow-hidden rounded-3xl border shadow-sm">
          <div className="h-[60vh] lg:h-[640px]">
            <LompocMapLoader businesses={businesses} />
          </div>
        </div>
      </div>
    </div>
  )
}
