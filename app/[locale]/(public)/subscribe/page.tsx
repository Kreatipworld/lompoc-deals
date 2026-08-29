import { Mail, Sparkles, Clock, ShieldCheck, Users } from "lucide-react"
import { CategoryPatternBg } from "@/components/category-pattern-bg"
import { SubscribeForm } from "@/components/subscribe-form"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { pageAlternates } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "subscribePage" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/subscribe", params.locale),
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
  const tUi = await getTranslations({ locale: params.locale, namespace: "newsUi.subscribe" })

  const benefits = [
    { icon: Sparkles, title: t("benefit1Title"), desc: t("benefit1Desc") },
    { icon: Clock, title: t("benefit2Title"), desc: t("benefit2Desc") },
    { icon: ShieldCheck, title: t("benefit3Title"), desc: t("benefit3Desc") },
  ]

  // Illustrative sections of the Monday email — descriptions of what's in it,
  // not invented events or offers.
  const sampleSections = [
    {
      title: t("sampleItem1Title"),
      category: t("sampleItem1Category"),
      body: t("sampleItem1Body"),
      badge: t("sampleBadgeToday"),
      color: "bg-brand-terracotta/10 text-brand-terracotta",
    },
    {
      title: t("sampleItem2Title"),
      category: t("sampleItem2Category"),
      body: t("sampleItem2Body"),
      badge: t("sampleBadgeWeekend"),
      color: "bg-success/10 text-success",
    },
    {
      title: t("sampleItem3Title"),
      category: t("sampleItem3Category"),
      body: t("sampleItem3Body"),
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
            {t("socialProofCount")}
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
                📰 {t("previewWeekly")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{tUi("previewSchedule")}</p>

              <div className="mt-4 space-y-3">
                {sampleSections.map(({ title, category, body, badge, color }, i) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
                          {badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{category}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{body}</p>
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

      {/* ── When it lands ── */}
      <section className="bg-background px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="mb-2 text-4xl font-extrabold text-primary">{t("statSaturday")}</div>
            <p className="text-sm text-muted-foreground">{t("statLocals")}</p>
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
