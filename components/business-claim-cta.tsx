import { Link } from "@/i18n/navigation"
import { Lock, ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function BusinessClaimCta({ slug }: { slug: string }) {
  const t = await getTranslations("businesses.profile")

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent to-background p-6 sm:p-8">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {t("claimHeading")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("claimBody")}
            </p>
          </div>
        </div>
        <Link
          href={`/signup?claim=${encodeURIComponent(slug)}`}
          className="inline-flex h-11 flex-shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          {t("claimCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
