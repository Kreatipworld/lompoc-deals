import { Link } from "@/i18n/navigation"
import { Home } from "lucide-react"
import type { PropertyListing } from "@/lib/queries"
import { SafeImage } from "@/components/safe-image"
import { getLocale, getTranslations } from "next-intl/server"

export function formatListingPrice(cents: number, type: "for-sale" | "for-rent", intl: string): string {
  const dollars = cents / 100
  const formatted = dollars.toLocaleString(intl, { maximumFractionDigits: 0 })
  return type === "for-rent" ? `$${formatted}/mo` : `$${formatted}`
}

// Open house line, always in Pacific time: "Sat, Sep 13 · 11:00 AM"
export function formatOpenHouse(at: Date, intl: string): string {
  const day = at.toLocaleDateString(intl, { weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles" })
  const time = at.toLocaleTimeString(intl, { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })
  return `${day} · ${time}`
}

// "3 bd | 2 ba | 1,496 sqft" — the portal convention buyers already read, no icons.
export function formatFacts(
  l: { beds: number | null; baths: number | null; sqft: number | null },
  t: (k: string) => string,
  intl: string
): string {
  const parts: string[] = []
  if (l.beds != null) parts.push(`${l.beds} ${t("bd")}`)
  if (l.baths != null) parts.push(`${l.baths} ${t("ba")}`)
  if (l.sqft != null) parts.push(`${l.sqft.toLocaleString(intl)} ${t("sqft")}`)
  return parts.join(" | ")
}

// A calm stand-in for a home whose agent has not uploaded photos yet. Quiet on
// purpose: the card is what the whole town sees on /homes, and a loud block
// reads as an error. Light purple-tinted ground, thin house glyph, small label.
export function PhotoPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-primary/[0.04] text-muted-foreground ${className}`}>
      <Home className="h-8 w-8" strokeWidth={1.25} aria-hidden />
      <span className="text-xs">{label}</span>
    </div>
  )
}

export function statusLabelFor(
  listing: { status: string; type: "for-sale" | "for-rent" },
  t: (k: string) => string
): string {
  if (listing.status === "pending") return t("pending")
  if (listing.status === "sold") return t("sold")
  if (listing.status === "rented") return t("rented")
  return listing.type === "for-sale" ? t("forSale") : t("forRent")
}

export async function PropertyListingCard({ listing }: { listing: PropertyListing }) {
  const [t, locale] = await Promise.all([getTranslations("propertyCard"), getLocale()])
  const intl = locale === "es" ? "es-US" : "en-US"
  const isLive = listing.status === "active"
  const statusLabel = statusLabelFor(listing, t)
  const openHouse =
    listing.openHouseAt && listing.openHouseAt.getTime() > Date.now()
      ? formatOpenHouse(listing.openHouseAt, intl)
      : null
  const facts = formatFacts(listing, t, intl)
  // "Maressa Martinez, Realtor · Empire Real Estate Group" → agent · brokerage stays readable
  const agentLine = listing.business.name.replace(/,\s*Realtor/i, "")

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-border/80 bg-card transition duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_12px_32px_-16px_rgba(34,16,42,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Photo, 4:3 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-primary/[0.04]">
        {listing.imageUrl ? (
          <SafeImage
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            fallback={<PhotoPlaceholder label={t("photosComing")} />}
          />
        ) : (
          <PhotoPlaceholder label={t("photosComing")} />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
              isLive ? "bg-white/95 text-foreground" : "bg-foreground/85 text-background"
            }`}
          >
            {statusLabel}
          </span>
          {openHouse && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold-foreground">
              {t("openHouseShort")}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
        <div className="font-display text-[26px] font-bold leading-none tracking-tight tabular-nums">
          {formatListingPrice(listing.priceCents, listing.type, intl)}
        </div>
        <div className="mt-1 text-sm text-foreground/85 tabular-nums">
          {facts && <span>{facts}</span>}
          {facts && <span className="text-muted-foreground"> - </span>}
          <span className="text-muted-foreground">{listing.type === "for-sale" ? t("typeSale") : t("typeRent")}</span>
        </div>
        {listing.address && <div className="truncate text-sm text-muted-foreground">{listing.address}</div>}
        {openHouse && <div className="text-xs text-foreground/80">{t("openHouse", { when: openHouse })}</div>}
        <div className="mt-auto pt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          {t("listingBy", { name: agentLine })}
        </div>
      </div>
    </Link>
  )
}

export async function PropertyListingGrid({ listings }: { listings: PropertyListing[] }) {
  const t = await getTranslations("propertyCard")
  if (listings.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">{t("noListings")}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
      {listings.map((l) => (
        <PropertyListingCard key={l.id} listing={l} />
      ))}
    </div>
  )
}
