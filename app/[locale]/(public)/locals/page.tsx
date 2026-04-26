import { getTranslations } from "next-intl/server"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  Heart,
  MapPin,
  Mail,
  Bell,
  Tag,
  Users,
  Compass,
  Zap,
  Check,
} from "lucide-react"
import { getSiteStats } from "@/lib/queries"

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
    keywords: [
      "lompoc locals",
      "lompoc deals for residents",
      "lompoc local discounts",
      "things to do lompoc",
      "lompoc community",
      "lompoc ca businesses",
      "support local lompoc",
    ],
  }
}

export default async function LocalsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "locals" })
  const stats = await getSiteStats()

  const CATEGORIES = [
    { label: t("cat1"), emoji: "🍽️" },
    { label: t("cat2"), emoji: "🍷" },
    { label: t("cat3"), emoji: "🛍️" },
    { label: t("cat4"), emoji: "💆" },
    { label: t("cat5"), emoji: "🔧" },
    { label: t("cat6"), emoji: "🚗" },
    { label: t("cat7"), emoji: "🏡" },
    { label: t("cat8"), emoji: "🎭" },
  ]

  const FEATURES = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
    t("feature5"),
    t("feature6"),
    t("feature7"),
    t("feature8"),
    t("feature9"),
    t("feature10"),
  ]

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        {/* Background image */}
        <Image
          src="/lompoc-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-30 object-cover object-center"
        />
        {/* Gradient overlay for readability */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-r from-background/95 via-background/80 to-background/60"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-transparent via-transparent to-background/90"
        />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            {/* Left: copy + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <MapPin className="h-3 w-3" />
                {t("heroBadge")}
              </div>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {t("heroH1")}{" "}
                <br />
                <span className="italic text-primary">{t("heroH1Italic")}</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("heroBody")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup/user"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
                >
                  {t("heroCtaPrimary")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/deals"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border bg-background px-7 text-base font-semibold transition-colors hover:bg-accent"
                >
                  {t("heroCtaSecondary")}
                </Link>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {t("heroTrustLine")}
              </p>
            </div>

            {/* Right: live stat card */}
            <div className="relative">
              <div className="relative rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("statCardEyebrow")}
                </div>
                <div className="mt-6 space-y-6">
                  <BigStat
                    value={stats.businesses}
                    label={t("statBusinesses")}
                  />
                  <div className="border-t" />
                  <BigStat
                    value={stats.activeDeals}
                    label={t("statDeals")}
                  />
                  <div className="border-t" />
                  <BigStat
                    value={stats.categories}
                    label={t("statCategories")}
                  />
                </div>
                <div className="mt-8 rounded-2xl bg-accent p-4 text-xs text-accent-foreground">
                  <Heart className="mb-1 h-3.5 w-3.5" />
                  <strong>{t("statCardNote")}</strong> {t("statCardNoteBody")}
                </div>
              </div>
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[40px] bg-primary/5 blur-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          HOW IT WORKS — 3 steps
         ───────────────────────────────────────────────── */}
      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("howItWorksEyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("howItWorksH2")}{" "}
              <span className="italic text-primary">{t("howItWorksH2Italic")}</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t("howItWorksBody")}
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step
              num={t("step1Num")}
              title={t("step1Title")}
              body={t("step1Body")}
              delay={0}
            />
            <Step
              num={t("step2Num")}
              title={t("step2Title")}
              body={t("step2Body")}
              delay={80}
            />
            <Step
              num={t("step3Num")}
              title={t("step3Title")}
              body={t("step3Body")}
              delay={160}
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          BENEFITS GRID — 6 reasons
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("whyJoinEyebrow")}
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("whyJoinH2")}{" "}
            <br />
            <span className="italic text-primary">{t("whyJoinH2Italic")}</span>
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Benefit
            icon={<Tag className="h-5 w-5" />}
            title={t("b1Title")}
            body={t("b1Body")}
            delay={0}
          />
          <Benefit
            icon={<Heart className="h-5 w-5" />}
            title={t("b2Title")}
            body={t("b2Body")}
            delay={60}
          />
          <Benefit
            icon={<Mail className="h-5 w-5" />}
            title={t("b3Title")}
            body={t("b3Body")}
            delay={120}
          />
          <Benefit
            icon={<Compass className="h-5 w-5" />}
            title={t("b4Title")}
            body={t("b4Body")}
            delay={0}
          />
          <Benefit
            icon={<Users className="h-5 w-5" />}
            title={t("b5Title")}
            body={t("b5Body")}
            delay={60}
          />
          <Benefit
            icon={<Bell className="h-5 w-5" />}
            title={t("b6Title")}
            body={t("b6Body")}
            delay={120}
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          WHAT YOU GET — feature checklist
         ───────────────────────────────────────────────── */}
      <section className="border-y bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("whatYouGetEyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("whatYouGetH2")} <span className="italic text-primary">{t("whatYouGetH2Free")}</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t("whatYouGetBody")}
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border bg-card p-8 shadow-sm sm:p-10">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-display text-2xl font-bold">{t("priceFree")}</div>
                <div className="text-sm text-muted-foreground">{t("priceForever")}</div>
              </div>
              <Link
                href="/signup/user"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
              >
                {t("priceCtaCreate")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          CATEGORIES TEASER — what's on the platform
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("categoriesEyebrow")}
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("categoriesH2")}{" "}
            <span className="italic text-primary">{t("categoriesH2Italic")}</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {t("categoriesBody")}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map(({ label, emoji }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center shadow-sm"
            >
              <span className="text-3xl" role="img" aria-hidden>
                {emoji}
              </span>
              <span className="text-sm font-medium leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t("browseAllBusinesses")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FINAL CTA
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border bg-gradient-to-br from-primary/15 via-accent to-background p-10 sm:p-16">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {t("finalH2")}{" "}
              <span className="italic text-primary">{t("finalH2Italic")}</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t("finalBody")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup/user"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
              >
                {t("finalCtaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t("finalCtaSecondary")}
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              {t("finalOwnerNote")}{" "}
              <Link
                href="/for-businesses"
                className="font-medium text-primary hover:underline"
              >
                {t("finalOwnerCta")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function BigStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-5xl font-semibold leading-none tracking-tight">
        {value}
      </div>
      <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function Step({
  num,
  title,
  body,
  delay = 0,
}: {
  num: string
  title: string
  body: string
  delay?: number
}) {
  return (
    <div
      className="relative rounded-3xl border bg-card p-7 shadow-sm card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="font-display text-5xl font-semibold leading-none tracking-tight text-primary/30">
        {num}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}

function Benefit({
  icon,
  title,
  body,
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  body: string
  delay?: number
}) {
  return (
    <div
      className="rounded-2xl border bg-card p-6 shadow-sm card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
