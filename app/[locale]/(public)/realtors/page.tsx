import { Link } from "@/i18n/navigation"
import { ArrowRight, Check, Home, Inbox, MapPin, Star, Video } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { TIERS } from "@/lib/stripe"
import { pageAlternates } from "@/lib/seo"
import { getFeaturedAgents, getAllRealEstateListings } from "@/lib/queries"
import { PropertyListingGrid } from "@/components/property-listing-card"
import { Reveal } from "@/components/reveal"
import { HeroIntro } from "@/components/motion/hero-intro"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

/**
 * lompoclocals.com/realtors — the realtor invitation. A seller page, nothing
 * else: the opportunity (few agents on a page the whole town uses), live proof,
 * what a listing gets, the price, one button. Owner (Sep 16 2026): "it has to
 * be a sales pitch so they sign up… a landing page of its own… it's a seller
 * page." No personal names anywhere; every number comes from the database.
 */
export const revalidate = 600

const SIGNUP = "/signup/business?plan=plus&utm_source=realtors&utm_medium=landing&utm_campaign=realtors"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: "realtorsInvite" })
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: pageAlternates("/realtors", params.locale),
  }
}

async function stats() {
  const [biz, homes, agents] = await Promise.all([
    db.execute(sql`select count(*)::int as n from businesses where status = 'approved'`),
    db.execute(sql`select count(*)::int as n from property_listings l join businesses b on b.id = l.business_id where l.status = 'active' and b.status = 'approved' and (l.expires_at is null or l.expires_at > now())`),
    db.execute(sql`select count(distinct l.business_id)::int as n from property_listings l join businesses b on b.id = l.business_id where l.status = 'active' and b.status = 'approved'`),
  ])
  const n = (r: { rows: Record<string, unknown>[] }) => Number(r.rows[0]?.n ?? 0)
  return { businesses: n(biz), homes: n(homes), agents: n(agents) }
}

export default async function RealtorsInvitePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const [t, s, agents, listings] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "realtorsInvite" }),
    stats().catch(() => ({ businesses: 450, homes: 0, agents: 1 })),
    getFeaturedAgents(3).catch(() => []),
    getAllRealEstateListings(undefined, 3).catch(() => []),
  ])
  const price = TIERS.premium.price
  const businessesRounded = Math.max(100, Math.floor(s.businesses / 10) * 10)

  const Cta = ({ size = "lg" }: { size?: "lg" | "md" }) => (
    <Link
      href={SIGNUP}
      data-realtors-cta
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gold font-semibold text-gold-foreground shadow-lg shadow-black/15 transition hover:bg-gold/90 active:scale-[0.98] ${size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"}`}
    >
      {t("cta")}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )

  return (
    <div className="pb-8">
      {/* HERO — the opportunity */}
      <section className="relative overflow-hidden border-b bg-primary text-primary-foreground">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-success/20 blur-3xl" />
        <div className={`${PAGE_CONTAINER} relative py-16 sm:py-24`}>
          <HeroIntro className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <Home className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-6xl" style={{ textWrap: "balance" }}>
              {s.agents <= 1 ? t("h1One") : t("h1Few", { count: s.agents })}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/90 sm:text-lg">
              {t("lead", { businesses: businessesRounded.toLocaleString() })}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Cta />
              <p className="text-sm text-primary-foreground/75">{t("priceLine", { price: price.toFixed(2) })}</p>
            </div>
          </HeroIntro>

          {/* live numbers */}
          <Reveal preset="stagger" className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: `${businessesRounded.toLocaleString()}+`, l: t("statBusinesses") },
              { n: "1,000+", l: t("statFollowers") },
              { n: String(s.agents), l: t("statAgents") },
              { n: String(s.homes), l: t("statHomes") },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-4 text-center backdrop-blur-sm">
                <div className="font-display text-3xl font-bold tabular-nums text-gold">{x.n}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/80">{x.l}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* WHY NOW */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-20`}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl" style={{ textWrap: "balance" }}>{t("whyH2")}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{t("whyBody")}</p>
        </div>
        <Reveal preset="stagger" className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            { icon: <MapPin className="h-5 w-5" />, title: t("g1Title"), body: t("g1Body") },
            { icon: <Inbox className="h-5 w-5" />, title: t("g2Title"), body: t("g2Body") },
            { icon: <Video className="h-5 w-5" />, title: t("g3Title"), body: t("g3Body") },
            { icon: <Star className="h-5 w-5" />, title: t("g4Title"), body: t("g4Body") },
          ].map((g) => (
            <div key={g.title} className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">{g.icon}</div>
              <h3 className="mt-4 font-display text-xl font-semibold">{g.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* PROOF — what is live right now */}
      {(listings.length > 0 || agents.length > 0) && (
        <section className="border-y bg-secondary/30">
          <div className={`${PAGE_CONTAINER} py-16 sm:py-20`}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{t("proofEyebrow")}</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{t("proofH2")}</h2>
              </div>
              <Link href="/homes" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                {t("proofLink")} →
              </Link>
            </div>
            {listings.length > 0 && <PropertyListingGrid listings={listings} />}
            {agents.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {agents.map((a) => (
                  <Link key={a.id} href={`/biz/${a.slug}`} className="inline-flex items-center gap-3 rounded-full border bg-card py-1.5 pl-1.5 pr-4 text-sm shadow-sm transition hover:border-primary/40">
                    {a.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Home className="h-4 w-4" /></span>
                    )}
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-muted-foreground">· {t("agentHomes", { count: a.homes })}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* PRICE + CTA */}
      <section className={`${PAGE_CONTAINER} py-16 sm:py-24`}>
        <div className="mx-auto max-w-2xl rounded-[28px] border-2 border-gold bg-card p-8 text-center shadow-xl sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{t("priceEyebrow")}</p>
          <div className="mt-3 flex items-baseline justify-center gap-1">
            <span className="font-display text-6xl font-bold tracking-tight">${price.toFixed(2)}</span>
            <span className="text-muted-foreground">{t("perMonth")}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("priceNote")}</p>
          <ul className="mx-auto mt-6 max-w-md space-y-2.5 text-left text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{t(`f${n}`)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Cta />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t("steps")}</p>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("questions")} <a href="mailto:hello@lompoclocals.com" className="font-semibold text-primary underline-offset-4 hover:underline">hello@lompoclocals.com</a>
          {" · "}
          <Link href="/for-businesses/real-estate/guide" className="font-semibold text-primary underline-offset-4 hover:underline">{t("guideLink")}</Link>
        </p>
      </section>
    </div>
  )
}
