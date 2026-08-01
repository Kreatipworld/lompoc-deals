import { db } from "@/db/client"
import { SignupForm } from "./signup-form"
import { Link } from "@/i18n/navigation"
import { Heart, Store, ChevronRight, Check } from "lucide-react"
import { ClaimPreview } from "./claim-preview"
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
  searchParams: { claim?: string; plan?: string; canceled?: string; from?: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" })

  const claimSlug = searchParams.claim
  const defaultPlan = searchParams.plan ?? null
  const showCanceled = searchParams.canceled === "1"
  const from = searchParams.from
  // The claim screen leads with a miniature of the listing itself, so pull what the card renders.
  let claimingBusiness: {
    name: string
    address: string | null
    coverUrl: string | null
    logoUrl: string | null
    hoursJson: unknown
    category: string | null
  } | null = null
  if (claimSlug) {
    const biz = await db.query.businesses.findFirst({
      where: (b, { eq }) => eq(b.slug, claimSlug),
      columns: {
        name: true,
        address: true,
        coverUrl: true,
        logoUrl: true,
        hoursJson: true,
        categoryId: true,
      },
    })
    if (biz) {
      // businesses has no `category` relation defined, so read the name on its own rather than
      // adding one just for this card.
      const cat = biz.categoryId
        ? await db.query.categories.findFirst({
            where: (c, { eq }) => eq(c.id, biz.categoryId as number),
            columns: { name: true },
          })
        : null
      claimingBusiness = {
        name: biz.name,
        address: biz.address ?? null,
        coverUrl: biz.coverUrl ?? null,
        logoUrl: biz.logoUrl ?? null,
        hoursJson: biz.hoursJson ?? null,
        category: cat?.name ?? null,
      }
    }
  }
  const claimingBusinessName = claimingBusiness?.name ?? null

  // If claiming a business, fall through to the old form (preserves claim flow)
  if (claimSlug) {
    return (
      <>
        {claimingBusiness && <ClaimPreview {...claimingBusiness} />}

        <div className="mt-6 space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {claimingBusinessName
              ? t("signupLanding.claimHeadingNamed")
              : t("signupLanding.claimHeading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("signupLanding.claimSubheading")}
          </p>
        </div>

        <div className="mt-6">
          <SignupForm
            claimSlug={claimSlug}
            defaultPlan={defaultPlan}
            showCanceled={showCanceled}
            submitLabel={
              claimingBusinessName
                ? t("signupLanding.claimCta", { name: claimingBusinessName })
                : undefined
            }
            submitPendingLabel={
              claimingBusinessName ? t("signupLanding.claimCtaPending") : undefined
            }
          />
        </div>

        {/* The three things an owner who never asked to be listed actually wants to know: what it
            costs, who controls it, and how to get out. Stated once, plainly, under the button. */}
        <ul className="mt-6 grid gap-2 border-t pt-5 text-sm text-muted-foreground">
          {["claimAssuranceFree", "claimAssuranceControl", "claimAssuranceExit"].map((key) => (
            <li key={key} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0B992F]" aria-hidden />
              <span>{t(`signupLanding.${key}`)}</span>
            </li>
          ))}
        </ul>
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
          href={from ? `/signup/user?from=${encodeURIComponent(from)}` : "/signup/user"}
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
