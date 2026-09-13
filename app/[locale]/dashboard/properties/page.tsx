import { auth } from "@/auth"
import { Link } from "@/i18n/navigation"
import { TIERS } from "@/lib/stripe"
import { getEffectiveTierForUser } from "@/lib/entitlement"
import { getMyBusiness, getMyProperties, deletePropertyAction, renewPropertyAction, markListingStatusAction } from "@/lib/biz-actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Building2, Plus, Lock, Zap, Pencil, RefreshCw, Mail, CheckCircle2, ExternalLink, Home } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getListingLeadStats, getLeadCountsByListing } from "@/lib/queries"

export const metadata = { title: "Properties" }

function formatPrice(cents: number, type: "for-sale" | "for-rent"): string {
  const dollars = cents / 100
  const formatted = dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })
  return type === "for-rent" ? `$${formatted}/mo` : `$${formatted}`
}

export default async function PropertiesPage({ searchParams }: { searchParams?: Promise<{ saved?: string }> }) {
  const [session, t, sp] = await Promise.all([
    auth(),
    getTranslations("dashboardProperties"),
    searchParams ?? Promise.resolve({} as { saved?: string }),
  ])
  const userId = Number(session?.user?.id)

  const currentTier = await getEffectiveTierForUser(userId)
  const tierConfig = TIERS[currentTier]

  if (!tierConfig.canListRealEstate) {
    return <PropertiesUpgradeGate t={t} />
  }

  const [biz, listings] = await Promise.all([getMyBusiness(), getMyProperties()])
  const [leads, leadCounts]: [Awaited<ReturnType<typeof getListingLeadStats>> | null, Record<number, number>] = biz
    ? await Promise.all([getListingLeadStats(biz.id), getLeadCountsByListing(biz.id)])
    : [null, {}]
  const savedId = sp?.saved ? parseInt(sp.saved, 10) : null

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

      {savedId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-600/30 bg-green-50 px-5 py-4 text-sm dark:bg-green-950/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-700" />
            <div>
              <div className="font-semibold">{t("savedTitle")}</div>
              <div className="text-muted-foreground">{t("savedBody")}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/homes" className={buttonVariants({ size: "sm", className: "rounded-full" })}>
              <Home className="mr-1 h-3.5 w-3.5" /> {t("viewOnHomes")}
            </Link>
            <Link href={`/listings/${savedId}`} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}>
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> {t("viewListing")}
            </Link>
          </div>
        </div>
      ) : null}

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
          <Link href="/dashboard/properties/new" className={buttonVariants({ className: "mt-5 rounded-full" })}>
            <Plus className="h-4 w-4" /> {t("addListing")}
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-3xl border bg-card shadow-sm">
          {listings.map((listing) => {
            const left = daysLeft(listing.expiresAt)
            const photoCount = 1 + (((listing.photosJson as string[] | null) ?? []).length)
            const leadsN = leadCounts[listing.id] ?? 0
            const isLive = listing.status === "active" && (left === null || left > 0)
            return (
              <li key={listing.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link href={`/dashboard/properties/edit/${listing.id}`} className="relative block h-24 w-full shrink-0 overflow-hidden rounded-xl bg-primary/[0.04] sm:w-36">
                  {listing.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <Home className="h-5 w-5" strokeWidth={1.25} />
                      <span className="text-[10px]">{t("noPhotos")}</span>
                    </div>
                  )}
                  {listing.imageUrl && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">{photoCount}</span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-bold tabular-nums">{formatPrice(listing.priceCents, listing.type)}</span>
                    <StatusChip status={listing.status} live={isLive} label={isLive ? (listing.type === "for-sale" ? t("forSale") : t("forRent")) : left !== null && left <= 0 && listing.status === "active" ? t("expired") : t(`status.${listing.status}` as "status.pending")} />
                  </div>
                  <div className="mt-0.5 truncate text-sm text-foreground/85">
                    {[listing.beds != null && `${listing.beds} ${t("bed")}`, listing.baths != null && `${listing.baths} ${t("bath")}`, listing.sqft != null && `${listing.sqft.toLocaleString("en-US")} ${t("sqft")}`].filter(Boolean).join(" | ")}
                    {listing.address && <span className="text-muted-foreground"> · {listing.address}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className={leadsN > 0 ? "font-medium text-primary" : ""}>{t("leadsForListing", { n: leadsN })}</span>
                    {left !== null && listing.status === "active" && (
                      <span className={left <= 10 ? "font-medium text-amber-700" : ""}>{left > 0 ? t("daysLeft", { days: left }) : t("expiredHint")}</span>
                    )}
                    {listing.openHouseAt && listing.openHouseAt.getTime() > Date.now() && (
                      <span>{t("openHouse")} {listing.openHouseAt.toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Link href={`/dashboard/properties/edit/${listing.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}>
                    <Pencil className="mr-1 h-3 w-3" /> {t("edit")}
                  </Link>
                  {left !== null && left <= 10 && listing.status === "active" && (
                    <form action={renewPropertyAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <Button size="sm" type="submit" className="rounded-full">
                        <RefreshCw className="mr-1 h-3 w-3" /> {t("renew")}
                      </Button>
                    </form>
                  )}
                  {listing.status === "active" || listing.status === "pending" ? (
                    <form action={markListingStatusAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input type="hidden" name="status" value={listing.type === "for-rent" ? "rented" : "sold"} />
                      <Button variant="ghost" size="sm" type="submit" className="rounded-full">
                        {listing.type === "for-rent" ? t("markRented") : t("markSold")}
                      </Button>
                    </form>
                  ) : (
                    <form action={markListingStatusAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input type="hidden" name="status" value="active" />
                      <Button variant="ghost" size="sm" type="submit" className="rounded-full">{t("markActive")}</Button>
                    </form>
                  )}
                  <form action={deletePropertyAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <Button variant="ghost" size="sm" type="submit" className="rounded-full text-muted-foreground">
                      {t("remove")}
                    </Button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StatusChip({ status, live, label }: { status: string; live: boolean; label: string }) {
  const cls = live
    ? "bg-green-100 text-green-800"
    : status === "pending"
      ? "bg-amber-100 text-amber-800"
      : "bg-foreground/10 text-foreground"
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>{label}</span>
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
