import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, MapPin, Globe } from "lucide-react"
import { parseHours } from "@/lib/hours"
import { AdminHoursForm } from "./hours-form"

export const dynamic = "force-dynamic"

export default async function AdminEditHoursPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id: idStr } = await params
  const id = parseInt(idStr, 10)
  if (Number.isNaN(id)) notFound()

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, id),
    columns: { id: true, name: true, slug: true, address: true, website: true, hoursJson: true, hoursSource: true },
  })
  if (!biz) notFound()

  const t = await getTranslations("adminEditHours")
  const initialHours = parseHours(biz.hoursJson)

  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link
        href="/admin/businesses/missing-hours"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{biz.name}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {biz.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {biz.address}
            </span>
          )}
          {biz.website && (
            <a
              href={biz.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              {t("openWebsite")}
            </a>
          )}
        </div>
        {biz.hoursSource && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("currentSource", { source: biz.hoursSource })}
          </p>
        )}
      </header>

      <AdminHoursForm
        businessId={biz.id}
        initialHours={initialHours}
        labels={{
          to: t("to"),
          closed: t("closed"),
          save: t("save"),
        }}
      />
    </main>
  )
}
