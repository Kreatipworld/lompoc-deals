import { db } from "@/db/client"
import { SignupForm } from "./signup-form"
import { Sparkles } from "lucide-react"

export const metadata = { title: "Sign up — Lompoc Deals" }

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { claim?: string; plan?: string; canceled?: string }
}) {
  const claimSlug = searchParams.claim
  const defaultPlan = searchParams.plan ?? null
  const showCanceled = searchParams.canceled === "1"
  let claimingBusinessName: string | null = null
  if (claimSlug) {
    const biz = await db.query.businesses.findFirst({
      where: (b, { eq }) => eq(b.slug, claimSlug),
      columns: { name: true },
    })
    claimingBusinessName = biz?.name ?? null
  }

  return (
    <>
      {claimingBusinessName && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">
              Claiming <span className="text-primary">{claimingBusinessName}</span>
            </p>
            <p className="text-muted-foreground">
              Create your account and an admin will review your claim.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {claimingBusinessName ? "Claim your listing" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {claimingBusinessName
            ? "Set up your business owner account in 30 seconds."
            : "Save deals as a local, or post deals as a business."}
        </p>
      </div>
      <div className="mt-8">
        <SignupForm claimSlug={claimSlug ?? null} defaultPlan={defaultPlan} showCanceled={showCanceled} />
      </div>
    </>
  )
}
