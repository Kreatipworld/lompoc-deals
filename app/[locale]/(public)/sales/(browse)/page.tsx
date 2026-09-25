import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { SalesBrowser } from "@/components/sales-browser"
import { getActiveSaleListings } from "@/lib/sales-queries"
import { pageAlternates, siteUrl } from "@/lib/seo"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

// Public marketplace page: ISR, no session, no cookies (cost rules, Sep 16 2026).
export const revalidate = 300

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "sales" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/sales", params.locale),
    openGraph: {
      type: "website",
      url: `${siteUrl}${params.locale === "es" ? "/es" : ""}/sales`,
      siteName: "Lompoc Locals",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  }
}

export default async function SalesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const [t, items] = await Promise.all([getTranslations({ locale: params.locale, namespace: "sales" }), getActiveSaleListings()])

  return (
    <main className={`${PAGE_CONTAINER} py-10`}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("h1")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("intro")}</p>
        </div>
        <Link href="/sales/post" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90" data-sales-post-cta>
          {t("postCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="mt-8">
        <SalesBrowser items={items} />
      </div>

      <p className="mt-10 flex items-center gap-2 border-t pt-6 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-success" />
        {t("detail.reviewed")} {t("detail.safety")}
      </p>
    </main>
  )
}
