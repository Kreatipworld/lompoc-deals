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
  const sponsors = await getSponsoredBusinesses({ limit: 8 })
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sponsors.map((s) => (
            <Link
              key={s.id}
              href={`/biz/${s.slug}`}
              className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] w-full bg-muted">
                {s.coverUrl && (
                  <SafeImage
                    src={s.coverUrl}
                    alt={s.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {s.exclusive && (
                  <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                    <BadgeCheck className="h-3 w-3" />
                    {t("officialPartner", { category: s.categoryName ?? "" })}
                  </span>
                )}
                {s.logoUrl && (
                  <SafeImage
                    src={s.logoUrl}
                    alt=""
                    className="absolute bottom-2.5 left-2.5 h-10 w-10 rounded-lg border-2 border-white/80 bg-white object-cover shadow-md"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-semibold leading-snug">{s.name}</p>
                {s.categoryName && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {s.categoryName}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
