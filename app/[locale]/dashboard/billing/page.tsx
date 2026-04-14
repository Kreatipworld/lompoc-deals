import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions, deals } from "@/db/schema"
import { TIERS } from "@/lib/stripe"
import { getPlanFeatures } from "@/lib/plan-features"
import { eq, and, gt, sql } from "drizzle-orm"
import { CreditCard, Check, AlertCircle, CheckCircle2, BarChart2, ExternalLink, Star, Zap } from "lucide-react"
import BillingActions from "./billing-actions"

export const metadata = { title: "Billing — Lompoc Deals" }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  const session = await auth()
  const userId = Number(session!.user!.id)

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  const biz = await db.query.businesses.findFirst({
    where: (b, { eq: e }) => e(b.ownerUserId, userId),
    columns: { id: true, gracePeriodEndsAt: true },
  })

  const isActive = sub?.status === "active" || sub?.status === "trialing"
  const currentTier = sub?.tier ?? "free"
  const tierConfig = TIERS[currentTier]
  const features = getPlanFeatures(currentTier)

  // Count active deals for usage bar
  let activeDealCount = 0
  if (biz) {
    const now = new Date()
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(and(eq(deals.businessId, biz.id), gt(deals.expiresAt, now)))
    activeDealCount = result[0]?.count ?? 0
  }

  const dealLimit = tierConfig.dealLimit
  const usagePct = dealLimit === Infinity ? 0 : Math.min((activeDealCount / dealLimit) * 100, 100)

  // Feature display for plan info card
  const FEATURE_ITEMS: { label: string; key: keyof typeof features; icon: React.ReactNode }[] = [
    { label: "View & click analytics", key: "canViewAnalytics", icon: <BarChart2 className="h-3.5 w-3.5" /> },
    { label: "Social links on profile", key: "canShowSocialLinks", icon: <ExternalLink className="h-3.5 w-3.5" /> },
    { label: "Real estate listings", key: "canListRealEstate", icon: <Star className="h-3.5 w-3.5" /> },
    { label: "Priority in search results", key: "priorityRanking", icon: <Zap className="h-3.5 w-3.5" /> },
    { label: "Featured on homepage", key: "featuredOnHomepage", icon: <Star className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </header>

      {searchParams.success && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Subscription activated — welcome aboard!
        </div>
      )}

      {searchParams.canceled && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Checkout was canceled — your subscription was not changed.
        </div>
      )}

      {/* Grace period warning */}
      {biz?.gracePeriodEndsAt && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Payment failed. Your plan features remain active until{" "}
            <strong>{new Date(biz.gracePeriodEndsAt).toLocaleDateString()}</strong> — after that,
            your account downgrades to Free. Update your payment method to avoid interruption.
          </span>
        </div>
      )}

      {/* Plan info card */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Current plan
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              {tierConfig.name}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {tierConfig.price === 0 ? "Free" : `$${tierConfig.price}/mo`}
              </span>
            </h2>
            {sub?.currentPeriodEnd && (
              <p className="mt-1 text-sm text-muted-foreground">
                {sub.cancelAtPeriodEnd
                  ? `Cancels on ${sub.currentPeriodEnd.toLocaleDateString()}`
                  : `Renews on ${sub.currentPeriodEnd.toLocaleDateString()}`}
              </p>
            )}
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                sub?.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : sub?.status === "past_due"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {!sub || sub.status === "trialing"
                ? "Active"
                : sub.status === "active"
                ? "Active"
                : sub.status === "past_due"
                ? "Past due"
                : "Canceled"}
            </span>
          </div>
          {isActive && sub && <BillingActions hasSubscription mode="manage" />}
        </div>

        {/* Deal usage bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active deals</span>
            <span className="font-medium">
              {activeDealCount} of {dealLimit === Infinity ? "∞" : dealLimit} used
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                usagePct >= 90 ? "bg-destructive" : usagePct >= 70 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: dealLimit === Infinity ? "10%" : `${usagePct}%` }}
            />
          </div>
          {usagePct >= 90 && dealLimit !== Infinity && (
            <p className="text-xs text-destructive">
              Almost at your deal limit — upgrade to post more.
            </p>
          )}
        </div>

        {/* Feature checklist */}
        <div className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {FEATURE_ITEMS.map(({ label, key }) => {
            const enabled = features[key as keyof typeof features] as boolean
            return (
              <div
                key={key}
                className={`flex items-center gap-2 text-sm ${
                  enabled ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${enabled ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                  {enabled ? <Check className="h-3 w-3" /> : <span className="text-[10px]">—</span>}
                </span>
                {label}
                {!enabled && (
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {key === "canListRealEstate" || key === "priorityRanking" || key === "featuredOnHomepage"
                      ? "Premium"
                      : "Standard+"}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(Object.entries(TIERS) as [keyof typeof TIERS, (typeof TIERS)[keyof typeof TIERS]][]).map(
          ([key, tier]) => (
            <div
              key={key}
              className={`relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm transition ${
                currentTier === key ? "border-primary ring-1 ring-primary/30" : ""
              }`}
            >
              {key === "standard" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/30 bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </div>
              )}
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">{tier.name}</div>
                <div className="mt-1">
                  {tier.price === 0 ? (
                    <span className="font-display text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-bold">${tier.price}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                {currentTier === key ? (
                  <div className="w-full rounded-xl bg-primary/10 py-2 text-center text-sm font-medium text-primary">
                    Current plan
                  </div>
                ) : (
                  <BillingActions
                    hasSubscription={!!sub}
                    mode="subscribe"
                    tier={key}
                    label={currentTier ? "Switch to " + tier.name : "Get started"}
                  />
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
