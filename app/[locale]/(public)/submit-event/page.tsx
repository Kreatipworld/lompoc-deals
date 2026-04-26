import { SubmitEventForm } from "./submit-form"
import { CalendarDays } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "submitEvent" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function SubmitEventPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "submitEvent" })

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("heading")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <SubmitEventForm />
      </div>
    </div>
  )
}
