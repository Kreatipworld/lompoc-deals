import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { TIERS } from "@/lib/stripe"
import { eq } from "drizzle-orm"
import { CreditCard, Check, AlertCircle, CheckCircle2 } from "lucide-react"
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

  const isActive = sub?.status === "active" || sub?.status === "trialing"
  const currentTier = sub?.tier ?? null

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

      {/* Current plan */}
      {isActive && sub ? (
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Current plan
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                {TIERS[sub.tier].name}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  {TIERS[sub.tier].price === 0 ? "Free" : `$${TIERS[sub.tier].price}/mo`}
                </span>
              </h2>
              {sub.currentPeriodEnd && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {sub.cancelAtPeriodEnd
                    ? `Cancels on ${sub.currentPeriodEnd.toLocaleDateString()}`
                    : `Renews on ${sub.currentPeriodEnd.toLocaleDateString()}`}
                </p>
              )}
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  sub.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : sub.status === "past_due"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {sub.status === "trialing" ? "Trial" : sub.status === "active" ? "Active" : sub.status === "past_due" ? "Past due" : "Canceled"}
              </span>
            </div>
            <BillingActions hasSubscription mode="manage" />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-10 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg font-semibold">No active subscription</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a plan below to start posting deals.
          </p>
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
