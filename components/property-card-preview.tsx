"use client"

import { Home } from "lucide-react"

// Client twin of PropertyListingCard for the dashboard's live preview: same
// shape (4:3 photo, quiet status chip, bold price, facts line, address, agent
// line) fed from form state while the agent types.
export function PropertyCardPreview({
  photo,
  price,
  type,
  beds,
  baths,
  sqft,
  address,
  homeTypeLabel,
  status,
  agentName,
  labels,
}: {
  photo: string | null
  price: number | null
  type: "for-sale" | "for-rent"
  beds: string
  baths: string
  sqft: string
  address: string
  homeTypeLabel: string
  status: string
  agentName: string
  labels: { forSale: string; forRent: string; pending: string; sold: string; rented: string; photosComing: string; bd: string; ba: string; sqft: string; listingBy: string; forSaleType: string; forRentType: string }
}) {
  const priceText =
    price != null && price > 0
      ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}${type === "for-rent" ? "/mo" : ""}`
      : "$—"
  const facts = [
    beds && `${beds} ${labels.bd}`,
    baths && `${baths} ${labels.ba}`,
    sqft && `${Number(sqft).toLocaleString("en-US")} ${labels.sqft}`,
  ]
    .filter(Boolean)
    .join(" | ")
  const statusLabel =
    status === "pending" ? labels.pending : status === "sold" ? labels.sold : status === "rented" ? labels.rented : type === "for-sale" ? labels.forSale : labels.forRent
  const typeLine = (type === "for-sale" ? labels.forSaleType : labels.forRentType).replace("{type}", homeTypeLabel)

  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border border-border/80 bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-primary/[0.04]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Home className="h-8 w-8" strokeWidth={1.25} aria-hidden />
            <span className="text-xs">{labels.photosComing}</span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
            status === "active" ? "bg-white/95 text-foreground" : "bg-foreground/85 text-background"
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
        <div className="font-display text-[26px] font-bold leading-none tracking-tight tabular-nums">{priceText}</div>
        <div className="mt-1 text-sm text-foreground/85 tabular-nums">
          {facts && <span>{facts}</span>}
          {facts && <span className="text-muted-foreground"> - </span>}
          <span className="text-muted-foreground">{typeLine}</span>
        </div>
        <div className="truncate text-sm text-muted-foreground">{address || "—"}</div>
        <div className="mt-auto pt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          {labels.listingBy.replace("{name}", agentName)}
        </div>
      </div>
    </div>
  )
}
