import { notFound } from "next/navigation"
import { db } from "@/db/client"
import { getDealsByCategorySlug } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { DealsGate } from "@/components/deals-gate"
import { CategoryChips } from "@/components/category-chips"
import { SearchBar } from "@/components/search-bar"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, params.slug),
  })
  return {
    title: cat ? `${cat.name} — Lompoc Deals` : "Category — Lompoc Deals",
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, params.slug),
  })
  if (!cat) notFound()

  const [deals, viewer] = await Promise.all([
    getDealsByCategorySlug(params.slug),
    getViewer(),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{cat.name}</h1>
        <p className="text-muted-foreground">
          {deals.length} active {deals.length === 1 ? "deal" : "deals"} in {cat.name}.
        </p>
        <SearchBar />
      </section>

      <CategoryChips activeSlug={params.slug} />

      <section>
        {viewer.isAuthed ? (
          <DealGrid
            deals={deals}
            viewer={viewer}
            fromPath={`/category/${params.slug}`}
          />
        ) : (
          <DealsGate
            count={deals.length}
            fromPath={`/category/${params.slug}`}
          />
        )}
      </section>
    </div>
  )
}
