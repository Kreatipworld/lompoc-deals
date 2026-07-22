import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Eye,
  Globe2,
  Mail,
  MapPin,
  Receipt,
  Rocket,
  Sparkles,
  Store,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { and, eq, gt, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { analyticsEvents, events } from "@/db/schema"
import { getSiteStats } from "@/lib/queries"
import { getDigestPartners } from "@/lib/digest"
import { TIERS } from "@/lib/stripe"
import { pageAlternates } from "@/lib/seo"
import { BrandLogo } from "@/components/brand-logo"
import { SafeImage } from "@/components/safe-image"
import { Reveal } from "@/components/reveal"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "partners" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: [
      "list your lompoc business",
      "get found by locals lompoc",
      "lompoc business partner",
      "advertise lompoc business",
      "lompoc business directory",
      "free business listing lompoc ca",
    ],
    openGraph: {
      title: t("metaOgTitle"),
      description: t("metaOgDescription"),
      images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: "Lompoc, California" }],
    },
    alternates: pageAlternates("/partners"),
  }
}

async function getUpcomingEventCount() {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(events)
    .where(and(eq(events.status, "approved"), gt(events.startsAt, sql`now()`)))
  return row?.n ?? 0
}

async function getThirtyDayVisitorCount() {
  const [row] = await db
    .select({ n: sql<number>`count(distinct ${analyticsEvents.sessionId})::int` })
    .from(analyticsEvents)
    .where(sql`${analyticsEvents.createdAt} > now() - interval '30 days'`)
  return row?.n ?? 0
}

/** Floors to the nearest 100 and formats as a friendly "2,400+" figure. */
function friendlyCount(n: number) {
  const floored = Math.floor(n / 100) * 100
  return `${floored.toLocaleString("en-US")}+`
}

export default async function PartnersPage({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "partners" })

  const [stats, upcomingEvents, visitors30d, digestPartners] = await Promise.all([
    getSiteStats(),
    getUpcomingEventCount(),
    getThirtyDayVisitorCount(),
    getDigestPartners(6),
  ])

  const spotlightPartners = digestPartners.filter((p) => p.coverUrl).slice(0, 3)

  const growthPrice = TIERS.standard.price
  const perDay = (growthPrice / 30).toLocaleString(params.locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  })

  return (
    <>
      {/* ─────────────────────────────────────────────────
          HERO — brand purple, logo plate, live stats
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-primary">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_85%_-10%,hsl(287_65%_35%/0.55)_0%,transparent_55%),linear-gradient(165deg,hsl(287_75%_20%)_0%,hsl(var(--primary))_52%,hsl(287_80%_15%)_100%)]"
        />
        <div className={`${PAGE_CONTAINER} py-16 text-center sm:py-24 lg:py-28`}>
          <Reveal preset="stagger" as="div" className="mx-auto flex max-w-2xl flex-col items-center">
            <div className="inline-flex rounded-2xl bg-white p-3.5 shadow-xl sm:p-4">
              <BrandLogo className="h-10 w-auto sm:h-12" />
            </div>

            <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {t("hero.kicker")}
            </div>

            <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
              {t("hero.h1")}{" "}
              <span className="relative inline-block italic text-gold">
                {t("hero.h1Italic")}
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-gold/40"
                />
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/signup/business"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-gold-foreground shadow-lg shadow-black/20 transition [transition:transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:brightness-105 active:scale-[0.97]"
              >
                {t("hero.ctaClaim")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {t("hero.ctaLive")}
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/70">{t("hero.trustLine")}</p>
          </Reveal>

          <Reveal
            preset="stagger"
            className="mx-auto mt-12 grid max-w-xl grid-cols-3 divide-x divide-white/20 rounded-2xl border border-white/15 bg-white/5 py-6 backdrop-blur-sm"
          >
            <HeroStat value={friendlyCount(visitors30d)} label={t("hero.statVisitorsLabel")} />
            <HeroStat value={stats.businesses.toLocaleString("en-US")} label={t("hero.statBusinessesLabel")} />
            <HeroStat value={`${upcomingEvents.toLocaleString("en-US")}+`} label={t("hero.statEventsLabel")} />
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          INTRO VIDEO — a neighbor explains the platform
         ───────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("intro.eyebrow")}
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("intro.h2")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("intro.subtitle")}</p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-lg">
          <video
            src="/videos/partner-intro.mp4"
            controls
            playsInline
            preload="metadata"
            aria-label={t("intro.videoLabel")}
            className="aspect-video w-full"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          OUR MISSION — awareness + local economy
         ───────────────────────────────────────────────── */}
      <section className="border-y bg-primary text-primary-foreground">
        <div className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              {t("mission.eyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("mission.h2")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">{t("mission.body")}</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="rounded-2xl bg-white/10 p-5 text-left">
                <div className="font-display text-lg font-semibold">{t(`mission.p${n}Title`)}</div>
                <p className="mt-1 text-sm text-primary-foreground/80">{t(`mission.p${n}Body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          YOU'RE PROBABLY ALREADY LISTED
         ───────────────────────────────────────────────── */}
      {spotlightPartners.length > 0 && (
        <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("alreadyListed.eyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("alreadyListed.h2", { count: stats.businesses })}
            </h2>
            <p className="mt-4 text-base text-muted-foreground">{t("alreadyListed.subtitle")}</p>
          </div>

          <Reveal
            preset="stagger"
            className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3"
          >
            {spotlightPartners.map((p) => (
              <Link
                key={p.slug}
                href={`/biz/${p.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-lg"
              >
                <SafeImage
                  src={p.coverUrl ?? undefined}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                  <BadgeCheck className="h-3 w-3" />
                  {t("alreadyListed.badge")}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="truncate font-display text-lg font-semibold text-white">{p.name}</p>
                  {p.categoryName && (
                    <p className="truncate text-xs text-white/80">{p.categoryName}</p>
                  )}
                </div>
              </Link>
            ))}
          </Reveal>
        </section>
      )}

      {/* ─────────────────────────────────────────────────
          THREE VALUE CARDS
         ───────────────────────────────────────────────── */}
      <section className="border-y bg-secondary/30">
        <div className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("values.eyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("values.h2")}
            </h2>
          </div>

          <Reveal
            preset="stagger"
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            <ValueCard
              icon={<Eye className="h-5 w-5" />}
              title={t("values.card1Title")}
              body={t("values.card1Body")}
            />
            <ValueCard
              icon={<Receipt className="h-5 w-5" />}
              title={t("values.card2Title")}
              body={t("values.card2Body")}
            />
            <ValueCard
              icon={<Sparkles className="h-5 w-5" />}
              title={t("values.card3Title")}
              body={t("values.card3Body")}
            />
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          INTERACTIVE GUIDE — self-hosted deck, embedded
         ───────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("guide.eyebrow")}
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("guide.h2")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("guide.subtitle")}</p>
        </div>
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-lg">
          <iframe
            src="/partner-guide.html"
            title={t("guide.h2")}
            loading="lazy"
            className="h-[82vh] min-h-[560px] w-full border-0"
          />
        </div>
        <div className="mt-6 text-center">
          <a
            href="/partner-guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            {t("guide.openFull")}
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          MORE THAN A LISTING — living hub
         ───────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("hub.eyebrow")}
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("hub.h2")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">{t("hub.subtitle")}</p>
        </div>

        <Reveal
          preset="stagger"
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <HubCard
            icon={<Calendar className="h-5 w-5" />}
            tag={t("hub.eventsTag")}
            title={t("hub.eventsTitle", { count: Math.max(upcomingEvents, 0) })}
            body={t("hub.eventsBody")}
          />
          <HubCard
            icon={<Rocket className="h-5 w-5" />}
            tag={t("hub.launchesTag")}
            title={t("hub.launchesTitle")}
            body={t("hub.launchesBody")}
          />
          <HubCard
            icon={<Mail className="h-5 w-5" />}
            tag={t("hub.digestTag")}
            title={t("hub.digestTitle")}
            body={t("hub.digestBody")}
            accent
          />
          <HubCard
            icon={<MapPin className="h-5 w-5" />}
            tag={t("hub.mapTag")}
            title={t("hub.mapTitle")}
            body={t("hub.mapBody")}
          />
          <HubCard
            icon={<Globe2 className="h-5 w-5" />}
            tag={t("hub.bilingualTag")}
            title={t("hub.bilingualTitle")}
            body={t("hub.bilingualBody")}
          />
          <HubCard
            icon={<BadgeCheck className="h-5 w-5" />}
            tag={t("hub.partnerTag")}
            title={t("hub.partnerTitle")}
            body={t("hub.partnerBody")}
          />
        </Reveal>
      </section>

      {/* ─────────────────────────────────────────────────
          HOW TO JOIN — 3 steps
         ───────────────────────────────────────────────── */}
      <section className="border-y bg-secondary/30">
        <div className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("howToJoin.eyebrow")}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("howToJoin.h2")}
            </h2>
          </div>

          <Reveal preset="stagger" className="mx-auto mt-12 max-w-2xl space-y-5">
            <Step number={1} title={t("howToJoin.step1Title")} body={t("howToJoin.step1Body")} />
            <Step number={2} title={t("howToJoin.step2Title")} body={t("howToJoin.step2Body")} />
            <Step number={3} title={t("howToJoin.step3Title")} body={t("howToJoin.step3Body")} />
          </Reveal>

          <p className="mt-8 text-center text-xs font-medium text-muted-foreground">
            {t("howToJoin.footnote")}
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          PRICING
         ───────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="mx-auto max-w-lg rounded-[2rem] border bg-card p-8 text-center shadow-sm sm:p-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("pricing.eyebrow")}
          </div>
          <div className="mt-4 flex items-baseline justify-center gap-1.5">
            <span className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
              ${growthPrice.toFixed(2)}
            </span>
            <span className="text-base text-muted-foreground">{t("pricing.perMonth")}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-primary">{t("pricing.planName")}</p>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("pricing.body", { perDay })}
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-4 py-2 text-xs font-semibold text-success">
            <Sparkles className="h-3.5 w-3.5" />
            {t("pricing.freeNote")}
          </p>
          <Link
            href="/signup/business"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-success px-8 py-3.5 text-base font-semibold text-success-foreground shadow-lg shadow-success/20 transition hover:bg-success/90 active:scale-[0.98] sm:w-auto"
          >
            {t("pricing.ctaLabel")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FINAL CTA
         ───────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary p-10 text-primary-foreground sm:p-16">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-success/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/20">
              <Store className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              {t("finalCta.h2")} <span className="italic text-gold">{t("finalCta.h2Highlight")}</span>
            </h2>
            <p className="mt-4 text-base text-primary-foreground/80 sm:text-lg">
              {t("finalCta.subtitle")}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup/business"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-success px-8 py-3.5 text-base font-semibold text-success-foreground shadow-lg shadow-success/25 [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-success/90 active:scale-[0.97]"
              >
                {t("finalCta.ctaClaim")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
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

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <div className="font-display text-2xl font-semibold leading-none text-white sm:text-3xl">
        {value}
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-wider text-white/70 sm:text-[11px]">
        {label}
      </div>
    </div>
  )
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function HubCard({
  icon,
  tag,
  title,
  body,
  accent = false,
}: {
  icon: React.ReactNode
  tag: string
  title: string
  body: string
  accent?: boolean
}) {
  return (
    <div
      className={
        accent
          ? "rounded-3xl border border-gold/40 bg-gold/10 p-6 shadow-sm"
          : "rounded-3xl border bg-card p-6 shadow-sm"
      }
    >
      <div
        className={
          accent
            ? "flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-gold-foreground"
            : "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
        }
      >
        {icon}
      </div>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {tag}
      </div>
      <h3 className="mt-1.5 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function Step({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div>
        <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
