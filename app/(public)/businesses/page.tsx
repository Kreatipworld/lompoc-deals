import Link from "next/link"
import {
  Flower2,
  MapPin,
  Phone,
  Globe,
  ArrowRight,
  Tag,
} from "lucide-react"
import { getDirectoryBusinesses, getAllCategories } from "@/lib/queries"

export const metadata = {
  title: "Business directory — Lompoc Deals",
  description:
    "All Lompoc, California businesses listed on Lompoc Deals, organized by category.",
}

export default async function BusinessesPage() {
  const [businesses, cats] = await Promise.all([
    getDirectoryBusinesses(),
    getAllCategories(),
  ])

  // Group by category
  const grouped = new Map<
    string,
    { id: number; name: string; slug: string; items: typeof businesses }
  >()
  for (const c of cats) {
    grouped.set(c.slug, { id: c.id, name: c.name, slug: c.slug, items: [] })
  }
  for (const b of businesses) {
    if (b.categorySlug && grouped.has(b.categorySlug)) {
      grouped.get(b.categorySlug)!.items.push(b)
    }
  }

  const populatedCategories = Array.from(grouped.values()).filter(
    (g) => g.items.length > 0
  )

  return (
    <>
      {/* HEADER */}
      <section className="border-b bg-gradient-to-b from-accent via-background to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Flower2 className="h-3.5 w-3.5" />
              Lompoc, California
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Business directory
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              {businesses.length} local{" "}
              {businesses.length === 1 ? "business" : "businesses"} on Lompoc
              Deals, organized by category. Tap any name for their profile and
              active deals.
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORIES + LISTINGS */}
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        {/* Quick category jump */}
        <nav className="flex flex-wrap gap-2">
          {populatedCategories.map((g) => (
            <a
              key={g.slug}
              href={`#${g.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium hover:border-primary/40 hover:bg-accent"
            >
              {g.name}
              <span className="text-xs text-muted-foreground">
                · {g.items.length}
              </span>
            </a>
          ))}
        </nav>

        {populatedCategories.map((g) => (
          <section key={g.slug} id={g.slug} className="scroll-mt-20">
            <div className="mb-5 flex items-end justify-between border-b pb-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {g.name}
              </h2>
              <Link
                href={`/category/${g.slug}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                See deals →
              </Link>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/biz/${b.slug}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent">
                        {b.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.logoUrl}
                            alt=""
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                        ) : (
                          <Flower2 className="h-5 w-5 text-primary/70" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight line-clamp-2">
                          {b.name}
                        </h3>
                        {b.activeDealCount > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <Tag className="h-3 w-3" />
                            {b.activeDealCount}{" "}
                            {b.activeDealCount === 1 ? "deal" : "deals"}
                          </span>
                        )}
                      </div>
                    </div>

                    {b.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {b.description}
                      </p>
                    )}

                    <div className="mt-auto space-y-1 text-xs text-muted-foreground">
                      {b.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary/60" />
                          <span className="truncate">{b.address}</span>
                        </div>
                      )}
                      {b.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 flex-shrink-0 text-primary/60" />
                          {b.phone}
                        </div>
                      )}
                      {b.website && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3 flex-shrink-0 text-primary/60" />
                          <span className="truncate">
                            {b.website.replace(/^https?:\/\//, "")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                      View profile
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
