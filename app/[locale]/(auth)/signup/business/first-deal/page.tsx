import { auth } from "@/auth"
import { db } from "@/db/client"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { FirstDealForm } from "./first-deal-form"
import { Sparkles } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signupBusiness")
  return {
    title: t("firstDeal.metaTitle"),
  }
}

export default async function FirstDealPage() {
  const t = await getTranslations("signupBusiness")
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = parseInt(session.user.id, 10)
  const biz = await db.query.businesses.findFirst({
    where: (b, { eq }) => eq(b.ownerUserId, userId),
    columns: { id: true, name: true },
  })

  if (!biz) redirect("/dashboard/profile")

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("firstDeal.stepLabel")}
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("firstDeal.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("firstDeal.subtitle", { bizName: biz.name })}
        </p>
      </div>

      <FirstDealForm />

      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <span>
          {t("firstDeal.almostThere")}{" "}
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            {t("firstDeal.skipToDashboard")}
          </Link>
        </span>
      </div>
    </div>
  )
}
