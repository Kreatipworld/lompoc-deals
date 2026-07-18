import { getTranslations } from "next-intl/server"
import { BadgeCheck, Sparkles, ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SafeImage } from "@/components/safe-image"
import { getSponsoredBusinesses } from "@/lib/sponsors"

/**
 * Homepage "Featured Local Partners" showcase — the landing-page space that
 * Plus / Category-Exclusive sponsors pay for. Exclusive owners lead (with the
 * Official Partner badge). Renders nothing when there are no sponsors.
 */
export async function SponsorShowcase() {
  const sponsors = await getSponsoredBusinesses({ limit: 20 })
  if (sponsors.length === 0) return null
  const t = await getTranslations("sponsors")

  return (
    <section className="border-y bg-gradient-to-b from-accent/30 to-transparent py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("showcaseEyebrow")}
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {t("showcaseHeading")}
            </h2>
            <p className="mt-1 text-muted-foreground">{t("showcaseSub")}</p>
          </div>
          <Link
            href="/for-businesses"
            className="hidden flex-shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            {t("becomePartner")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Single horizontal row — scroll right for more sponsors */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]">
          {sponsors.map((s) => (
            <Link
              key={s.id}
              href={`/biz/${s.slug}`}
              className="group relative h-72 w-56 flex-shrink-0 snap-start overflow-hidden rounded-2xl border bg-muted shadow-sm transition-shadow hover:shadow-lg sm:w-60"
            >
              {s.coverUrl && (
                <SafeImage
                  src={s.coverUrl}
                  alt={s.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              {s.exclusive && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                  <BadgeCheck className="h-3 w-3" />
                  {t("officialPartner", { category: s.categoryName ?? "" })}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-2.5 p-4">
                {s.logoUrl && (
                  <SafeImage
                    src={s.logoUrl}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded-lg border-2 border-white/80 bg-white object-cover shadow-md"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold leading-snug text-white">
                    {s.name}
                  </p>
                  {s.categoryName && (
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-white/75">
                      {s.categoryName}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
