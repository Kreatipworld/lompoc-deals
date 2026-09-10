import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowRight, KeyRound, MapPin } from "lucide-react"
import { getAllRealEstateListings } from "@/lib/queries"
import { PropertyListingCard } from "@/components/property-listing-card"
import { HomesMap, type HomePin } from "@/components/homes-map"
import { pageAlternates } from "@/lib/seo"

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
  const tab = searchParams?.tab === "rent" ? "for-rent" : searchParams?.tab === "sale" ? "for-sale" : undefined
  const [t, listings] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "homes" }),
    getAllRealEstateListings(tab),
  ])
  const pins: HomePin[] = listings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({ id: l.id, title: l.title, priceCents: l.priceCents, type: l.type, lat: l.lat!, lng: l.lng!, imageUrl: l.imageUrl }))

  const tabs = [
    { key: undefined, label: t("tabAll") },
    { key: "sale", label: t("tabSale") },
    { key: "rent", label: t("tabRent") },
  ] as const

  return (
    <main className="pb-20">
      {/* Header */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-10 sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">{t("heading")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("subheading")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {tabs.map((tb) => {
              const active = (tb.key ?? undefined) === (searchParams?.tab === "rent" || searchParams?.tab === "sale" ? searchParams.tab : undefined)
              return (
                <Link
                  key={tb.label}
                  href={tb.key ? `/homes?tab=${tb.key}` : "/homes"}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    active ? "bg-primary text-primary-foreground shadow-sm" : "border bg-card text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {tb.label}
                </Link>
              )
            })}
            <span className="ml-auto text-sm text-muted-foreground">
              {listings.length === 1 ? t("countOne", { count: 1 }) : t("countMany", { count: listings.length })}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8">
        {listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyBody")}</p>
            <Link
              href="/for-businesses/real-estate"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("emptyCta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {pins.length > 0 && (
              <div className="mb-8 overflow-hidden rounded-3xl border shadow-sm">
                <div className="h-[320px] sm:h-[400px]">
                  <HomesMap homes={pins} labels={{ forSale: t("tabSale"), forRent: t("tabRent") }} />
                </div>
                <p className="flex items-center gap-1.5 border-t bg-card px-4 py-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {t("mapHint")}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <PropertyListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Agent CTA */}
      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="flex flex-col items-start gap-5 rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">{t("ctaTitle")}</h2>
            <p className="mt-1 max-w-xl text-sm text-primary-foreground/85">{t("ctaBody")}</p>
          </div>
          <Link
            href="/for-businesses/real-estate"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-[#241629] hover:opacity-90"
          >
            {t("ctaButton")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
