import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Home,
  Megaphone,
  Store,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { TIERS } from "@/lib/stripe"
import { pageAlternates } from "@/lib/seo"
import { Reveal } from "@/components/reveal"
import { HeroIntro } from "@/components/motion/hero-intro"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

// The realtor road: Plus is the listings tier. This page sells it in one
// screen and hands the agent to the signup wizard with Plus preselected.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "realEstateLanding" })
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    keywords: [
      "list homes lompoc",
      "lompoc real estate listing",
      "lompoc homes for sale",
      "lompoc homes for rent",
      "lompoc realtor advertising",
    ],
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: "Lompoc, California" }],
    },
    alternates: pageAlternates("/for-businesses/real-estate", params.locale),
  }
}

const SIGNUP_PLUS = "/signup/business?plan=plus"

export default async function RealEstateLandingPage({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "realEstateLanding" })
  const price = TIERS.premium.price

  return (
    <div className="pb-8">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-primary text-primary-foreground">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-success/20 blur-3xl" />
        <div className={`${PAGE_CONTAINER} relative py-16 sm:py-24`}>
          <HeroIntro className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <Home className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              {t("heroH1")}
            </h1>
            <p className="mt-4 text-base font-semibold text-gold sm:text-lg">{t("heroSub")}</p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              {t("heroBody")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={SIGNUP_PLUS}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-gold-foreground shadow-lg shadow-black/20 transition hover:bg-gold/90 active:scale-[0.98] sm:w-auto"
              >
                {t("heroCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/properties"
                className="inline-flex w-full items-center justify-center rounded-full border border-primary-foreground/30 px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 sm:w-auto"
              >
                {t("heroSecondary")}
              </Link>
            </div>
          </HeroIntro>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("benefitsH2")}
        </h2>
        <Reveal preset="stagger" className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Benefit icon={<Home className="h-5 w-5" />} title={t("b1Title")} body={t("b1Body")} href="/homes" />
          <Benefit icon={<Store className="h-5 w-5" />} title={t("b2Title")} body={t("b2Body")} href="/category/real-estate" />
          <Benefit icon={<Megaphone className="h-5 w-5" />} title={t("b3Title")} body={t("b3Body")} />
        </Reveal>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="border-y bg-secondary/30">
        <div className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("howH2")}
          </h2>
          <Reveal preset="stagger" className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                  {n}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{t(`step${n}Title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(`step${n}Body`)}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── PRICE ────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="mx-auto max-w-lg rounded-[2rem] border-2 border-primary/30 bg-card p-8 text-center shadow-lg shadow-primary/10 sm:p-12">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            <BadgeCheck className="h-4 w-4 text-gold" />
            {t("priceEyebrow")}
          </div>
          <div className="mt-4 flex items-baseline justify-center gap-1.5">
            <span className="font-display text-5xl font-bold tracking-tight sm:text-6xl">${price.toFixed(2)}</span>
            <span className="text-base text-muted-foreground">{t("perMonth")}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-success">{t("priceNote")}</p>
          <ul className="mx-auto mt-7 max-w-sm space-y-2.5 text-left">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t(`priceF${n}`)}</span>
              </li>
            ))}
          </ul>
          <Link
            href={SIGNUP_PLUS}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.98]"
          >
            {t("priceCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/properties"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("priceSecondary")}
          </Link>
        </div>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{t("rulesTitle")}:</span> {t("rulesBody")}
        </p>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="border-t bg-secondary/30">
        <div className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("faqH2")}
          </h2>
          <div className="mx-auto mt-10 max-w-2xl divide-y rounded-3xl border bg-card shadow-sm">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-6">
                <h3 className="font-display text-base font-semibold">{t(`q${n}`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(`a${n}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary p-10 text-center text-primary-foreground sm:p-16">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("finalH2")}</h2>
            <p className="mt-3 text-primary-foreground/85">{t("finalBody")}</p>
            <Link
              href={SIGNUP_PLUS}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-gold-foreground shadow-lg shadow-black/20 transition hover:bg-gold/90 active:scale-[0.98]"
            >
              {t("finalCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Benefit({
  icon,
  title,
  body,
  href,
}: {
  icon: ReactNode
  title: string
  body: string
  href?: string
}) {
  const inner = (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </>
  )
  const cls = "flex h-full flex-col rounded-3xl border bg-card p-6 shadow-sm transition hover:shadow-md"
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}
