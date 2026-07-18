import { getTranslations } from "next-intl/server"
import { ArrowRight, Sparkles, BadgeCheck } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SafeImage } from "@/components/safe-image"
import { getCategorySpotlight } from "@/lib/sponsors"

/**
 * Sponsor spotlight — a landing banner at the top of a category page. Shows the
 * Category-Exclusive owner ("Official Partner") when one exists, otherwise the
 * daily-rotated Plus sponsor. Renders nothing when the category is unsponsored.
 */
export async function SponsorSpotlight({ categorySlug }: { categorySlug: string }) {
  const sponsor = await getCategorySpotlight(categorySlug)
  if (!sponsor) return null
  const t = await getTranslations("sponsors")
  const badgeLabel = sponsor.exclusive
    ? t("officialPartner", { category: sponsor.categoryName ?? "" })
    : t("sponsored")

  return (
    <Link
      href={`/biz/${sponsor.slug}`}
      className="group relative mb-8 block overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative h-52 w-full bg-muted sm:h-64">
        {sponsor.coverUrl && (
          <SafeImage
            src={sponsor.coverUrl}
            alt={sponsor.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
          {sponsor.exclusive ? <BadgeCheck className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {badgeLabel}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            {sponsor.logoUrl && (
              <SafeImage
                src={sponsor.logoUrl}
                alt=""
                className="h-12 w-12 flex-shrink-0 rounded-xl border-2 border-white/80 bg-white object-cover shadow-md"
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold text-white sm:text-2xl">
                {sponsor.name}
              </p>
              {sponsor.description && (
                <p className="line-clamp-1 text-sm text-white/85">{sponsor.description}</p>
              )}
            </div>
          </div>
          <span className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-foreground shadow sm:inline-flex">
            {t("visit")}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
