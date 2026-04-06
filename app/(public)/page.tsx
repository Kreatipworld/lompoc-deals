import { getActiveDeals } from "@/lib/queries"
import { DealGrid } from "@/components/deal-card"
import { CategoryChips } from "@/components/category-chips"
import { SearchBar } from "@/components/search-bar"

export const metadata = {
  title: "Lompoc Deals — local coupons, specials, and announcements",
  description:
    "The latest deals from Lompoc, California businesses. Updated daily.",
}

export default async function HomePage() {
  const deals = await getActiveDeals()

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Lompoc Deals
        </h1>
        <p className="text-muted-foreground">
          Local coupons, specials, and announcements from businesses in Lompoc, CA.
        </p>
        <SearchBar />
      </section>

      <CategoryChips />

      <section>
        <h2 className="mb-4 text-xl font-semibold">Latest deals</h2>
        <DealGrid deals={deals} />
      </section>
    </div>
  )
}
