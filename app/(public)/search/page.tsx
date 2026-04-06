import { searchDeals } from "@/lib/queries"
import { getIsAdmin } from "@/lib/is-admin"
import { DealGrid } from "@/components/deal-card"
import { SearchBar } from "@/components/search-bar"

export const metadata = { title: "Search — Lompoc Deals" }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = (searchParams.q ?? "").trim()
  const [deals, isAdmin] = await Promise.all([
    q ? searchDeals(q) : Promise.resolve([]),
    getIsAdmin(),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <SearchBar defaultValue={q} />
      </section>

      <section>
        {q ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {deals.length} {deals.length === 1 ? "result" : "results"} for{" "}
              <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
            </p>
            <DealGrid deals={deals} isAdmin={isAdmin} />
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
