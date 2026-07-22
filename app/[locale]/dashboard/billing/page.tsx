import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions, deals } from "@/db/schema"
import { TIERS, stripe } from "@/lib/stripe"
import { getPlanFeatures } from "@/lib/plan-features"
import { eq, and, gt, sql } from "drizzle-orm"
import { CreditCard, Check, AlertCircle, CheckCircle2, BarChart2, ExternalLink, Star, Zap, FileText } from "lucide-react"
import BillingActions from "./billing-actions"
import { getTranslations } from "next-intl/server"

export const metadata = { title: "Billing — Lompoc Locals" }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  const [session, t] = await Promise.all([auth(), getTranslations("dashboardBilling")])
  const userId = Number(session!.user!.id)

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  const biz = await db.query.businesses.findFirst({
    where: (b, { eq: e }) => e(b.ownerUserId, userId),
    columns: { id: true, gracePeriodEndsAt: true },
  })

  // Recent invoices, straight from Stripe, so members see their statements and
  // payments without leaving the dashboard. Read-only; the full history + card
  // management + cancel live in the Stripe portal behind "Manage subscription".
  let invoices: { id: string; date: string; amount: string; status: string; url: string | null }[] = []
  if (sub?.stripeCustomerId) {
    try {
      const list = await stripe.invoices.list({ customer: sub.stripeCustomerId, limit: 6 })
      invoices = list.data.map((inv) => ({
        id: inv.id,
        date: new Date(inv.created * 1000).toLocaleDateString(),
        amount: `$${((inv.total ?? 0) / 100).toFixed(2)}`,
        status: inv.status ?? "—",
        url: inv.hosted_invoice_url ?? inv.invoice_pdf ?? null,
      }))
    } catch (err) {
      console.error("[billing] invoice list failed:", err)
    }
  }

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
    { label: t("featureAnalytics"), key: "canViewAnalytics", icon: <BarChart2 className="h-3.5 w-3.5" /> },
    { label: t("featureSocialLinks"), key: "canShowSocialLinks", icon: <ExternalLink className="h-3.5 w-3.5" /> },
    { label: t("featureRealEstate"), key: "canListRealEstate", icon: <Star className="h-3.5 w-3.5" /> },
    { label: t("featurePriority"), key: "priorityRanking", icon: <Zap className="h-3.5 w-3.5" /> },
    { label: t("featureFeatured"), key: "featuredOnHomepage", icon: <Star className="h-3.5 w-3.5" /> },
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
          {t("successBanner")}
        </div>
      )}

      {searchParams.canceled && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t("canceledBanner")}
        </div>
      )}

      {/* Grace period warning */}
      {biz?.gracePeriodEndsAt && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t("gracePeriodWarning", { date: new Date(biz.gracePeriodEndsAt).toLocaleDateString() })}
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
                {t("currentPlanLabel")}
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              {tierConfig.name}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {tierConfig.price === 0 ? "" : `$${tierConfig.price}/mo`}
              </span>
            </h2>
            {sub?.currentPeriodEnd && (
              <p className="mt-1 text-sm text-muted-foreground">
                {sub.cancelAtPeriodEnd
                  ? t("cancelsOn", { date: sub.currentPeriodEnd.toLocaleDateString() })
                  : t("renewsOn", { date: sub.currentPeriodEnd.toLocaleDateString() })}
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
                ? t("statusActive")
                : sub.status === "active"
                ? t("statusActive")
                : sub.status === "past_due"
                ? t("statusPastDue")
                : t("statusCanceled")}
            </span>
          </div>
          {isActive && sub && <BillingActions hasSubscription mode="manage" />}
        </div>

        {/* Deal usage bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("activeDealsUsage")}</span>
            <span className="font-medium">
              {t("dealsUsed", { count: activeDealCount, limit: dealLimit === Infinity ? "∞" : dealLimit })}
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
              {t("nearLimit")}
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
                      ? "Plus"
                      : "Growth+"}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Billing history — invoices & payments, in-app */}
      {invoices.length > 0 && (
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("historyTitle")}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">{t("colDate")}</th>
                  <th className="pb-2 font-medium">{t("colAmount")}</th>
                  <th className="pb-2 font-medium">{t("colStatus")}</th>
                  <th className="pb-2 text-right font-medium">{t("colInvoice")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="py-2.5">{inv.date}</td>
                    <td className="py-2.5 font-medium tabular-nums">{inv.amount}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          inv.status === "paid"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {inv.status === "paid" ? t("paid") : inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {inv.url ? (
                        <a
                          href={inv.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {t("view")} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t("historyHint")}</p>
        </div>
      )}

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
                  {t("mostPopular")}
                </div>
              )}
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">{tier.name}</div>
                <div className="mt-1">
                  {tier.price === 0 ? (
                    <span className="font-display text-3xl font-bold">{tier.price === 0 ? "Free" : ""}</span>
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
                    {t("currentPlanLabel")}
                  </div>
                ) : key === "premium" ? (
                  // Plus is contact-led (listings tier), not self-serve checkout.
                  <a
                    href="mailto:hello@lompoclocals.com?subject=Lompoc%20Locals%20Plus"
                    className="block w-full rounded-xl border py-2 text-center text-sm font-semibold text-primary transition hover:bg-accent"
                  >
                    {t("plusContact")}
                  </a>
                ) : (
                  <BillingActions
                    hasSubscription={!!sub}
                    mode="subscribe"
                    tier={key}
                    label={currentTier ? t("switchTo", { name: tier.name }) : t("getStarted")}
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
