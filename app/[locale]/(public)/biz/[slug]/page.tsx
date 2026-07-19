import { notFound, permanentRedirect } from "next/navigation"
import { FeaturedDeals } from "@/components/featured-deals"
import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
import {
  MapPin,
  Phone,
  Globe,
  ArrowLeft,
  Store,
  Sparkles,
  Calendar,
  Navigation,
  Bell,
  BadgeCheck,
} from "lucide-react"
import { getBusinessBySlug, getListingsByBusinessId, getRelatedBusinesses } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { bumpViewCounts } from "@/lib/tracking"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
import { headers } from "next/headers"
import { DealGrid } from "@/components/deal-card"
import { PropertyListingGrid } from "@/components/property-listing-card"
import { BusinessSocialLinks } from "@/components/business-social-links"
import { BusinessHours } from "@/components/business-hours"
import { BusinessMapLoader } from "@/components/business-map-loader"
import { BusinessClaimCta } from "@/components/business-claim-cta"
import { FollowBusinessButton } from "@/components/follow-business-button"
import { BusinessPhotoGallery } from "@/components/business-photo-gallery"
import { BusinessAbout } from "@/components/business-about"
import { SafeImage } from "@/components/safe-image"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { buildLocalBusinessJsonLd } from "@/lib/business-jsonld"
import { pageAlternates } from "@/lib/seo"

const SYSTEM_OWNER_EMAIL = "system@lompocdeals.test"

// Profiles are living data (enrichment sweeps, claims, unpublishes). Without
// revalidation, a page cached while approved keeps serving after unpublish.
export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const [data, t] = await Promise.all([
    getBusinessBySlug(params.slug),
    getTranslations("businesses.profile"),
  ])
  if (!data) return { title: t("metaNotFound") }
  const { name, description, about } = data.business
  const catLabel = data.business.category?.name ?? "local business"
  const fallbackDescription = t("metaFallbackDescription", { name, catLabel })
  // Prefer the longer About copy (truncated) for the meta description.
  const aboutSnippet = about?.trim()
    ? about.trim().slice(0, 155).replace(/\s+\S*$/, "") + (about.trim().length > 155 ? "…" : "")
    : null
  const metaDescription = aboutSnippet ?? description ?? fallbackDescription
  return {
    title: `${name} — ${t("metaTitleSuffix")}`,
    description: metaDescription,
    keywords: [name, catLabel, "Lompoc CA", "Lompoc"],
    alternates: pageAlternates(`/biz/${params.slug}`),
    openGraph: {
      title: `${name} ${t("metaOgSuffix")}`,
      description: metaDescription,
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
  params: { slug: string; locale: string }
}) {
  const [data, viewer, t, tsp] = await Promise.all([
    getBusinessBySlug(params.slug),
    getViewer(),
    getTranslations("businesses.profile"),
    getTranslations("sponsors"),
  ])
  if (!data) {
    if (params.slug.startsWith("demo-")) {
      const strippedSlug = params.slug.replace(/^demo-/, "")
      const suffixedSlug = `${strippedSlug}-lompoc`
      const [strippedMatch, suffixedMatch] = await Promise.all([
        getBusinessBySlug(strippedSlug),
        getBusinessBySlug(suffixedSlug),
      ])
      if (strippedMatch) {
        permanentRedirect(`/biz/${strippedSlug}`)
      }
      if (suffixedMatch) {
        permanentRedirect(`/biz/${suffixedSlug}`)
      }
    }
    notFound()
  }
  const { business, deals } = data
  const isRealEstate = business.category?.slug === "real-estate"

  const relatedBusinesses = await getRelatedBusinesses(
    business.categoryId,
    business.id,
    4
  )

  // For real estate businesses, fetch property listings instead
  const listings = isRealEstate
    ? await getListingsByBusinessId(business.id)
    : []

  const activeDeals = deals.filter((d) => new Date(d.expiresAt) > new Date())
  const itemCount = isRealEstate ? listings.length : activeDeals.length
  const itemLabel = isRealEstate
    ? itemCount === 1 ? t("listingSingular") : t("listingPlural")
    : itemCount === 1 ? t("dealSingular") : t("dealPlural")

  if (!isRealEstate && deals.length > 0) {
    void bumpViewCounts(deals.map((d) => d.id))
  }

  // Emit business_page_viewed after 404 check so we don't track missing pages
  const locale = (params.locale === "es" ? "es" : "en") as "en" | "es"
  const ref = headers().get("referer") ?? undefined
  void track("business_page_viewed", {
    userId: viewer.userId ?? null,
    sessionId: getSessionId(),
    targetType: "business",
    targetId: business.id,
    props: { locale, referrer: ref },
  })

  const isUnclaimed = business.ownerEmail === SYSTEM_OWNER_EMAIL
  const reviewsUrl = googleReviewsUrl(business)

  // Build photo array: photosJson takes priority, then fall back to coverUrl
  const photosJson = business.photosJson as string[] | null
  const photos: string[] =
    Array.isArray(photosJson) && photosJson.length > 0
      ? photosJson
      : business.coverUrl
      ? [business.coverUrl]
      : []

  const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  const jsonLd = buildLocalBusinessJsonLd(business, {
    siteUrl,
    amenities: (business.amenitiesJson as string[] | null) ?? [],
    photos,
    categorySlug: business.category?.slug ?? null,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* ─────────────────────────────────────────────────
          COVER IMAGE BANNER (full-width, above header card)
         ───────────────────────────────────────────────── */}
      <BusinessPhotoGallery photos={photos} businessName={business.name} logoUrl={business.logoUrl} />

      {/* ─────────────────────────────────────────────────
          HEADER CARD — logo + name + meta
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-background via-background to-background"
        />

        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {/* HEADER CARD — logo + name + meta */}
          <div className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8 mt-4">
          {/* Breadcrumb — inside the card to prevent overlap with cover */}
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors duration-150 hover:text-foreground">
              {t("breadcrumbHome")}
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
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Logo */}
              <div className="flex-shrink-0">
                {business.logoUrl ? (
                  <SafeImage
                    src={business.logoUrl}
                    alt={`${business.name} logo`}
                    className="h-20 w-20 rounded-2xl border-2 border-background bg-background object-cover shadow-md sm:h-24 sm:w-24"
                    fallback={
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-gradient-to-br from-primary/15 to-accent shadow-md sm:h-24 sm:w-24">
                        <Store className="h-9 w-9 text-primary/60" />
                      </div>
                    }
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-gradient-to-br from-primary/15 to-accent shadow-md sm:h-24 sm:w-24">
                    <Store className="h-9 w-9 text-primary/60" />
                  </div>
                )}
              </div>

              {/* Title block */}
              <div className="flex-1 space-y-3">
                <div>
                  {business.planOverride === "premium" && (
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {tsp("officialPartnerGeneric")}
                    </span>
                  )}
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
                    {t("trustActiveItem", { count: itemCount, label: itemLabel })}
                  </span>
                  <span className="text-foreground/30">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t("trustListed", {
                      date: format(new Date(business.createdAt), "MMM yyyy"),
                    })}
                  </span>
                  {viewer.isLocal && (
                    <>
                      <span className="text-foreground/30">·</span>
                      <FollowBusinessButton
                        businessId={business.id}
                        slug={params.slug}
                        isFollowing={viewer.followedBusinessIds.has(business.id)}
                        labels={{ follow: t("follow"), following: t("following") }}
                      />
                    </>
                  )}
                  {!viewer.isAuthed && (
                    <>
                      <span className="text-foreground/30">·</span>
                      <Link
                        href={`/login?from=${encodeURIComponent(`/biz/${params.slug}`)}`}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-secondary"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        {t("follow")}
                      </Link>
                    </>
                  )}
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
              {business.address && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    business.address
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {t("getDirections")}
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
          ABOUT THIS PLACE — long-form copy + amenities
         ───────────────────────────────────────────────── */}
      <div className="mt-6">
        <BusinessAbout
          about={business.about}
          amenities={business.amenitiesJson as string[] | null}
          source={{ about: business.aboutSource, amenities: business.amenitiesSource }}
        />
      </div>

      {/* ─────────────────────────────────────────────────
          2-COLUMN BODY
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* MAIN — active deals OR listings depending on category */}
          <div>
            {(isRealEstate || deals.length > 0) && (
              <div className="mb-6 flex items-end justify-between">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {isRealEstate ? t("sectionActiveListings") : t("sectionActiveDeals")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("sectionFrom", { name: business.name })}
                </p>
              </div>
            )}
            {isRealEstate ? (
              <PropertyListingGrid listings={listings} />
            ) : deals.length > 0 ? (
              <DealGrid
                deals={deals}
                viewer={viewer}
                fromPath={`/biz/${params.slug}`}
              />
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-base font-semibold">{t("noDealsYetTitle")}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t("noDealsYetBody", { name: business.name })}
                  </p>
                </div>
                {viewer.isLocal && (
                  <FollowBusinessButton
                    businessId={business.id}
                    slug={params.slug}
                    isFollowing={viewer.followedBusinessIds.has(business.id)}
                    labels={{ follow: t("follow"), following: t("following") }}
                  />
                )}
                {!viewer.isAuthed && (
                  <Link
                    href={`/login?from=${encodeURIComponent(`/biz/${params.slug}`)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-secondary"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {t("follow")}
                  </Link>
                )}
              </div>
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
            <BusinessHours hoursJson={business.hoursJson} phone={business.phone} />
          </aside>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          CLAIM CTA — demoted below the fold so unclaimed profiles lead with content
         ───────────────────────────────────────────────── */}
      {isUnclaimed && (
        <section className="mx-auto mt-6 max-w-6xl px-4">
          <BusinessClaimCta slug={params.slug} />
        </section>
      )}

      {/* ─────────────────────────────────────────────────
          OWNER CTA — footer link to /for-businesses (all businesses)
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-10 text-center">
        <Link
          href="/for-businesses"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {t("ownerCta")}
        </Link>
      </section>

      {relatedBusinesses.length > 0 && business.category && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mt-12 border-t pt-8">
            <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">
              {t("moreInCategory", { category: business.category.name })}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {relatedBusinesses.map((rb) => (
                <li key={rb.slug}>
                  <Link
                    href={`/biz/${rb.slug}`}
                    className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary"
                  >
                    <span className="truncate">{rb.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <FeaturedDeals excludeBusinessId={business.id} />
    </>
  )
}
