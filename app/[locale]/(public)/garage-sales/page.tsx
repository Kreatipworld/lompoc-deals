import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { db } from "@/db/client"
import { garageSales } from "@/db/schema"
import { eq, gte, and, desc } from "drizzle-orm"
import { GarageSalesMapLoader } from "@/components/garage-sales-map"
import { MapPin, Clock, Tag, Plus, ShoppingBag } from "lucide-react"

export const metadata: Metadata = {
  title: "Garage Sales in Lompoc, CA — Find Local Yard Sales | Lompoc Deals",
  description:
    "Browse upcoming garage sales and yard sales in Lompoc, CA. Map view, date filters, and item categories — find the best deals in your neighborhood.",
}

function formatDateRange(startDate: Date, endDate: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  if (startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString("en-US", { weekday: "short", ...opts })
  }
  return `${startDate.toLocaleDateString("en-US", opts)} – ${endDate.toLocaleDateString("en-US", opts)}`
}

function isThisWeekend(date: Date) {
  const now = new Date()
  const dow = now.getDay()
  const daysUntilSat = (6 - dow + 7) % 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + (dow === 6 ? 0 : daysUntilSat))
  sat.setHours(0, 0, 0, 0)
  const sun = new Date(sat)
  sun.setDate(sat.getDate() + 1)
  sun.setHours(23, 59, 59, 999)
  return date >= sat && date <= sun
}

export default async function GarageSalesPage() {
  const now = new Date()

  const sales = await db
    .select()
    .from(garageSales)
    .where(and(eq(garageSales.status, "active"), gte(garageSales.endDate, now)))
    .orderBy(desc(garageSales.startDate))
    .limit(100)

  const mapSales = sales.map((s) => ({
    id: s.id,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    description: s.description,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    itemCategories: s.itemCategories as string[] | null,
  }))

  const weekendSales = sales.filter((s) => isThisWeekend(s.startDate))

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-50 via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -top-20 right-[-10%] -z-10 h-[360px] w-[360px] rounded-full bg-orange-400/10 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Garage Sales in Lompoc
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {sales.length} upcoming sale{sales.length !== 1 ? "s" : ""}
                {weekendSales.length > 0 && ` · ${weekendSales.length} this weekend`}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Community-posted garage sales across Lompoc. Browse the map, filter by date, and
            score some great finds. Got stuff to sell?{" "}
            <Link href="/garage-sales/post" className="font-medium text-orange-600 hover:underline">
              Post your sale free →
            </Link>
          </p>
        </div>
      </section>

      {/* MAIN LAYOUT */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-16">
        {sales.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <ShoppingBag className="h-8 w-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">No upcoming sales yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to post a garage sale in Lompoc!
              </p>
            </div>
            <Link
              href="/garage-sales/post"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              Post a garage sale
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* SALE CARDS */}
            <div className="flex-1 lg:max-w-[520px]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {sales.length} upcoming sale{sales.length !== 1 ? "s" : ""}
                </p>
                <Link
                  href="/garage-sales/post"
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
                >
                  <Plus className="h-3 w-3" />
                  Post a sale
                </Link>
              </div>

              <ul className="space-y-3">
                {sales.map((sale) => (
                  <li key={sale.id}>
                    <Link
                      href={`/garage-sales/${sale.id}`}
                      className="group flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                          <span className="font-semibold text-sm leading-snug line-clamp-2">
                            {sale.address}
                          </span>
                        </div>
                        {isThisWeekend(sale.startDate) && (
                          <span className="shrink-0 rounded-full bg-orange-100 border border-orange-200 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                            This weekend
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateRange(sale.startDate, sale.endDate)}
                          {sale.startTime && (
                            <span className="ml-1">
                              {sale.startTime}
                              {sale.endTime ? `–${sale.endTime}` : ""}
                            </span>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {sale.description}
                      </p>

                      {sale.itemCategories && (sale.itemCategories as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(sale.itemCategories as string[]).map((cat) => (
                            <span
                              key={cat}
                              className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] capitalize text-orange-700"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end text-xs font-medium text-orange-600 opacity-0 transition group-hover:opacity-100">
                        View details →
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* MAP */}
            <div className="lg:sticky lg:top-6 w-full lg:flex-1">
              <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ height: 520 }}>
                <GarageSalesMapLoader sales={mapSales} />
              </div>
              <p className="mt-2 text-right text-xs italic text-muted-foreground">
                Click a pin to preview · orange pins = active sales
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
