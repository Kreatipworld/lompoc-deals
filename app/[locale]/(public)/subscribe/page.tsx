import { Mail, Sparkles, Clock, ShieldCheck, Star, Users } from "lucide-react"
import { CategoryPatternBg } from "@/components/category-pattern-bg"
import { SubscribeForm } from "./subscribe-form"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "subscribePage" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

function InlineSubscribeForm() {
  return (
    <div className="w-full max-w-sm">
      <SubscribeForm />
    </div>
  )
}

export default async function SubscribePage({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "subscribePage" })

  const benefits = [
    { icon: Sparkles, title: t("benefit1Title"), desc: t("benefit1Desc") },
    { icon: Clock, title: t("benefit2Title"), desc: t("benefit2Desc") },
    { icon: ShieldCheck, title: t("benefit3Title"), desc: t("benefit3Desc") },
  ]

  const testimonials = [
    { quote: t("testimonial1Quote"), author: t("testimonial1Author"), subtitle: t("testimonial1Sub") },
    { quote: t("testimonial2Quote"), author: t("testimonial2Author"), subtitle: t("testimonial2Sub") },
    { quote: t("testimonial3Quote"), author: t("testimonial3Author"), subtitle: t("testimonial3Sub") },
  ]

  const sampleDeals = [
    {
      business: "Lompoc Brewing Co.",
      category: "Food & Drink",
      deal: "Happy Hour — 20% off all pints",
      badge: t("sampleBadgeToday"),
      color: "bg-brand-terracotta/10 text-brand-terracotta",
    },
    {
      business: "Valley Flowers",
      category: "Shopping",
      deal: "Spring bouquets from $18 — this weekend only",
      badge: t("sampleBadgeWeekend"),
      color: "bg-success/10 text-success",
    },
    {
      business: "Central Coast Yoga",
      category: "Wellness",
      deal: "First class free for new students",
      badge: t("sampleBadgeNew"),
      color: "bg-accent text-accent-foreground",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-background px-4 py-16 sm:py-24">
        {/* Tiled deal-category icon pattern — sits above gradient, behind content */}
        <CategoryPatternBg />
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-terracotta/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-medium text-primary">
            <Mail className="h-3.5 w-3.5" />
            {t("badge")}
          </div>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {t("heading1")}
            <br />
            <span className="text-primary">{t("heading2")}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            {t("subheading")}
          </p>

          <div className="mt-8 flex justify-center">
            <InlineSubscribeForm />
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {t("socialProofCount", { count: "1,400" })}
          </p>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="bg-background px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            {t("benefitsHeading")}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample digest preview ── */}
      <section className="bg-muted/40 px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            {t("previewHeading")}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("previewSubheading")}
          </p>

          {/* Mock email preview */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            {/* Email header bar */}
            <div className="border-b border-border bg-accent/60 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gold/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
                </div>
                <span className="text-xs text-muted-foreground">
                  📬 {t("previewEmailSubject")}
                </span>
              </div>
            </div>

            {/* Email body */}
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  LD
                </div>
                <div>
                  <p className="text-xs font-semibold">{t("previewFrom")}</p>
                  <p className="text-xs text-muted-foreground">{t("previewEmail")}</p>
                </div>
              </div>

              <h3 className="font-bold text-foreground">
                🛍️ {t("previewWeekly")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Saturday, April 19 · 9:00 AM</p>

              <div className="mt-4 space-y-3">
                {sampleDeals.map(({ business, category, deal, badge, color }, i) => (
                  <div
                    key={business}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{business}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
                          {badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{category}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{deal}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("previewMoreDeals")} &rarr;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="bg-background px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-2 text-4xl font-extrabold text-primary">1,400+</div>
            <p className="text-sm text-muted-foreground">{t("statLocals")}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map(({ quote, author, subtitle }) => (
              <div
                key={author}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-gold text-gold"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="mt-3">
                  <p className="text-xs font-semibold">{author}</p>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative overflow-hidden bg-primary px-4 py-14 text-primary-foreground">
        {/* Icon pattern in white on dark CTA background */}
        <CategoryPatternBg className="text-primary-foreground/10" />
        <div className="relative mx-auto max-w-xl text-center">
          <Mail className="mx-auto mb-4 h-10 w-10 opacity-80" />
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            {t("ctaHeading")}
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80 sm:text-base">
            {t("ctaBody")}
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-sm">
              <SubscribeForm variant="inverted" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
