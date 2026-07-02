import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Link } from "@/i18n/navigation"
import { Lock, Zap } from "lucide-react"
import { TIERS } from "@/lib/stripe"
import { DealForm } from "../deal-form"

export const metadata = { title: "New deal — Lompoc Locals" }

export default async function NewDealPage() {
  const session = await auth()
  const userId = Number(session?.user?.id)
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  // Mirror the server-side limit in lib/biz-actions.ts: an inactive sub falls
  // back to the Free limit. Free = 0 → posting deals is gated behind Growth.
  const isActive = sub?.status === "active" || sub?.status === "trialing"
  const tierKey = sub?.tier ?? "free"
  const dealLimit = isActive ? TIERS[tierKey].dealLimit : TIERS.free.dealLimit

  if (dealLimit === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">New deal</h1>
        <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">
            Posting deals starts on Growth
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your Free plan gets you listed in the directory and on the map. Upgrade to
            Growth to post deals, get featured in the weekly digest, and reach locals
            across the valley.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Zap className="h-4 w-4" />
              Upgrade to post deals
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">New deal</h1>
      <DealForm />
    </div>
  )
}
