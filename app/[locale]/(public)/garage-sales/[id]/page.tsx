import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { db } from "@/db/client"
import { garageSales } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { MapPin, Clock, Tag, Navigation, ArrowLeft, ShoppingBag } from "lucide-react"
import { getTranslations } from "next-intl/server"

interface Props {
  params: { id: string; locale: string }
}

async function getSale(id: number) {
  const [sale] = await db
    .select()
    .from(garageSales)
    .where(and(eq(garageSales.id, id), eq(garageSales.status, "active")))
    .limit(1)
  return sale ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return {}
  const sale = await getSale(id)
  if (!sale) return {}
  return {
    title: `Garage Sale at ${sale.address} — Lompoc Deals`,
    description: sale.description.slice(0, 160),
  }
}

function formatDateRange(startDate: Date, endDate: Date) {
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }
  if (startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString("en-US", opts)
  }
  const startStr = startDate.toLocaleDateString("en-US", opts)
  const endStr = endDate.toLocaleDateString("en-US", opts)
  return `${startStr} – ${endStr}`
}

export default async function GarageSaleDetailPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "garageSaleDetail" })

  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const sale = await getSale(id)
  if (!sale) notFound()

  const dateStr = formatDateRange(sale.startDate, sale.endDate)
  const timeStr =
    sale.startTime
      ? `${sale.startTime}${sale.endTime ? ` – ${sale.endTime}` : ""}`
      : null

  const mapsUrl = sale.lat && sale.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${sale.lat},${sale.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sale.address + ", Lompoc, CA")}`

  const cats = sale.itemCategories as string[] | null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Back link */}
      <Link
        href="/garage-sales"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToAll")}
      </Link>

      <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
        {/* Orange header band */}
        <div className="flex items-center gap-3 bg-orange-500 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-orange-100">
              {t("garageSale")}
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-white leading-tight">
              {sale.address}
            </h1>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Date + time */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{dateStr}</p>
              {timeStr && (
                <p className="mt-0.5 text-sm text-muted-foreground">{timeStr}</p>
              )}
            </div>
          </div>

          {/* Address + directions */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
              <MapPin className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{sale.address}</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
              >
                <Navigation className="h-3 w-3" />
                {t("getDirections")}
              </a>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("whatsForSale")}
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">{sale.description}</p>
          </div>

          {/* Item categories */}
          {cats && cats.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("categories")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {cats.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-medium capitalize text-orange-700"
                  >
                    <Tag className="h-3 w-3" />
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Posted date */}
          <p className="text-xs text-muted-foreground border-t pt-4">
            {t("postedDate", { date: sale.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) })}
          </p>
        </div>
      </div>

      {/* CTA — post your own */}
      <div className="mt-8 rounded-2xl border bg-orange-50 p-5 text-center">
        <p className="text-sm font-medium">{t("gotStuff")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("postYourOwn")}</p>
        <Link
          href="/garage-sales/post"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          {t("postCta")}
        </Link>
      </div>
    </div>
  )
}
