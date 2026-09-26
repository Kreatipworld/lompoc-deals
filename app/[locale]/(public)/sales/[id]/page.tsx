import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { ArrowLeft, ArrowRight, MapPin, Navigation, Phone, MessageSquare, ShieldCheck, Clock, UserRound } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SaleGallery } from "@/components/sale-gallery"
import { SaleMessageForm } from "@/components/sale-message-form"
import { SaleShareButton } from "@/components/sale-share-button"
import { SaleCard } from "@/components/sale-card"
import { BusinessMapLoader } from "@/components/business-map-loader"
import { getActiveSaleListings, getSaleListingById } from "@/lib/sales-queries"
import { acceptsMessages, formatSalePrice, garageSaleWhen, isPubliclyVisible, phoneHref, sellerFirstName } from "@/lib/sales"
import { inLompocArea } from "@/lib/listing-utils"
import { pick } from "@/lib/localize"
import { pageAlternates, siteUrl } from "@/lib/seo"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

// A listing page is public and cached; anything not publicly visible is a 404
// for everyone (the seller sees "pending" on the post confirmation, the admin in /admin/sales).
// No loading.tsx here on purpose — a skeleton on a notFound() route is a soft 404.
export const revalidate = 300

async function load(idParam: string) {
  const id = parseInt(idParam, 10)
  if (isNaN(id)) return null
  const l = await getSaleListingById(id)
  if (!l || !isPubliclyVisible(l.status)) return null
  return l
}

export async function generateMetadata({ params }: { params: { id: string; locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "sales" })
  const l = await load(params.id)
  if (!l) return { title: t("brand"), robots: { index: false, follow: true } }
  const intl = params.locale === "es" ? "es-US" : "en-US"
  const price = formatSalePrice(l, { free: t("card.free"), obo: t("card.obo") }, intl)
  const title = l.kind === "garage-sale" ? `${l.title} · ${garageSaleWhen(l.startsAt?.toISOString() ?? null, l.endsAt?.toISOString() ?? null, intl) ?? ""}` : `${price} · ${l.title}`
  const desc = pick(params.locale, l.description, l.descriptionEs).trim()
  const description = desc.length > 160 ? desc.slice(0, 160).replace(/\s+\S*$/, "") + "…" : desc
  const path = `/sales/${l.id}`
  return {
    title: { absolute: `${title} | ${t("brand")}` },
    description,
    alternates: pageAlternates(path, params.locale),
    robots: l.status === "active" ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: `${siteUrl}${params.locale === "es" ? "/es" : ""}${path}`,
      siteName: "Lompoc Locals",
      title,
      description,
      images: l.photos?.[0] ? [{ url: l.photos[0] }] : undefined,
    },
    twitter: { card: l.photos?.[0] ? "summary_large_image" : "summary", title, description },
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2.5 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  )
}

export default async function SaleListingPage({ params }: { params: { id: string; locale: string } }) {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "sales" })
  const l = await load(params.id)
  if (!l) notFound()

  const intl = params.locale === "es" ? "es-US" : "en-US"
  const price = formatSalePrice(l, { free: t("card.free"), obo: t("card.obo") }, intl)
  const when = l.kind === "garage-sale" ? garageSaleWhen(l.startsAt?.toISOString() ?? null, l.endsAt?.toISOString() ?? null, intl) : null
  const description = pick(params.locale, l.description, l.descriptionEs)
  const live = acceptsMessages(l.status, l.expiresAt)
  const isGarage = l.kind === "garage-sale"
  // A garage-sale address is public only while the sale is on (spec §5).
  const address = isGarage && live ? l.address : null
  const showPin = !!address && l.lat != null && l.lng != null && inLompocArea(l.lat, l.lng)
  const mapsUrl = address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : null
  const phone = live && l.showPhone && l.contactPhone ? l.contactPhone : null
  const seller = sellerFirstName(l.seller.firstName, t("detail.neighbor"))
  const memberYear = l.seller.memberSince.getFullYear()
  const banner = l.status === "sold" ? t("detail.bannerSold") : !live ? (isGarage ? t("detail.bannerGarageOver") : t("detail.bannerExpired")) : null
  const more = (await getActiveSaleListings(l.category, 5)).filter((m) => m.id !== l.id).slice(0, 4)

  const jsonLd =
    l.status === "active" && l.priceCents != null && l.priceType !== "free"
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: l.title,
          description: l.description,
          image: l.photos?.length ? l.photos : undefined,
          offers: { "@type": "Offer", price: (l.priceCents / 100).toFixed(0), priceCurrency: "USD", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/UsedCondition" },
        }
      : null

  const pinCard = address ? (
    <div className="text-sm">
      <p className="font-display text-base font-bold leading-tight">{l.title}</p>
      {when && <p className="mt-1 text-xs text-muted-foreground">{when}</p>}
      <p className="mt-1 text-xs">{address}</p>
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          <Navigation className="h-3 w-3" /> {t("detail.directions")}
        </a>
      )}
    </div>
  ) : null

  return (
    <main className="pb-24">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}

      <div className={`${PAGE_CONTAINER} pt-6`}>
        <Link href={`/sales/c/${l.category}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t(`categories.${l.category}.name`)}
        </Link>
      </div>

      <section className={`${PAGE_CONTAINER} pt-4`}>
        {banner && (
          <p className="mb-4 rounded-2xl bg-foreground/85 px-4 py-3 text-sm font-medium text-background" data-sale-banner>
            {banner}
          </p>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <div className="min-w-0">
            <SaleGallery photos={l.photos ?? []} title={l.title} noPhotoLabel={isGarage ? t("card.garageSale") : t("card.noPhoto")} />

            <header className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/[0.08] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">{t(`categories.${l.category}.name`)}</span>
                {l.condition && <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold tracking-wide">{t(`conditions.${l.condition}`)}</span>}
              </div>
              {price ? (
                <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl" data-sale-price>
                  {price}
                </p>
              ) : null}
              <h1 className={`font-display font-semibold tracking-tight ${price ? "mt-3 text-2xl" : "mt-3 text-3xl sm:text-4xl"}`}>{l.title}</h1>
              {when && (
                <p className="mt-2 flex items-center gap-1.5 text-base">
                  <Clock className="h-4 w-4 text-primary" /> {when}
                </p>
              )}
              {(address || l.area) && (
                <p className="mt-1 flex items-center gap-1.5 text-base text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {address ?? l.area}
                </p>
              )}
            </header>

            {/* Contact row — the listing owns the buyer */}
            {live && (
              <div className="mt-6 flex flex-wrap gap-2">
                <SaleMessageForm listingId={l.id} />
                {phone && (
                  <>
                    <a href={`tel:${phoneHref(phone)}`} className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent" data-sale-phone="call">
                      <Phone className="h-4 w-4" /> {t("detail.call")}
                    </a>
                    <a href={`sms:${phoneHref(phone)}`} className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent" data-sale-phone="text">
                      <MessageSquare className="h-4 w-4" /> {t("detail.text")}
                    </a>
                  </>
                )}
                <SaleShareButton title={l.title} label={t("detail.share")} copiedLabel={t("detail.copied")} />
              </div>
            )}

            <div className="mt-10 max-w-prose">
              <h2 className="font-display text-xl font-semibold tracking-tight">{t("detail.details")}</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground/85">{description}</p>
            </div>

            {(l.kind === "vehicle" && l.attrs) || l.condition ? (
              <dl className="mt-8 max-w-md">
                {l.kind === "vehicle" && l.attrs?.year != null && <Fact label={t("detail.year")} value={String(l.attrs.year)} />}
                {l.kind === "vehicle" && l.attrs?.make && <Fact label={t("detail.make")} value={l.attrs.make} />}
                {l.kind === "vehicle" && l.attrs?.model && <Fact label={t("detail.model")} value={l.attrs.model} />}
                {l.kind === "vehicle" && l.attrs?.mileage != null && <Fact label={t("detail.mileage")} value={`${l.attrs.mileage.toLocaleString(intl)} mi`} />}
                {l.kind === "vehicle" && l.attrs?.transmission && <Fact label={t("detail.transmission")} value={t(`detail.${l.attrs.transmission}`)} />}
                {l.condition && <Fact label={t("detail.condition")} value={t(`conditions.${l.condition}`)} />}
                {l.area && <Fact label={t("detail.area")} value={l.area} />}
              </dl>
            ) : null}

            {showPin && l.lat != null && l.lng != null && (
              <div className="mt-10">
                <h2 className="font-display text-xl font-semibold tracking-tight">{t("detail.mapTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{address}</p>
                <div className="mt-3 overflow-hidden rounded-[20px] border border-border/80">
                  <div className="h-72" data-sale-map>
                    <BusinessMapLoader lat={l.lat} lng={l.lng} name={l.title} card={pinCard} closeLabel={t("detail.closeCard")} />
                  </div>
                </div>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    <Navigation className="h-3.5 w-3.5" /> {t("detail.directions")}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Seller card. Rendered once — the same element must never appear twice in a Server Component. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[20px] border border-border/80 bg-card px-5 py-4" data-sale-seller>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{t("detail.seller")}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                  <UserRound className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold">{seller}</p>
                  <p className="text-xs text-muted-foreground">{t("detail.memberSince", { year: String(memberYear) })}</p>
                </div>
              </div>
              {live ? (
                <div className="mt-4 flex flex-col gap-2">
                  <SaleMessageForm listingId={l.id} className="w-full" />
                  {phone && (
                    <a href={`tel:${phoneHref(phone)}`} className="block text-center text-sm font-medium text-foreground hover:text-primary">
                      {phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{banner}</p>
              )}
              <p className="mt-4 flex items-start gap-2 border-t pt-3 text-[11px] leading-snug text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span>{t("detail.safety")}</span>
              </p>
            </div>
          </aside>
        </div>
      </section>

      {more.length > 0 && (
        <section className={`${PAGE_CONTAINER} mt-16`}>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t("detail.more", { category: t(`categories.${l.category}.name`) })}</h2>
            <Link href={`/sales/c/${l.category}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t("backToAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {more.map((m) => (
              <SaleCard key={m.id} item={m} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
