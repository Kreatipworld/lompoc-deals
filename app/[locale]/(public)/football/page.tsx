import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowRight, CalendarDays, MapPin, Ticket, Trophy } from "lucide-react"
import { getFootballSeason, getFootballNews, latestResults, type FootballGame, type TeamSeason } from "@/lib/football"
import { HUYCK } from "@/lib/football-sync"
import { newsCoverUrl } from "@/lib/news-cover"
import { SafeImage } from "@/components/safe-image"
import { SubscribeForm } from "@/components/subscribe-form"
import { BusinessMapLoader } from "@/components/business-map-loader"
import { FootballCountdown } from "@/components/football-countdown"
import { FootballVideo } from "@/components/football-video"
import { pageAlternates } from "@/lib/seo"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

// Scores land the morning after; ten minutes keeps Friday night fresh without
// hitting the database on every visit.
export const revalidate = 600

const HUYCK_LAT = 34.6459
const HUYCK_LNG = -120.4693
const GOFAN = "https://gofan.co"

// Our own videos (Blob), 9:16.
const VIDEOS = [
  { key: "bigGame", src: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/social/video/biggame-braves-at-conqs-huyck-9x16-xw6gUq3bRO59uBnA4knny9WXvpQGPJ.mp4" },
  { key: "bravesNight", src: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/social/video/bravenight-v3-9x16.mp4" },
  { key: "week3", src: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/social/posts/2026-09-11-week3-football-9x16.mp4" },
] as const

const BADGE: Record<string, string> = { lompoc: "/football/badge-braves.png", cabrillo: "/football/badge-conqs.png" }

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "football" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates("/football", params.locale),
  }
}

/** Kickoff as an ISO string in Pacific time (PDT in season). */
function kickoffIso(g: FootballGame): string | null {
  if (!g.kickoff) return null
  const m = g.kickoff.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return null
  let h = Number(m[1]) % 12
  if (m[3].toUpperCase() === "PM") h += 12
  // Pacific is PDT (-07:00) for the whole Aug–Nov season; PST only after the first Sunday of November.
  const [y, mo, d] = g.gameDate.split("-").map(Number)
  const offset = mo >= 11 && d > 7 ? "-08:00" : mo === 12 ? "-08:00" : "-07:00"
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${m[2]}:00${offset}`
}

function fmtDate(date: string, locale: string, opts: Intl.DateTimeFormatOptions) {
  const [y, m, d] = date.split("-").map(Number)
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { timeZone: "America/Los_Angeles", ...opts }).format(new Date(Date.UTC(y, m - 1, d, 19)))
}

export default async function FootballPage({ params }: { params: { locale: string } }) {
  const [t, teams, news] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "football" }),
    getFootballSeason(),
    getFootballNews(6, params.locale),
  ])
  const results = latestResults(teams, 4)
  const hasGames = teams.some((x) => x.games.length > 0)

  const countdownLabels = { days: t("cdDays"), hours: t("cdHours"), minutes: t("cdMinutes"), tonight: t("cdTonight"), live: t("cdLive"), final: t("cdFinal") }
  const record = (x: TeamSeason) => `${x.wins}-${x.losses}${x.ties ? `-${x.ties}` : ""}`
  const matchup = (g: FootballGame) => (g.homeAway === "away" ? `${t("at")} ${g.opponent}` : `${t("vs")} ${g.opponent}`)

  return (
    <div className="pb-20">
      {/* ── Hero: this week ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1a0a1f] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/football/huyck-goalposts.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#650c75]/70 via-[#1a0a1f]/80 to-[#1a0a1f]" />
        <div className={`${PAGE_CONTAINER} relative py-12 sm:py-16`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#efc618]">{t("eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t("h1")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("sub")}</p>

          {hasGames ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {teams.map((x) => {
                const g = x.next
                const iso = g ? kickoffIso(g) : null
                return (
                  <article key={x.school} id={x.school === "lompoc" ? "braves" : "conqs"} className="rounded-[20px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={BADGE[x.school]} alt="" className="h-14 w-14 rounded-xl bg-white object-contain p-1" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#efc618]">{x.name}</p>
                        <p className="text-sm text-white/70">{t("record")} <span className="font-semibold text-white tabular-nums">{record(x)}</span></p>
                      </div>
                    </div>
                    {g ? (
                      <>
                        <p className="mt-5 font-display text-2xl font-bold leading-tight sm:text-3xl">{matchup(g)}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{fmtDate(g.gameDate, params.locale, { weekday: "long", month: "short", day: "numeric" })}{g.kickoff ? ` · ${g.kickoff}` : ""}</span>
                          {g.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{g.venue}</span>}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {iso && (
                            <span className="rounded-full bg-[#efc618] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#241629]">
                              {t("kickoffIn")} <FootballCountdown kickoffIso={iso} labels={countdownLabels} />
                            </span>
                          )}
                          <a href={GOFAN} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-white/90 underline-offset-4 hover:underline">
                            <Ticket className="h-4 w-4" /> {t("tickets")}
                          </a>
                        </div>
                      </>
                    ) : (
                      <p className="mt-5 text-white/80">{t("noNext")}</p>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="mt-8 rounded-[20px] border border-white/15 bg-white/[0.06] p-5 text-white/80">{t("empty")}</p>
          )}
        </div>
      </section>

      {/* ── Scores ─────────────────────────────────────────────────── */}
      {results.length > 0 && (
        <section className={`${PAGE_CONTAINER} pt-12`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t("scoresHeading")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("scoresSub")}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((g) => (
              <div key={g.id} className="rounded-2xl border border-border/80 bg-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{fmtDate(g.gameDate, params.locale, { month: "short", day: "numeric" })} · {g.teamShort}</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${g.result === "W" ? "bg-green-100 text-green-800" : g.result === "L" ? "bg-red-100 text-red-800" : "bg-muted text-foreground"}`}>{g.result}</span>
                  <span className="font-display text-2xl font-bold tabular-nums">{g.scoreFor}–{g.scoreAgainst}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{matchup(g)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Schedule & results ─────────────────────────────────────── */}
      {hasGames && (
        <section className={`${PAGE_CONTAINER} pt-12`}>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t("scheduleHeading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("scheduleSub")}</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            {teams.map((x) => (
              <div key={x.school} className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
                <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BADGE[x.school]} alt="" className="h-9 w-9 rounded-lg object-contain" />
                  <div>
                    <h3 className="font-display text-lg font-bold leading-tight">{x.name}</h3>
                    <p className="text-xs text-muted-foreground">{t("record")} <span className="font-semibold text-foreground tabular-nums">{record(x)}</span> · {t("season", { season: x.games[0]?.season ?? new Date().getFullYear() })}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      <tr className="border-b border-border/60">
                        <th className="px-5 py-2 font-bold">{t("colDate")}</th>
                        <th className="px-3 py-2 font-bold">{t("colOpponent")}</th>
                        <th className="px-3 py-2 font-bold">{t("colWhere")}</th>
                        <th className="px-5 py-2 text-right font-bold">{t("colResult")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {x.games.map((g) => {
                        const isNext = x.next?.id === g.id
                        const past = !!g.result
                        return (
                          <tr key={g.id} data-football="game" className={`border-b border-border/50 last:border-0 ${isNext ? "bg-primary/[0.06]" : ""} ${past ? "text-muted-foreground" : ""}`}>
                            <td className="whitespace-nowrap px-5 py-2.5 tabular-nums">
                              {fmtDate(g.gameDate, params.locale, { month: "short", day: "numeric" })}
                              {g.kickoff && <span className="ml-1 text-xs text-muted-foreground">{g.kickoff}</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={isNext ? "font-semibold text-foreground" : ""}>{matchup(g)}</span>
                              {g.leagueGame && <span className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">{t("league")}</span>}
                            </td>
                            <td className="px-3 py-2.5 text-xs">{g.homeAway === "away" && !/huyck/i.test(g.venue ?? "") ? t("away") : t("huyckShort")}</td>
                            <td className="whitespace-nowrap px-5 py-2.5 text-right tabular-nums">
                              {g.result ? (
                                <span className={g.result === "W" ? "font-semibold text-green-700" : g.result === "L" ? "font-semibold text-red-700" : ""}>{g.result} {g.scoreFor}–{g.scoreAgainst}</span>
                              ) : isNext ? (
                                <span className="rounded-full bg-[#efc618] px-2 py-0.5 text-[11px] font-bold uppercase text-[#241629]">{t("next")}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("sourceNote")}</p>
        </section>
      )}

      {/* ── News ───────────────────────────────────────────────────── */}
      {news.length > 0 && (
        <section className={`${PAGE_CONTAINER} pt-12`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t("newsHeading")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("newsSub")}</p>
            </div>
            <Link href="/news" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
              {t("newsMore")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-2xl border border-border/80 bg-card transition-shadow hover:shadow-md">
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <SafeImage src={newsCoverUrl({ ...post, title: post.titleEn })} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(params.locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" }) : ""}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold leading-snug group-hover:text-primary">{post.title}</h3>
                  {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
          <Link href="/news" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden">
            {t("newsMore")} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* ── Watch ──────────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} pt-12`}>
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t("watchHeading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("watchSub")}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {VIDEOS.map((v) => (
            <FootballVideo key={v.key} src={v.src} title={t(`video_${v.key}`)} labels={{ unmute: t("unmute"), mute: t("mute") }} />
          ))}
        </div>
      </section>

      {/* ── Game day ───────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} pt-12`}>
        <div className="grid gap-6 overflow-hidden rounded-[20px] border border-border/80 bg-card lg:grid-cols-[1fr_1.1fr]">
          <div className="p-6 sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><Trophy className="h-4 w-4" /> {t("gamedayEyebrow")}</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{t("gamedayHeading")}</h2>
            <p className="mt-2 text-muted-foreground">{t("gamedayBoth")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><strong>{HUYCK}</strong>, Lompoc, CA 93436</span></li>
              <li className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{t("gamedayArrive")}</span></li>
              <li className="flex gap-3"><Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{t("gamedayTickets")} <a href={GOFAN} target="_blank" rel="noopener" className="font-semibold text-primary underline-offset-4 hover:underline">GoFan</a></span></li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              {t("sponsorLine")}{" "}
              <Link href="/partners" className="font-semibold text-primary underline-offset-4 hover:underline">{t("sponsorCta")}</Link>
            </p>
          </div>
          <div className="h-72 lg:h-auto">
            <BusinessMapLoader lat={HUYCK_LAT} lng={HUYCK_LNG} name="Huyck Stadium" />
          </div>
        </div>
      </section>

      {/* ── Alerts ─────────────────────────────────────────────────── */}
      <section className={`${PAGE_CONTAINER} pt-12`}>
        <div className="rounded-[20px] bg-primary px-6 py-8 text-white sm:px-10">
          <h2 className="font-display text-2xl font-bold tracking-tight">{t("alertsHeading")}</h2>
          <p className="mt-1 max-w-xl text-white/85">{t("alertsSub")}</p>
          <div className="mt-5 max-w-md">
            <SubscribeForm variant="inverted" />
          </div>
        </div>
      </section>
    </div>
  )
}
