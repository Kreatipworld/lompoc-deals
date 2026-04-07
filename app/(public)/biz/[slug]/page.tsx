import { notFound } from "next/navigation"
import Link from "next/link"
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
import { getBusinessBySlug } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { bumpViewCounts } from "@/lib/tracking"
import { DealGrid } from "@/components/deal-card"
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
  return {
    title: `${data.business.name} — Lompoc Deals`,
    description: data.business.description ?? undefined,
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
  const activeDeals = deals.filter((d) => new Date(d.expiresAt) > new Date())

  if (deals.length > 0) {
    void bumpViewCounts(deals.map((d) => d.id))
  }

  const isUnclaimed = business.ownerEmail === SYSTEM_OWNER_EMAIL
  const reviewsUrl = googleReviewsUrl(business)

  return (
    <>
      {/* COVER */}
      <section className="relative">
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

        {/* HEADER CARD */}
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

                {/* Trust strip */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {activeDeals.length} active{" "}
                    {activeDeals.length === 1 ? "deal" : "deals"}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Listed since {format(new Date(business.createdAt), "MMM yyyy")}
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
          </div>
        </div>
      </section>

      {/* 2-COLUMN BODY */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-8">
            {/* Contact chips */}
            <div className="flex flex-wrap gap-2">
              {business.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
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

            {/* Active deals */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">
                Active deals
              </h2>
              <DealGrid
                deals={deals}
                viewer={viewer}
                fromPath={`/biz/${params.slug}`}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {business.lat != null && business.lng != null && (
              <div className="overflow-hidden rounded-2xl border shadow-sm">
                <div className="h-64">
                  <BusinessMapLoader
                    lat={business.lat}
                    lng={business.lng}
                    name={business.name}
                  />
                </div>
              </div>
            )}
            <BusinessHours hoursJson={business.hoursJson} />
          </aside>
        </div>
      </section>

      {/* CLAIM CTA */}
      {isUnclaimed && (
        <section className="mx-auto mb-16 max-w-6xl px-4">
          <BusinessClaimCta slug={params.slug} />
        </section>
      )}
    </>
  )
}
