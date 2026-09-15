import { Link } from "@/i18n/navigation"
import { ArrowRight, Trophy, Newspaper, Home, Tag, Clock } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { newsCoverUrl } from "@/lib/news-cover"
import { formatListingPriceShort, formatListingFacts } from "@/lib/listing-utils"
import type { BlogPostCard, PropertyListing, DealEndingSoon, DirectoryBusiness } from "@/lib/queries"
import type { FootballGame } from "@/lib/football"
import { kickoffIso } from "@/lib/football"
import { parseHours, isCanonical, isRaw, format12h, type Hours } from "@/lib/hours"

type Game = FootballGame & { teamName: string; teamShort: string }

const TZ = "America/Los_Angeles"

/* ── This week's games ─────────────────────────────────────────────── */
export function GamesBlock({ games, intl, t }: { games: Game[]; intl: string; t: (k: string, v?: Record<string, string>) => string }) {
  if (games.length === 0) return null
  return (
    <section className="py-8 sm:py-10">
      <Head icon={<Trophy className="h-5 w-5" />} title={t("gamesTitle")} />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {games.map((g) => {
          const iso = kickoffIso(g)
          const when = iso
            ? new Date(iso).toLocaleString(intl, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ })
            : new Date(g.gameDate + "T12:00:00-07:00").toLocaleDateString(intl, { weekday: "short", month: "short", day: "numeric", timeZone: TZ })
          return (
            <li key={`${g.school}-${g.id}`}>
              <Link href="/football" className="flex min-h-[72px] items-center gap-4 border border-[#d8cfc0] bg-white p-4 transition hover:border-[#650C75] hover:shadow-md">
                <span className="font-edition shrink-0 text-xs font-bold uppercase tracking-wide text-[#650C75]">{g.teamShort}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-edition block text-lg font-bold leading-snug">
                    {g.teamName} {g.homeAway === "away" ? t("at") : t("vs")} {g.opponent}
                  </span>
                  <span className="font-edition mt-0.5 block text-sm italic text-[#7a6f60]">
                    {when}
                    {g.venue ? ` · ${g.venue}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <Foot href="/football" label={t("gamesAll")} />
    </section>
  )
}

/* ── New on the news desk ───────────────────────────────────────────── */
export function NewsBlock({ posts, intl, t }: { posts: BlogPostCard[]; intl: string; t: (k: string) => string }) {
  if (posts.length === 0) return null
  return (
    <section className="py-8 sm:py-10">
      <Head icon={<Newspaper className="h-5 w-5" />} title={t("newsTitle")} />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="group border border-[#d8cfc0] bg-white transition hover:border-[#650C75] hover:shadow-md">
            <SafeImage src={newsCoverUrl({ ...p, title: p.titleEn })} alt="" className="aspect-[16/9] w-full object-cover" fallback={<div className="aspect-[16/9] w-full bg-[#650C75]" />} />
            <span className="block p-4">
              {p.publishedAt && (
                <span className="font-edition block text-[11px] font-bold uppercase tracking-[0.12em] text-[#650C75]">
                  {new Date(p.publishedAt).toLocaleDateString(intl, { month: "short", day: "numeric", timeZone: TZ })}
                </span>
              )}
              <span className="font-edition mt-1 block text-lg font-bold leading-snug group-hover:text-[#650C75]">{p.title}</span>
            </span>
          </Link>
        ))}
      </div>
      <Foot href="/news" label={t("newsAll")} />
    </section>
  )
}

/* ── New homes this week ────────────────────────────────────────────── */
export function HomesBlock({ homes, intl, t }: { homes: PropertyListing[]; intl: string; t: (k: string) => string }) {
  if (homes.length === 0) return null
  return (
    <section className="py-8 sm:py-10">
      <Head icon={<Home className="h-5 w-5" />} title={t("homesTitle")} />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {homes.map((h) => (
          <Link key={h.id} href={`/listings/${h.id}`} className="group border border-[#d8cfc0] bg-white transition hover:border-[#650C75] hover:shadow-md">
            <SafeImage src={h.imageUrl ?? ""} alt={h.title} className="aspect-[4/3] w-full object-cover" fallback={<div className="aspect-[4/3] w-full bg-[#f1e6f4]" />} />
            <span className="block p-4">
              <span className="font-edition block text-xl font-extrabold tabular-nums group-hover:text-[#650C75]">{formatListingPriceShort(h.priceCents, h.type, intl)}</span>
              <span className="font-edition mt-0.5 block text-sm text-[#7a6f60]">{formatListingFacts(h.beds, h.baths, h.sqft)}</span>
              {h.address && <span className="font-edition mt-0.5 block text-sm italic text-[#7a6f60]">{h.address}</span>}
            </span>
          </Link>
        ))}
      </div>
      <Foot href="/homes" label={t("homesAll")} />
    </section>
  )
}

/* ── Deals ending this week ─────────────────────────────────────────── */
export function EndingBlock({ deals, intl, t }: { deals: DealEndingSoon[]; intl: string; t: (k: string, v?: Record<string, string>) => string }) {
  if (deals.length === 0) return null
  return (
    <section className="py-8 sm:py-10">
      <Head icon={<Tag className="h-5 w-5" />} title={t("endingTitle")} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {deals.map((d) => (
          <Link key={d.id} href={`/biz/${d.business.slug}`} className="group flex min-h-[96px] gap-4 border border-[#d8cfc0] bg-white p-4 transition hover:border-[#650C75] hover:shadow-md">
            {(d.imageUrl ?? d.business.coverUrl) && (
              <SafeImage src={(d.imageUrl ?? d.business.coverUrl) as string} alt={`${d.title} — ${d.business.name}`} className="h-20 w-20 shrink-0 object-cover" />
            )}
            <span className="min-w-0 flex-1">
              {d.discountText && (
                <span className="mb-1 inline-block bg-[#EFC618] px-2 py-0.5 text-xs font-bold uppercase text-[#3a2600]">{d.discountText}</span>
              )}
              <span className="font-edition block text-lg font-bold leading-snug group-hover:text-[#650C75]">{d.title}</span>
              <span className="font-edition mt-0.5 block text-sm italic text-[#7a6f60]">
                {d.business.name} · {t("endsOn", { date: new Date(d.expiresAt).toLocaleDateString(intl, { weekday: "short", month: "short", day: "numeric", timeZone: TZ }) })}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <Foot href="/deals" label={t("allDeals")} />
    </section>
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

export function OpenLateBlock({ items, t }: { items: { biz: DirectoryBusiness; close: string }[]; t: (k: string, v?: Record<string, string>) => string }) {
  if (items.length === 0) return null
  return (
    <section className="py-8 sm:py-10">
      <Head icon={<Clock className="h-5 w-5" />} title={t("openLateTitle")} />
      <p className="font-edition mt-2 text-base text-[#7a6f60]">{t("openLateSub")}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ biz, close }) => (
          <li key={biz.slug}>
            <Link href={`/biz/${biz.slug}`} className="flex min-h-[64px] items-center gap-3 border border-[#d8cfc0] bg-white p-3 transition hover:border-[#650C75] hover:shadow-md">
              <SafeImage src={biz.logoUrl ?? biz.photoUrl ?? ""} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" fallback={<span className="h-12 w-12 shrink-0 rounded-lg bg-[#f1e6f4]" />} />
              <span className="min-w-0">
                <span className="font-edition block truncate text-base font-bold">{biz.name}</span>
                <span className="font-edition block text-sm text-[#0B992F]">{t("openUntil", { time: format12h(close) })}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Foot href="/businesses" label={t("openLateAll")} />
    </section>
  )
}

/* ── shared bits ────────────────────────────────────────────────────── */
function Head({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b-2 border-[#650C75] pb-2">
      {icon && <span className="text-[#650C75]">{icon}</span>}
      <h2 className="font-edition text-xl font-bold uppercase tracking-[0.16em] text-[#650C75] sm:text-2xl">{title}</h2>
    </div>
  )
}

function Foot({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="font-edition mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-base font-bold text-[#650C75] underline-offset-4 hover:underline">
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  )
}
