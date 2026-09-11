import { Link } from "@/i18n/navigation"
import { Bed, Bath, Maximize, MapPin, Home, CalendarDays } from "lucide-react"
import type { PropertyListing } from "@/lib/queries"
import { SafeImage } from "@/components/safe-image"
import { TiltCard } from "@/components/motion/tilt-card"
import { getLocale, getTranslations } from "next-intl/server"

function formatPrice(cents: number, type: "for-sale" | "for-rent", intl: string): string {
  const dollars = cents / 100
  const formatted = dollars.toLocaleString(intl, { maximumFractionDigits: 0 })
  return type === "for-rent" ? `$${formatted}/mo` : `$${formatted}`
}

// Open house line, always in Pacific time: "Sat, Sep 13 · 11:00 AM"
function formatOpenHouse(at: Date, intl: string): string {
  const day = at.toLocaleDateString(intl, { weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles" })
  const time = at.toLocaleTimeString(intl, { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })
  return `${day} · ${time}`
}

// A branded stand-in for a home whose agent has not uploaded photos yet. It has to
// look deliberate, not broken: a paying realtor's first listing often lands before
// the photos do, and the card is what the whole town sees on /homes.
function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary via-primary/90 to-[#2c0736] text-primary-foreground">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gold/80 bg-white/10">
        <Home className="h-7 w-7" />
      </span>
      <span className="text-xs font-semibold tracking-wide opacity-90">{label}</span>
    </div>
  )
}

export async function PropertyListingCard({
  listing,
}: {
  listing: PropertyListing
}) {
  const [t, locale] = await Promise.all([getTranslations("propertyCard"), getLocale()])
  const intl = locale === "es" ? "es-US" : "en-US"
  const isForSale = listing.type === "for-sale"
  const isLive = listing.status === "active"
  // Status chip: live homes say For sale / For rent; anything else says what happened.
  const statusLabel =
    listing.status === "pending"
      ? t("pending")
      : listing.status === "sold"
        ? t("sold")
        : listing.status === "rented"
          ? t("rented")
          : isForSale
            ? t("forSale")
            : t("forRent")
  const openHouse =
    listing.openHouseAt && listing.openHouseAt.getTime() > Date.now()
      ? formatOpenHouse(listing.openHouseAt, intl)
      : null

  return (
    <TiltCard className="h-full rounded-2xl">
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image */}
      <div data-tilt="img" className="relative h-52 overflow-hidden">
        {listing.imageUrl ? (
          <SafeImage
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallback={<PhotoPlaceholder label={t("photosComing")} />}
          />
        ) : (
          <PhotoPlaceholder label={t("photosComing")} />
        )}
        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-md ${
              !isLive
                ? "bg-foreground/90 text-background"
                : isForSale
                  ? "bg-gold text-gold-foreground"
                  : "bg-background text-foreground"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        {/* Price overlay (bottom-left) */}
        <div className="absolute bottom-3 left-3 rounded-xl bg-background/95 px-3 py-1.5 backdrop-blur">
          <div className="font-display text-xl font-semibold leading-none tracking-tight tabular-nums">
            {formatPrice(listing.priceCents, listing.type, intl)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
          {listing.title}
        </h3>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
          {listing.beds != null && (
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-primary/60" />
              {listing.beds} {t("bed")}
            </span>
          )}
          {listing.baths != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-primary/60" />
              {listing.baths} {t("bath")}
            </span>
          )}
          {listing.sqft != null && (
            <span className="inline-flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5 text-primary/60" />
              {listing.sqft.toLocaleString(intl)} {t("sqft")}
            </span>
          )}
        </div>

        {listing.address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary/60" />
            <span className="line-clamp-1">{listing.address}</span>
          </div>
        )}

        {openHouse && (
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green/10 px-2.5 py-1 text-xs font-semibold text-green">
            <CalendarDays className="h-3.5 w-3.5" />
            {t("openHouse", { when: openHouse })}
          </div>
        )}

        {listing.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {listing.description}
          </p>
        )}

        <div className="mt-auto pt-2 text-xs font-medium text-primary">
          {t("listedBy", { name: listing.business.name })}
        </div>
      </div>
    </Link>
    </TiltCard>
  )
}

export async function PropertyListingGrid({
  listings,
}: {
  listings: PropertyListing[]
}) {
  const t = await getTranslations("propertyCard")
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {t("noListings")}
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <PropertyListingCard key={l.id} listing={l} />
      ))}
    </div>
  )
}
