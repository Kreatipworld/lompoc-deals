import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Tag,
  Eye,
  Mail,
  Heart,
  ShieldCheck,
  Zap,
  Check,
  X,
  Store,
  TrendingUp,
  Star,
  Rocket,
  Users,
  CalendarClock,
} from "lucide-react"
import { getSiteStats } from "@/lib/queries"
import { Reveal } from "@/components/reveal"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "forBusinesses" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: [
      "list business lompoc",
      "lompoc business directory",
      "lompoc business listing",
      "free business listing lompoc ca",
      "lompoc small business marketing",
      "get found lompoc",
    ],
  }
}

export default async function ForBusinessesPage() {
  const stats = await getSiteStats()
  const t = await getTranslations("forBusinesses")

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO — bold, conversion-first
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-accent via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -left-40 -top-24 -z-10 h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-32 top-40 -z-10 h-[420px] w-[420px] rounded-full bg-success/10 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            {/* Left: copy + CTA */}
            <Reveal preset="stagger" as="div">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <MapPin className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </div>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.03] tracking-tight sm:text-5xl lg:text-[4.25rem]">
                {t("hero.h1")}{" "}
                <span className="relative inline-block italic text-primary">
                  {t("hero.h1Italic")}
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-2.5 w-full rounded-full bg-gold/50"
                  />
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("hero.subtitle")}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-success px-8 py-3.5 text-base font-semibold text-success-foreground shadow-lg shadow-success/20 [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-success/90 active:scale-[0.97]"
                >
                  {t("hero.ctaGetStarted")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/businesses"
                  className="inline-flex items-center justify-center gap-2 rounded-full border bg-background px-8 py-3.5 text-base font-semibold transition-colors hover:bg-accent"
                >
                  {t("hero.ctaSeeWho")}
                </Link>
              </div>

              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                {t("hero.trustLine")}
              </p>
            </Reveal>

            {/* Right: live stat card */}
            <Reveal preset="fadeIn" delay={300} className="relative">
              <div className="relative rounded-[2rem] border bg-card p-8 shadow-2xl shadow-primary/10">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  {t("hero.statRightNow")}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
                  <BigStat value={stats.businesses} label={t("hero.statBusinesses")} />
                  <BigStat value={stats.activeDeals} label={t("hero.statDeals")} />
                  <div className="col-span-2 border-t" />
                  <BigStat value={stats.categories} label={t("hero.statCategories")} />
                  <div className="flex items-end justify-end">
                    <Store className="h-12 w-12 text-primary/15" />
                  </div>
                </div>
                <div className="mt-7 flex items-start gap-3 rounded-2xl bg-accent p-4 text-xs text-accent-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>{t("hero.newThisWeekLabel")}</strong> {t("hero.newThisWeek")}
                  </span>
                </div>
              </div>
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[40px] bg-primary/5 blur-2xl"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          TRUST / STATS STRIP — bold purple band
         ───────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
            <div className="grid grid-cols-3 divide-x divide-primary-foreground/20">
              <StatChip icon={<Store className="h-4 w-4" />} value={stats.businesses} label={t("hero.statBusinesses")} />
              <StatChip icon={<Tag className="h-4 w-4" />} value={stats.activeDeals} label={t("hero.statDeals")} />
              <StatChip icon={<Users className="h-4 w-4" />} value={stats.categories} label={t("hero.statCategories")} />
            </div>
            <p className="text-center text-sm font-medium text-primary-foreground/80 sm:text-right">
              {t("hero.trustLine")}
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          HOW IT WORKS — 3 steps
         ───────────────────────────────────────────────── */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("howItWorks.eyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("howItWorks.h2")}{" "}
              <span className="italic text-primary">{t("howItWorks.h2Done")}</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground">{t("howItWorks.subtitle")}</p>
          </div>

          <div className="relative mt-16">
            {/* connector line */}
            <div
              aria-hidden
              className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            />
            <Reveal preset="stagger" className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Step num="01" icon={<Store className="h-5 w-5" />} title={t("howItWorks.step1Title")} body={t("howItWorks.step1Body")} />
              <Step num="02" icon={<Tag className="h-5 w-5" />} title={t("howItWorks.step2Title")} body={t("howItWorks.step2Body")} />
              <Step num="03" icon={<TrendingUp className="h-5 w-5" />} title={t("howItWorks.step3Title")} body={t("howItWorks.step3Body")} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          PRICING — front-and-center, plan-led
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b bg-accent/40">
        <div
          aria-hidden
          className="absolute left-1/2 top-0 -z-10 h-72 w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              {t("pricing.eyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {t("pricing.h2")}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t("pricing.subtitle")}</p>
          </div>

          <Reveal
            preset="stagger"
            className="mx-auto mt-14 grid max-w-5xl grid-cols-1 items-start gap-6 lg:grid-cols-3"
          >
            {/* Free */}
            <PlanCard
              name="Free"
              icon={<MapPin className="h-5 w-5" />}
              price="$0"
              perMonth={t("pricing.perMonth")}
              bestFor={t("pricing.freeBestFor")}
              features={[
                t("pricing.freeFeature1"),
                t("pricing.freeFeature2"),
                t("pricing.freeFeature3"),
                t("pricing.freeFeature4"),
                t("pricing.freeFeature5"),
              ]}
              excluded="No deal posting — deals unlock on Growth"
              ctaLabel={t("pricing.freeCtaLabel")}
            />

            {/* Growth — featured */}
            <PlanCard
              name="Growth"
              icon={<Rocket className="h-5 w-5" />}
              price="$39.99"
              perMonth={t("pricing.perMonth")}
              bestFor={t("pricing.growthBestFor")}
              features={[
                t("pricing.standardFeature1"),
                t("pricing.standardFeature2"),
                t("pricing.standardFeature3"),
                t("pricing.standardFeature4"),
                t("pricing.standardFeature5"),
              ]}
              ctaLabel={t("pricing.standardCtaLabel")}
              featured
              badge={t("pricing.mostPopular")}
            />

            {/* Plus */}
            <PlanCard
              name="Plus"
              icon={<Star className="h-5 w-5" />}
              price="$99.99"
              perMonth={t("pricing.perMonth")}
              bestFor={t("pricing.plusBestFor")}
              features={[
                t("pricing.premiumFeature1"),
                t("pricing.premiumFeature2"),
                t("pricing.premiumFeature3"),
                t("pricing.premiumFeature4"),
                t("pricing.premiumFeature5"),
                t("pricing.premiumFeature6"),
                t("pricing.premiumFeature7"),
                t("pricing.premiumFeature8"),
              ]}
              valueNote={t("pricing.plusValueNote")}
              ctaLabel={t("pricing.premiumCtaLabel")}
            />
          </Reveal>

          {/* Decision helper */}
          <div className="mx-auto mt-14 max-w-3xl rounded-[2rem] border bg-card p-6 shadow-sm sm:p-9">
            <h3 className="text-center font-display text-lg font-semibold sm:text-xl">
              {t("pricing.helperTitle")}
            </h3>
            <div className="mt-6 grid gap-3">
              {[
                { q: t("pricing.helperFreeQ"), plan: "Free" },
                { q: t("pricing.helperGrowthQ"), plan: "Growth" },
                { q: t("pricing.helperPlusQ"), plan: "Plus" },
              ].map((row) => (
                <div
                  key={row.plan}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/50 px-5 py-3.5"
                >
                  <span className="text-sm text-muted-foreground">{row.q}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary">
                    {row.plan}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">{t("pricing.footnote")}</p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          BENEFITS GRID
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("benefits.eyebrow")}
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("benefits.h2")} <br />
            <span className="italic text-primary">{t("benefits.h2NotChains")}</span>
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Benefit icon={<MapPin className="h-5 w-5" />} title={t("benefits.b1Title")} body={t("benefits.b1Body")} delay={0} />
          <Benefit icon={<Tag className="h-5 w-5" />} title={t("benefits.b2Title")} body={t("benefits.b2Body")} delay={60} />
          <Benefit icon={<Eye className="h-5 w-5" />} title={t("benefits.b3Title")} body={t("benefits.b3Body")} delay={120} />
          <Benefit icon={<Mail className="h-5 w-5" />} title={t("benefits.b4Title")} body={t("benefits.b4Body")} delay={0} />
          <Benefit icon={<Heart className="h-5 w-5" />} title={t("benefits.b5Title")} body={t("benefits.b5Body")} delay={60} />
          <Benefit icon={<ShieldCheck className="h-5 w-5" />} title={t("benefits.b6Title")} body={t("benefits.b6Body")} delay={120} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          SHORT FAQ — quick objection handling
         ───────────────────────────────────────────────── */}
      <section className="border-y bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="text-center font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Questions before you start?
          </h2>
          <Reveal preset="stagger" className="mt-10 space-y-4">
            <Faq
              icon={<CalendarClock className="h-4 w-4" />}
              q="How long does it take to get listed?"
              a={t("howItWorks.subtitle")}
            />
            <Faq
              icon={<ShieldCheck className="h-4 w-4" />}
              q="Do I need a credit card to begin?"
              a={t("hero.trustLine")}
            />
            <Faq
              icon={<TrendingUp className="h-4 w-4" />}
              q="Can I change plans as I grow?"
              a={t("pricing.footnote")}
            />
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FINAL CTA
         ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary p-10 text-primary-foreground sm:p-16">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-success/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/20">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {t("finalCta.h2")}{" "}
              <span className="italic text-gold">{t("finalCta.h2Seconds")}</span>
            </h2>
            <p className="mt-4 text-base text-primary-foreground/80 sm:text-lg">
              {t("finalCta.subtitle")}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-success px-8 py-3.5 text-base font-semibold text-success-foreground shadow-lg shadow-success/25 [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-success/90 active:scale-[0.97]"
              >
                {t("finalCta.ctaList")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-primary-foreground/70 underline-offset-4 hover:text-primary-foreground hover:underline"
              >
                {t("finalCta.ctaBrowse")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function BigStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <div className="flex items-center gap-1.5 font-display text-2xl font-semibold leading-none sm:text-3xl">
        <span className="text-primary-foreground/60">{icon}</span>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-wider text-primary-foreground/70 sm:text-[11px]">
        {label}
      </div>
    </div>
  )
}

function Step({
  num,
  icon,
  title,
  body,
}: {
  num: string
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="relative rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
        {icon}
      </div>
      <div className="mt-5 font-display text-sm font-bold tracking-[0.2em] text-primary/40">
        {num}
      </div>
      <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function PlanCard({
  name,
  icon,
  price,
  perMonth,
  bestFor,
  features,
  excluded,
  valueNote,
  ctaLabel,
  featured = false,
  badge,
}: {
  name: string
  icon: React.ReactNode
  price: string
  perMonth: string
  bestFor: string
  features: string[]
  excluded?: string
  valueNote?: string
  ctaLabel: string
  featured?: boolean
  badge?: string
}) {
  return (
    <div
      className={
        featured
          ? "relative flex flex-col rounded-[1.75rem] border-2 border-primary bg-card p-8 shadow-2xl shadow-primary/15 ring-1 ring-primary/10 lg:-mt-4 lg:mb-4"
          : "relative flex flex-col rounded-[1.75rem] border bg-card p-8 shadow-sm"
      }
    >
      {featured && badge ? (
        <div className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-gold-foreground shadow-sm animate-pop-badge">
          <Star className="h-3.5 w-3.5 fill-current" />
          {badge}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div
          className={
            featured
              ? "flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              : "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
          }
        >
          {icon}
        </div>
        <div className="font-display text-xl font-semibold">{name}</div>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-bold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">{perMonth}</span>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{bestFor}</div>

      <div className="my-6 border-t" />

      <ul className="flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check
              className={
                featured
                  ? "mt-0.5 h-4 w-4 shrink-0 text-success"
                  : "mt-0.5 h-4 w-4 shrink-0 text-primary"
              }
            />
            <span>{f}</span>
          </li>
        ))}
        {excluded ? (
          <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
            <span className="line-through decoration-muted-foreground/40">{excluded}</span>
          </li>
        ) : null}
      </ul>

      {valueNote ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-3 text-xs font-semibold text-success">
          <Sparkles className="h-4 w-4 shrink-0" />
          {valueNote}
        </div>
      ) : null}

      <Link
        href="/signup"
        className={
          featured
            ? "mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-semibold text-success-foreground shadow-md shadow-success/20 transition hover:bg-success/90 active:scale-[0.98]"
            : "mt-6 inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-accent active:scale-[0.98]"
        }
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
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
      className="group rounded-3xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/5 card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function Faq({
  icon,
  q,
  a,
}: {
  icon: React.ReactNode
  q: string
  a: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">{q}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  )
}
