import { Link } from "@/i18n/navigation"
import { confirmSubscriptionByToken } from "@/lib/subscribe-actions"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "subscribe" })
  return { title: t("confirmMetaTitle") }
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const t = await getTranslations("subscribe")
  const token = searchParams.token ?? ""
  const result = token
    ? await confirmSubscriptionByToken(token)
    : { ok: false as const, message: "missing-token" }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-bold">{t("confirmedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("confirmedBody", { email: result.email })}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">{t("confirmFailedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("confirmFailedBody")}</p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block text-sm underline">
        {t("backHome")}
      </Link>
    </div>
  )
}
