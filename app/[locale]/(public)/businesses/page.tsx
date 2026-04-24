import { Link } from "@/i18n/navigation"
import {
  Flower2,
  MapPin,
  Phone,
  Globe,
  ArrowRight,
  Tag,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import {
  getDirectoryBusinesses,
  getAllCategories,
  getSiteStats,
} from "@/lib/queries"
import { SearchBar } from "@/components/search-bar"
import { SafeImage } from "@/components/safe-image"
import { AnimeReveal } from "@/components/anime-reveal"
import { AnimatedCounter } from "@/components/animated-counter"

export const metadata = {
  title: "Lompoc Business Directory — Local Businesses | Lompoc Deals",
  description:
    "Browse Lompoc, CA businesses by category — restaurants, salons, auto repair, retail, services, and more. Find deals from local businesses you already know.",
  keywords: [
    "lompoc business directory",
    "lompoc local businesses",
    "lompoc restaurants",
    "lompoc salons",
    "lompoc ca businesses",
  ],
}

export default async function BusinessesPage() {
  const [businesses, cats, stats] = await Promise.all([
    getDirectoryBusinesses(),
    getAllCategories(),
    getSiteStats(),
  ])

  const grouped = new Map<
    string,
    { id: number; name: string; slug: string; items: typeof businesses }
  >()
  for (const c of cats) {
    grouped.set(c.slug, { id: c.id, name: c.name, slug: c.slug, items: [] })
  }
  for (const b of businesses) {
    if (b.categorySlug && grouped.has(b.categorySlug)) {
      grouped.get(b.categorySlug)!.items.push(b)
    }
  }

  const populatedCategories = Array.from(grouped.values()).filter(
    (g) => g.items.length > 0
  )

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO — Full-bleed editorial with animated headline
         ═══════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden">
        {/* Deep gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-br from-[hsl(273_33%_12%)] via-[hsl(270_26%_10%)] to-[hsl(273_33%_8%)]"
        />

        {/* Radial glow — primary purple */}
        <div
          aria-hidden
          className="absolute -left-48 top-0 -z-10 h-[700px] w-[700px] rounded-full bg-primary/25 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute -right-48 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]"
        />

        {/* Animated flower SVG — decorative, clipped top-right */}
        <svg
          aria-hidden
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[700px] w-[700px] text-primary/10 sm:-right-16 sm:-top-16"
          fill="currentColor"
        >
          <g transform="translate(300 300)">
            {Array.from({ length: 8 }).map((_, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-160"
                rx="90"
                ry="180"
                transform={`rotate(${i * 45})`}
                opacity="0.6"
              />
            ))}
            <circle r="80" fill="currentColor" opacity="0.9" />
          </g>
        </svg>

        {/* Grain overlay */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-36">
          {/* Eyebrow */}
          <AnimeReveal direction="up" delay={0} duration={600}>
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
              <span className="h-px w-8 bg-white/30" />
              <span>Directory</span>
              <span className="text-white/20">·</span>
              <span>Lompoc, California</span>
              <span className="text-white/20">·</span>
              <span>est. 2026</span>
            </div>
          </AnimeReveal>

          {/* Display headline */}
          <AnimeReveal direction="up" delay={80} duration={700}>
            <h1 className="relative mt-6 font-display text-[clamp(3.2rem,11vw,8.5rem)] font-bold leading-[0.9] tracking-[-0.04em] text-white">
              <span className="block">Lompoc,</span>
              <span className="mt-1 block italic text-primary">
                in full bloom.
              </span>
            </h1>
          </AnimeReveal>

          {/* Description + stats */}
          <AnimeReveal direction="up" delay={160} duration={700}>
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <p className="max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
                The Flower Capital&apos;s complete index of local businesses —
                restaurants, retail, services, and the spots only locals know.
                Browse by category, search by name, find your next favorite on
                H&nbsp;Street.
              </p>

              {/* Stat cluster */}
              <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-4">
                <div className="text-right">
                  <div className="font-display text-[5rem] font-bold leading-none tracking-tight text-white">
                    <AnimatedCounter value={stats.businesses} duration={1400} delay={400} />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Local businesses
                  </div>
                </div>
              </div>
            </div>
          </AnimeReveal>

          {/* Search */}
          <AnimeReveal direction="up" delay={240} duration={700}>
            <div className="mt-10 max-w-2xl">
              <SearchBar size="lg" />
            </div>
          </AnimeReveal>

          {/* Category chips */}
          <AnimeReveal direction="up" delay={320} duration={700}>
            <nav className="mt-6 flex flex-wrap gap-2">
              {populatedCategories.map((g) => (
                <a
                  key={g.slug}
                  href={`#${g.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white/70 backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                >
                  {g.name}
                  <span className="text-xs text-white/30">· {g.items.length}</span>
                </a>
              ))}
            </nav>
          </AnimeReveal>

          {/* Stat bar */}
          <AnimeReveal direction="up" delay={400} duration={700}>
            <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
              <span className="text-white/60">{stats.businesses} Businesses</span>
              <span className="text-white/10">·</span>
              <span>{stats.activeDeals} Active Deals</span>
              <span className="text-white/10">·</span>
              <span>{stats.categories} Categories</span>
              <span className="text-white/10">·</span>
              <span>Updated daily</span>
            </div>
          </AnimeReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          QUICK STATS ROW
         ═══════════════════════════════════════════════════ */}
      <div className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: "Businesses", value: stats.businesses, icon: <Flower2 className="h-4 w-4" /> },
              { label: "Active Deals", value: stats.activeDeals, icon: <Tag className="h-4 w-4" /> },
              { label: "Categories", value: stats.categories, icon: <Sparkles className="h-4 w-4" /> },
              { label: "Updated", value: null, label2: "Daily", icon: <TrendingUp className="h-4 w-4" /> },
            ].map((s, i) => (
              <AnimeReveal key={s.label} direction="up" delay={i * 60} duration={600}>
                <div className="flex flex-col gap-1 rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {s.icon}
                    {s.label}
                  </div>
                  <div className="font-display text-3xl font-bold tracking-tight">
                    {s.value !== null ? (
                      <AnimatedCounter value={s.value} duration={1200} delay={200 + i * 80} />
                    ) : (
                      s.label2
                    )}
                  </div>
                </div>
              </AnimeReveal>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DIRECTORY LISTINGS
         ═══════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
        {populatedCategories.map((g) => (
          <section key={g.slug} id={g.slug} className="scroll-mt-24">
            <AnimeReveal direction="up" delay={0} duration={560}>
              <div className="mb-6 flex items-end justify-between border-b pb-3">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    {g.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {g.items.length} {g.items.length === 1 ? "business" : "businesses"}
                  </p>
                </div>
                <Link
                  href={`/category/${g.slug}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  See all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </AnimeReveal>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((b, bi) => (
                <AnimeReveal
                  key={b.id}
                  as="li"
                  direction="up"
                  delay={bi * 50}
                  duration={520}
                >
                  <Link
                    href={`/biz/${b.slug}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-accent transition-transform duration-200 group-hover:scale-105">
                        {b.logoUrl ? (
                          <SafeImage
                            src={b.logoUrl}
                            alt=""
                            className="h-12 w-12 rounded-xl object-cover"
                            fallback={<Flower2 className="h-5 w-5 text-primary/70" />}
                          />
                        ) : (
                          <Flower2 className="h-5 w-5 text-primary/70" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-display text-lg font-bold leading-tight tracking-tight line-clamp-2">
                          {b.name}
                        </h3>
                        {b.activeDealCount > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <Tag className="h-3 w-3" />
                            {b.activeDealCount}{" "}
                            {b.activeDealCount === 1 ? "deal" : "deals"}
                          </span>
                        )}
                      </div>
                    </div>

                    {b.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {b.description}
                      </p>
                    )}

                    <div className="mt-auto space-y-1 text-xs text-muted-foreground">
                      {b.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary/60" />
                          <span className="truncate">{b.address}</span>
                        </div>
                      )}
                      {b.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 flex-shrink-0 text-primary/60" />
                          {b.phone}
                        </div>
                      )}
                      {b.website && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3 flex-shrink-0 text-primary/60" />
                          <span className="truncate">
                            {b.website.replace(/^https?:\/\//, "")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      View profile
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </AnimeReveal>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM CTA — List your business
         ═══════════════════════════════════════════════════ */}
      <section className="border-t bg-secondary/30">
        <AnimeReveal direction="up" delay={0} duration={600}>
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Flower2 className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Own a Lompoc business?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Get listed in the directory free — add your hours, photos, deals,
              and let locals find you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/for-businesses"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.97]"
              >
                List your business free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/deals"
                className="inline-flex h-12 items-center gap-2 rounded-full border bg-background px-7 text-base font-semibold transition-colors hover:bg-accent"
              >
                <Tag className="h-4 w-4" />
                Browse active deals
              </Link>
            </div>
          </div>
        </AnimeReveal>
      </section>
    </>
  )
}
