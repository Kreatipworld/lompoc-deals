import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Wallet, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import { ConnectStripeButton, StripeExpressDashboardButton } from "./connect-actions"
import { getTranslations } from "next-intl/server"

export const metadata = { title: "Payouts — Lompoc Deals" }

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: { connected?: string; reauth?: string }
}) {
  const [session, t] = await Promise.all([auth(), getTranslations("dashboardPayouts")])
  const userId = Number(session!.user!.id)

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.ownerUserId, userId),
  })

  const isConnected = !!business?.stripeConnectAccountId
  const isOnboarded = !!business?.stripeConnectOnboardingComplete

  const earningsCards = [
    { label: t("availableBalance"), value: t("viewInStripe") },
    { label: t("nextPayout"), value: t("viewInStripe") },
    { label: t("totalEarned"), value: t("viewInStripe") },
  ]

  const payoutsInfoItems = [
    t("payoutsInfo1"),
    t("payoutsInfo2"),
    t("payoutsInfo3"),
    t("payoutsInfo4"),
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {searchParams.connected && !isOnboarded && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t("almostThereAlert")}
        </div>
      )}

      {searchParams.reauth && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t("reauthAlert")}
        </div>
      )}

      {/* Connect status card */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("stripeConnect")}
              </span>
            </div>

            {isOnboarded ? (
              <>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  {t("accountConnected")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("accountConnectedBody")}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("onboardingComplete")}
                </div>
              </>
            ) : isConnected ? (
              <>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  {t("onboardingInProgress")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("onboardingInProgressBody")}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  {t("notConnectedTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("notConnectedBody")}
                </p>
              </>
            )}
          </div>

          <div className="shrink-0">
            {isOnboarded ? (
              <StripeExpressDashboardButton accountId={business!.stripeConnectAccountId!} labels={{ loading: t("loadingDashboard"), open: t("openStripeDashboard") }} />
            ) : (
              <ConnectStripeButton labels={{ connect: t("connectWithStripe"), redirecting: t("redirectingToStripe") }} />
            )}
          </div>
        </div>
      </div>

      {/* Earnings summary placeholder — will be populated once Connect is live */}
      {isOnboarded && (
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">{t("earningsSummary")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("earningsSummaryBody")}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {earningsCards.map(({ label, value }) => (
              <div key={label} className="rounded-2xl border bg-muted/30 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="mt-1 flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="rounded-3xl border border-dashed bg-muted/20 p-6">
        <h3 className="font-display text-base font-semibold">{t("howPayoutsWork")}</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {payoutsInfoItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
