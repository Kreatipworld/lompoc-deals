import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Wallet, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import { ConnectStripeButton, StripeExpressDashboardButton } from "./connect-actions"

export const metadata = { title: "Payouts — Lompoc Deals" }

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: { connected?: string; reauth?: string }
}) {
  const session = await auth()
  const userId = Number(session!.user!.id)

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.ownerUserId, userId),
  })

  const isConnected = !!business?.stripeConnectAccountId
  const isOnboarded = !!business?.stripeConnectOnboardingComplete

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Stripe account to receive payouts for promotions and featured placements.
        </p>
      </header>

      {searchParams.connected && !isOnboarded && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Almost there — Stripe is still reviewing your details. Check back shortly or complete any missing steps.
        </div>
      )}

      {searchParams.reauth && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Your Stripe onboarding link expired. Click below to continue.
        </div>
      )}

      {/* Connect status card */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Stripe Connect
              </span>
            </div>

            {isOnboarded ? (
              <>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  Account connected
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your Stripe Express account is active. Payouts will be deposited to your linked bank account on Stripe&apos;s standard schedule.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Onboarding complete
                </div>
              </>
            ) : isConnected ? (
              <>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  Onboarding in progress
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your Stripe Express account was created but onboarding is not yet complete. Click below to continue.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  Not connected
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect a Stripe account to enable payouts. You&apos;ll be guided through Stripe&apos;s Express onboarding flow.
                </p>
              </>
            )}
          </div>

          <div className="shrink-0">
            {isOnboarded ? (
              <StripeExpressDashboardButton accountId={business!.stripeConnectAccountId!} />
            ) : (
              <ConnectStripeButton />
            )}
          </div>
        </div>
      </div>

      {/* Earnings summary placeholder — will be populated once Connect is live */}
      {isOnboarded && (
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Earnings summary</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed earnings and payout history are available in your{" "}
            <span className="font-medium">Stripe Express Dashboard</span>. Use the button above to view your balance, upcoming payouts, and transaction history.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Available balance", value: "View in Stripe" },
              { label: "Next payout", value: "View in Stripe" },
              { label: "Total earned", value: "View in Stripe" },
            ].map(({ label, value }) => (
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
        <h3 className="font-display text-base font-semibold">How payouts work</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            Lompoc Deals uses Stripe Connect to process and distribute payouts to business owners.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            A platform fee applies to each payout — contact support for current rates.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            Payouts are processed by Stripe on a standard schedule (typically 2 business days after funds are available).
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            Use Stripe test mode during development — no real money is moved.
          </li>
        </ul>
      </div>
    </div>
  )
}
