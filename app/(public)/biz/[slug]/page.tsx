import { notFound } from "next/navigation"
import Link from "next/link"
import { MapPin, Phone, Globe, ArrowLeft, Flower2 } from "lucide-react"
import { getBusinessBySlug } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { bumpViewCounts } from "@/lib/tracking"
import { DealGrid } from "@/components/deal-card"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const data = await getBusinessBySlug(params.slug)
  if (!data) return { title: "Business not found — Lompoc Deals" }
  return {
    title: `${data.business.name} — Lompoc Deals`,
    description: data.business.description ?? undefined,
  }
}

export default async function BusinessPage({
  params,
}: {
  params: { slug: string }
}) {
  const [data, viewer] = await Promise.all([
    getBusinessBySlug(params.slug),
    getViewer(),
  ])
  if (!data) notFound()
  const { business, deals } = data
  const activeDeals = deals.filter((d) => new Date(d.expiresAt) > new Date())

  if (deals.length > 0) {
    void bumpViewCounts(deals.map((d) => d.id))
  }

  return (
    <>
      {/* COVER + HEADER */}
      <section className="relative">
        {/* Cover image or gradient fallback */}
        <div className="relative h-56 sm:h-72">
          {business.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent to-background" />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
          />
        </div>

        {/* Floating header card */}
        <div className="mx-auto -mt-20 max-w-6xl px-4">
          <div className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to all deals
            </Link>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* Logo */}
              <div className="flex-shrink-0">
                {business.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logoUrl}
                    alt={`${business.name} logo`}
                    className="h-24 w-24 rounded-2xl border bg-background object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border bg-gradient-to-br from-primary/15 to-accent shadow-sm">
                    <Flower2 className="h-10 w-10 text-primary/60" />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    {business.name}
                  </h1>
                  {business.category && (
                    <Link
                      href={`/category/${business.category.slug}`}
                      className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {business.category.name}
                    </Link>
                  )}
                </div>

                {business.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {business.description}
                  </p>
                )}

                {/* Info chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {business.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        business.address
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs text-foreground transition hover:bg-secondary"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {business.address}
                    </a>
                  )}
                  {business.phone && (
                    <a
                      href={`tel:${business.phone.replace(/[^0-9+]/g, "")}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs text-foreground transition hover:bg-secondary"
                    >
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {business.phone}
                    </a>
                  )}
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs text-foreground transition hover:bg-secondary"
                    >
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      {business.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Stat */}
              <div className="hidden flex-shrink-0 text-center sm:block">
                <div className="font-display text-3xl font-semibold text-primary">
                  {activeDeals.length}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Active {activeDeals.length === 1 ? "deal" : "deals"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEALS */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Active deals
          </h2>
          <p className="text-sm text-muted-foreground">
            from {business.name}
          </p>
        </div>
        <DealGrid
          deals={deals}
          viewer={viewer}
          fromPath={`/biz/${params.slug}`}
        />
      </section>
    </>
  )
}
