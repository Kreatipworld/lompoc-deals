import { Link } from "@/i18n/navigation"
import { ArrowRight, Ticket } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { Reveal } from "@/components/motion/reveal"
import { FootballCountdown } from "@/components/football-countdown"
import { newsCoverUrl } from "@/lib/news-cover"
import { formatListingPriceShort, formatListingFacts } from "@/lib/listing-utils"
import type { BlogPostCard, PropertyListing, DealEndingSoon, DirectoryBusiness } from "@/lib/queries"
import type { FootballGame } from "@/lib/football"
import { kickoffIso } from "@/lib/football"
import { parseHours, isCanonical, isRaw, format12h, type Hours } from "@/lib/hours"

type Game = FootballGame & { teamName: string; teamShort: string }
type T = (k: string, v?: Record<string, string>) => string

const TZ = "America/Los_Angeles"
const GOFAN = "https://gofan.co"
const BADGE: Record<string, string> = { lompoc: "/football/badge-braves.png", cabrillo: "/football/badge-conqs.png" }

/* ── Shared edition primitives (one spacing scale, one card language) ── */
export const CARD = "rounded-2xl border border-[#e3dacb] bg-white transition hover:border-[#650C75]/60 hover:shadow-[0_10px_30px_rgba(26,23,18,0.06)]"

export function Sec({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal as="section" className={`py-10 sm:py-12 ${className}`}>
      {children}
    </Reveal>
  )
}

export function Head({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-[#e3dacb] pb-3">
      <div>
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#b9931a]">
          {icon && <span className="text-[#b9931a]">{icon}</span>}
          {title}
        </p>
        {sub && <p className="font-edition mt-1 text-sm italic text-[#7a6f60]">{sub}</p>}
      </div>
    </div>
  )
}

export function Foot({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-[#650C75] underline-offset-4 hover:underline">
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

/* ── This week's games ─────────────────────────────────────────────── */
export function GamesBlock({
  games,
  intl,
  t,
  tf,
}: {
  games: Game[]
  intl: string
  t: T
  tf: T
}) {
  if (games.length === 0) return null
  const cd = { days: tf("cdDays"), hours: tf("cdHours"), minutes: tf("cdMinutes"), tonight: tf("cdTonight"), live: tf("cdLive"), final: tf("cdFinal") }
  return (
    <Sec>
      <Head title={t("gamesTitle")} />
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {games.map((g) => {
          const iso = kickoffIso(g)
          const when = iso
            ? new Date(iso).toLocaleString(intl, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ })
            : new Date(g.gameDate + "T12:00:00-07:00").toLocaleDateString(intl, { weekday: "short", month: "short", day: "numeric", timeZone: TZ })
          return (
            <li key={`${g.school}-${g.id}`}>
              <div className="relative overflow-hidden rounded-2xl bg-[#1a0a1f] p-5 text-white">
                <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#650C75]/50 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BADGE[g.school] ?? BADGE.lompoc} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-white object-contain p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#EFC618]">{g.teamName}</p>
                    <Link href="/football" className="font-edition mt-0.5 block text-2xl font-bold leading-tight hover:underline">
                      {g.homeAway === "away" ? t("at") : t("vs")} {g.opponent}
                    </Link>
                    <p className="mt-1 text-sm text-white/75">
                      {when}
                      {g.venue ? ` · ${g.venue}` : ""}
                    </p>
                  </div>
                </div>
                <div className="relative mt-4 flex flex-wrap items-center gap-2">
                  {iso && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EFC618] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#241629]">
                      {tf("kickoffIn")} <FootballCountdown kickoffIso={iso} labels={cd} />
                    </span>
                  )}
                  <a
                    href={GOFAN}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#EFC618]/70 px-3 py-1 text-xs font-semibold text-[#EFC618] transition hover:bg-[#EFC618]/10"
                  >
                    <Ticket className="h-3.5 w-3.5" /> {tf("tickets")}
                  </a>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <Foot href="/football" label={t("gamesAll")} />
    </Sec>
  )
}

/* ── New on the news desk ───────────────────────────────────────────── */
export function NewsBlock({ posts, intl, t }: { posts: BlogPostCard[]; intl: string; t: T }) {
  if (posts.length === 0) return null
  return (
    <Sec>
      <Head title={t("newsTitle")} />
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className={`group flex items-stretch gap-4 p-3 ${CARD}`}>
            <SafeImage
              src={newsCoverUrl({ ...p, title: p.titleEn })}
              alt=""
              className="h-24 w-28 shrink-0 rounded-xl object-cover"
              fallback={<span className="h-24 w-28 shrink-0 rounded-xl bg-[#650C75]" />}
            />
            <span className="flex min-w-0 flex-col justify-center">
              {p.publishedAt && (
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b9931a]">
                  {new Date(p.publishedAt).toLocaleDateString(intl, { month: "short", day: "numeric", timeZone: TZ })}
                </span>
              )}
              <span className="font-edition mt-1 line-clamp-2 text-lg font-bold leading-snug group-hover:text-[#650C75]">{p.title}</span>
            </span>
          </Link>
        ))}
      </div>
      <Foot href="/news" label={t("newsAll")} />
    </Sec>
  )
}

/* ── New homes this week ────────────────────────────────────────────── */
export function HomesBlock({ homes, intl, t }: { homes: PropertyListing[]; intl: string; t: T }) {
  if (homes.length === 0) return null
  return (
    <Sec>
      <Head title={t("homesTitle")} />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {homes.map((h) => (
          <Link key={h.id} href={`/listings/${h.id}`} className={`group overflow-hidden ${CARD}`}>
            <SafeImage src={h.imageUrl ?? ""} alt={h.title} className="aspect-[4/3] w-full object-cover" fallback={<div className="aspect-[4/3] w-full bg-[#f1e6f4]" />} />
            <span className="block p-4">
              <span className="block text-xl font-extrabold tabular-nums group-hover:text-[#650C75]">{formatListingPriceShort(h.priceCents, h.type, intl)}</span>
              <span className="mt-0.5 block text-sm text-[#5e5448]">{formatListingFacts(h.beds, h.baths, h.sqft)}</span>
              {h.address && <span className="mt-0.5 block truncate text-sm text-[#7a6f60]">{h.address}</span>}
            </span>
          </Link>
        ))}
      </div>
      <Foot href="/homes" label={t("homesAll")} />
    </Sec>
  )
}

/* ── Deals ending this week ─────────────────────────────────────────── */
export function EndingBlock({ deals, intl, t }: { deals: DealEndingSoon[]; intl: string; t: T }) {
  if (deals.length === 0) return null
  return (
    <Sec>
      <Head title={t("endingTitle")} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {deals.map((d) => (
          <Link key={d.id} href={`/biz/${d.business.slug}`} className={`group flex items-center gap-4 p-3 ${CARD}`}>
            {(d.imageUrl ?? d.business.coverUrl) && (
              <SafeImage src={(d.imageUrl ?? d.business.coverUrl) as string} alt={`${d.title} — ${d.business.name}`} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            )}
            <span className="min-w-0 flex-1">
              {d.discountText && (
                <span className="mb-1 inline-block rounded-full bg-[#EFC618] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#241629]">{d.discountText}</span>
              )}
              <span className="font-edition block text-lg font-bold leading-snug group-hover:text-[#650C75]">{d.title}</span>
              <span className="mt-0.5 block text-sm text-[#7a6f60]">
                {d.business.name} · {t("endsOn", { date: new Date(d.expiresAt).toLocaleDateString(intl, { weekday: "short", month: "short", day: "numeric", timeZone: TZ }) })}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <Foot href="/deals" label={t("allDeals")} />
    </Sec>
  )
}

/* ── Open late tonight ──────────────────────────────────────────────── */
const DAY_KEYS: (keyof Hours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

/** Businesses still open after 9 PM tonight (Pacific), by their posted hours. */
export function openLateTonight(all: DirectoryBusiness[], limit = 6): { biz: DirectoryBusiness; close: string }[] {
  const now = new Date()
  const key = DAY_KEYS[Number(now.toLocaleString("en-US", { timeZone: TZ, weekday: "short" }) === "Sun" ? 0 : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(now.toLocaleString("en-US", { timeZone: TZ, weekday: "short" })) + 1)]
  const nowHm = now.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
  const out: { biz: DirectoryBusiness; close: string }[] = []
  for (const b of all) {
    const hours = parseHours(b.hoursJson)
    const d = hours[key]
    if (!d) continue
    let close: string | null = null
    if (isCanonical(d)) close = d.close
    else if (isRaw(d) && d.ranges?.length) close = d.ranges[d.ranges.length - 1].close
    if (!close) continue
    const open = isCanonical(d) ? d.open : d.ranges?.[0]?.open ?? "00:00"
    const wraps = close <= open // e.g. 11:00–02:00 (past midnight)
    const lateEnough = wraps || close >= "21:00"
    const stillOpen = wraps ? nowHm >= open || nowHm < close : nowHm >= open && nowHm < close
    if (lateEnough && stillOpen) out.push({ biz: b, close })
    if (out.length >= limit * 3) break
  }
  // Members first, then latest close.
  out.sort((a, b) => b.biz.tier - a.biz.tier || (a.close <= "05:00" ? 1 : 0) - (b.close <= "05:00" ? 1 : 0) || b.close.localeCompare(a.close))
  return out.slice(0, limit)
}

export function OpenLateBlock({ items, t }: { items: { biz: DirectoryBusiness; close: string }[]; t: T }) {
  if (items.length === 0) return null
  return (
    <Sec>
      <Head title={t("openLateTitle")} sub={t("openLateSub")} />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ biz, close }) => (
          <li key={biz.slug}>
            <Link href={`/biz/${biz.slug}`} className={`flex min-h-[64px] items-center gap-3 p-3 ${CARD}`}>
              <SafeImage src={biz.logoUrl ?? biz.photoUrl ?? ""} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" fallback={<span className="h-12 w-12 shrink-0 rounded-xl bg-[#f1e6f4]" />} />
              <span className="min-w-0">
                <span className="block truncate text-base font-bold">{biz.name}</span>
                <span className="flex items-center gap-1.5 text-sm text-[#0B992F]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0B992F]" aria-hidden="true" />
                  {t("openUntil", { time: format12h(close) })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Foot href="/businesses" label={t("openLateAll")} />
    </Sec>
  )
}
