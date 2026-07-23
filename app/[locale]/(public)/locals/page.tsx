import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getActiveDeals, getSiteStats } from "@/lib/queries"
import { getFeaturedBusinesses } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { CouponDemo } from "@/components/coupon-demo"
import { EventsSection } from "@/components/events-section"
import { FeaturedBusinessesMarquee } from "@/components/featured-businesses-marquee"
import { Reveal } from "@/components/reveal"
import {
  Heart,
  Bell,
  Mail,
  Ticket,
  ArrowRight,
  MapPin,
  Store,
  Sparkles,
} from "lucide-react"

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
  { key: "expFlowers", img: "/activities/lompoc-flower-fields.jpg", href: "/activities/lompoc-flower-fields", tilt: "-rotate-2" },
  { key: "expWine", img: "/activities/wine-ghetto-tasting.jpg", href: "/activities/lompoc-wine-ghetto", tilt: "rotate-1" },
  { key: "expBeach", img: "/activities/jalama-beach.jpg", href: "/activities/jalama-beach", tilt: "rotate-2" },
  { key: "expLaunch", img: "/activities/vandenberg-launch.jpg", href: "/activities/vandenberg-launches", tilt: "-rotate-1" },
] as const

/** Soft film-grain overlay (inline SVG noise) that warms large photo/gradient surfaces. */
function Grain({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}

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
    { icon: <Heart className="h-5 w-5" />, chip: "bg-primary/10 text-primary", title: t("benefitSaveTitle"), body: t("benefitSaveBody") },
    { icon: <Bell className="h-5 w-5" />, chip: "bg-gold/20 text-gold-foreground", title: t("benefitFollowTitle"), body: t("benefitFollowBody") },
    { icon: <Mail className="h-5 w-5" />, chip: "bg-success/10 text-success", title: t("benefitDigestTitle"), body: t("benefitDigestBody") },
    { icon: <Ticket className="h-5 w-5" />, chip: "bg-primary/10 text-primary", title: t("benefitHistoryTitle"), body: t("benefitHistoryBody") },
  ]

  const heroStats = [
    { icon: <Store className="h-4 w-4" />, label: t("statBusinesses", { count: stats.businesses }), tilt: "-rotate-2" },
    { icon: <Ticket className="h-4 w-4" />, label: t("statDeals", { count: stats.activeDeals }), tilt: "rotate-1" },
    { icon: <Sparkles className="h-4 w-4" />, label: t("statCategories", { count: stats.categories }), tilt: "-rotate-1" },
  ]

  return (
    <main className="overflow-x-clip">
      {/* ── HERO — golden-hour wash over the community photo ─────────── */}
      <section className="relative isolate">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 overflow-hidden"
          style={{
            backgroundImage: "url('/lompoc-hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 55%",
          }}
        />
        {/* Plum shade for copy legibility, melting into warm golden light. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(112deg,hsl(287_81%_12%/0.94)_0%,hsl(287_70%_18%/0.72)_44%,hsl(287_50%_25%/0.28)_75%,hsl(45_90%_55%/0.18)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[hsl(45_85%_58%/0.22)] via-transparent to-transparent"
        />
        <Grain />

        <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:pb-28 sm:pt-20">
          <Reveal preset="stagger" as="div" className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <MapPin className="h-3 w-3 text-gold" />
              {t("heroBadge")}
            </div>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl">
              {t("heroH1")}{" "}
              <span className="relative inline-block font-edition italic text-gold">
                {t("heroH1Italic")}
                <svg
                  aria-hidden
                  viewBox="0 0 120 8"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-2.5 w-full text-gold/60"
                >
                  <path d="M2 6 Q 30 1 60 4 T 118 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              {t("heroBody")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup/user"
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-gold-foreground shadow-lg shadow-black/25 transition-transform hover:-translate-y-0.5"
              >
                {t("heroCtaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
                className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {t("heroCtaSecondary")}
              </Link>
            </div>
            <p className="mt-4 text-xs font-medium text-white/75">{t("heroTrustLine")}</p>
          </Reveal>
        </div>

      </section>

      {/* ── TRY A COUPON — warm cream, sticker energy ─────────────────── */}
      <section className="bg-[hsl(45_80%_96%)] pb-16 dark:bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4">
          {/* Floating stat postcards, straddling the hero's bottom edge. */}
          <Reveal preset="stagger" className="relative z-10 flex -translate-y-7 flex-wrap gap-3 sm:gap-4">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className={`inline-flex items-center gap-2 rounded-2xl border border-gold/25 bg-background px-4 py-3 text-sm font-semibold shadow-lg shadow-black/10 transition-transform hover:rotate-0 ${s.tilt}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-gold-foreground">
                  {s.icon}
                </span>
                {s.label}
              </div>
            ))}
          </Reveal>
        </div>
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <Reveal preset="fadeUp" className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-block -rotate-2 rounded-lg bg-success px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-success-foreground shadow-sm">
              {t("demoEyebrow")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("demoH2")} <span className="font-edition italic text-primary">{t("demoH2Italic")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">{t("demoBody")}</p>
          </Reveal>

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
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal preset="fadeUp" className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
                {t("liveEyebrow")}
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {t("liveH2")}
              </h2>
            </div>
            <Link
              href="/deals"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2"
            >
              {t("liveSeeAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <DealGrid deals={deals} viewer={viewer} fromPath="/locals" variant="tripadvisor" />
        </section>
      )}

      {/* ── POPULAR IN LOMPOC — featured businesses marquee ──────────── */}
      {featuredBusinesses.length > 0 && (
        <section className="border-y border-gold/20 bg-[hsl(45_80%_96%)] py-16 dark:bg-accent/20">
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
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal preset="fadeUp" className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
            {t("valueEyebrow")}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("valueH2")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("valueBody")}</p>
        </Reveal>

        <Reveal preset="stagger" className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                aria-hidden
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gold/10 transition-transform group-hover:scale-125"
              />
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${b.chip}`}>
                {b.icon}
              </span>
              <h3 className="font-display text-lg font-semibold tracking-tight">{b.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </Reveal>

        <div className="mt-9">
          <Link
            href="/signup/user"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            {t("valueCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── EVENTS — live upcoming events around Lompoc ──────────────── */}
      <EventsSection />

      {/* ── LOMPOC EXPERIENCES — polaroids from your backyard ────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal preset="fadeUp">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">
            {t("expEyebrow")}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("expH2")}</h2>
        </Reveal>
        <Reveal preset="stagger" className="mt-10 grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4">
          {EXPERIENCES.map((e) => (
            <Link
              key={e.key}
              href={e.href}
              className={`group relative block rounded-md bg-background p-2 pb-8 shadow-lg shadow-black/10 ring-1 ring-black/5 transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-[1.04] sm:p-3 sm:pb-10 ${e.tilt}`}
            >
              {/* washi-tape strip */}
              <span
                aria-hidden
                className="absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-[2px] bg-gold/50 shadow-sm backdrop-blur-[1px]"
              />
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[4px]">
                <Image
                  src={e.img}
                  alt={t(e.key)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </span>
              <span className="absolute inset-x-0 bottom-2 truncate px-3 text-center font-edition text-sm italic text-foreground/80 sm:bottom-3 sm:text-base">
                {t(e.key)}
              </span>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* ── FINAL CTA — sunset send-off ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,hsl(287_81%_22%)_0%,hsl(var(--primary))_45%,hsl(310_60%_28%)_78%,hsl(30_70%_35%)_100%)] px-6 py-14 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(55% 65% at 88% 8%, rgba(239,198,24,0.35) 0%, transparent 60%), radial-gradient(45% 55% at 8% 92%, rgba(11,153,47,0.22) 0%, transparent 60%)",
            }}
          />
          <Grain />
          <Reveal preset="fadeUp">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {t("finalH2")}
            </h2>
            <p className="mx-auto mt-4 max-w-md font-edition text-lg italic text-white/85">
              {t("finalBody")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup/user"
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-8 py-3.5 text-sm font-bold text-gold-foreground shadow-lg shadow-black/25 transition-transform hover:-translate-y-0.5"
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
          </Reveal>
        </div>
      </section>
    </main>
  )
}
