import { getTranslations } from "next-intl/server"
import { SupportForm } from "./support-form"

export const dynamic = "force-dynamic"

export default async function SupportPage() {
  const t = await getTranslations("dashboardSupport")
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 max-w-xl text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6 max-w-xl">
        <SupportForm />
      </div>
    </div>
  )
}
