import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { isPast, formatDistanceToNowStrict } from "date-fns"
import { MapPin, Phone, Clock, FileText, CheckCircle2, Ticket } from "lucide-react"
import { getDealById } from "@/lib/queries"
import { claimCodeFor } from "@/lib/claim-code"
import { redeemFromClaimAction } from "@/lib/tracking-actions"

export async function generateMetadata() {
  const t = await getTranslations("claim")
  return { title: t("metaTitle") }
}

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: { redeemed?: string }
}) {
  const { id } = await params
  const t = await getTranslations("claim")
  const dealId = parseInt(id, 10)
  const deal = Number.isFinite(dealId) ? await getDealById(dealId) : null

  if (!deal) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFoundBody")}</p>
        <Link href="/deals" className="mt-6 inline-block text-sm font-semibold text-primary underline">
          {t("browseDeals")}
        </Link>
      </div>
    )
  }

  if (isPast(deal.expiresAt)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("endedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("endedBody")}</p>
        <Link
          href={`/biz/${deal.business.slug}`}
          className="mt-6 inline-block text-sm font-semibold text-primary underline"
        >
          {t("viewBusiness", { name: deal.business.name })}
        </Link>
      </div>
    )
  }

  const redeemed = searchParams.redeemed === "1"

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-lg">
        {/* Business header */}
        <div className="border-b bg-primary/5 px-6 py-4 text-center">
          <Link
            href={`/biz/${deal.business.slug}`}
            className="font-display text-lg font-semibold text-primary hover:underline"
          >
            {deal.business.name}
          </Link>
          {deal.business.address && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {deal.business.address}
            </p>
          )}
        </div>

        {/* Deal body */}
        <div className="px-6 py-6 text-center">
          {deal.discountText && (
            <p className="font-display text-4xl font-extrabold tracking-tight text-primary">
              {deal.discountText}
            </p>
          )}
          <h1 className="mt-2 font-display text-xl font-semibold leading-snug">{deal.title}</h1>
          {deal.description && (
            <p className="mt-2 text-sm text-muted-foreground">{deal.description}</p>
          )}

          {/* The code */}
          <div className="mx-auto mt-6 w-fit rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-8 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("code")}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground">
              {claimCodeFor(deal.id)}
            </p>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Ticket className="h-4 w-4 text-primary" /> {t("showAtRegister")}
          </p>

          {/* Meta */}
          <div className="mt-5 space-y-1 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("expires", { distance: formatDistanceToNowStrict(deal.expiresAt) })}
            </p>
            {deal.terms && (
              <p className="flex items-center justify-center gap-1 italic">
                <FileText className="h-3 w-3 shrink-0" /> {deal.terms}
              </p>
            )}
            {deal.business.phone && (
              <a
                href={`tel:${deal.business.phone}`}
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <Phone className="h-3 w-3" /> {deal.business.phone}
              </a>
            )}
          </div>
        </div>

        {/* Redeem confirmation */}
        <div className="border-t bg-muted/30 px-6 py-4">
          {redeemed ? (
            <p className="inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> {t("usedConfirmed")}
            </p>
          ) : (
            <form action={redeemFromClaimAction}>
              <input type="hidden" name="dealId" value={deal.id} />
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-full border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {t("usedIt")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
