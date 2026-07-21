import { getTranslations } from "next-intl/server"
import { BadgeCheck, Sparkles, ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SafeImage } from "@/components/safe-image"
import { getSponsoredBusinesses } from "@/lib/sponsors"

/**
 * "Featured Members" showcase — a single horizontal row of Plus / Category-
 * Exclusive members, each with their live coupon. Used on the homepage (all
 * members) and, with categorySlug, at the top of a category page (that
 * category's members). Renders nothing when there are no members.
 */
export async function SponsorShowcase({
  categorySlug,
}: {
  categorySlug?: string
} = {}) {
  const members = await getSponsoredBusinesses({ categorySlug, limit: 20 })
  if (members.length === 0) return null
  const t = await getTranslations("sponsors")
  const scoped = Boolean(categorySlug)
  // Ambient drift only on the homepage row with enough members to loop smoothly;
  // category slides (few members) keep a manual scroll.
  const useMarquee = !scoped && members.length >= 4

  return (
    <section className="border-y bg-gradient-to-b from-accent/30 to-transparent py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            {/* Eyebrow + subtitle are decorative editorial flourish — collapse
                them away on mobile so the header reads as one line before the
                first card; full treatment returns at sm: and up. */}
            <div className="mb-1 hidden items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              {t("showcaseEyebrow")}
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {scoped ? t("showcaseCategoryHeading") : t("showcaseHeading")}
            </h2>
            <p className="mt-1 hidden text-muted-foreground sm:block">
              {scoped ? t("showcaseCategorySub") : t("showcaseSub")}
            </p>
          </div>
          <Link
            href="/for-businesses"
            className="hidden flex-shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            {t("becomePartner")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {useMarquee ? (
          /* Ambient marquee — cards drift continuously, pause on hover */
          <div className="marquee-group -mx-4 overflow-hidden px-4">
            <div className="animate-marquee flex w-max gap-4 pb-1">
              {[...members, ...members].map((s, i) => card(s, `${s.id}-${i}`))}
            </div>
          </div>
        ) : (
          /* Manual horizontal scroll (category slides / small sets) */
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]">
            {members.map((s) => card(s, s.id))}
          </div>
        )}
      </div>
    </section>
  )

  function card(s: (typeof members)[number], key: string | number) {
    return (
      <Link
        key={key}
        href={`/biz/${s.slug}`}
        className="group relative h-72 w-56 flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-muted shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.06] [transition:transform_260ms_ease,box-shadow_260ms_ease] hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_18px_40px_-14px_rgba(0,0,0,0.4)] sm:w-60"
      >
        {s.coverUrl && (
          <SafeImage
            src={s.coverUrl}
            alt={s.name}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/[0.04]" />

        {/* Every member here is a paid partner — badge them all; exclusive
            owners get the category-specific version. */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow">
          <BadgeCheck className="h-3 w-3" />
          {t("officialPartnerGeneric")}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end gap-2.5 p-4">
          {s.logoUrl && (
            <SafeImage
              src={s.logoUrl}
              alt=""
              className="h-11 w-11 flex-shrink-0 rounded-xl bg-white object-contain p-1 shadow-md ring-1 ring-black/5"
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold leading-snug text-white drop-shadow-sm">
              {s.name}
            </p>
            {s.categoryName && (
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                {s.categoryName}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }
}
