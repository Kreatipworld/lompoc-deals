import { db } from "@/db/client"
import { SignupForm } from "./signup-form"
import { Link } from "@/i18n/navigation"
import { Sparkles, Heart, Store, ChevronRight } from "lucide-react"

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

  // If claiming a business, fall through to the old form (preserves claim flow)
  if (claimSlug) {
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
            Claim your listing
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your business owner account in 30 seconds.
          </p>
        </div>
        <div className="mt-8">
          <SignupForm claimSlug={claimSlug} defaultPlan={defaultPlan} showCanceled={showCanceled} />
        </div>
      </>
    )
  }

  // Default: two-CTA landing
  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Join Lompoc Deals
        </h1>
        <p className="text-sm text-muted-foreground">
          No per-deal fees. No hidden charges. No ads.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Local user CTA */}
        <Link
          href="/signup/user"
          className="group flex flex-col gap-3 rounded-3xl border-2 border-border bg-card p-6 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">I&apos;m a local</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Browse deals, save favorites, follow local businesses. Always free.
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
            Get started free
            <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        {/* Business CTA */}
        <Link
          href="/signup/business"
          className="group flex flex-col gap-3 rounded-3xl border-2 border-border bg-card p-6 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">I own a business</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Post deals, grow your audience, track analytics. Plans from $0/mo.
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
            View plans
            <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
