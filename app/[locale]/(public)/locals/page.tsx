import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getActiveDeals, getSiteStats } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { getFeaturedBusinesses } from "@/lib/queries"
import { DealGrid } from "@/components/deal-card"
import { CouponDemo } from "@/components/coupon-demo"
import { EventsSection } from "@/components/events-section"
import { FeaturedBusinessesMarquee } from "@/components/featured-businesses-marquee"
import { Heart, Bell, Mail, Ticket, ArrowRight, MapPin } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "locals" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

const EXPERIENCES = [
  { key: "expFlowers", img: "/activities/lompoc-flower-fields.jpg", href: "/activities/lompoc-flower-fields" },
  { key: "expWine", img: "/activities/wine-ghetto-tasting.jpg", href: "/activities/lompoc-wine-ghetto" },
  { key: "expBeach", img: "/activities/jalama-beach.jpg", href: "/activities/jalama-beach" },
  { key: "expLaunch", img: "/activities/vandenberg-launch.jpg", href: "/activities/vandenberg-launches" },
] as const

export default async function LocalsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "locals" })
  const th = await getTranslations({ locale, namespace: "home" })

  const [stats, deals, viewer, featuredBusinesses] = await Promise.all([
    getSiteStats(),
    getActiveDeals(3),
    getViewer(),
    getFeaturedBusinesses(10),
  ])

  const benefits = [
    { icon: <Heart className="h-5 w-5" />, title: t("benefitSaveTitle"), body: t("benefitSaveBody") },
    { icon: <Bell className="h-5 w-5" />, title: t("benefitFollowTitle"), body: t("benefitFollowBody") },
    { icon: <Mail className="h-5 w-5" />, title: t("benefitDigestTitle"), body: t("benefitDigestBody") },
    { icon: <Ticket className="h-5 w-5" />, title: t("benefitHistoryTitle"), body: t("benefitHistoryBody") },
  ]

  return (
    <main>
      {/* ── HERO — flower fields under the purple brand wash ─────────── */}
      <section className="relative isolate overflow-hidden border-b">
        {/* Community photo — festival crowd at Ryon Park */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 overflow-hidden"
          style={{
            backgroundImage: "url('/lompoc-community.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 62%",
          }}
        />
        {/* Wash: dark behind the copy (left), light over the crowd (right) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[hsl(287_81%_14%/0.92)] via-[hsl(287_81%_18%/0.62)] to-[hsl(287_81%_20%/0.22)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-16 bg-gradient-to-t from-black/25 to-transparent"
        />

        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <MapPin className="h-3 w-3" />
              {t("heroBadge")}
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
              {t("heroH1")} <span className="italic text-gold">{t("heroH1Italic")}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">{t("heroBody")}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/signup/user"
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-lg transition-transform hover:-translate-y-0.5"
              >
                {t("heroCtaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
                className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {t("heroCtaSecondary")}
              </Link>
            </div>
            <p className="mt-4 text-xs font-medium text-white/70">{t("heroTrustLine")}</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/15 pt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              <span className="text-white/80">{t("statBusinesses", { count: stats.businesses })}</span>
              <span className="text-white/20">·</span>
              <span>{t("statDeals", { count: stats.activeDeals })}</span>
              <span className="text-white/20">·</span>
              <span>{t("statCategories", { count: stats.categories })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRY A COUPON — interactive demo ──────────────────────────── */}
      <section className="bg-secondary/30 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
              {t("demoEyebrow")}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("demoH2")} <span className="italic text-primary">{t("demoH2Italic")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">{t("demoBody")}</p>
          </div>

          <CouponDemo
            labels={{
              scenes: [
                { title: t("demoScene1Title"), body: t("demoStep1") },
                { title: t("demoScene2Title"), body: t("demoStep2") },
                { title: t("demoScene3Title"), body: t("demoStep3") },
              ],
              panelLabels: [t("demoPanel1"), t("demoPanel2"), t("demoPanel3")],
              demoChip: t("demoChip"),
              businessName: t("demoBizName"),
              dealTitle: t("demoDealTitle"),
              dealDiscount: t("demoDealDiscount"),
              dealTerms: t("demoDealTerms"),
              expires: t("demoExpires"),
              claimCta: t("demoClaimCta"),
              code: t("demoCode"),
              showAtRegister: t("demoShowAtRegister"),
              usedCta: t("demoUsedCta"),
              usedTitle: t("demoUsedTitle"),
              usedBody: t("demoUsedBody"),
              playAgain: t("demoPlayAgain"),
            }}
          />
        </div>
      </section>

      {/* ── REAL DEALS RIGHT NOW ─────────────────────────────────────── */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
                {t("liveEyebrow")}
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
                {t("liveH2")}
              </h2>
            </div>
            <Link
              href="/deals"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2"
            >
              {t("liveSeeAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <DealGrid deals={deals} viewer={viewer} fromPath="/locals" variant="tripadvisor" />
        </section>
      )}

      {/* ── POPULAR IN LOMPOC — featured businesses marquee ──────────── */}
      {featuredBusinesses.length > 0 && (
        <section className="border-t bg-accent/20 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  {th("popularInLompoc")}
                </h2>
                <p className="mt-1 text-muted-foreground">{th("businessesSubheading")}</p>
              </div>
              <Link
                href="/businesses"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
              >
                {th("viewAllBusinesses")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <FeaturedBusinessesMarquee
              businesses={featuredBusinesses}
              dealLabel={th("deal")}
              dealsLabel={th("deals")}
              prevLabel={th("carouselPrev")}
              nextLabel={th("carouselNext")}
            />
          </div>
        </section>
      )}

      {/* ── MEMBER VALUE — everything the free account does ──────────── */}
      <section className="border-y bg-secondary/30 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
              {t("valueEyebrow")}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("valueH2")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("valueBody")}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.title} className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {b.icon}
                </span>
                <h3 className="font-display font-semibold">{b.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/signup/user"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("valueCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── EVENTS — live upcoming events around Lompoc ──────────────── */}
      <EventsSection />

      {/* ── LOMPOC EXPERIENCES — real photos, real places ────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
          {t("expEyebrow")}
        </p>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">{t("expH2")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {EXPERIENCES.map((e) => (
            <Link
              key={e.key}
              href={e.href}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border shadow-sm"
            >
              <Image
                src={e.img}
                alt={t(e.key)}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 font-display text-sm font-bold text-white sm:text-base">
                {t(e.key)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[hsl(287_70%_30%)] to-[hsl(287_81%_18%)] px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(50% 60% at 85% 10%, rgba(239,198,24,0.25) 0%, transparent 60%), radial-gradient(45% 55% at 10% 90%, rgba(11,153,47,0.25) 0%, transparent 60%)",
            }}
          />
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("finalH2")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">{t("finalBody")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup/user"
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {t("finalCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/subscribe"
              className="text-sm font-medium text-white/85 underline-offset-4 hover:underline"
            >
              {t("finalSubscribe")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
