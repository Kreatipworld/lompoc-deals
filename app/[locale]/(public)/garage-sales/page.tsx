import { getTranslations } from "next-intl/server"
import { ArrowRight, MapPin } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { getFeedItems, type FeedDisplayItem } from "@/lib/feed-queries"
import { isThisWeekend } from "@/lib/feed-interleave"
import { neighborhoodLabel } from "@/lib/neighborhoods"
import { FeedCard } from "@/components/feed-card"
import { GarageSalesMapSection } from "@/components/garage-sales-map-section"
import { pageAlternates } from "@/lib/seo"

export async function generateMetadata() {
  const t = await getTranslations("garageSalesPage")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/garage-sales"),
  }
}

export default async function GarageSalesPage({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations("garageSalesPage")
  const all = await getFeedItems()
  const sales = all.filter((i) => i.type === "garage_sale")
  const now = new Date()
  const weekend = sales.filter((s) => isThisWeekend(s.saleStartsAt, s.saleEndsAt, now))
  const upcoming = sales.filter((s) => !weekend.includes(s))
  const hoods = Array.from(
    new Set(sales.map((s) => s.neighborhood).filter(Boolean) as string[])
  )

  const faq = [1, 2, 3].map((n) => ({
    q: t(`faq${n}q`),
    a: t(`faq${n}a`),
  }))
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  }

  const cardGrid = (items: FeedDisplayItem[]) => (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {items.map((item) => (
        <div key={item.id} className="mb-4 break-inside-avoid">
          <FeedCard item={item} />
        </div>
      ))}
    </div>
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{t("intro")}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/feed/post"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("postCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/feed?type=for_sale"
          className="inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          {t("browseAll")}
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="mt-10 rounded-2xl border bg-secondary/30 p-8 text-center text-muted-foreground">
          {t("empty")}{" "}
          <Link href="/feed/post" className="font-medium text-primary underline underline-offset-4">
            {t("postCta")}
          </Link>
        </p>
      ) : (
        <>
          {weekend.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-2xl font-semibold">{t("thisWeekend")}</h2>
              {cardGrid(weekend)}
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-2xl font-semibold">{t("upcoming")}</h2>
              {cardGrid(upcoming)}
            </section>
          )}
          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl font-semibold">{t("mapHeading")}</h2>
            <GarageSalesMapSection items={sales} />
          </section>
        </>
      )}

      {hoods.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-semibold">{t("byNeighborhood")}</h2>
          <div className="flex flex-wrap gap-2">
            {hoods.map((h) => (
              <Link
                key={h}
                href={`/feed?type=garage_sale&hood=${h}`}
                className="inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm hover:bg-accent"
              >
                <MapPin className="h-3.5 w-3.5" />
                {neighborhoodLabel(h, params.locale)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 border-t pt-8">
        <h2 className="mb-4 font-display text-2xl font-semibold">{t("faqHeading")}</h2>
        <dl className="max-w-3xl space-y-5">
          {faq.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
