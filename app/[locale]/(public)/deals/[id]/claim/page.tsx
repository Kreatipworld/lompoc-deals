import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { isPast, formatDistanceToNowStrict } from "date-fns"
import { MapPin, Phone, Clock, FileText } from "lucide-react"
import { getDealById } from "@/lib/queries"
import { auth } from "@/auth"
import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { couponClaims } from "@/db/schema"
import { CouponCodeBlock } from "@/components/coupon-code-block"

export async function generateMetadata() {
  const t = await getTranslations("claim")
  return { title: t("metaTitle") }
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
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

  const session = await auth()
  const userId = session?.user?.id ? Number(session.user.id) : null
  const myClaim = userId
    ? await db.query.couponClaims.findFirst({
        where: and(eq(couponClaims.dealId, deal.id), eq(couponClaims.userId, userId)),
      })
    : null

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

          <CouponCodeBlock
            dealId={deal.id}
            isSignedIn={Boolean(userId)}
            existingCode={myClaim?.code ?? null}
            labels={{
              signIn: t("signInToGetCode"),
              signInWhy: t("signInWhy"),
              getCode: t("getMyCode"),
              yourCode: t("yourCode"),
              codeIsYours: t("codeIsYours"),
              showAtRegister: t("showAtRegister"),
              expired: t("blockedExpired"),
              paused: t("blockedPaused"),
              soldOut: t("blockedSoldOut"),
              dailyLimit: t("blockedDailyLimit"),
              error: t("claimError"),
            }}
          />

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
      </div>
    </div>
  )
}
