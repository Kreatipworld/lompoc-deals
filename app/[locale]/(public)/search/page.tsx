import { searchDeals } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { SearchBar } from "@/components/search-bar"
import { MapPin } from "lucide-react"

export const metadata = { title: "Search — Lompoc Deals" }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = (searchParams.q ?? "").trim()
  const [deals, viewer] = await Promise.all([
    q ? searchDeals(q) : Promise.resolve([]),
    getViewer(),
  ])

  return (
    <div className="space-y-0">
      {/* ─── Search hero with Lompoc background ─── */}
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
        {/* Dark overlay */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/60"
        />

        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" />
            Lompoc, California
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Find deals in Lompoc
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/75 sm:text-base">
            Search coupons, specials, and announcements from local businesses.
          </p>
          <div className="mx-auto mt-6 max-w-xl">
            <SearchBar defaultValue={q} size="lg" />
          </div>
        </div>
      </section>

      {/* ─── Results ─── */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {q ? (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {deals.length} {deals.length === 1 ? "result" : "results"} for{" "}
              <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
            </p>
            <DealGrid
              deals={deals}
              viewer={viewer}
              fromPath={`/search?q=${encodeURIComponent(q)}`}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Type a keyword above to search across deals and businesses.
          </p>
        )}
      </section>
    </div>
  )
}
