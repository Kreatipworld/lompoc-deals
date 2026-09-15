import { Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
export const dynamic = "force-dynamic"
import { ArrowRight, Home } from "lucide-react"
import { db } from "@/db/client"
import {
  getDealsByCategorySlug,
  getAllRealEstateListings,
  getBusinessesByCategorySlug,
} from "@/lib/queries"
import { filterOpenNow, isOpenNow, parseHours, DAY_KEYS } from "@/lib/hours"
import { FIND_TERMS } from "@/lib/find-terms"
import { searchAll, businessesBySlugs } from "@/lib/search"
import { CategoryList } from "@/components/directory/category-list"
import { getViewer } from "@/lib/viewer"
import { FeaturedRow } from "@/components/featured-row"
import { SponsorShowcase } from "@/components/sponsor-showcase"
import { DealGrid } from "@/components/deal-card"
import { PropertyListingGrid } from "@/components/property-listing-card"
import { CategoryChips } from "@/components/category-chips"
import { SearchBar } from "@/components/search-bar"
import { PageHeader } from "@/components/page-header"
import { getTranslations } from "next-intl/server"
import { pageAlternates } from "@/lib/seo"
import { categoryLabel } from "@/lib/category-label"

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string }
}) {
  const [cat, tMeta, tLabels] = await Promise.all([
    db.query.categories.findFirst({
      where: (c, { eq }) => eq(c.slug, params.slug),
    }),
    getTranslations({ locale: params.locale, namespace: "siteMeta" }),
    getTranslations({ locale: params.locale, namespace: "categoryLabels" }),
  ])
  if (!cat) return { title: tMeta("categoryNotFound") }
  // DB names are English-only ("Food & Drink"); the label helper localizes them.
  const label = categoryLabel(tLabels, cat.slug, cat.name)
  const labelLower = label.toLowerCase()
  return {
    title: tMeta("categoryTitle", { category: label }),
    description: tMeta("categoryDescription", { category: labelLower }),
    keywords: [`lompoc ${labelLower}`, `${labelLower} lompoc`, `lompoc ${labelLower} deals`, "lompoc ca"],
    alternates: pageAlternates(`/category/${params.slug}`, params.locale),
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
    isRealEstate ? Promise.resolve([]) : getBusinessesByCategorySlug(params.slug, params.locale),
    isRealEstate ? Promise.resolve([]) : getDealsByCategorySlug(params.slug, 50, params.locale),
    isRealEstate ? getAllRealEstateListings(tab ?? undefined) : Promise.resolve([]),
    getViewer(),
  ])
  const categoryBusinesses = openNow ? filterOpenNow(allCategoryBusinesses) : allCategoryBusinesses
  const localeKey = params.locale === "es" ? "es" : "en"
  // Quick picks: only the find pages that actually return businesses (owner: "the
  // guidance has to be perfect" — never a chip that lands on an empty page).
  const quickCandidates = FIND_TERMS.filter((f) => f.category === params.slug && f.kind === "businesses")
  const quickCounts = await Promise.all(
    quickCandidates.map(async (f) => {
      const [r, picked] = await Promise.all([searchAll(f.query, localeKey), businessesBySlugs(f.include ?? [], localeKey)])
      const excluded = new Set(f.exclude ?? [])
      const n = [...picked, ...r.businesses.filter((b) => !picked.some((x) => x.id === b.id))].filter((b) => !excluded.has(b.slug)).length
      return n
    })
  )
  const quick = quickCandidates.filter((_, i) => quickCounts[i] > 0)
  const tLabels = await getTranslations({ locale: params.locale, namespace: "categoryLabels" })
  const catName = categoryLabel(tLabels, cat.slug, cat.name)

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

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: categoryBusinesses.slice(0, 25).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${process.env.AUTH_URL ?? "http://localhost:3000"}/biz/${b.slug}`,
      name: b.name,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHeader
        title={t("headingGeo", { name: catName })}
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
          <Link
            href="/homes"
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            {t("quickHomes")}
            <ArrowRight className="h-4 w-4" />
          </Link>
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
          <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            {quick.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("quickHeading")}</span>
                {quick.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/find/${f.slug}`}
                    className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    {f.title[localeKey]}
                  </Link>
                ))}
              </div>
            )}
            <CategoryList
              items={categoryBusinesses.map((b) => {
                const hours = parseHours(b.hoursJson)
                const known = DAY_KEYS.some((k) => hours[k] !== null)
                return {
                  id: b.id,
                  name: b.name,
                  slug: b.slug,
                  description: b.description,
                  address: b.address,
                  logoUrl: b.logoUrl,
                  photoUrl: b.photoUrl,
                  activeDealCount: b.activeDealCount,
                  tier: b.tier,
                  openNow: known ? isOpenNow(hours) : null,
                }
              })}
              labels={{
                searchWithin: t("searchWithin", { name: catName }),
                sortMembers: t("sortMembers"),
                sortAz: t("sortAz"),
                showMore: t("showMore"),
                countLabel: t("countLabel", { count: "{count}" }),
                member: t("memberBadge"),
                dealSingular: t("dealSingular"),
                dealPlural: t("dealPlural"),
                openNow: t("openNow"),
                noMatch: t("noMatch"),
              }}
            />
          </section>

          {/* PREMIUM FEATURED ROW — scoped to this category; renders null when no premium deals */}
          <FeaturedRow viewer={viewer} categorySlug={params.slug} fromPath={`/category/${params.slug}`} />

          {/* DEALS: secondary section */}
          {deals.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-10">
              <div className="mb-6 border-t pt-8 sm:pt-10">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {t("activeDealsIn", { name: catName })}
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
