import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { MapPin, ArrowRight, CalendarDays, Mail } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { PageHeader } from "@/components/page-header"
import { PAGE_CONTAINER } from "@/lib/layout-constants"
import { pageAlternates, siteUrl } from "@/lib/seo"
import { getFoodSpots, getPartnerBusinesses, type DirectoryBusiness } from "@/lib/queries"

// The guide is evergreen prose over slow-moving data (activities, member covers) —
// hourly ISR keeps new members and photo swaps flowing through without a deploy.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "thingsToDo" })
  return {
    // No brand in the string — the root layout's template appends "| Lompoc Locals".
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: [
      "things to do in lompoc",
      "lompoc attractions",
      "lompoc ca",
      "la purisima mission",
      "lompoc wine ghetto",
      "jalama beach",
      "vandenberg launch viewing",
    ],
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [{ url: "/activities/la-purisima-mission.jpg", width: 1200, height: 630, alt: t("heading") }],
    },
    alternates: pageAlternates("/things-to-do", locale),
  }
}

type GuideSection = {
  id: string
  toc: string
  title: string
  body: string
  image: { src: string; alt: string }
  links: { href: string; label: string }[]
}

export default async function ThingsToDoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "thingsToDo" })

  // Eat & drink picks: paying members seed the pool, the directory's rotating
  // food-spot query fills the rest; the final list is alphabetical so nothing
  // reads as a ranking.
  let foodSpots: DirectoryBusiness[] = []
  try {
    const [partners, spots] = await Promise.all([
      getPartnerBusinesses(locale),
      getFoodSpots(10, locale),
    ])
    const merged = [
      ...partners.filter((b) => b.categorySlug === "food-drink" && b.photoUrl),
      ...spots.filter((b) => b.photoUrl),
    ]
    const seen = new Set<number>()
    foodSpots = merged
      .filter((b) => (seen.has(b.id) ? false : (seen.add(b.id), true)))
      .slice(0, 6)
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    // DB unavailable (build/dev) — the guide still renders; the food grid hides.
  }

  const sections: GuideSection[] = [
    {
      id: "mission",
      toc: t("tocMission"),
      title: t("missionTitle"),
      body: t("missionBody"),
      image: { src: "/activities/la-purisima-mission.jpg", alt: t("missionTitle") },
      links: [
        { href: "/activities/la-purisima-mission", label: t("missionLink") },
        { href: "/activities/burton-mesa-ecological-reserve", label: t("missionLinkTrails") },
      ],
    },
    {
      id: "wine",
      toc: t("tocWine"),
      title: t("wineTitle"),
      body: t("wineBody"),
      image: { src: "/activities/wine-ghetto-tasting.jpg", alt: t("wineTitle") },
      links: [
        { href: "/activities/lompoc-wine-ghetto", label: t("wineLinkGhetto") },
        { href: "/activities/sta-rita-hills-wine-trail", label: t("wineLinkTrail") },
      ],
    },
    {
      id: "arts",
      toc: t("tocArts"),
      title: t("artsTitle"),
      body: t("artsBody"),
      image: { src: "/activities/lompoc-murals.jpg", alt: t("artsTitle") },
      links: [
        { href: "/activities/lompoc-murals-tour", label: t("artsLinkMurals") },
        { href: "/activities/lompoc-museum", label: t("artsLinkMuseum") },
        { href: "/activities/cypress-gallery", label: t("artsLinkGallery") },
      ],
    },
    {
      id: "beaches",
      toc: t("tocBeach"),
      title: t("beachTitle"),
      body: t("beachBody"),
      image: { src: "/activities/jalama-beach.jpg", alt: t("beachTitle") },
      links: [
        { href: "/activities/jalama-beach", label: t("beachLinkJalama") },
        { href: "/activities/surf-beach", label: t("beachLinkSurf") },
        { href: "/activities/ocean-beach-county-park", label: t("beachLinkOcean") },
      ],
    },
    {
      id: "launches",
      toc: t("tocLaunch"),
      title: t("launchTitle"),
      body: t("launchBody"),
      image: { src: "/activities/vandenberg-launch.jpg", alt: t("launchTitle") },
      links: [
        { href: "/activities/vandenberg-launches", label: t("launchLinkGuide") },
        { href: "/news", label: t("launchLinkNews") },
        { href: "/events", label: t("launchLinkEvents") },
      ],
    },
    {
      id: "flowers",
      toc: t("tocFlowers"),
      title: t("flowersTitle"),
      body: t("flowersBody"),
      image: { src: "/activities/lompoc-flower-fields.jpg", alt: t("flowersTitle") },
      links: [
        { href: "/activities/lompoc-flower-fields", label: t("flowersLinkGuide") },
        { href: "/activities/ryon-park", label: t("flowersLinkPark") },
      ],
    },
  ]

  const tocEntries = [
    ...sections.map((s) => ({ id: s.id, label: s.toc })),
    { id: "eat", label: t("tocEat") },
    { id: "weekend", label: t("tocWeekend") },
  ]

  // The six attractions as an ItemList — each URL is one of our own guide pages.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("heading"),
    itemListElement: sections.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.title,
      url: `${siteUrl}${locale === "es" ? "/es" : ""}${s.links[0].href}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader title={t("heading")} meta={t("subheading")} />

      {/* ─── INTRO + TOC ─── */}
      <section className={`${PAGE_CONTAINER} pt-8 sm:pt-10`}>
        <div className="grid items-center gap-6 md:grid-cols-5 md:gap-10">
          <div className="md:col-span-3">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("intro1")}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{t("intro2")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tocEntries.map((entry) => (
                <a
                  key={entry.id}
                  href={`#${entry.id}`}
                  className="flex-shrink-0 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
                >
                  {entry.label}
                </a>
              ))}
              <Link
                href="/activities"
                className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("introActivitiesLink")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl border bg-accent md:col-span-2 md:block">
            <SafeImage
              src="/lompoc-flowers-4.jpg"
              alt={t("heading")}
              loading="eager"
              optWidth={1080}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ─── THE SIX GUIDE SECTIONS ─── */}
      <div className={PAGE_CONTAINER}>
        {sections.map((section, i) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 border-b py-10 last:border-b-0 sm:py-12"
          >
            <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
              <div className={i % 2 === 1 ? "md:order-2" : undefined}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-accent">
                  <SafeImage
                    src={section.image.src}
                    alt={section.image.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-primary">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
                  {section.title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1 rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
                    >
                      {link.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ─── EAT & DRINK LOCAL ─── */}
      <section id="eat" className={`${PAGE_CONTAINER} scroll-mt-24 border-t py-10 sm:py-12`}>
        <p className="text-sm font-semibold tracking-wide text-primary">07</p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
          {t("eatTitle")}
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{t("eatBody")}</p>

        {foodSpots.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {foodSpots.map((biz) => (
              <Link
                key={biz.id}
                href={`/biz/${biz.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-accent">
                  <SafeImage
                    src={biz.photoUrl!}
                    alt={biz.name}
                    optWidth={384}
                    className="h-full w-full object-cover [transition:transform_300ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                  />
                  {biz.activeDealCount > 0 && (
                    <div className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
                      {t("eatDealBadge", { count: biz.activeDealCount })}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold leading-snug transition-colors group-hover:text-primary">
                    {biz.name}
                  </h3>
                  {biz.address && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{biz.address.split(",")[0]}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/deals"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("eatLinkDeals")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/category/food-drink"
            className="inline-flex items-center gap-1 rounded-full border bg-background px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
          >
            {t("eatLinkAll")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ─── THIS WEEKEND + DIGEST ─── */}
      <section id="weekend" className={`${PAGE_CONTAINER} scroll-mt-24 pb-12 pt-2 sm:pb-16`}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-accent/30 p-6">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">{t("weekendTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("weekendBody")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("weekendLinkEvents")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/this-week"
                className="inline-flex items-center gap-1 rounded-full border bg-background px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
              >
                {t("weekendLinkThisWeek")}
              </Link>
              <Link
                href="/hotels"
                className="inline-flex items-center gap-1 rounded-full border bg-background px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
              >
                {t("weekendLinkHotels")}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border bg-accent/30 p-6">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">{t("subscribeTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("subscribeBody")}
            </p>
            <Link
              href="/subscribe"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("subscribeCta")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
