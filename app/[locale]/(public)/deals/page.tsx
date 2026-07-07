import { Link } from "@/i18n/navigation"
import { ArrowRight, Tag, Clock, Mail, Star, Store, MapPin } from "lucide-react"
import { differenceInCalendarDays } from "date-fns"
import { getActiveDeals, getSiteStats } from "@/lib/queries"
import { getFeaturedDeals } from "@/lib/featured"
import { getViewer } from "@/lib/viewer"
import { trackClaimAction } from "@/lib/tracking-actions"
import { DealCard } from "@/components/deal-card"
import { CategoryStrip } from "@/components/category-strip"
import { SearchBar } from "@/components/search-bar"
import { SafeImage } from "@/components/safe-image"
import { AnimatedCounter } from "@/components/animated-counter"
import { CouponDemo } from "@/components/coupon-demo"
import { SubscribeForm } from "../subscribe/subscribe-form"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import type { DealCardData } from "@/lib/queries"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deals.page")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: t("metaKeywords").split(","),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: t("ogImageAlt") }],
    },
  }
}

const ENDS_SOON_DAYS = 7

export default async function DealsPage() {
  const [allDeals, featured, viewer, stats, t, tl] = await Promise.all([
    getActiveDeals(60),
    getFeaturedDeals({ limit: 1 }),
    getViewer(),
    getSiteStats(),
    getTranslations("deals.page"),
    getTranslations("locals"),
  ])

  const spotlight: DealCardData | undefined = featured[0] ?? allDeals[0]
  const rest = allDeals.filter((d) => d.id !== spotlight?.id)
  const endsSoon = rest
    .filter((d) => differenceInCalendarDays(d.expiresAt, new Date()) <= ENDS_SOON_DAYS)
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
  const endsSoonIds = new Set(endsSoon.map((d) => d.id))
  const wall = rest.filter((d) => !endsSoonIds.has(d.id))
  const hasDeals = allDeals.length > 0

  const daysLeftChip = (deal: DealCardData) => {
    const days = differenceInCalendarDays(deal.expiresAt, new Date())
    return days <= 0 ? t("endsToday") : t("daysLeft", { count: days })
  }

  return (
    <>
      {/* ─── HERO — market energy ─── */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-br from-[#4a0857] via-[#650C75] to-[#37043f]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(55% 55% at 90% 0%, rgba(239,198,24,0.25) 0%, transparent 60%), radial-gradient(50% 55% at 5% 100%, rgba(11,153,47,0.22) 0%, transparent 60%)",
          }}
        />

        <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:py-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Tag className="h-3 w-3" />
            {t("badge")}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="mt-3 text-white/80">
            <AnimatedCounter value={stats.activeDeals} duration={1200} delay={300} />{" "}
            {t("heroCountSuffix")}
          </p>
          <div className="mx-auto mt-6 max-w-xl">
            <SearchBar size="lg" scrim />
          </div>
        </div>
      </section>

      {/* ─── CATEGORY STRIP ─── */}
      <CategoryStrip />

      {hasDeals && spotlight && (
        <>
          {/* ─── DEAL OF THE WEEK ─── */}
          <section className="mx-auto max-w-6xl px-4 pt-10">
            <div className="relative overflow-visible">
              <span className="absolute -top-3.5 left-6 z-10 inline-flex items-center gap-1 rounded-full bg-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-foreground shadow-sm">
                <Star className="h-3.5 w-3.5 fill-current" />
                {t("spotlightBadge")}
              </span>
              <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-gold/40 bg-card shadow-lg sm:flex-row">
                <div className="relative h-48 w-full flex-shrink-0 sm:h-auto sm:w-80">
                  <SafeImage
                    src={spotlight.imageUrl ?? spotlight.business.coverUrl ?? undefined}
                    alt={spotlight.title}
                    className="h-full w-full object-cover"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-gold/15 to-success/10">
                        <Tag className="h-12 w-12 text-primary/20" />
                      </div>
                    }
                  />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  {spotlight.discountText && (
                    <p className="font-display text-5xl font-extrabold leading-none tracking-tight text-primary sm:text-6xl">
                      {spotlight.discountText}
                    </p>
                  )}
                  <h2 className="mt-3 font-display text-2xl font-bold leading-tight">
                    {spotlight.title}
                  </h2>
                  <Link
                    href={`/biz/${spotlight.business.slug}`}
                    className="mt-1 text-sm font-semibold text-primary hover:underline"
                  >
                    {spotlight.business.name}
                  </Link>
                  {spotlight.business.address && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {spotlight.business.address}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">
                    <form action={trackClaimAction}>
                      <input type="hidden" name="dealId" value={spotlight.id} />
                      <input type="hidden" name="redirectTo" value={`/deals/${spotlight.id}/claim`} />
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
                      >
                        {t("spotlightCta")}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </form>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {daysLeftChip(spotlight)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── ENDS SOON RAIL ─── */}
          {endsSoon.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pt-12">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gold-foreground" />
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {t("endsSoonHeading")}
                </h2>
              </div>
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                {endsSoon.map((deal) => (
                  <div key={deal.id} className="relative w-80 flex-shrink-0 snap-start pt-3">
                    <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-gold-foreground shadow">
                      {daysLeftChip(deal)}
                    </span>
                    <DealCard deal={deal} viewer={viewer} fromPath="/deals" variant="tripadvisor" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── THE DEAL WALL ─── */}
          {wall.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pt-12">
              <h2 className="mb-5 font-display text-2xl font-bold tracking-tight">
                {t("wallHeading")}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wall.map((deal, i) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    viewer={viewer}
                    fromPath="/deals"
                    variant="tripadvisor"
                    staggerIndex={i}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!hasDeals && (
        <section className="mx-auto max-w-3xl px-4 py-14 text-center text-muted-foreground">
          <p>{t("noDeals")}</p>
        </section>
      )}

      {/* ─── SATURDAY DIGEST BAND ─── */}
      <section className="mt-14 border-y bg-secondary/30 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 sm:flex-row sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold leading-tight">
                {t("digestHeading")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("digestBody")}</p>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* ─── FIRST TIME? STORYBOARD ─── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
            {t("demoEyebrow")}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
            {t("demoHeading")}
          </h2>
        </div>
        <CouponDemo
          labels={{
            scenes: [
              { title: tl("demoScene1Title"), body: tl("demoStep1") },
              { title: tl("demoScene2Title"), body: tl("demoStep2") },
              { title: tl("demoScene3Title"), body: tl("demoStep3") },
            ],
            panelLabels: [tl("demoPanel1"), tl("demoPanel2"), tl("demoPanel3")],
            demoChip: tl("demoChip"),
            businessName: tl("demoBizName"),
            dealTitle: tl("demoDealTitle"),
            dealDiscount: tl("demoDealDiscount"),
            dealTerms: tl("demoDealTerms"),
            expires: tl("demoExpires"),
            claimCta: tl("demoClaimCta"),
            code: tl("demoCode"),
            showAtRegister: tl("demoShowAtRegister"),
            usedCta: tl("demoUsedCta"),
            usedTitle: tl("demoUsedTitle"),
            usedBody: tl("demoUsedBody"),
            playAgain: tl("demoPlayAgain"),
          }}
        />
      </section>

      {/* ─── MERCHANT BAND ─── */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[hsl(287_70%_30%)] to-[hsl(287_81%_18%)] px-6 py-10 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(50% 60% at 85% 10%, rgba(239,198,24,0.25) 0%, transparent 60%), radial-gradient(45% 55% at 10% 90%, rgba(11,153,47,0.25) 0%, transparent 60%)",
            }}
          />
          <Store className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("merchantHeading")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-white/80">{t("merchantBody")}</p>
          <Link
            href="/for-businesses"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-lg transition-transform hover:-translate-y-0.5"
          >
            {t("merchantCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
