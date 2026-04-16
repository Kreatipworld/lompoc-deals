import { Link } from "@/i18n/navigation"
import { Bed, Bath, Maximize, MapPin } from "lucide-react"
import type { PropertyListing } from "@/lib/queries"
import { SafeImage } from "@/components/safe-image"

function formatPrice(cents: number, type: "for-sale" | "for-rent"): string {
  const dollars = cents / 100
  const formatted = dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })
  return type === "for-rent" ? `$${formatted}/mo` : `$${formatted}`
}

export function PropertyListingCard({
  listing,
}: {
  listing: PropertyListing
}) {
  const isForSale = listing.type === "for-sale"
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <SafeImage
          src={listing.imageUrl ?? undefined}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Type badge */}
        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-md ${
              isForSale
                ? "bg-primary text-primary-foreground"
                : "bg-foreground text-background"
            }`}
          >
            {isForSale ? "For sale" : "For rent"}
          </span>
        </div>
        {/* Price overlay (bottom-left) */}
        <div className="absolute bottom-3 left-3 rounded-xl bg-background/95 px-3 py-1.5 backdrop-blur">
          <div className="font-display text-lg font-semibold leading-none tracking-tight">
            {formatPrice(listing.priceCents, listing.type)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
          {listing.title}
        </h3>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {listing.beds != null && (
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-primary/60" />
              {listing.beds} bed
            </span>
          )}
          {listing.baths != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-primary/60" />
              {listing.baths} bath
            </span>
          )}
          {listing.sqft != null && (
            <span className="inline-flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5 text-primary/60" />
              {listing.sqft.toLocaleString()} sqft
            </span>
          )}
        </div>

        {listing.address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary/60" />
            <span className="line-clamp-1">{listing.address}</span>
          </div>
        )}

        {listing.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {listing.description}
          </p>
        )}

        <div className="mt-auto pt-2 text-xs font-medium text-primary">
          Listed by {listing.business.name}
        </div>
      </div>
    </Link>
  )
}

export function PropertyListingGrid({
  listings,
}: {
  listings: PropertyListing[]
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No active listings right now. Check back soon.
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
