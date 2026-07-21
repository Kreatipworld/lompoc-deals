import { Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
export const dynamic = "force-dynamic"
import {
  Store,
  MapPin,
  Phone,
  Globe,
  ArrowRight,
  Tag,
} from "lucide-react"
import { db } from "@/db/client"
import {
  getDealsByCategorySlug,
  getAllRealEstateListings,
  getBusinessesByCategorySlug,
} from "@/lib/queries"
import { filterOpenNow } from "@/lib/hours"
import { getViewer } from "@/lib/viewer"
import { FeaturedRow } from "@/components/featured-row"
import { SponsorShowcase } from "@/components/sponsor-showcase"
import { DealGrid } from "@/components/deal-card"
import { PropertyListingGrid } from "@/components/property-listing-card"
import { CategoryChips } from "@/components/category-chips"
import { SearchBar } from "@/components/search-bar"
import { BusinessAvatar } from "@/components/business-avatar"
import { PageHeader } from "@/components/page-header"
import { getTranslations } from "next-intl/server"
import { pageAlternates } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, params.slug),
  })
  if (!cat) return { title: "Category — Lompoc Locals" }
  const catLower = cat.name.toLowerCase()
  return {
    title: `Lompoc ${cat.name} Businesses & Deals — Local Directory | Lompoc Locals`,
    description: `Browse ${catLower} businesses in Lompoc, CA — local listings, active deals, and coupons. Updated daily.`,
    keywords: [`lompoc ${catLower}`, `lompoc ${catLower} businesses`, `lompoc ${catLower} deals`, "lompoc ca"],
    alternates: pageAlternates(`/category/${params.slug}`),
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string; locale: string }
  searchParams?: { tab?: string; open?: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "category" })

  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, params.slug),
  })
  if (!cat) notFound()

  const isRealEstate = params.slug === "real-estate"
  const tab =
    searchParams?.tab === "rent"
      ? "for-rent"
      : searchParams?.tab === "sale"
        ? "for-sale"
        : null
  const openNow = searchParams?.open === "1"

  const [allCategoryBusinesses, deals, listings, viewer] = await Promise.all([
    isRealEstate ? Promise.resolve([]) : getBusinessesByCategorySlug(params.slug),
    isRealEstate ? Promise.resolve([]) : getDealsByCategorySlug(params.slug),
    isRealEstate ? getAllRealEstateListings(tab ?? undefined) : Promise.resolve([]),
    getViewer(),
  ])
  const categoryBusinesses = openNow ? filterOpenNow(allCategoryBusinesses) : allCategoryBusinesses

  // Preserve other existing searchParams (e.g. ?tab=) when toggling ?open=1
  const toggledParams = new URLSearchParams()
  if (searchParams?.tab) toggledParams.set("tab", searchParams.tab)
  if (!openNow) toggledParams.set("open", "1")
  const openToggleHref = `/category/${params.slug}${
    toggledParams.toString() ? `?${toggledParams.toString()}` : ""
  }`

  // For real-estate, show listing count; for others, show business count
  const heroCount = isRealEstate ? listings.length : categoryBusinesses.length
  const heroLabel = isRealEstate
    ? heroCount === 1 ? t("listingSingular") : t("listingPlural")
    : heroCount === 1 ? t("businessSingular") : t("businessPlural")

  return (
    <>
      <PageHeader
        title={cat.name}
        backHref="/businesses"
        backLabel={t("allBusinesses")}
        meta={
          <>
            {heroCount} {heroLabel} {t("inLompoc")}
            {!isRealEstate && deals.length > 0 && (
              <> · {deals.length} {deals.length === 1 ? t("dealSingular") : t("dealPlural")}</>
            )}
          </>
        }
      >
        <div className="w-full lg:max-w-md">
          <SearchBar scrim />
        </div>
      </PageHeader>

      {/* CHIPS */}
      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <CategoryChips
            activeSlug={params.slug}
            openNow={
              isRealEstate
                ? undefined
                : { active: openNow, href: openToggleHref, label: t("openNowFilter") }
            }
          />
        </div>
      </section>

      {/* FEATURED MEMBERS — category member slide (like the landing page) */}
      <SponsorShowcase categorySlug={params.slug} />

      {/* REAL ESTATE: tabs + property grid */}
      {isRealEstate && (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="mb-6 flex items-center gap-2 border-b">
            <Link
              href={`/category/${params.slug}`}
              className={`relative -mb-px border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition ${
                !tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tabAll")}
            </Link>
            <Link
              href={`/category/${params.slug}?tab=sale`}
              className={`relative -mb-px border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition ${
                tab === "for-sale"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tabForSale")}
            </Link>
            <Link
              href={`/category/${params.slug}?tab=rent`}
              className={`relative -mb-px border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition ${
                tab === "for-rent"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tabForRent")}
            </Link>
          </div>
          <PropertyListingGrid listings={listings} />
        </section>
      )}

      {/* NON-REAL-ESTATE: business listings (primary) */}
      {!isRealEstate && (
        <>
          <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
            {categoryBusinesses.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                {t("noBusinesses")}
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryBusinesses.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/biz/${b.slug}`}
                      className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <BusinessAvatar
                          logoUrl={b.logoUrl}
                          photoUrl={b.photoUrl}
                          name={b.name}
                          className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl"
                          icon={<Store className="h-5 w-5 text-primary/70" />}
                        />
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight line-clamp-2">
                            {b.name}
                          </h3>
                          {b.activeDealCount > 0 && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              <Tag className="h-3 w-3" />
                              {b.activeDealCount}{" "}
                              {b.activeDealCount === 1 ? t("dealSingular") : t("dealPlural")}
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
                        {t("viewProfile")}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* PREMIUM FEATURED ROW — scoped to this category; renders null when no premium deals */}
          <FeaturedRow viewer={viewer} categorySlug={params.slug} fromPath={`/category/${params.slug}`} />

          {/* DEALS: secondary section */}
          {deals.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-10">
              <div className="mb-6 border-t pt-8 sm:pt-10">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {t("activeDealsIn", { name: cat.name })}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("dealsAvailable", { count: deals.length, label: deals.length === 1 ? t("dealSingular") : t("dealPlural") })}
                </p>
              </div>
              <DealGrid
                deals={deals}
                viewer={viewer}
                fromPath={`/category/${params.slug}`}
              />
            </section>
          )}
        </>
      )}
    </>
  )
}
