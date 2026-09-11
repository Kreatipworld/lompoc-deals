import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowRight, KeyRound } from "lucide-react"
import { getAllRealEstateListings, getFeaturedAgents } from "@/lib/queries"
import { PropertyListingCard } from "@/components/property-listing-card"
import { SafeImage } from "@/components/safe-image"
import { HomesMap, type HomePin } from "@/components/homes-map"
import { pageAlternates } from "@/lib/seo"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

// The market moves at the pace agents post; ten minutes keeps the page fresh
// without hitting the database on every visit.
export const revalidate = 600

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "homes" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/homes", params.locale),
  }
}

export default async function HomesPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams?: { tab?: string }
}) {
  const activeTab = searchParams?.tab === "rent" || searchParams?.tab === "sale" ? searchParams.tab : undefined
  const tab = activeTab === "rent" ? "for-rent" : activeTab === "sale" ? "for-sale" : undefined
  const [t, listings, featuredAgents] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "homes" }),
    getAllRealEstateListings(tab),
    getFeaturedAgents(3),
  ])
  const pins: HomePin[] = listings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({ id: l.id, title: l.title, priceCents: l.priceCents, type: l.type, lat: l.lat!, lng: l.lng!, imageUrl: l.imageUrl }))

  const tabs = [
    { key: undefined, label: t("tabAll") },
    { key: "sale", label: t("tabSale") },
    { key: "rent", label: t("tabRent") },
  ] as const

  const count = listings.length === 1 ? t("countOne", { count: 1 }) : t("countMany", { count: listings.length })
  const hasMap = pins.length > 0

  const map = hasMap && (
    <div className="h-full w-full overflow-hidden rounded-[20px] border border-border/80" aria-label={t("mapAria")}>
      <HomesMap homes={pins} labels={{ forSale: t("tabSale"), forRent: t("tabRent") }} />
    </div>
  )

  // Featured agents: included with Plus while we test. Hidden when none.
  const rail = featuredAgents.length > 0 && (
    <section className={`${PAGE_CONTAINER} pt-8`} data-featured="rail">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">{t("featuredAgentsTitle")}</h2>
        <p className="hidden text-sm text-muted-foreground sm:block">{t("featuredAgentsSub")}</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuredAgents.map((a) => {
          const [agentName, brokerage] = a.name.split(" · ").map((s) => s.trim())
          const avatar = a.logoUrl ?? a.coverUrl
          return (
            <div key={a.id} className="flex items-center gap-4 rounded-[20px] border border-border/80 bg-card px-4 py-4">
              {avatar ? (
                <SafeImage
                  src={avatar}
                  alt={agentName}
                  className="h-14 w-14 flex-shrink-0 rounded-xl object-cover ring-1 ring-black/[0.06]"
                  fallback={<div className="h-14 w-14 flex-shrink-0 rounded-xl bg-primary/[0.08]" />}
                />
              ) : (
                <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-primary/[0.08]" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/biz/${a.slug}`} className="block truncate font-display text-base font-semibold leading-tight hover:underline">
                  {agentName}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {brokerage ? `${brokerage} · ` : ""}
                  {a.homes === 1 ? t("featuredHomesOne", { count: 1 }) : t("featuredHomesMany", { count: a.homes })}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-xs">
                  {a.phone && (
                    <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="font-medium hover:text-primary">
                      {a.phone}
                    </a>
                  )}
                  <Link href={`/biz/${a.slug}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {t("featuredView")}
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )

  return (
    <main className="pb-24">
      {/* Quiet header */}
      <section className={`${PAGE_CONTAINER} pt-10 sm:pt-14`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t("heading")}</h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">{t("subheading")}</p>
      </section>

      {/* Sticky filter row, the way a search-results page keeps its controls in reach */}
      <div className="sticky top-16 z-20 mt-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className={`${PAGE_CONTAINER} flex items-center gap-2 py-3`}>
          {tabs.map((tb) => {
            const active = tb.key === activeTab
            return (
              <Link
                key={tb.label}
                href={tb.key ? `/homes?tab=${tb.key}` : "/homes"}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-primary/[0.06] hover:text-foreground"
                }`}
              >
                {tb.label}
              </Link>
            )
          })}
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">{count}</span>
        </div>
      </div>

      {rail}

      <section className={`${PAGE_CONTAINER} pt-8`}>
        {listings.length === 0 ? (
          <div className="rounded-[20px] border border-dashed px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
              <KeyRound className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyBody")}</p>
            <Link
              href="/for-businesses/real-estate"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("emptyCta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className={hasMap ? "grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,45%)_minmax(0,1fr)] lg:gap-10" : ""}>
            {/* Map: above the list on the phone, a sticky left pane on desktop */}
            {/* Capped so one listing never renders a page-tall grey column; the list defines page height. */}
            {hasMap && (
              <div className="h-[300px] lg:sticky lg:top-[7.5rem] lg:h-[min(calc(100vh-200px),640px)] lg:self-start">{map}</div>
            )}
            <div
              aria-label={t("listAria")}
              className={`grid grid-cols-1 content-start items-start gap-6 sm:grid-cols-2 sm:gap-7 ${hasMap ? "" : "lg:grid-cols-3 lg:gap-8"}`}
            >
              {listings.map((l) => (
                <PropertyListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Restrained agent CTA */}
      <section className={`${PAGE_CONTAINER} mt-16`}>
        <div className="flex flex-col gap-3 rounded-[20px] border border-border/80 bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">{t("ctaTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("ctaBody")}</p>
          </div>
          <Link
            href="/for-businesses/real-estate"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("ctaButton")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
