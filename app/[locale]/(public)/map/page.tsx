import { LompocInteractiveMapLoader } from "@/components/map/LompocInteractiveMapLoader"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { ArrowRight, Store, Tag, CalendarDays, MapPin } from "lucide-react"
import { getAllCategories } from "@/lib/queries"
import { pageAlternates } from "@/lib/seo"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "map" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/map"),
  }
}

export default async function MapPage() {
  const [t, categories] = await Promise.all([
    getTranslations("map"),
    getAllCategories(),
  ])

  return (
    <main>
      {/* Header — title, context, and quick jumps into the journey */}
      <section className="border-b bg-gradient-to-b from-accent/30 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <MapPin className="h-3.5 w-3.5" />
            Lompoc, California
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{t("subtitle")}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/businesses", label: t("linkBusinesses"), Icon: Store },
              { href: "/", label: t("linkDeals"), Icon: Tag },
              { href: "/events", label: t("linkEvents"), Icon: CalendarDays },
            ].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The interactive map */}
      <div className="h-[72vh] min-h-[460px] overflow-hidden">
        <LompocInteractiveMapLoader />
      </div>

      {/* Explore section — onward journey + a static fallback if the map can't load */}
      <section className="border-t bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {t("exploreHeading")}
          </h2>
          <p className="mt-1 text-muted-foreground">{t("exploreSub")}</p>

          <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {t("browseByCategory")}
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
              >
                {cat.name}
                <ArrowRight className="h-3.5 w-3.5 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
