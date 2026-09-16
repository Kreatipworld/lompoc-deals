import { Link } from "@/i18n/navigation"
import { ArrowRight, BookOpen, Lightbulb } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { pageAlternates } from "@/lib/seo"
import { PAGE_CONTAINER } from "@/lib/layout-constants"
import { GuidePrintButton } from "@/components/guide-print-button"

// The Plus member manual for real estate agents. One sendable link, en + es,
// printable. Written to the dashboard property flow (12-photo uploader, home
// facts, open house, status, leads). Documentation layout: sticky in-page nav
// on desktop, numbered sections, framed "see it live" cards instead of
// screenshots so the page never goes stale.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "realEstateGuide" })
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: pageAlternates("/for-businesses/real-estate/guide", params.locale),
    robots: { index: true, follow: true },
  }
}

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"] as const

export default async function RealEstateGuidePage({
  params,
}: {
  params: { locale: string }
}) {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "realEstateGuide" })

  return (
    <div className="pb-12">
      <style>{`
        @media print {
          header, footer, nav, .print-hide { display: none !important; }
          .guide-main { max-width: none !important; }
          .guide-section { break-inside: avoid; }
          a[href]::after { content: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <section className="border-b bg-secondary/30">
        <div className={`${PAGE_CONTAINER} py-10 sm:py-14`}>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">{t("h1")}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("lede")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <GuidePrintButton label={t("printBtn")} />
            <Link
              href="/dashboard/properties"
              className="print-hide inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {t("s11Cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BODY ───────────────────────────────────────────── */}
      <div className={`${PAGE_CONTAINER} py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12`}>
        <aside className="print-hide hidden lg:block">
          <nav aria-label={t("navLabel")} className="sticky top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("navLabel")}</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {SECTIONS.map((s, i) => (
                <li key={s}>
                  <a href={`#${s}`} className="flex gap-2 rounded-md px-2 py-1 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                    <span className="w-5 shrink-0 tabular-nums text-primary">{i + 1}.</span>
                    <span>{t(`${s}Title`)}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className="guide-main max-w-3xl space-y-14">
          {/* 1. What you have with Plus */}
          <Section id="s1" n={1} title={t("s1Title")}>
            <p>{t("s1Body")}</p>
            <Bullets items={[t("s1L1"), t("s1L2"), t("s1L3"), t("s1L4"), t("s1L5")]} />
            <LiveCard label={t("liveLabel")} href="/homes" caption={t("s1Cap")} url="lompoclocals.com/homes" />
          </Section>

          {/* 2. Your profile */}
          <Section id="s2" n={2} title={t("s2Title")}>
            <p>{t("s2Body")}</p>
            <Bullets items={[t("s2L1"), t("s2L2"), t("s2L3"), t("s2L4"), t("s2L5")]} />
            <LiveCard
              label={t("liveLabel")}
              href="/biz/empire-real-estate-group-maressa-the-realtor"
              caption={t("s2Cap")}
              url="lompoclocals.com/biz/…"
            />
          </Section>

          {/* 3. Add a property */}
          <Section id="s3" n={3} title={t("s3Title")}>
            <p>{t("s3Body")}</p>
            <Steps items={[t("s3St1"), t("s3St2"), t("s3St3"), t("s3St4"), t("s3St5"), t("s3St6"), t("s3St7"), t("s3St8")]} />
            <LiveCard label={t("liveLabel")} href="/listings/50" caption={t("s3Cap")} url="lompoclocals.com/listings/…" />
          </Section>

          {/* 4. Photos that sell */}
          <Section id="s4" n={4} title={t("s4Title")}>
            <Bullets items={[t("s4L1"), t("s4L2"), t("s4L3"), t("s4L4")]} />
          </Section>

          {/* 5. Edit, renew, sold, remove */}
          <Section id="s5" n={5} title={t("s5Title")}>
            <Bullets items={[t("s5L1"), t("s5L2"), t("s5L3"), t("s5L4")]} />
          </Section>

          {/* 6. Buyer leads */}
          <Section id="s6" n={6} title={t("s6Title")}>
            <p>{t("s6Body")}</p>
            <Bullets items={[t("s6L1"), t("s6L2")]} />
            <Tip label={t("tip")}>{t("s6L3")}</Tip>
          </Section>

          {/* 7. Open houses */}
          <Section id="s7" n={7} title={t("s7Title")}>
            <p>{t("s7Body")}</p>
          </Section>

          {/* 8. Featured Agent */}
          <Section id="s8" n={8} title={t("s8Title")}>
            <p>{t("s8Body")}</p>
          </Section>

          {/* 9. We promote you */}
          <Section id="s9" n={9} title={t("s9Title")}>
            <Bullets items={[t("s9L1"), t("s9L2"), t("s9L3"), t("s9L4")]} />
            <p>{t("s9Body")}</p>
          </Section>

          {/* 10. Rules */}
          <Section id="s10" n={10} title={t("s10Title")}>
            <Bullets items={[t("s10L1"), t("s10L2"), t("s10L3"), t("s10L4")]} />
          </Section>

          {/* 11. Help */}
          <Section id="s11" n={11} title={t("s11Title")}>
            <p>{t("s11Body")}</p>
            <div className="print-hide flex flex-wrap gap-3 pt-2">
              <a
                href="mailto:hello@lompoclocals.com"
                className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition hover:bg-accent"
              >
                hello@lompoclocals.com
              </a>
              <Link
                href="/dashboard/properties"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t("s11Cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Section>

          <p className="border-t pt-6 text-sm text-muted-foreground">{t("footer")}</p>
        </main>
      </div>
    </div>
  )
}

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="guide-section scroll-mt-24">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl font-semibold tabular-nums text-primary">{n}.</span>
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/90">{children}</div>
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-5">
      {items.map((it, i) => (
        <li key={i} className="list-disc marker:text-primary">
          {it}
        </li>
      ))}
    </ul>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 rounded-xl border bg-card px-4 py-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  )
}

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-foreground" />
      <p>
        <span className="font-semibold">{label}:</span> {children}
      </p>
    </div>
  )
}

// A framed "see it live" card in place of a screenshot: the real page is the
// illustration, so the guide never shows a stale UI.
function LiveCard({ label, href, caption, url }: { label: string; href: string; caption: string; url: string }) {
  return (
    <Link
      href={href}
      className="print-hide group block overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-2 border-b bg-secondary/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
        <span className="ml-2 normal-case tracking-normal text-foreground/70">{url}</span>
      </div>
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <p className="text-sm text-muted-foreground">{caption}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
          {label}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
