import { getTranslations } from "next-intl/server"
import { RedeemConsole } from "@/components/redeem-console"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "redeem" })
  return { title: t("metaTitle") }
}

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "redeem" })

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6">
        <RedeemConsole
          locale={locale}
          labels={{
            codeLabel: t("codeLabel"),
            check: t("check"),
            checking: t("checking"),
            markRedeemed: t("markRedeemed"),
            redeeming: t("redeeming"),
            valid: t("valid"),
            notFound: t("notFound"),
            alreadyRedeemed: t("alreadyRedeemed"),
            expiredCoupon: t("expiredCoupon"),
            voided: t("voided"),
            claimedBy: t("claimedBy"),
            claimedOn: t("claimedOn"),
            redeemedOn: t("redeemedOn"),
            done: t("done"),
            another: t("another"),
            error: t("error"),
          }}
        />
      </div>
    </div>
  )
}
