import { Link } from "@/i18n/navigation"
import { Star, ArrowRight, Megaphone } from "lucide-react"
import type { DealCardData } from "@/lib/queries"
import { getTranslations } from "next-intl/server"

/**
 * Homepage Weekly Deals Digest — a deals-first section with featured deal hero,
 * deal grid, and a single sponsor CTA banner. Clean and honest — no fake ads.
 */
export async function DealsDigest({ deals }: { deals: DealCardData[] }) {
  const t = await getTranslations("dealsDigest")
  if (!deals.length) return null

  const featured = deals[0]
  const grid = deals.slice(1, 7)
  const bizHref = (slug: string) => `/biz/${slug}`

  const FeatureBanner = (
    <Link
      href="/for-businesses"
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Megaphone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold leading-tight">{t("featureTitle")}</p>
        <p className="truncate text-sm text-muted-foreground">{t("featureBody")}</p>
      </div>
      <span className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-success px-4 py-2 text-sm font-bold text-success-foreground group-hover:gap-2 sm:inline-flex">
        {t("featureCta")} <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      {/* Heading */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">{t("eyebrow")}</p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("titleA")} <span className="text-success">{t("titleB")}</span>
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/deals" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2">
          {t("seeAll")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Top sponsor banner */}
      {FeatureBanner}

      {/* Featured hero + deal grid */}
      <div className="mt-4 flex flex-col gap-4">
        {/* Featured hero */}
        <Link href={bizHref(featured.business.slug)} className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card sm:flex-row">
          <span className="absolute left-0 top-4 z-10 rounded-r-full bg-gold px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-gold-foreground">
            <Star className="mr-1 inline h-3 w-3 -translate-y-px fill-current" />{t("featuredBadge")}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featured.imageUrl ?? featured.business.coverUrl ?? "/categories/other.jpg"} alt="" className="h-44 w-full object-cover sm:h-auto sm:w-72 sm:flex-shrink-0" />
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <p className="font-display text-xl font-bold leading-tight sm:text-2xl">{featured.title}</p>
            <p className="mt-1 text-sm font-semibold text-primary">{featured.business.name}</p>
            {featured.business.categoryName && (
              <p className="text-xs text-muted-foreground">{featured.business.categoryName}{featured.business.address ? ` · ${featured.business.address.split(",")[0]}` : ""}</p>
            )}
            <div className="mt-auto flex items-baseline gap-2 pt-4">
              {featured.discountText && <span className="font-display text-4xl font-extrabold leading-none tracking-tight text-primary sm:text-5xl">{featured.discountText}</span>}
            </div>
            <span className="mt-3 inline-flex w-fit items-center rounded-full bg-primary px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground">{t("withBadge")}</span>
            {featured.terms && <p className="mt-2 text-xs text-muted-foreground">{featured.terms}</p>}
          </div>
        </Link>

        {/* Deal grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grid.map((d) => (
            <Link key={d.id} href={bizHref(d.business.slug)} className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.imageUrl ?? d.business.coverUrl ?? "/categories/other.jpg"} alt="" className="h-32 w-full object-cover" />
              <div className="flex flex-1 flex-col p-4">
                <p className="font-display text-base font-bold leading-tight">{d.title}</p>
                <p className="mt-1 text-xs font-semibold text-primary">{d.business.name}</p>
                {d.business.categoryName && <p className="text-xs text-muted-foreground">{d.business.categoryName}</p>}
                <div className="mt-auto flex items-baseline gap-1.5 pt-3">
                  {d.discountText && <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-primary">{d.discountText}</span>}
                </div>
                <span className="mt-2 inline-flex w-fit items-center rounded-full bg-primary px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-primary-foreground">{t("withBadge")}</span>
                {d.terms && <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{d.terms}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
