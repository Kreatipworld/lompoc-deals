import { Link } from "@/i18n/navigation"
import { ArrowRight, MapPin, Clock } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { categoryLabel, CATEGORY_SLUGS } from "@/lib/category-label"
import type { Metadata } from "next"
import { getMasterDigestContent, selectLead } from "@/lib/digest"
import { SafeImage } from "@/components/safe-image"
import { EditionGallery } from "@/components/edition-gallery"
import { pageAlternates } from "@/lib/seo"
import { PAGE_CONTAINER } from "@/lib/layout-constants"
import { launchTitle } from "@/lib/launch-display"
import { getWeekForecast } from "@/lib/weather"
import { WeatherWeek } from "@/components/weather-week"
import { getFootballSeason, upcomingGames, isFootballSeason } from "@/lib/football"
import { getRecentBlogPosts, getNewListingsSince, getDealsEndingWithin, getDirectoryBusinesses } from "@/lib/queries"
import { GamesBlock, NewsBlock, HomesBlock, EndingBlock, OpenLateBlock, openLateTonight, Sec, Head, Foot, CARD } from "./briefing"

// The edition tracks live content (events expire, deals rotate), so render fresh
// rather than serving a stale week from the build.
export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "thisWeek" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: [
      "lompoc this week",
      "what's happening in lompoc",
      "lompoc events this week",
      "lompoc deals this week",
      "things to do in lompoc",
    ],
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    alternates: pageAlternates("/this-week", params.locale),
  }
}

/** Absolute-ise relative image paths the same way the digest email does. */
function img(u: string | null | undefined): string | null {
  return u || null
}

export default async function ThisWeekPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const locale = params.locale === "es" ? "es" : "en"
  const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback)
  const [content, t, tc, tcEn, ta, tLaunch, tw, tf, forecast, seasons, news, newHomes, ending, directory] = await Promise.all([
    // Events / things / outdoors / news come back in the page locale (DB twins, English fallback).
    getMasterDigestContent(locale),
    getTranslations({ locale: params.locale, namespace: "thisWeek" }),
    getTranslations({ locale: params.locale, namespace: "categoryLabels" }),
    getTranslations({ locale: "en", namespace: "categoryLabels" }),
    getTranslations({ locale: params.locale, namespace: "activityCategory" }),
    getTranslations({ locale: params.locale, namespace: "newsUi.events" }),
    getTranslations({ locale: params.locale, namespace: "weather" }),
    getTranslations({ locale: params.locale, namespace: "football" }),
    // Every briefing block degrades to "nothing" rather than breaking the edition.
    getWeekForecast(),
    isFootballSeason() ? safe(getFootballSeason(), []) : Promise.resolve([]),
    safe(getRecentBlogPosts(3, locale), []),
    safe(getNewListingsSince(7, 3), []),
    safe(getDealsEndingWithin(7, 4, locale), []),
    safe(getDirectoryBusinesses(locale), []),
  ])
  const games = upcomingGames(seasons, 7)
  const openLate = openLateTonight(directory, 6)
  const weatherLabels = {
    heading: tw("heading"),
    source: tw("source"),
    updating: tw("updating"),
    today: tw("today"),
    days: { mon: tw("mon"), tue: tw("tue"), wed: tw("wed"), thu: tw("thu"), fri: tw("fri"), sat: tw("sat"), sun: tw("sun") },
    conditions: {
      sun: tw("c_sun"),
      "cloud-sun": tw("c_cloud-sun"),
      cloud: tw("c_cloud"),
      fog: tw("c_fog"),
      rain: tw("c_rain"),
      drizzle: tw("c_drizzle"),
      storm: tw("c_storm"),
      wind: tw("c_wind"),
    },
  }
  // Launch rows with no title_es twin still get their parsed Spanish shape on /es. The query
  // already substituted a twin when one exists, so a translated title no longer matches the
  // launch regex and passes through untouched.
  const eventTitle = (e: { title: string; source?: string }) =>
    launchTitle({ title: e.title, source: e.source ?? "", description: null }, locale, tLaunch)
  // Partners carry only the English category name; map it back to its slug so /es reads the label.
  const slugByEnglishName = new Map(CATEGORY_SLUGS.map((slug) => [tcEn(slug), slug]))
  const partnerCategory = (name: string | null) =>
    name ? categoryLabel(tc, slugByEnglishName.get(name), name) : null
  // "Things to do" subtitles are either an activity category slug or a sentence of description.
  const ACTIVITY_KEYS = new Set(["outdoors", "food-wine", "history", "arts", "family", "unique"])
  const thingSubtitle = (sub: string | null) => (sub && ACTIVITY_KEYS.has(sub) ? ta(sub) : sub)

  const lead = selectLead(content)
  // Keep the lead out of its own section so it never appears twice on the page.
  const events = lead?.kind === "event" ? content.events.slice(1) : content.events
  const deals = lead?.kind === "deal" ? content.deals.slice(1) : content.deals

  const intl = locale === "es" ? "es-US" : "en-US"
  const dateLong = (d: Date) =>
    d.toLocaleDateString(intl, {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    })
  const dateShort = (d: Date) =>
    d.toLocaleDateString(intl, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    })
  const dayName = (d: Date) => d.toLocaleDateString(intl, { weekday: "short", timeZone: "America/Los_Angeles" })
  const dayNum = (d: Date) => d.toLocaleDateString(intl, { day: "numeric", timeZone: "America/Los_Angeles" })
  const timeOf = (d: Date) =>
    d.toLocaleTimeString(intl, { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })

  const today = new Date()
  const isEmpty =
    content.events.length + content.deals.length + content.things.length + content.partners.length === 0

  const leadImage = lead
    ? lead.kind === "event"
      ? img(lead.event.imageUrl)
      : img(lead.deal.imageUrl ?? lead.deal.business.coverUrl)
    : null
  const leadHref = lead ? (lead.kind === "event" ? `/events/${lead.event.id}` : `/biz/${lead.deal.business.slug}`) : "/"
  const leadTitle = lead ? (lead.kind === "event" ? eventTitle(lead.event) : lead.deal.title) : ""
  const leadMeta = lead
    ? lead.kind === "event"
      ? `${dateShort(lead.event.startsAt)} · ${timeOf(lead.event.startsAt)}${lead.event.location ? ` · ${lead.event.location}` : ""}`
      : lead.deal.business.name
    : ""

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#1a1712]">
      {/* ── Weather: always the first thing on the page, never hidden ── */}
      <WeatherWeek days={forecast} labels={weatherLabels} />

      {/* ── Masthead: the same nameplate readers just saw in their inbox ── */}
      <header className="bg-[#650C75] text-center text-white">
        <div className={`${PAGE_CONTAINER} py-6 sm:py-8`}>
          <p className="font-edition text-[11px] font-bold uppercase tracking-[0.34em] text-[#EFC618] sm:text-xs">{t("kicker")}</p>
          <h1 className="font-edition mt-1.5 text-4xl font-bold leading-none sm:text-6xl">{t("nameplate")}</h1>
          <div className="mx-auto mt-3 h-px w-40 bg-[#EFC618]" />
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/75 sm:text-xs">
            {dateLong(today)} &nbsp;·&nbsp; {t("dateline")}
          </p>
        </div>
      </header>

      <main className={`${PAGE_CONTAINER} pb-10 sm:pb-14`}>
        {/* ── This week's games (in season only) ── */}
        <GamesBlock games={games} intl={intl} t={t} tf={tf} />

        {isEmpty && games.length === 0 && news.length === 0 ? (
          <p className="font-edition mx-auto max-w-xl py-24 text-center text-xl leading-relaxed text-[#7a6f60]">
            {t("emptyEdition")}
          </p>
        ) : (
          <>
            {/* ── Lead story: full-bleed image, title over a scrim ── */}
            {lead && (
              <Sec>
                <Head title={t("leadStory")} />
                <Link href={leadHref} className="group relative mt-5 block overflow-hidden rounded-2xl bg-[#1a0a1f] text-white">
                  {leadImage ? (
                    <SafeImage src={leadImage} alt={leadTitle} className="h-[420px] w-full object-cover transition duration-700 group-hover:scale-[1.03] sm:h-[520px]" />
                  ) : (
                    <div className="h-[360px] w-full bg-gradient-to-br from-[#650C75] to-[#2c0736] sm:h-[440px]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120616] via-[#120616]/55 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#EFC618] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#241629]">
                      {lead.kind === "deal" && lead.deal.discountText ? lead.deal.discountText : leadMeta}
                    </span>
                    <h2 className="font-edition mt-3 max-w-3xl text-3xl font-bold leading-[1.05] sm:text-5xl">{leadTitle}</h2>
                    {lead.kind === "deal" && <p className="font-edition mt-2 text-base italic text-white/80 sm:text-lg">{leadMeta}</p>}
                    <span className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#650C75] transition group-hover:bg-[#EFC618] group-hover:text-[#241629]">
                      {lead.kind === "event" ? t("eventDetails") : t("viewDeal")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Sec>
            )}

            {/* ── Calendar: timeline, day column left ── */}
            {events.length > 0 && (
              <Sec>
                <Head title={t("calendarTitle")} />
                <ol className="mt-5 overflow-hidden rounded-2xl border border-[#e3dacb] bg-white">
                  {events.slice(0, 8).map((e, i) => (
                    <li key={e.id} className={i > 0 ? "border-t border-[#efe8dc]" : ""}>
                      <Link href={`/events/${e.id}`} className="group grid min-h-[72px] grid-cols-[64px_1fr] gap-3 p-3 transition hover:bg-[#fbf7f0] sm:grid-cols-[88px_1fr] sm:gap-5 sm:p-4">
                        <span className="flex flex-col items-center justify-center rounded-xl bg-[#fdf6dc] py-2 text-[#8a6d0f]">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{dayName(e.startsAt)}</span>
                          <span className="font-edition text-2xl font-bold leading-none tabular-nums">{dayNum(e.startsAt)}</span>
                        </span>
                        <span className="flex min-w-0 flex-col justify-center">
                          <span className="font-edition line-clamp-2 text-lg font-bold leading-snug group-hover:text-[#650C75] sm:text-xl">{eventTitle(e)}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[#7a6f60]">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeOf(e.startsAt)}</span>
                            {e.location && <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{e.location}</span></span>}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
                <Foot href="/events" label={t("allEvents")} />
              </Sec>
            )}

            {/* ── New on the news desk ── */}
            <NewsBlock posts={news} intl={intl} t={t} />

            {/* ── New homes this week ── */}
            <HomesBlock homes={newHomes} intl={intl} t={t} />

            {/* ── Deals ending this week ── */}
            <EndingBlock deals={ending} intl={intl} t={t} />

            {/* ── Open late tonight ── */}
            <OpenLateBlock items={openLate} t={t} />

            {/* ── Deals ── */}
            {deals.length > 0 && (
              <Sec>
                <Head title={t("dealsTitle")} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {deals.map((d) => (
                    <Link key={d.id} href={`/biz/${d.business.slug}`} className={`group flex items-center gap-4 p-3 ${CARD}`}>
                      {img(d.imageUrl ?? d.business.coverUrl) && (
                        <SafeImage
                          src={img(d.imageUrl ?? d.business.coverUrl) as string}
                          alt={`${d.title} — ${d.business.name}`}
                          className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        {d.discountText && (
                          <span className="mb-1 inline-block rounded-full bg-[#EFC618] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#241629]">
                            {d.discountText}
                          </span>
                        )}
                        <span className="font-edition block text-lg font-bold leading-snug group-hover:text-[#650C75]">{d.title}</span>
                        <span className="mt-0.5 block text-sm text-[#7a6f60]">{d.business.name}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <Foot href="/deals" label={t("allDeals")} />
              </Sec>
            )}

            {/* ── Things to do — swipeable ── */}
            {content.things.length > 0 && (
              <Sec>
                <Head title={t("thingsTitle")} sub={t("swipeHint")} />
                <div className="mt-5">
                  <EditionGallery label={t("thingsTitle")} prevLabel={t("prev")} nextLabel={t("next")}>
                    {content.things.map((thing) => (
                      <Link key={thing.href} href={thing.href} className={`group w-[72vw] shrink-0 snap-start overflow-hidden sm:w-[280px] ${CARD}`}>
                        <SafeImage
                          src={img(thing.imageUrl) ?? ""}
                          alt={thing.title}
                          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          fallback={<div className="h-44 w-full bg-[#650C75]" />}
                        />
                        <span className="block p-4">
                          {thing.subtitle && (
                            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#b9931a]">{thingSubtitle(thing.subtitle)}</span>
                          )}
                          <span className="font-edition mt-1 block text-lg font-bold leading-snug group-hover:text-[#650C75]">{thing.title}</span>
                        </span>
                      </Link>
                    ))}
                  </EditionGallery>
                </div>
                <Foot href="/activities" label={t("allThings")} />
              </Sec>
            )}

            {/* ── Neighbors — swipeable ── */}
            {content.partners.length > 0 && (
              <Sec>
                <Head title={t("neighborsTitle")} sub={t("swipeHint")} />
                <div className="mt-5">
                  <EditionGallery label={t("neighborsTitle")} prevLabel={t("prev")} nextLabel={t("next")}>
                    {content.partners.map((p) => (
                      <Link key={p.slug} href={`/biz/${p.slug}`} className={`group w-[72vw] shrink-0 snap-start overflow-hidden sm:w-[280px] ${CARD}`}>
                        <SafeImage
                          src={img(p.coverUrl) ?? ""}
                          alt={p.name}
                          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          fallback={<div className="h-44 w-full bg-[#650C75]" />}
                        />
                        <span className="block p-4">
                          <span className="inline-block rounded-full bg-[#650C75] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">{t("officialPartner")}</span>
                          <span className="font-edition mt-2 block text-lg font-bold leading-snug group-hover:text-[#650C75]">{p.name}</span>
                          <span className="mt-0.5 block text-sm text-[#7a6f60]">{p.dealTitle ?? partnerCategory(p.categoryName) ?? ""}</span>
                        </span>
                      </Link>
                    ))}
                  </EditionGallery>
                </div>
              </Sec>
            )}
          </>
        )}

        {/* ── Subscribe: this page is the digest's landing spot ── */}
        <section className="mt-4 overflow-hidden rounded-2xl bg-[#650C75] px-6 py-10 text-center text-white sm:py-12">
          <h2 className="font-edition text-2xl font-bold sm:text-3xl">{t("subscribeTitle")}</h2>
          <p className="font-edition mx-auto mt-2 max-w-md text-base text-white/80 sm:text-lg">{t("subscribeBody")}</p>
          <Link
            href="/subscribe"
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#EFC618] px-8 text-base font-bold text-[#241629] transition hover:bg-white"
          >
            {t("subscribeCta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}
