import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { SalesBrowser } from "@/components/sales-browser"
import { getActiveSaleListings } from "@/lib/sales-queries"
import { isSaleCategory, SALE_CATEGORIES } from "@/lib/sales"
import { pageAlternates, siteUrl } from "@/lib/seo"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

// One shelf of the marketplace, with its own title for search ("Used cars for sale in Lompoc").
export const revalidate = 300
// The twelve shelves are the whole list: an unknown category is a router-level
// 404, never a rendered page (the browse skeleton would otherwise stream a 200 first).
export const dynamicParams = false

export function generateStaticParams() {
  return SALE_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata({ params }: { params: { locale: string; category: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  if (!isSaleCategory(params.category)) return { title: "Lompoc Sales" }
  const t = await getTranslations({ locale: params.locale, namespace: "sales" })
  const title = t(`categories.${params.category}.metaTitle`)
  const description = t(`categories.${params.category}.metaDescription`)
  return {
    title,
    description,
    alternates: pageAlternates(`/sales/c/${params.category}`, params.locale),
    openGraph: { type: "website", url: `${siteUrl}${params.locale === "es" ? "/es" : ""}/sales/c/${params.category}`, siteName: "Lompoc Locals", title, description },
  }
}

export default async function SalesCategoryPage({ params }: { params: { locale: string; category: string } }) {
  setRequestLocale(params.locale)
  if (!isSaleCategory(params.category)) notFound()
  const category = params.category
  const [t, items] = await Promise.all([getTranslations({ locale: params.locale, namespace: "sales" }), getActiveSaleListings(category)])

  return (
    <main className={`${PAGE_CONTAINER} py-10`}>
      <Link href="/sales" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backToAll")}
      </Link>
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{t("brand")}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(`categories.${category}.metaTitle`)}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t(`categories.${category}.intro`)}</p>
        </div>
        <Link href="/sales/post" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {t("postCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="mt-8">
        <SalesBrowser items={items} category={category} />
      </div>
    </main>
  )
}
