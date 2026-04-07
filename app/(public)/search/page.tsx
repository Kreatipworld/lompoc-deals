import { searchDeals } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { DealsGate } from "@/components/deals-gate"
import { SearchBar } from "@/components/search-bar"

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <SearchBar defaultValue={q} />
      </section>

      <section>
        {!viewer.isAuthed ? (
          <DealsGate
            count={deals.length}
            fromPath={`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          />
        ) : q ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
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
