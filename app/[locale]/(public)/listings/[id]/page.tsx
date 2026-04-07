import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Phone,
  Globe,
  ArrowLeft,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { getListingById } from "@/lib/queries"
import { BusinessMapLoader } from "@/components/business-map-loader"

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return { title: "Listing — Lompoc Deals" }
  const listing = await getListingById(id)
  if (!listing) return { title: "Listing not found — Lompoc Deals" }
  return {
    title: `${listing.title} — Lompoc Deals`,
    description: listing.description ?? undefined,
  }
}

function formatPrice(cents: number, type: "for-sale" | "for-rent"): string {
  const dollars = cents / 100
  const formatted = dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })
  return type === "for-rent" ? `$${formatted}/mo` : `$${formatted}`
}

export default async function ListingPage({
  params,
}: {
  params: { id: string }
}) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()
  const listing = await getListingById(id)
  if (!listing) notFound()

  const isForSale = listing.type === "for-sale"
  const photos = (listing.photosJson as string[] | null) ?? []
  const allPhotos = listing.imageUrl && !photos.includes(listing.imageUrl)
    ? [listing.imageUrl, ...photos]
    : photos.length
      ? photos
      : listing.imageUrl
        ? [listing.imageUrl]
        : []

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Link
          href="/category/real-estate"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to all listings
        </Link>
      </div>

      {/* Photo gallery — main + grid */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        {allPhotos.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {/* Main photo */}
            <div className="overflow-hidden rounded-2xl border md:row-span-2 md:h-[520px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={allPhotos[0]}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            </div>
            {/* Thumbnails */}
            {allPhotos.slice(1, 5).map((url, i) => (
              <div
                key={i}
                className="hidden h-[256px] overflow-hidden rounded-2xl border md:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${listing.title} photo ${i + 2}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-2xl border bg-muted text-sm text-muted-foreground">
            No photos available
          </div>
        )}
      </section>

      {/* Body — header + 2-col layout */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* MAIN */}
          <div className="space-y-8">
            {/* Header */}
            <header className="space-y-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                  isForSale
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground text-background"
                }`}
              >
                {isForSale ? "For sale" : "For rent"}
              </span>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {listing.title}
              </h1>
              {listing.address && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {listing.address}
                </p>
              )}
            </header>

            {/* Price + specs row */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="font-display text-4xl font-semibold tracking-tight">
                {formatPrice(listing.priceCents, listing.type)}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {listing.beds != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Bed className="h-4 w-4 text-primary" />
                    <strong>{listing.beds}</strong> bed
                  </span>
                )}
                {listing.baths != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Bath className="h-4 w-4 text-primary" />
                    <strong>{listing.baths}</strong> bath
                  </span>
                )}
                {listing.sqft != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Maximize className="h-4 w-4 text-primary" />
                    <strong>{listing.sqft.toLocaleString()}</strong> sqft
                  </span>
                )}
                {listing.yearBuilt != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    Built <strong>{listing.yearBuilt}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  About this property
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Map */}
            {listing.lat != null && listing.lng != null && (
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Location
                </h2>
                <div className="mt-3 overflow-hidden rounded-2xl border shadow-sm">
                  <div className="h-72">
                    <BusinessMapLoader
                      lat={listing.lat}
                      lng={listing.lng}
                      name={listing.address ?? listing.title}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR — agent / brokerage card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Listed by
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold leading-tight tracking-tight">
                {listing.business.name}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {listing.business.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <a
                      href={`tel:${listing.business.phone.replace(/[^0-9+]/g, "")}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {listing.business.phone}
                    </a>
                  </li>
                )}
                {listing.business.website && (
                  <li className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <a
                      href={listing.business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:text-foreground hover:underline"
                    >
                      {listing.business.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>
              <Link
                href={`/biz/${listing.business.slug}`}
                className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View brokerage profile
              </Link>
            </div>

            {listing.detailUrl && (
              <a
                href={listing.detailUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Zillow
              </a>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
