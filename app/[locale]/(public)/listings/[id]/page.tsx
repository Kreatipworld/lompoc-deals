import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, ArrowRight, Store } from "lucide-react"
import { getAllRealEstateListings, getListingById } from "@/lib/queries"
import { BusinessMapLoader } from "@/components/business-map-loader"
import { SafeImage } from "@/components/safe-image"
import {
  PhotoPlaceholder,
  PropertyListingCard,
  formatFacts,
  formatListingPrice,
  formatOpenHouse,
  statusLabelFor,
} from "@/components/property-listing-card"
import { PAGE_CONTAINER } from "@/lib/layout-constants"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: { id: string; locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "listing" })
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return { title: "Listing" }
  const listing = await getListingById(id)
  if (!listing) return { title: t("metaNotFound"), robots: { index: false, follow: true } }
  return {
    title: `${listing.title} ${t("metaTitleSuffix")}`.trim(),
    description: listing.description ?? undefined,
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-3 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  )
}

export default async function ListingPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const [t, tc] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "listing" }),
    getTranslations({ locale: params.locale, namespace: "propertyCard" }),
  ])
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()
  const listing = await getListingById(id)
  if (!listing) notFound()

  const intl = params.locale === "es" ? "es-US" : "en-US"
  const isLive = listing.status === "active"
  const isForSale = listing.type === "for-sale"
  const statusLabel = statusLabelFor(listing, tc)
  const openHouse =
    listing.openHouseAt && listing.openHouseAt.getTime() > Date.now()
      ? formatOpenHouse(listing.openHouseAt, intl)
      : null
  const facts = formatFacts(listing, tc, intl)
  const price = formatListingPrice(listing.priceCents, listing.type, intl)

  const photos = (listing.photosJson as string[] | null) ?? []
  const allPhotos =
    listing.imageUrl && !photos.includes(listing.imageUrl)
      ? [listing.imageUrl, ...photos]
      : photos.length
        ? photos
        : listing.imageUrl
          ? [listing.imageUrl]
          : []

  // More homes: the rest of the live market, newest first.
  const moreHomes = (await getAllRealEstateListings(undefined, 4)).filter((l) => l.id !== listing.id).slice(0, 3)

  // Agent card, same shape as the profile sidebar.
  const [agentName, brokerage] = listing.business.name.split(" · ").map((s) => s.trim())
  const avatar = listing.business.logoUrl ?? listing.business.coverUrl ?? null
  const contactEmail =
    listing.business.email && !listing.business.email.endsWith("lompocdeals.system") ? listing.business.email : null
  const tel = listing.business.phone ? `tel:${listing.business.phone.replace(/[^\d+]/g, "")}` : null
  const showingHref = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(t("showingSubject", { address: listing.address ?? listing.title }))}`
    : tel
  const contactHref = tel ?? showingHref

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description ?? undefined,
    url: `https://www.lompoclocals.com/listings/${listing.id}`,
    image: allPhotos.length ? allPhotos : undefined,
    offers: {
      "@type": "Offer",
      price: (listing.priceCents / 100).toFixed(0),
      priceCurrency: "USD",
      availability: isLive ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    ...(listing.address
      ? { address: { "@type": "PostalAddress", streetAddress: listing.address, addressLocality: "Lompoc", addressRegion: "CA" } }
      : {}),
    ...(listing.lat != null && listing.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng } }
      : {}),
    seller: { "@type": "RealEstateAgent", name: listing.business.name, telephone: listing.business.phone ?? undefined },
  }

  const agentCard = (
    <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        {avatar ? (
          <SafeImage
            src={avatar}
            alt={agentName}
            className="h-14 w-14 flex-shrink-0 rounded-xl object-cover ring-1 ring-black/[0.06]"
            fallback={<div className="h-14 w-14 flex-shrink-0 rounded-xl bg-primary/[0.08]" />}
          />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
            <Store className="h-6 w-6" strokeWidth={1.5} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{t("listedByLabel")}</p>
          <Link href={`/biz/${listing.business.slug}`} className="block truncate font-display text-base font-semibold leading-tight hover:underline">
            {agentName}
          </Link>
          {brokerage && <p className="truncate text-xs text-muted-foreground">{brokerage}</p>}
        </div>
      </div>
      <div className="space-y-2 px-5 py-4 text-sm">
        {listing.business.phone && tel && (
          <a href={tel} className="block font-medium hover:text-primary">
            {listing.business.phone}
          </a>
        )}
        {listing.business.instagramUrl && (
          <a href={listing.business.instagramUrl} target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-primary">
            Instagram
          </a>
        )}
        {listing.business.website && (
          <a href={listing.business.website} target="_blank" rel="noreferrer" className="block truncate text-muted-foreground hover:text-primary">
            {listing.business.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t px-5 py-4">
        {showingHref && (
          <a
            href={showingHref}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("requestShowing")}
          </a>
        )}
        <Link href={`/biz/${listing.business.slug}`} className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
          {t("viewBrokerage")}
        </Link>
      </div>
    </div>
  )

  return (
    <main className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Breadcrumb */}
      <div className={`${PAGE_CONTAINER} pt-6`}>
        <Link href="/homes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("backToHomes")}
        </Link>
      </div>

      {/* Gallery hero: main photo + thumbnails */}
      <section className={`${PAGE_CONTAINER} pt-5`}>
        <div className={`grid gap-3 ${allPhotos.length > 1 ? "md:grid-cols-[2fr_1fr]" : ""}`}>
          <div className="overflow-hidden rounded-[20px] border border-border/80 bg-primary/[0.04]">
            <div className="aspect-[16/10] w-full md:aspect-auto md:h-[460px]">
              {allPhotos.length > 0 ? (
                <SafeImage
                  src={allPhotos[0]}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                  fallback={<PhotoPlaceholder label={tc("photosComing")} />}
                />
              ) : (
                <PhotoPlaceholder label={tc("photosComing")} />
              )}
            </div>
          </div>
          {allPhotos.length > 1 && (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:grid-rows-2 md:h-[460px]">
              {allPhotos.slice(1, 3).map((url, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden rounded-[16px] border border-border/80 md:aspect-auto md:h-full">
                  <SafeImage src={url} alt={`${listing.title} ${i + 2}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
        {allPhotos.length > 3 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {allPhotos.slice(3).map((url, i) => (
              <div key={i} className="aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-xl border border-border/80 sm:w-44">
                <SafeImage src={url} alt={`${listing.title} ${i + 4}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Body */}
      <section className={`${PAGE_CONTAINER} pt-10`}>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          {/* MAIN */}
          <article className="min-w-0">
            {/* Header block: price · facts · address · status */}
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                    isLive ? "bg-primary/[0.08] text-primary" : "bg-foreground/85 text-background"
                  }`}
                >
                  {statusLabel}
                </span>
                {openHouse && (
                  <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold-foreground">
                    {t("openHouse")} · {openHouse}
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl">{price}</h1>
              {facts && (
                <p className="mt-3 text-base text-foreground/90 tabular-nums">
                  {facts} <span className="text-muted-foreground">- {isForSale ? t("factTypeSale") : t("factTypeRent")}</span>
                </p>
              )}
              {listing.address && <p className="mt-1 text-base text-muted-foreground">{listing.address}</p>}

              {/* Contact row */}
              <div className="mt-6 flex flex-wrap gap-2">
                {showingHref && (
                  <a
                    href={showingHref}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    {t("requestShowing")}
                  </a>
                )}
                {contactHref && (
                  <a
                    href={contactHref}
                    className="inline-flex items-center justify-center rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-foreground/30"
                  >
                    {t("contactAgentBtn")}
                  </a>
                )}
              </div>
            </header>

            {/* What's special */}
            {listing.description && (
              <div className="mt-12 max-w-prose">
                <h2 className="font-display text-xl font-semibold tracking-tight">{t("whatsSpecial")}</h2>
                <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground/85">{listing.description}</p>
              </div>
            )}

            {/* Facts & features */}
            <div className="mt-12">
              <h2 className="font-display text-xl font-semibold tracking-tight">{t("factsFeatures")}</h2>
              <dl className="mt-3 max-w-md">
                <Fact label={t("factType")} value={isForSale ? t("factTypeSale") : t("factTypeRent")} />
                <Fact label={t("factStatus")} value={statusLabel} />
                {listing.beds != null && <Fact label={t("factBeds")} value={String(listing.beds)} />}
                {listing.baths != null && <Fact label={t("factBaths")} value={String(listing.baths)} />}
                <Fact label={t("factSqft")} value={listing.sqft != null ? listing.sqft.toLocaleString(intl) : t("factNa")} />
                <Fact label={t("factYearBuilt")} value={listing.yearBuilt != null ? String(listing.yearBuilt) : t("factNa")} />
                <Fact label={t("factLot")} value={t("factNa")} />
                {openHouse && <Fact label={t("factOpenHouse")} value={openHouse} />}
              </dl>
            </div>

            {/* Neighborhood map */}
            {listing.lat != null && listing.lng != null && (
              <div className="mt-12">
                <h2 className="font-display text-xl font-semibold tracking-tight">{t("neighborhood")}</h2>
                {listing.address && <p className="mt-1 text-sm text-muted-foreground">{listing.address}</p>}
                <div className="mt-3 overflow-hidden rounded-[20px] border border-border/80">
                  <div className="h-72">
                    <BusinessMapLoader lat={listing.lat} lng={listing.lng} name={listing.address ?? listing.title} />
                  </div>
                </div>
              </div>
            )}

            {/* Listed by, inline on the phone (the sidebar carries it on desktop) */}
            <div className="mt-12 lg:hidden">{agentCard}</div>
          </article>

          {/* SIDEBAR — agent card */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">{agentCard}</aside>
        </div>
      </section>

      {/* More homes in Lompoc */}
      {moreHomes.length > 0 && (
        <section className={`${PAGE_CONTAINER} mt-20`}>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t("moreHomes")}</h2>
            <Link href="/homes" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t("seeAllHomes").replace(" →", "")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
            {moreHomes.map((l) => (
              <PropertyListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
