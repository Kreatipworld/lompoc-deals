import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Link } from "@/i18n/navigation"
import { TIERS } from "@/lib/stripe"
import { getMyBusiness, getMyProperties, deletePropertyAction } from "@/lib/biz-actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Building2, Plus, Lock, Zap, Bed, Bath, Maximize, MapPin, Pencil } from "lucide-react"

export const metadata = { title: "Properties — Lompoc Deals" }

function formatPrice(cents: number, type: "for-sale" | "for-rent"): string {
  const dollars = cents / 100
  const formatted = dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })
  return type === "for-rent" ? `$${formatted}/mo` : `$${formatted}`
}

export default async function PropertiesPage() {
  const session = await auth()
  const userId = Number(session?.user?.id)

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  const currentTier = sub?.tier ?? "free"
  const tierConfig = TIERS[currentTier]

  if (!tierConfig.canListRealEstate) {
    return <PropertiesUpgradeGate />
  }

  const [biz, listings] = await Promise.all([getMyBusiness(), getMyProperties()])

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your real estate listings on Lompoc Deals.
          </p>
        </div>
        {biz && (
          <Link
            href="/dashboard/properties/new"
            className={buttonVariants({ className: "rounded-full" })}
          >
            <Plus className="h-4 w-4" />
            Add listing
          </Link>
        )}
      </header>

      {!biz ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            You need to{" "}
            <Link href="/dashboard/profile" className="font-medium text-primary underline">
              create a business profile
            </Link>{" "}
            before adding property listings.
          </p>
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-xl font-semibold">No listings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Click <span className="font-medium">Add listing</span> to post your first property.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              {listing.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="mb-4 h-40 w-full rounded-xl object-cover"
                />
              )}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    listing.type === "for-sale"
                      ? "bg-primary/10 text-primary"
                      : "bg-foreground/10 text-foreground"
                  }`}
                >
                  {listing.type === "for-sale" ? "For sale" : "For rent"}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug">{listing.title}</h3>
              <p className="mt-0.5 text-base font-semibold text-primary">
                {formatPrice(listing.priceCents, listing.type)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {listing.beds != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bed className="h-3 w-3" /> {listing.beds} bed
                  </span>
                )}
                {listing.baths != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3 w-3" /> {listing.baths} bath
                  </span>
                )}
                {listing.sqft != null && (
                  <span className="inline-flex items-center gap-1">
                    <Maximize className="h-3 w-3" /> {listing.sqft.toLocaleString()} sqft
                  </span>
                )}
              </div>
              {listing.address && (
                <div className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                  <span className="line-clamp-1">{listing.address}</span>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                <Link
                  href={`/dashboard/properties/edit/${listing.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Link>
                <form action={deletePropertyAction}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    Remove
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function PropertiesUpgradeGate() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your real estate listings on Lompoc Deals.
        </p>
      </header>

      <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">
          Property listings are a Premium feature
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upgrade to Premium to add for-sale and for-rent property listings to your business
          profile. Unlimited deals and priority placement included.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="h-4 w-4" />
            Upgrade to Premium — $39.99/mo
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  )
}
