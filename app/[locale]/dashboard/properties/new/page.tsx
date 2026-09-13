import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { TIERS } from "@/lib/stripe"
import { getEffectiveTierForUser } from "@/lib/entitlement"
import { getMyBusiness } from "@/lib/biz-actions"
import { ChevronLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { PropertyForm } from "../property-form"

export const metadata = { title: "Add listing" }

export default async function NewPropertyPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("dashboardProperties")])
  const userId = Number(session?.user?.id)

  const currentTier = await getEffectiveTierForUser(userId)
  if (!TIERS[currentTier].canListRealEstate) redirect("/dashboard/properties")

  const biz = await getMyBusiness()
  if (!biz) redirect("/dashboard/properties")

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard/properties"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("propertyFormTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("newSubtitle")}</p>
      </header>

      <PropertyForm businessId={biz.id} agentName={biz.name} />
    </div>
  )
}
