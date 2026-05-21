import { db } from "@/db/client"
import { businesses, categories } from "@/db/schema"
import { isNull, eq, asc } from "drizzle-orm"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { MapPin, Pencil, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MissingHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const t = await getTranslations("adminMissingHours")

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      address: businesses.address,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(isNull(businesses.hoursJson))
    .orderBy(asc(businesses.name))

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle", { count: rows.length })}
        </p>
      </header>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          {t("saved")}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">{t("colBusiness")}</th>
              <th className="px-4 py-2.5">{t("colCategory")}</th>
              <th className="px-4 py-2.5">{t("colAddress")}</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2.5">
                  <Link href={`/biz/${r.slug}`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.categoryName ?? "—"}</td>
                <td className="px-4 py-2.5">
                  {r.address ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{r.address}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">{t("noAddress")}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/businesses/${r.id}/hours`}
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" />
                    {t("editHours")}
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}
