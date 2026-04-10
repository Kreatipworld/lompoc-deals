import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
import {
  MapPin,
  Phone,
  Globe,
  ArrowLeft,
  Flower2,
  Sparkles,
  Calendar,
} from "lucide-react"
import { getBusinessBySlug, getListingsByBusinessId } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { bumpViewCounts } from "@/lib/tracking"
import { DealGrid } from "@/components/deal-card"
import { PropertyListingGrid } from "@/components/property-listing-card"
import { BusinessSocialLinks } from "@/components/business-social-links"
import { BusinessHours } from "@/components/business-hours"
import { BusinessMapLoader } from "@/components/business-map-loader"
import { BusinessClaimCta } from "@/components/business-claim-cta"

const SYSTEM_OWNER_EMAIL = "system@lompocdeals.test"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const data = await getBusinessBySlug(params.slug)
  if (!data) return { title: "Business not found — Lompoc Deals" }
  const { name, description } = data.business
  const catLabel = data.business.category?.name ?? "local business"
  const fallbackDescription = `Browse current deals and coupons from ${name}, a ${catLabel} in Lompoc, CA. Free to claim — updated directly by the business.`
  return {
    title: `${name} — Deals & Coupons in Lompoc, CA | Lompoc Deals`,
    description: description ?? fallbackDescription,
    openGraph: {
      title: `${name} | Lompoc Deals`,
      description: description ?? `Current deals from ${name} in Lompoc, CA. Free to claim.`,
    },
  }
}

function googleReviewsUrl(business: {
  googleBusinessUrl: string | null
  address: string | null
  name: string
}): string | null {
  if (business.googleBusinessUrl) return business.googleBusinessUrl
  const q = business.address ?? `${business.name}, Lompoc, CA`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
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
  const isRealEstate = business.category?.slug === "real-estate"

  // For real estate businesses, fetch property listings instead
  const listings = isRealEstate
    ? await getListingsByBusinessId(business.id)
    : []

  const activeDeals = deals.filter((d) => new Date(d.expiresAt) > new Date())
  const itemCount = isRealEstate ? listings.length : activeDeals.length
  const itemLabel = isRealEstate ? "listing" : "deal"

  if (!isRealEstate && deals.length > 0) {
    void bumpViewCounts(deals.map((d) => d.id))
  }

  const isUnclaimed = business.ownerEmail === SYSTEM_OWNER_EMAIL
  const reviewsUrl = googleReviewsUrl(business)

  return (
    <>
      {/* ─────────────────────────────────────────────────
          COVER IMAGE BANNER (full-width, above header card)
         ───────────────────────────────────────────────── */}
      {business.coverUrl ? (
        <div className="relative h-44 w-full overflow-hidden sm:h-60 card-enter">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={business.coverUrl}
            alt=""
            className="h-full w-full object-cover [transition:transform_400ms_cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        </div>
      ) : (
        <div className="h-24 w-full bg-gradient-to-r from-primary/20 via-accent to-primary/10 sm:h-36" />
      )}

      {/* ─────────────────────────────────────────────────
          HEADER CARD — logo + name + meta
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-background via-background to-background"
        />

        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors duration-150 hover:text-foreground">
              Deals
            </Link>
            {business.category && (
              <>
                <ArrowLeft className="h-3 w-3 rotate-180" aria-hidden />
                <Link
                  href={`/category/${business.category.slug}`}
                  className="transition-colors duration-150 hover:text-foreground"
                >
                  {business.category.name}
                </Link>
              </>
            )}
            <ArrowLeft className="h-3 w-3 rotate-180" aria-hidden />
            <span className="font-medium text-foreground">{business.name}</span>
          </nav>

          {/* HEADER CARD — logo overlaps cover when present */}
          <div className={`rounded-3xl border bg-card p-6 shadow-lg sm:p-8 ${business.coverUrl ? "-mt-10 sm:-mt-14" : "mt-4"}`}>
            {/* Eyebrow */}
            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Business</span>
              <span className="text-foreground/30">·</span>
              <span>Lompoc, California</span>
              {business.category && (
                <>
                  <span className="text-foreground/30">·</span>
                  <span>{business.category.name}</span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Logo */}
              <div className="flex-shrink-0">
                {business.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logoUrl}
                    alt={`${business.name} logo`}
                    className="h-20 w-20 rounded-2xl border-2 border-background bg-background object-cover shadow-md sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-gradient-to-br from-primary/15 to-accent shadow-md sm:h-24 sm:w-24">
                    <Flower2 className="h-9 w-9 text-primary/60" />
                  </div>
                )}
              </div>

              {/* Title block */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
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
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {business.description}
                  </p>
                )}

                {/* Trust strip */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {itemCount} active{" "}
                    {itemCount === 1 ? itemLabel : `${itemLabel}s`}
                  </span>
                  <span className="text-foreground/30">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Listed since{" "}
                    {format(new Date(business.createdAt), "MMM yyyy")}
                  </span>
                </div>

                {/* Social links + Google reviews */}
                <BusinessSocialLinks
                  links={{
                    instagramUrl: business.instagramUrl,
                    facebookUrl: business.facebookUrl,
                    tiktokUrl: business.tiktokUrl,
                    youtubeUrl: business.youtubeUrl,
                    yelpUrl: business.yelpUrl,
                    googleBusinessUrl: business.googleBusinessUrl,
                  }}
                  reviewUrl={reviewsUrl}
                />
              </div>
            </div>

            {/* Contact chips inside the header card */}
            <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
              {business.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    business.address
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs text-foreground transition-colors duration-150 hover:bg-secondary"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {business.address}
                </a>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone.replace(/[^0-9+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs text-foreground transition-colors duration-150 hover:bg-secondary"
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
                  className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs text-foreground transition-colors duration-150 hover:bg-secondary"
                >
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          2-COLUMN BODY
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* MAIN — active deals OR listings depending on category */}
          <div>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {isRealEstate ? "Active listings" : "Active deals"}
              </h2>
              <p className="text-sm text-muted-foreground">
                from {business.name}
              </p>
            </div>
            {isRealEstate ? (
              <PropertyListingGrid listings={listings} />
            ) : (
              <DealGrid
                deals={deals}
                viewer={viewer}
                fromPath={`/biz/${params.slug}`}
              />
            )}
          </div>

          {/* SIDEBAR — map + hours */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {business.lat != null && business.lng != null && (
              <div className="overflow-hidden rounded-2xl border shadow-sm">
                <div className="h-64">
                  <BusinessMapLoader
                    lat={business.lat}
                    lng={business.lng}
                    name={business.name}
                  />
                </div>
                {business.address && (
                  <div className="border-t bg-card px-4 py-3 text-xs text-muted-foreground">
                    <MapPin className="mr-1 inline h-3 w-3 text-primary" />
                    {business.address}
                  </div>
                )}
              </div>
            )}
            <BusinessHours hoursJson={business.hoursJson} />
          </aside>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          CLAIM CTA (only when business is owned by system@)
         ───────────────────────────────────────────────── */}
      {isUnclaimed && (
        <section className="mx-auto mb-16 max-w-6xl px-4">
          <BusinessClaimCta slug={params.slug} />
        </section>
      )}
    </>
  )
}
