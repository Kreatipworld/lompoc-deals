import { Link } from "@/i18n/navigation"
import { unsubscribeByToken } from "@/lib/subscribe-actions"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "subscribe" })
  return { title: t("unsubscribeMetaTitle") }
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const t = await getTranslations("subscribe")
  const token = searchParams.token ?? ""
  const result = token
    ? await unsubscribeByToken(token)
    : { ok: false as const, message: "Missing token" }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-bold">{t("unsubscribeSuccess")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.rich("unsubscribedBody", {
              email: result.email,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">{t("unsubscribeFailedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("unsubscribeFailedBody")}</p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block text-sm underline">
        {t("backHome")}
      </Link>
    </div>
  )
}
