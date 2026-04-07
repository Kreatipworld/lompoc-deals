import { Link } from "@/i18n/navigation"
import {
  Flower2,
  MapPin,
  Phone,
  Globe,
  ArrowRight,
  Tag,
} from "lucide-react"
import {
  getDirectoryBusinesses,
  getAllCategories,
  getSiteStats,
} from "@/lib/queries"
import { SearchBar } from "@/components/search-bar"

export const metadata = {
  title: "Business directory — Lompoc Deals",
  description:
    "All Lompoc, California businesses listed on Lompoc Deals, organized by category.",
}

export default async function BusinessesPage() {
  const [businesses, cats, stats] = await Promise.all([
    getDirectoryBusinesses(),
    getAllCategories(),
    getSiteStats(),
  ])

  // Group by category
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
      {/* ─────────────────────────────────────────────────
          HERO — Editorial / Lompoc-in-bloom
         ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        {/* Cream gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-[hsl(40_38%_97%)] via-background to-background"
        />

        {/* Subtle paper-grain noise overlay */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />

        {/* Coral glow blob (top-left) */}
        <div
          aria-hidden
          className="absolute -left-32 top-0 -z-10 h-[480px] w-[480px] rounded-full bg-primary/15 blur-3xl"
        />

        {/* Big decorative flower silhouette (top-right, partially clipped) */}
        <svg
          aria-hidden
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-[640px] w-[640px] text-primary/20 sm:-right-16 sm:-top-20"
          fill="currentColor"
        >
          {/* 8-petal stylized poppy/flower */}
          <g transform="translate(300 300)">
            {Array.from({ length: 8 }).map((_, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="-160"
                rx="90"
                ry="180"
                transform={`rotate(${i * 45})`}
                opacity="0.55"
              />
            ))}
            <circle r="80" fill="currentColor" opacity="0.9" />
          </g>
        </svg>

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-32 lg:pt-32">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-8 bg-foreground/30" />
            <span>Directory</span>
            <span className="text-foreground/30">·</span>
            <span>Lompoc, California</span>
            <span className="text-foreground/30">·</span>
            <span>est. 2026</span>
          </div>

          {/* MASSIVE display headline */}
          <h1 className="relative mt-6 font-display text-[clamp(3.5rem,12vw,9rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
            <span className="block">Lompoc,</span>
            <span className="mt-1 block italic text-primary">
              in full bloom.
            </span>
          </h1>

          {/* Description + meta */}
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              The Flower Capital&apos;s complete index of local businesses —
              restaurants, retail, services, and the spots only the locals
              know. Browse by category, search by name, and find your next
              favorite shop on H Street.
            </p>

            {/* Floating count badge */}
            <div className="hidden lg:block">
              <div className="text-right">
                <div className="font-display text-7xl font-semibold leading-none tracking-tight">
                  {stats.businesses}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Local
                  <br />
                  businesses
                </div>
              </div>
            </div>
          </div>

          {/* Big search bar */}
          <div className="mt-10 max-w-2xl">
            <SearchBar size="lg" />
          </div>

          {/* Quick category jump chips */}
          <nav className="mt-6 flex flex-wrap gap-2">
            {populatedCategories.map((g) => (
              <a
                key={g.slug}
                href={`#${g.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/70 px-3.5 py-1.5 text-sm font-medium backdrop-blur transition hover:border-primary/40 hover:bg-accent"
              >
                {g.name}
                <span className="text-xs text-muted-foreground">
                  · {g.items.length}
                </span>
              </a>
            ))}
          </nav>

          {/* Editorial stat row */}
          <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-foreground/10 pt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>{stats.businesses} Businesses</span>
            <span className="text-foreground/30">·</span>
            <span>{stats.activeDeals} Active Deals</span>
            <span className="text-foreground/30">·</span>
            <span>{stats.categories} Categories</span>
            <span className="text-foreground/30">·</span>
            <span>Updated daily</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          DIRECTORY LISTINGS (unchanged from before)
         ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-16">
        {populatedCategories.map((g) => (
          <section key={g.slug} id={g.slug} className="scroll-mt-24">
            <div className="mb-5 flex items-end justify-between border-b pb-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {g.name}
              </h2>
              <Link
                href={`/category/${g.slug}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                See deals →
              </Link>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/biz/${b.slug}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent">
                        {b.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.logoUrl}
                            alt=""
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                        ) : (
                          <Flower2 className="h-5 w-5 text-primary/70" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight line-clamp-2">
                          {b.name}
                        </h3>
                        {b.activeDealCount > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
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

                    <div className="flex items-center justify-end pt-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                      View profile
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
