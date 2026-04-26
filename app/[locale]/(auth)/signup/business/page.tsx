import { db } from "@/db/client"
import { Store } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { BusinessSignupWizard } from "./business-signup-wizard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signupBusiness")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export type Category = { id: number; name: string; slug: string }

export default async function BusinessSignupPage({
  searchParams,
}: {
  searchParams: { step?: string; canceled?: string }
}) {
  const t = await getTranslations("signupBusiness")

  const categories = await db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
    columns: { id: true, name: true, slug: true },
  })

  // step param is 1-indexed for URLs, 0-indexed internally
  const rawStep = parseInt(searchParams.step ?? "1", 10)
  const initialStep = Math.min(Math.max(rawStep - 1, 0), 2)
  const showCanceled = searchParams.canceled === "1"

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Store className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <BusinessSignupWizard
          categories={categories}
          initialStep={initialStep}
          showCanceled={showCanceled}
        />
      </div>
    </>
  )
}
