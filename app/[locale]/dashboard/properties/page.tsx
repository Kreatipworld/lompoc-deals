import { auth } from "@/auth"
import { Link } from "@/i18n/navigation"
import { TIERS } from "@/lib/stripe"
import { getEffectiveTierForUser } from "@/lib/entitlement"
import { getMyBusiness, getMyProperties, deletePropertyAction, renewPropertyAction } from "@/lib/biz-actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Building2, Plus, Lock, Zap, Bed, Bath, Maximize, MapPin, Pencil, CalendarClock, RefreshCw, Mail } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getListingLeadStats } from "@/lib/queries"

export const metadata = { title: "Properties" }

function formatPrice(cents: number, type: "for-sale" | "for-rent"): string {
  const dollars = cents / 100
  const formatted = dollars.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return type === "for-rent" ? `$${formatted}/mo` : `$${formatted}`
}

export default async function PropertiesPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("dashboardProperties")])
  const userId = Number(session?.user?.id)

  const currentTier = await getEffectiveTierForUser(userId)
  const tierConfig = TIERS[currentTier]

  if (!tierConfig.canListRealEstate) {
    return <PropertiesUpgradeGate t={t} />
  }

  const [biz, listings] = await Promise.all([getMyBusiness(), getMyProperties()])
  const leads = biz ? await getListingLeadStats(biz.id) : null

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {biz && (
          <Link
            href="/dashboard/properties/new"
            className={buttonVariants({ className: "rounded-full" })}
          >
            <Plus className="h-4 w-4" />
            {t("addListing")}
          </Link>
        )}
      </header>

      {/* Leads — the number a real-estate member is buying: every tour request and message, counted. */}
      {leads && (
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
                <Mail className="h-4 w-4 text-primary" />
                {t("leadsTitle")}
              </h2>
              <p className="mt-1 max-w-xl text-xs text-muted-foreground">{t("leadsSub")}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="font-display text-3xl font-semibold tabular-nums">{leads.last30}</div>
                <div className="text-xs text-muted-foreground">{t("leadsLast30")}</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold tabular-nums">{leads.allTime}</div>
                <div className="text-xs text-muted-foreground">{t("leadsAllTime")}</div>
              </div>
            </div>
          </div>
          {leads.recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("leadsEmpty")}</p>
          ) : (
            <ul className="mt-4 divide-y">
              {leads.recent.map((l) => (
                <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-muted-foreground"> · {l.kind === "showing" ? t("leadKindShowing") : t("leadKindContact")}</span>
                    <span className="text-muted-foreground"> · {l.listingTitle ?? t("leadFromPage")}</span>
                    {l.message && <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.message}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <a href={`mailto:${l.email}`} className="font-medium text-primary hover:underline">{l.email}</a>
                    <span className="text-muted-foreground tabular-nums">{l.createdAt.toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!biz ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            <Link href="/dashboard/profile" className="font-medium text-primary underline">
              {t("createProfile")}
            </Link>{" "}
            {t("noBusiness")}
          </p>
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-xl font-semibold">{t("noListings")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noListingsHint")}
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
                  {listing.type === "for-sale" ? t("forSale") : t("forRent")}
                </span>
                {listing.status !== "active" && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                    {t(`status.${listing.status}` as "status.pending")}
                  </span>
                )}
                {daysLeft(listing.expiresAt) !== null && daysLeft(listing.expiresAt)! <= 0 && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-destructive">
                    {t("expired")}
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug">{listing.title}</h3>
              <p className="mt-0.5 text-base font-semibold text-primary">
                {formatPrice(listing.priceCents, listing.type)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {listing.beds != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bed className="h-3 w-3" /> {listing.beds} {t("bed")}
                  </span>
                )}
                {listing.baths != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3 w-3" /> {listing.baths} {t("bath")}
                  </span>
                )}
                {listing.sqft != null && (
                  <span className="inline-flex items-center gap-1">
                    <Maximize className="h-3 w-3" /> {listing.sqft.toLocaleString()} {t("sqft")}
                  </span>
                )}
              </div>
              {listing.address && (
                <div className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                  <span className="line-clamp-1">{listing.address}</span>
                </div>
              )}
              {listing.openHouseAt && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3 text-primary/60" />
                  {t("openHouse")} {listing.openHouseAt.toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              )}
              {daysLeft(listing.expiresAt) !== null && (
                <p className={`mt-1.5 text-xs ${daysLeft(listing.expiresAt)! <= 10 ? "font-medium text-amber-700" : "text-muted-foreground"}`}>
                  {daysLeft(listing.expiresAt)! > 0 ? t("expiresIn", { days: daysLeft(listing.expiresAt)! }) : t("expiredHint")}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                {daysLeft(listing.expiresAt) !== null && daysLeft(listing.expiresAt)! <= 10 && (
                  <form action={renewPropertyAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <Button size="sm" type="submit" className="rounded-full">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      {t("renew")}
                    </Button>
                  </form>
                )}
                <Link
                  href={`/dashboard/properties/edit/${listing.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  {t("edit")}
                </Link>
                <form action={deletePropertyAction}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    {t("remove")}
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

function daysLeft(expiresAt: Date | null): number | null {
  if (!expiresAt) return null
  return Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
}

function PropertiesUpgradeGate({ t }: { t: Awaited<ReturnType<typeof getTranslations<"dashboardProperties">>> }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">
          {t("upgradeTitle")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("upgradeBody")}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="h-4 w-4" />
            {t("upgradePremium")}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            {t("backToOverview")}
          </Link>
        </div>
      </div>
    </div>
  )
}
