import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { HOTELS } from "@/lib/hotels-data"
import { HotelsMap } from "@/components/hotels-map"
import { ScrollReveal } from "@/components/scroll-reveal"
import {
  MapPin,
  Phone,
  Star,
  ArrowRight,
  BedDouble,
  Wifi,
  Car,
  Coffee,
  Landmark,
  Navigation,
  Wine,
  Rocket,
  Flower2,
  Palette,
  Globe,
  ChevronRight,
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

const PRICE_LABEL: Record<string, string> = {
  $: "Budget",
  $$: "Mid-range",
  $$$: "Upscale",
}

const PRICE_BADGE_CLASS: Record<string, string> = {
  $: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  $$: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  $$$: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
}

// Gradient covers per price tier — used as visual stand-ins for hotel photos
const COVER_GRADIENT: Record<string, string> = {
  $: "from-emerald-500/20 via-teal-400/10 to-cyan-300/10",
  $$: "from-amber-500/25 via-orange-400/15 to-yellow-300/10",
  $$$: "from-violet-600/25 via-purple-500/15 to-fuchsia-400/10",
}

const AMENITY_ICON: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="h-3 w-3" />,
  "Free Parking": <Car className="h-3 w-3" />,
  "Hot Breakfast": <Coffee className="h-3 w-3" />,
  "Continental Breakfast": <Coffee className="h-3 w-3" />,
  "Free Breakfast": <Coffee className="h-3 w-3" />,
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const sz = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
                ? "fill-amber-200 text-amber-400"
                : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Tourism reasons ────────────────────────────────────────────────────────────

const WHY_VISIT = [
  {
    icon: <Wine className="h-6 w-6" />,
    label: "Santa Rita Hills Wine Trail",
    desc: "World-class Pinot Noir & Chardonnay. Dozens of tasting rooms within 20 minutes of downtown.",
    accent: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    label: "Vandenberg Space Force Base",
    desc: "Rocket launches visible from the city. Home to SpaceX Falcon 9 polar orbit missions.",
    accent: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300",
  },
  {
    icon: <Flower2 className="h-6 w-6" />,
    label: "Flower Fields & Festival",
    desc: "The Flower Capital of America. Acres of blooms from April through June every year.",
    accent: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300",
  },
  {
    icon: <Palette className="h-6 w-6" />,
    label: "Old Town Murals & History",
    desc: "80+ murals in Old Town tell Lompoc's history. La Purísima Mission is minutes away.",
    accent: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
  },
]

// ── Neighborhood guide ──────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

const TOP_PICKS = HOTELS.filter((h) =>
  ["embassy-suites-lompoc", "hampton-inn-lompoc", "holiday-inn-express-lompoc", "ocairns-inn-lompoc"].includes(h.slug)
)

export default function HotelsPage() {
  const upscale = HOTELS.filter((h) => h.priceRange === "$$$")
  const midRange = HOTELS.filter((h) => h.priceRange === "$$")
  const budget = HOTELS.filter((h) => h.priceRange === "$")

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
          {/* Badge */}
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-sm animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <Flower2 className="h-3 w-3" />
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
              { label: "Price tiers", value: "3" },
              { label: "Avg rating", value: (HOTELS.reduce((s, h) => s + h.rating, 0) / HOTELS.length).toFixed(1) + " ★" },
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
                <div className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
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
          TOP PICKS
      ══════════════════════════════════════════════════════ */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <ScrollReveal>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
                  Editor&apos;s picks
                </div>
                <h2 className="font-display text-xl font-bold tracking-tight">Top-Rated Stays</h2>
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TOP_PICKS.map((hotel, i) => (
              <ScrollReveal key={hotel.slug} delay={i * 70}>
                <Link
                  href={`/hotels/${hotel.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-lg"
                >
                  {/* Cover */}
                  <div
                    className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${COVER_GRADIENT[hotel.priceRange]} overflow-hidden`}
                  >
                    <BedDouble className="h-10 w-10 text-foreground/10 transition-transform duration-300 group-hover:scale-110" />
                    {/* Price badge overlay */}
                    <span
                      className={`absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[11px] font-bold ${PRICE_BADGE_CLASS[hotel.priceRange]}`}
                    >
                      {hotel.priceRange}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {PRICE_LABEL[hotel.priceRange]}
                      </div>
                      <h3 className="mt-0.5 font-display text-sm font-bold leading-snug tracking-tight line-clamp-2">
                        {hotel.name}
                      </h3>
                    </div>
                    <StarRating rating={hotel.rating} />
                    <p className="line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                      {hotel.tagline}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                        <span className="truncate">{hotel.neighborhood?.split("—")[0].trim()}</span>
                      </div>
                      <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FULL HOTEL LIST + MAP
      ══════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-4 py-10 pb-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">

          {/* ── Hotel list by tier ── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Upscale */}
            {upscale.length > 0 && (
              <div>
                <ScrollReveal>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-violet-500" />
                    <h2 className="font-display text-base font-bold tracking-tight">Upscale ($$$)</h2>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                      {upscale.length} hotels
                    </span>
                  </div>
                </ScrollReveal>
                <ul className="space-y-3">
                  {upscale.map((hotel, i) => (
                    <ScrollReveal key={hotel.slug} delay={i * 60} as="li">
                      <HotelCard hotel={hotel} />
                    </ScrollReveal>
                  ))}
                </ul>
              </div>
            )}

            {/* Mid-range */}
            {midRange.length > 0 && (
              <div>
                <ScrollReveal>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <h2 className="font-display text-base font-bold tracking-tight">Mid-Range ($$)</h2>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      {midRange.length} hotels
                    </span>
                  </div>
                </ScrollReveal>
                <ul className="space-y-3">
                  {midRange.map((hotel, i) => (
                    <ScrollReveal key={hotel.slug} delay={i * 60} as="li">
                      <HotelCard hotel={hotel} />
                    </ScrollReveal>
                  ))}
                </ul>
              </div>
            )}

            {/* Budget */}
            {budget.length > 0 && (
              <div>
                <ScrollReveal>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <h2 className="font-display text-base font-bold tracking-tight">Budget ($)</h2>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {budget.length} hotels
                    </span>
                  </div>
                </ScrollReveal>
                <ul className="space-y-3">
                  {budget.map((hotel, i) => (
                    <ScrollReveal key={hotel.slug} delay={i * 50} as="li">
                      <HotelCard hotel={hotel} />
                    </ScrollReveal>
                  ))}
                </ul>
              </div>
            )}

            <ScrollReveal>
              <p className="text-center text-xs text-muted-foreground">
                Know a Lompoc hotel that should be listed?{" "}
                <Link href="/for-businesses" className="underline underline-offset-2 hover:text-foreground">
                  Add your property
                </Link>
              </p>
            </ScrollReveal>
          </div>

          {/* ── Map ── */}
          <div className="lg:sticky lg:top-6 w-full lg:w-[420px] shrink-0">
            <ScrollReveal>
              <h2 className="mb-3 font-display text-base font-bold tracking-tight">
                Hotels on the Map
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ height: 500 }}>
                <HotelsMap hotels={HOTELS} />
              </div>
              {/* Legend */}
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

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          WHERE TO STAY — NEIGHBORHOOD GUIDE
      ══════════════════════════════════════════════════════ */}
      <section className="border-t bg-accent/30">
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
            <h2 className="font-display text-xl font-bold tracking-tight">
              Lompoc Visitor Tips
            </h2>
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
    </>
  )
}

// ── HotelCard ──────────────────────────────────────────────────────────────────

import type { Hotel } from "@/lib/hotels-data"

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:flex-row"
    >
      {/* Cover */}
      <div
        className={`relative flex h-28 shrink-0 items-center justify-center bg-gradient-to-br ${COVER_GRADIENT[hotel.priceRange]} sm:h-auto sm:w-28`}
      >
        <BedDouble className="h-8 w-8 text-foreground/10 transition-transform duration-300 group-hover:scale-110" />
        {/* Website indicator */}
        {hotel.website && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground backdrop-blur-sm">
            <Globe className="h-2.5 w-2.5" />
            Book
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-bold leading-snug tracking-tight">{hotel.name}</h3>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${PRICE_BADGE_CLASS[hotel.priceRange]}`}
          >
            {hotel.priceRange}
          </span>
        </div>

        <StarRating rating={hotel.rating} />

        <p className="line-clamp-1 text-xs text-muted-foreground">{hotel.tagline}</p>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 3).map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {AMENITY_ICON[a] ?? null}
              {a}
            </span>
          ))}
          {hotel.amenities.length > 3 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
              +{hotel.amenities.length - 3} more
            </span>
          )}
        </div>

        {/* Address row */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
          <span className="truncate">{hotel.address}</span>
        </div>
        {hotel.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0 text-primary/50" />
            {hotel.phone}
          </div>
        )}

        <div className="flex items-center justify-end pt-0.5 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          View details
          <ArrowRight className="ml-1 h-3 w-3" />
        </div>
      </div>
    </Link>
  )
}
