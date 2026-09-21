import { Link } from "@/i18n/navigation"
import { ArrowRight, BadgeCheck } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getPartnerBusinesses } from "@/lib/queries"
import { isOpenNow, parseHours, DAY_KEYS } from "@/lib/hours"
import { CategoryList } from "@/components/directory/category-list"
import { PageHeader } from "@/components/page-header"
import { SearchBar } from "@/components/search-bar"
import { pageAlternates } from "@/lib/seo"

// Members change photos, hours, and deals all day, and the roster itself grows
// every time a business joins; regenerate at most every 10 minutes. Business
// saves bust it immediately (lib/revalidate-business).
export const revalidate = 600

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "members" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: [
      "lompoc locals members",
      "official partner lompoc",
      "lompoc locals partners",
      "support local lompoc",
    ],
    alternates: pageAlternates("/members", params.locale),
  }
}

/**
 * The Official Partners roster — every paying member, in one browsable list.
 *
 * Sep 21 2026: the owner shared `/category/partners`, which 404s — "partners"
 * is a membership status, not a category, and nothing on the site listed the
 * members at a URL you could share. The homepage and /businesses rails showed
 * them; neither was a page. This is that page, and `/category/partners` now
 * redirects here (next.config.mjs).
 *
 * Membership comes from getPartnerBusinesses(), the same tier-ranked query that
 * feeds those rails — plan override or an active/trialing subscription, never a
 * hand-rolled read of `subscriptions`.
 */
export default async function MembersPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const [members, t] = await Promise.all([
    getPartnerBusinesses(params.locale),
    getTranslations({ locale: params.locale, namespace: "members" }),
  ])

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("heading"),
    itemListElement: members.slice(0, 50).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${process.env.AUTH_URL ?? "http://localhost:3000"}/biz/${b.slug}`,
      name: b.name,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }}
      />

      <PageHeader
        title={t("heading")}
        backHref="/businesses"
        backLabel={t("allBusinesses")}
        meta={
          <>
            {members.length} {members.length === 1 ? t("memberSingular") : t("memberPlural")} {t("inLompoc")}
          </>
        }
      >
        <div className="w-full lg:max-w-md">
          <SearchBar scrim />
        </div>
      </PageHeader>

      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <p className="max-w-3xl text-sm text-muted-foreground">
            <BadgeCheck className="mr-1.5 inline h-4 w-4 text-primary" aria-hidden />
            {t("intro")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {members.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <CategoryList
            items={members.map((b) => {
              const hours = parseHours(b.hoursJson)
              const known = DAY_KEYS.some((k) => hours[k] !== null)
              return {
                id: b.id,
                name: b.name,
                slug: b.slug,
                description: b.description,
                address: b.address,
                logoUrl: b.logoUrl,
                photoUrl: b.photoUrl,
                activeDealCount: b.activeDealCount,
                tier: b.tier,
                openNow: known ? isOpenNow(hours) : null,
              }
            })}
            labels={{
              searchWithin: t("searchWithin"),
              // CategoryList sorts this mode by tier, then active deals, then
              // name — on a page where everyone is a member that reads as
              // "Plus and the busiest listings first".
              sortMembers: t("sortFeatured"),
              sortAz: t("sortAz"),
              showMore: t("showMore"),
              countLabel: t("countLabel", { count: "{count}" }),
              member: t("memberBadge"),
              dealSingular: t("dealSingular"),
              dealPlural: t("dealPlural"),
              openNow: t("openNow"),
              noMatch: t("noMatch"),
            }}
          />
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:pb-12">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-secondary/40 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{t("ctaHeading")}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("ctaBody")}</p>
          </div>
          <Link
            href="/partners"
            className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            {t("ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
