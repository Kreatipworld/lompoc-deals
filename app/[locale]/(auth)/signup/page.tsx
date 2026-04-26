import { db } from "@/db/client"
import { SignupForm } from "./signup-form"
import { Link } from "@/i18n/navigation"
import { Sparkles, Heart, Store, ChevronRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" })
  return {
    title: t("signupLanding.metaTitle"),
    description: t("signupLanding.metaDescription"),
  }
}

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { claim?: string; plan?: string; canceled?: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" })

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
                {t("signupLanding.claimingBadgeTitle")}{" "}
                <span className="text-primary">{claimingBusinessName}</span>
              </p>
              <p className="text-muted-foreground">
                {t("signupLanding.claimingBadgeBody")}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("signupLanding.claimHeading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("signupLanding.claimSubheading")}
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
          {t("signupLanding.heading")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("signupLanding.subheading")}
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
            <div className="font-display text-lg font-semibold">{t("signupLanding.localTitle")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t("signupLanding.localBody")}
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
            {t("signupLanding.localCta")}
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
            <div className="font-display text-lg font-semibold">{t("signupLanding.businessTitle")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t("signupLanding.businessBody")}
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
            {t("signupLanding.businessCta")}
            <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("signupLanding.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("signupLanding.signIn")}
        </Link>
      </p>
    </>
  )
}
