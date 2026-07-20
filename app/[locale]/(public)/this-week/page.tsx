import { Link } from "@/i18n/navigation"
import { CalendarDays, MapPin, Tag, ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { getMasterDigestContent, selectLead } from "@/lib/digest"
import { SafeImage } from "@/components/safe-image"
import { EditionGallery } from "@/components/edition-gallery"
import { pageAlternates } from "@/lib/seo"

// The edition tracks live content (events expire, deals rotate), so render fresh
// rather than serving a stale week from the build.
export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
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
      images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: "Lompoc, California" }],
    },
    alternates: pageAlternates("/this-week"),
  }
}

/** Absolute-ise relative image paths the same way the digest email does. */
function img(u: string | null | undefined): string | null {
  return u || null
}

export default async function ThisWeekPage({ params }: { params: { locale: string } }) {
  const locale = params.locale === "es" ? "es" : "en"
  const [content, t] = await Promise.all([
    getMasterDigestContent(),
    getTranslations({ locale: params.locale, namespace: "thisWeek" }),
  ])

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
  const timeOf = (d: Date) =>
    d.toLocaleTimeString(intl, { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })

  const today = new Date()
  const isEmpty =
    content.events.length + content.deals.length + content.things.length + content.partners.length === 0

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#1a1712]">
      {/* ── Masthead: the same nameplate readers just saw in their inbox ── */}
      <header className="border-b-4 border-[#650C75] bg-[#650C75] text-center">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <p className="font-edition text-[11px] font-bold uppercase tracking-[0.34em] text-[#EFC618] sm:text-xs">
            {t("kicker")}
          </p>
          <h1 className="font-edition mt-2 text-4xl font-bold leading-none text-white sm:text-6xl">
            {t("nameplate")}
          </h1>
          <div className="mx-auto mt-4 h-[3px] w-[88%] bg-[#EFC618]" />
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/80 sm:text-xs">
            {dateLong(today)} &nbsp;·&nbsp; {t("dateline")}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {isEmpty ? (
          <p className="font-edition mx-auto max-w-xl py-24 text-center text-xl leading-relaxed text-[#7a6f60]">
            {t("emptyEdition")}
          </p>
        ) : (
          <>
            {/* ── Lead story ── */}
            {lead && (
              <section className="border-b-2 border-[#1a1712] py-8 sm:py-10">
                <p className="font-edition text-xs font-bold uppercase tracking-[0.2em] text-[#650C75]">
                  {t("leadStory")}
                </p>
                {lead.kind === "event" ? (
                  <div className="mt-3 grid gap-6 md:grid-cols-[1.25fr_1fr] md:items-start">
                    <div>
                      <Link
                        href={`/events/${lead.event.id}`}
                        className="font-edition block text-3xl font-bold leading-[1.08] hover:text-[#650C75] sm:text-5xl"
                      >
                        {lead.event.title}
                      </Link>
                      <p className="font-edition mt-3 text-base italic text-[#7a6f60] sm:text-lg">
                        {dateShort(lead.event.startsAt)} · {timeOf(lead.event.startsAt)}
                        {lead.event.location ? ` · ${lead.event.location}` : ""}
                      </p>
                      <Link
                        href={`/events/${lead.event.id}`}
                        className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#650C75] px-6 text-base font-semibold text-white transition hover:bg-[#4a0857]"
                      >
                        {t("eventDetails")} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    {img(lead.event.imageUrl) && (
                      <SafeImage
                        src={img(lead.event.imageUrl) as string}
                        alt=""
                        className="h-56 w-full border border-[#d8cfc0] object-cover sm:h-72"
                      />
                    )}
                  </div>
                ) : (
                  <div className="mt-3 grid gap-6 md:grid-cols-[1.25fr_1fr] md:items-start">
                    <div>
                      {lead.deal.discountText && (
                        <span className="mb-3 inline-block bg-[#EFC618] px-3 py-1 text-sm font-bold uppercase tracking-wide text-[#3a2600]">
                          {lead.deal.discountText}
                        </span>
                      )}
                      <Link
                        href={`/biz/${lead.deal.business.slug}`}
                        className="font-edition block text-3xl font-bold leading-[1.08] hover:text-[#650C75] sm:text-5xl"
                      >
                        {lead.deal.title}
                      </Link>
                      <p className="font-edition mt-3 text-base italic text-[#7a6f60] sm:text-lg">
                        {lead.deal.business.name}
                      </p>
                      <Link
                        href={`/biz/${lead.deal.business.slug}`}
                        className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#650C75] px-6 text-base font-semibold text-white transition hover:bg-[#4a0857]"
                      >
                        {t("viewDeal")} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    {img(lead.deal.imageUrl ?? lead.deal.business.coverUrl) && (
                      <SafeImage
                        src={img(lead.deal.imageUrl ?? lead.deal.business.coverUrl) as string}
                        alt=""
                        className="h-56 w-full border border-[#d8cfc0] object-cover sm:h-72"
                      />
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── Calendar ── */}
            {events.length > 0 && (
              <section className="py-8 sm:py-10">
                <SectionHead icon={<CalendarDays className="h-5 w-5" />} title={t("calendarTitle")} />
                <ul className="mt-5 divide-y divide-[#d8cfc0] border-t border-[#d8cfc0]">
                  {events.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/events/${e.id}`}
                        className="flex min-h-[64px] flex-col gap-1 py-4 transition hover:bg-[#efe9df] sm:flex-row sm:items-baseline sm:gap-5"
                      >
                        <span className="font-edition shrink-0 text-sm font-bold uppercase tracking-wide text-[#650C75] sm:w-32">
                          {dateShort(e.startsAt)}
                        </span>
                        <span className="flex-1">
                          <span className="font-edition block text-lg font-bold leading-snug sm:text-xl">
                            {e.title}
                          </span>
                          <span className="font-edition mt-0.5 block text-sm italic text-[#7a6f60]">
                            {timeOf(e.startsAt)}
                            {e.location ? ` · ${e.location}` : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <FooterLink href="/events" label={t("allEvents")} />
              </section>
            )}

            {/* ── Deals ── */}
            {deals.length > 0 && (
              <section className="py-8 sm:py-10">
                <SectionHead icon={<Tag className="h-5 w-5" />} title={t("dealsTitle")} />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {deals.map((d) => (
                    <Link
                      key={d.id}
                      href={`/biz/${d.business.slug}`}
                      className="group flex min-h-[96px] gap-4 border border-[#d8cfc0] bg-white p-4 transition hover:border-[#650C75] hover:shadow-md"
                    >
                      {img(d.imageUrl ?? d.business.coverUrl) && (
                        <SafeImage
                          src={img(d.imageUrl ?? d.business.coverUrl) as string}
                          alt=""
                          className="h-20 w-20 shrink-0 object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        {d.discountText && (
                          <span className="mb-1 inline-block bg-[#EFC618] px-2 py-0.5 text-xs font-bold uppercase text-[#3a2600]">
                            {d.discountText}
                          </span>
                        )}
                        <span className="font-edition block text-lg font-bold leading-snug group-hover:text-[#650C75]">
                          {d.title}
                        </span>
                        <span className="font-edition mt-0.5 block text-sm italic text-[#7a6f60]">
                          {d.business.name}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
                <FooterLink href="/deals" label={t("allDeals")} />
              </section>
            )}

            {/* ── Things to do — swipeable ── */}
            {content.things.length > 0 && (
              <section className="py-8 sm:py-10">
                <SectionHead icon={<MapPin className="h-5 w-5" />} title={t("thingsTitle")} />
                <p className="font-edition mt-2 text-base text-[#7a6f60]">{t("swipeHint")}</p>
                <div className="mt-5">
                  <EditionGallery
                    label={t("thingsTitle")}
                    prevLabel={t("prev")}
                    nextLabel={t("next")}
                  >
                    {content.things.map((thing) => (
                      <Link
                        key={thing.href}
                        href={thing.href}
                        className="group w-[78vw] shrink-0 snap-start border border-[#d8cfc0] bg-white transition hover:border-[#650C75] hover:shadow-lg sm:w-[300px]"
                      >
                        <SafeImage
                          src={img(thing.imageUrl) ?? ""}
                          alt=""
                          className="h-48 w-full object-cover"
                          fallback={<div className="h-48 w-full bg-[#650C75]" />}
                        />
                        <span className="block p-4">
                          {thing.subtitle && (
                            <span className="font-edition block text-xs font-bold uppercase tracking-[0.12em] text-[#650C75]">
                              {thing.subtitle}
                            </span>
                          )}
                          <span className="font-edition mt-1 block text-xl font-bold leading-snug group-hover:text-[#650C75]">
                            {thing.title}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </EditionGallery>
                </div>
                <FooterLink href="/activities" label={t("allThings")} />
              </section>
            )}

            {/* ── Neighbors — swipeable ── */}
            {content.partners.length > 0 && (
              <section className="py-8 sm:py-10">
                <SectionHead title={t("neighborsTitle")} />
                <p className="font-edition mt-2 text-base text-[#7a6f60]">{t("swipeHint")}</p>
                <div className="mt-5">
                  <EditionGallery
                    label={t("neighborsTitle")}
                    prevLabel={t("prev")}
                    nextLabel={t("next")}
                  >
                    {content.partners.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/biz/${p.slug}`}
                        className="group w-[78vw] shrink-0 snap-start border border-[#d8cfc0] bg-white transition hover:border-[#650C75] hover:shadow-lg sm:w-[300px]"
                      >
                        <SafeImage
                          src={img(p.coverUrl) ?? ""}
                          alt=""
                          className="h-48 w-full object-cover"
                          fallback={<div className="h-48 w-full bg-[#650C75]" />}
                        />
                        <span className="block p-4">
                          <span className="font-edition inline-block border border-[#650C75] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#650C75]">
                            {t("officialPartner")}
                          </span>
                          <span className="font-edition mt-2 block text-xl font-bold leading-snug group-hover:text-[#650C75]">
                            {p.name}
                          </span>
                          <span className="font-edition mt-0.5 block text-sm italic text-[#7a6f60]">
                            {p.dealTitle ?? p.categoryName ?? ""}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </EditionGallery>
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Subscribe: this page is the digest's landing spot ── */}
        <section className="mt-6 border-2 border-[#650C75] bg-white px-6 py-10 text-center">
          <h2 className="font-edition text-2xl font-bold sm:text-3xl">{t("subscribeTitle")}</h2>
          <p className="font-edition mx-auto mt-2 max-w-md text-base text-[#7a6f60] sm:text-lg">
            {t("subscribeBody")}
          </p>
          <Link
            href="/subscribe"
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#650C75] px-8 text-base font-semibold text-white transition hover:bg-[#4a0857]"
          >
            {t("subscribeCta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}

/** Rule-flanked section kicker, echoing the printed-paper section headers. */
function SectionHead({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b-2 border-[#650C75] pb-2">
      {icon && <span className="text-[#650C75]">{icon}</span>}
      <h2 className="font-edition text-xl font-bold uppercase tracking-[0.16em] text-[#650C75] sm:text-2xl">
        {title}
      </h2>
    </div>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="font-edition mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-base font-bold text-[#650C75] underline-offset-4 hover:underline"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  )
}
