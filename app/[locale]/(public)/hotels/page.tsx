import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { HOTELS } from "@/lib/hotels-data"
import { HotelsMap } from "@/components/hotels-map"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HotelsFilterGrid } from "@/components/hotels-filter-grid"
import { ActivityTicker } from "@/components/activity-ticker"
import {
  MapPin,
  ArrowRight,
  BedDouble,
  Landmark,
  Navigation,
  Wine,
  Rocket,
  Flower2,
  Palette,
  ChevronRight,
  ShieldCheck,
  Tag,
  Ban,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Lompoc Hotels & Accommodations — Where to Stay | Lompoc Deals",
  description:
    "Find curated hotels in Lompoc, CA. From budget-friendly motels to upscale suites — near Vandenberg Space Force Base, downtown Lompoc, and the Santa Rita Hills wine country.",
  keywords: [
    "lompoc hotels",
    "lompoc accommodations",
    "hotels in lompoc ca",
    "lompoc motels",
    "where to stay lompoc",
    "lompoc california lodging",
  ],
  openGraph: {
    title: "Lompoc Hotels & Accommodations",
    description: "Curated hotels in Lompoc, CA — from budget to boutique.",
  },
}

// ── Constants ────────────────────────────────────────────────────────────────

const COVER_GRADIENT: Record<string, string> = {
  $: "from-emerald-500/20 via-teal-400/10 to-cyan-300/10",
  $$: "from-amber-500/25 via-orange-400/15 to-yellow-300/10",
  $$$: "from-violet-600/25 via-purple-500/15 to-fuchsia-400/10",
}

// ── Static data ───────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {
    icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    title: "Verified Properties",
    desc: "Every listing manually reviewed",
  },
  {
    icon: <Tag className="h-5 w-5 text-brand-terracotta" />,
    title: "Best-Price Guarantee",
    desc: "No booking fees, ever",
  },
  {
    icon: <Wine className="h-5 w-5 text-primary" />,
    title: "Wine Country Access",
    desc: "All hotels near Santa Rita Hills AVA",
  },
  {
    icon: <Ban className="h-5 w-5 text-emerald-600" />,
    title: "Free Cancellation",
    desc: "Flexible options on select stays",
  },
]

const WHY_VISIT = [
  {
    icon: <Wine className="h-6 w-6" />,
    label: "Santa Rita Hills Wine Trail",
    desc: "World-class Pinot Noir & Chardonnay. Dozens of tasting rooms within 20 minutes of downtown.",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    label: "Vandenberg Space Force Base",
    desc: "Rocket launches visible from the city. Home to SpaceX Falcon 9 polar orbit missions.",
    iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300",
  },
  {
    icon: <Flower2 className="h-6 w-6" />,
    label: "Flower Fields & Festival",
    desc: "The Flower Capital of America. Acres of blooms from April through June every year.",
    iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300",
  },
  {
    icon: <Palette className="h-6 w-6" />,
    label: "Old Town Murals & History",
    desc: "80+ murals in Old Town tell Lompoc's history. La Purísima Mission is minutes away.",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
  },
]

const NEIGHBORHOODS = [
  {
    name: "N H Street Corridor",
    subtitle: "Most hotels · Best selection",
    desc: "The main hotel strip. All major chains are here — within minutes of dining, gas, and the Vandenberg gate. Easy freeway access.",
    badge: "bg-primary/10 text-primary",
    slugs: ["embassy-suites-lompoc", "hilton-garden-inn-lompoc", "holiday-inn-express-lompoc", "hampton-inn-lompoc"],
  },
  {
    name: "Downtown & Ocean Ave",
    subtitle: "Local feel · Walkable",
    desc: "Closest to Old Town murals, the Friday Market, and local cafés. Budget options with genuine neighborhood character.",
    badge: "bg-brand-terracotta/10 text-brand-terracotta",
    slugs: ["cabrillo-inn-lompoc", "civic-center-motel-lompoc", "lotus-of-lompoc", "village-inn-lompoc"],
  },
  {
    name: "Santa Ynez Valley",
    subtitle: "Wine country luxury · 30 min east",
    desc: "If you're visiting for the Santa Rita Hills AVA, staying in Buellton or Solvang puts you right in wine country — full-service amenities and vineyard views.",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    slugs: ["santa-ynez-valley-marriott-solvang"],
  },
]

// ── Top picks (editor's picks) ─────────────────────────────────────────────

const FEATURED_MAIN_SLUG = "embassy-suites-lompoc"
const FEATURED_SECONDARY_SLUGS = ["hampton-inn-lompoc", "holiday-inn-express-lompoc"]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HotelsPage() {
  const featuredMain = HOTELS.find((h) => h.slug === FEATURED_MAIN_SLUG)
  const featuredSecondary = FEATURED_SECONDARY_SLUGS.map((s) => HOTELS.find((h) => h.slug === s)).filter(Boolean)

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b">
        {/* Layered gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-accent via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -top-32 right-[-5%] -z-10 h-[480px] w-[480px] rounded-full bg-primary/8 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-[-10%] -z-10 h-[300px] w-[400px] rounded-full bg-brand-terracotta/6 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          {/* Eyebrow badge */}
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-sm animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Flower Capital of America · Lompoc, CA
          </div>

          {/* Heading */}
          <h1
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            Where to Stay in Lompoc
          </h1>
          <p
            className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed animate-fade-up"
            style={{ animationDelay: "110ms" }}
          >
            {HOTELS.length} curated hotels — from budget-friendly stays near Vandenberg to boutique
            inns steps from the Santa Rita Hills wine trail.
          </p>

          {/* Stats row */}
          <div
            className="mt-6 flex flex-wrap gap-4 animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            {[
              { label: "Hotels listed", value: `${HOTELS.length}` },
              { label: "Avg rating", value: (HOTELS.reduce((s, h) => s + h.rating, 0) / HOTELS.length).toFixed(1) + " ★" },
              { label: "Price tiers", value: "3" },
              { label: "Min from VSFB", value: "< 10 min" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border bg-background/80 px-4 py-2.5 text-center backdrop-blur-sm"
              >
                <div className="text-lg font-bold text-foreground">{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Landmark chips */}
          <div
            className="mt-5 flex flex-wrap gap-2 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            {[
              { icon: <Landmark className="h-3.5 w-3.5" />, label: "La Purísima Mission", note: "State historic park" },
              { icon: <Navigation className="h-3.5 w-3.5" />, label: "Vandenberg Space Force Base", note: "Main gate · Hwy 1" },
              { icon: <Flower2 className="h-3.5 w-3.5" />, label: "Flower Fields", note: "Apr–Jun peak" },
              { icon: <Wine className="h-3.5 w-3.5" />, label: "Santa Rita Hills AVA", note: "World-class Pinot Noir" },
            ].map((lm) => (
              <div
                key={lm.label}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"
              >
                <span className="text-primary/70">{lm.icon}</span>
                <span className="font-medium text-foreground">{lm.label}</span>
                <span className="hidden text-muted-foreground/60 sm:inline">· {lm.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          EDITOR'S PICKS — featured grid (1 large + 2 small)
      ══════════════════════════════════════════════════════ */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <ScrollReveal>
            <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
              Editor&apos;s picks
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight">Top-Rated Stays</h2>
          </ScrollReveal>

          {featuredMain && (
            <div className="mt-6 grid gap-5 md:grid-cols-[1.6fr_1fr] md:grid-rows-2">
              {/* Main featured card */}
              <ScrollReveal className="md:row-span-2">
                <Link
                  href={`/hotels/${featuredMain.slug}`}
                  className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(123,79,158,0.16),0_4px_12px_rgba(31,31,31,0.08)] hover:border-primary/20 md:min-h-[360px]"
                >
                  {/* Full-bleed gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${COVER_GRADIENT[featuredMain.priceRange]} transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Wishlist */}
                  <button
                    aria-label={`Save ${featuredMain.name} to wishlist`}
                    onClick={(e) => e.preventDefault()}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:text-brand-terracotta group-hover:opacity-100"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M10 17s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.65-7 9-7 9z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Text overlay */}
                  <div className="relative mt-auto p-5 text-white">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      {featuredMain.priceRange === "$$$" ? "Upscale" : featuredMain.priceRange === "$$" ? "Mid-Range" : "Budget"}
                    </div>
                    <h3 className="font-display text-lg font-bold leading-snug">{featuredMain.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] opacity-80">
                      <MapPin className="h-3 w-3" />
                      {featuredMain.avenue ?? featuredMain.address}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                        {(featuredMain.rating * 2).toFixed(1)} · {featuredMain.rating >= 4.5 ? "Exceptional" : featuredMain.rating >= 4.25 ? "Superb" : "Very Good"}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>

              {/* Secondary cards */}
              {featuredSecondary.map((hotel, i) =>
                hotel ? (
                  <ScrollReveal key={hotel.slug} delay={i * 80}>
                    <Link
                      href={`/hotels/${hotel.slug}`}
                      className="group flex h-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(123,79,158,0.16),0_4px_12px_rgba(31,31,31,0.08)] hover:border-primary/20"
                    >
                      {/* Small image area */}
                      <div className={`relative flex h-full w-28 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${COVER_GRADIENT[hotel.priceRange]}`}>
                        <BedDouble className="h-7 w-7 text-foreground/10 transition-transform duration-[400ms] group-hover:scale-105" />
                      </div>
                      <div className="flex flex-1 flex-col justify-center gap-1 p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                          {hotel.priceRange === "$$$" ? "Upscale" : hotel.priceRange === "$$" ? "Mid-Range" : "Budget"}
                        </div>
                        <h3 className="font-display text-sm font-bold leading-snug tracking-tight line-clamp-2">{hotel.name}</h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                          <span className="truncate">{hotel.avenue ?? hotel.address}</span>
                        </div>
                        <span className="mt-1 inline-flex w-fit rounded-full bg-sage-100 px-2.5 py-0.5 text-[10px] font-semibold text-sage-800">
                          {(hotel.rating * 2).toFixed(1)} · {hotel.rating >= 4.5 ? "Exceptional" : hotel.rating >= 4.25 ? "Superb" : "Very Good"}
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                ) : null
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY VISIT LOMPOC
      ══════════════════════════════════════════════════════ */}
      <section className="border-b bg-accent/30">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <ScrollReveal>
            <h2 className="font-display text-xl font-bold tracking-tight">What Brings Visitors to Lompoc?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your reason for visiting shapes the best place to stay.
            </p>
          </ScrollReveal>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_VISIT.map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-snug">{item.label}</div>
                    <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FILTER BAR + ALL HOTELS GRID (client component)
      ══════════════════════════════════════════════════════ */}
      <HotelsFilterGrid />

      {/* ══════════════════════════════════════════════════════
          MAP
      ══════════════════════════════════════════════════════ */}
      <section className="border-t bg-accent/20">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <ScrollReveal>
            <h2 className="mb-3 font-display text-xl font-bold tracking-tight">Hotels on the Map</h2>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ height: 440 }}>
              <HotelsMap hotels={HOTELS} />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Budget ($)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Mid-range ($$)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-violet-600" />
                <span>Upscale ($$$)</span>
              </div>
              <span className="ml-auto italic">Click a pin to preview</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NEIGHBORHOOD GUIDE
      ══════════════════════════════════════════════════════ */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <ScrollReveal>
            <h2 className="font-display text-xl font-bold tracking-tight">
              Which Area Should You Stay In?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lompoc has three distinct hotel zones — each suited to a different kind of visit.
            </p>
          </ScrollReveal>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {NEIGHBORHOODS.map((area, i) => (
              <ScrollReveal key={area.name} delay={i * 80}>
                <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm h-full">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${area.badge}`}>
                      {area.subtitle}
                    </span>
                    <h3 className="mt-2 font-display text-base font-bold">{area.name}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{area.desc}</p>
                  </div>
                  <div className="mt-auto space-y-1.5">
                    {area.slugs.slice(0, 3).map((slug) => {
                      const hotel = HOTELS.find((h) => h.slug === slug)
                      if (!hotel) return null
                      return (
                        <Link
                          key={slug}
                          href={`/hotels/${slug}`}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-accent"
                        >
                          <BedDouble className="h-3 w-3 shrink-0 text-primary/50" />
                          <span className="truncate font-medium">{hotel.name}</span>
                          <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/50" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TOURISM TIPS
      ══════════════════════════════════════════════════════ */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <ScrollReveal>
            <h2 className="font-display text-xl font-bold tracking-tight">Lompoc Visitor Tips</h2>
          </ScrollReveal>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Book Early for Flower Festival",
                body: "The annual Lompoc Flower Festival (June) fills hotels fast. Book at least 2–3 months ahead. The H Street corridor is your best bet for availability.",
              },
              {
                title: "Vandenberg Launch Watching",
                body: "SpaceX launches from Vandenberg are often visible from Lompoc. Check the launch schedule — the H Street hotels have clear sightlines to the north.",
              },
              {
                title: "Wine Tasting Day Trips",
                body: "Most Lompoc hotels are 15–25 minutes from Santa Rita Hills tasting rooms. Stay in town and hire a driver, or stay in Buellton for vineyard immersion.",
              },
              {
                title: "Pet-Friendly Options",
                body: "Motel 6, Red Roof Inn, Quality Inn, Days Inn, and Cabrillo Inn welcome pets. Always call ahead to confirm policies and fees.",
              },
              {
                title: "Best Value on H Street",
                body: "The Holiday Inn Express and Hampton Inn consistently offer the best value: hot breakfast included, pools, and prime location — at mid-range prices.",
              },
              {
                title: "Getting Around",
                body: "Lompoc is car-dependent. All major hotels have free parking. The H Street corridor puts you within 10 min of most attractions.",
              },
            ].map((tip, i) => (
              <ScrollReveal key={tip.title} delay={i * 50}>
                <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
                  <h3 className="font-semibold text-sm">{tip.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOTEL OWNER CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="border-t bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <ScrollReveal>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold">Own a Hotel in Lompoc?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get your property in front of thousands of visitors planning trips to Lompoc, the Santa Rita Hills, and Vandenberg Space Force Base.
                </p>
              </div>
              <Link
                href="/for-businesses"
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
              >
                List your property
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Activity ticker (fixed bottom-left) ─────────────────────────── */}
      <ActivityTicker />
    </>
  )
}
