import { getTranslations } from "next-intl/server"
import { pageAlternates } from "@/lib/seo"
import { searchAll } from "@/lib/search"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { SearchBar } from "@/components/search-bar"
import { SafeImage } from "@/components/safe-image"
import { MapPin, Store, ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
import { SponsorRow } from "@/components/sponsor-row"
import { categoryLabel } from "@/lib/category-label"
import { findTermForQuery, FIND_TERMS } from "@/lib/find-terms"
import { memberTiers } from "@/lib/member-tier"
import { getAllCategories } from "@/lib/queries"
import { fold, editDistance, instantSearch } from "@/lib/search/instant"
import { getSearchIndex } from "@/lib/search/build-index"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "search" })
  return {
    // metaTitle embeds the brand ("Search Lompoc Locals…") — bypass the layout's
    // "%s | Lompoc Locals" template or the suffix doubles.
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    // Self-referential canonical per locale (otherwise /es/search inherits nothing
    // and the page-level alternates are missing entirely). Still noindex below.
    alternates: pageAlternates("/search", locale),
    // Internal search results: unbounded thin URL space — keep out of the index.
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: { q?: string }
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "search" })
  const tc = await getTranslations({ locale, namespace: "categoryLabels" })

  const q = (searchParams.q ?? "").trim()
  const [results, viewer] = await Promise.all([
    q ? searchAll(q, locale) : Promise.resolve({ businesses: [], categories: [], deals: [] }),
    getViewer(),
  ])
  // Growth/Plus members lead the business results; the matcher's order holds within a tier.
  if (results.businesses.length > 1) {
    const tiers = await memberTiers(results.businesses.map((b) => b.id))
    results.businesses = [...results.businesses].sort((a, b) => (tiers.get(b.id) ?? 0) - (tiers.get(a.id) ?? 0))
  }
  const count = results.businesses.length + results.categories.length + results.deals.length

  if (q) {
    const sid = getSessionId()
    // Fire-and-forget: never block render on analytics.
    void track("search_run", {
      userId: viewer?.userId ?? null,
      sessionId: sid,
      targetType: "search",
      targetId: null,
      props: { query: q, resultCount: count, locale: locale as "en" | "es" },
    })
  }
  const word = count === 1 ? t("resultSingular") : t("resultPlural")
  const curated = q ? findTermForQuery(q) : undefined
  // Nothing matched: offer the nearest word pages and the categories instead of a dead end.
  const lang = locale === "es" ? "es" : "en"
  const nothing = q && count === 0
  const nearPages = nothing
    ? FIND_TERMS.filter((term) => {
        const fq = fold(q)
        const hay = [term.slug.replace(/-/g, " "), term.title.en, term.title.es, ...term.aliases].map(fold)
        return hay.some((h) => h.includes(fq) || fq.includes(h) || h.split(" ").some((w) => w.length >= 4 && editDistance(w, fq, 2) <= 2))
      }).slice(0, 4)
    : []
  const allCats = nothing ? (await getAllCategories()).filter((c) => c.slug !== "other") : []
  // Typo recovery: the same instant matcher the search box uses, run over the cached index.
  const didYouMean = nothing ? instantSearch(await getSearchIndex(), q, 6).businesses : []

  return (
    <div className="space-y-0">
      {/* ─── Search hero with Lompoc background ─── */}
      {/* No `overflow-hidden` on the section so the search dropdown can extend
          past the hero; the background layers are `absolute inset-0` and stay
          bounded on their own. */}
      <section className="relative border-b">
        {/* Lompoc background image */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 overflow-hidden"
          style={{
            backgroundImage: "url('/lompoc-flowers-4.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        {/* Dark overlay */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/60"
        />

        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <MapPin className="h-3 w-3" />
                {t("badge")}
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {t("heading")}
              </h1>
              <p className="mt-1 max-w-md text-sm text-white/75">
                {t("subheading")}
              </p>
            </div>
            <div className="w-full lg:max-w-md">
              <SearchBar defaultValue={q} size="lg" scrim />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Results ─── */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {q ? (
          <>
            {curated && (
              <Link
                href={`/find/${curated.slug}`}
                className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm transition-colors hover:bg-primary/10"
              >
                <span>
                  <span className="font-semibold text-primary">{t("curatedBanner")}</span>{" "}
                  <span className="font-medium">{curated.title[locale === "es" ? "es" : "en"]}</span>
                </span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" />
              </Link>
            )}
            <p className="mb-6 text-sm text-muted-foreground">
              {t("resultsFor", { count, word })}{" "}
              <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
            </p>

            {results.categories.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 font-display text-lg font-semibold">{t("sectionCategories")}</h2>
                <div className="flex flex-wrap gap-2">
                  {results.categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                    >
                      {categoryLabel(tc, c.slug, c.name)}
                      <span className="text-xs text-muted-foreground">({c.count})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.businesses.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 font-display text-lg font-semibold">{t("sectionBusinesses")}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.businesses.map((b) => (
                    <Link
                      key={b.id}
                      href={`/biz/${b.slug}`}
                      className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md"
                    >
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <SafeImage
                          src={b.logoUrl ?? undefined}
                          alt={b.name}
                          className="h-full w-full object-cover"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center">
                              <Store className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          }
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold group-hover:text-primary">{b.name}</p>
                        {b.categoryName && (
                          <p className="truncate text-xs text-muted-foreground">{categoryLabel(tc, b.categorySlug, b.categoryName)}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.deals.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-lg font-semibold">{t("sectionDeals")}</h2>
                <DealGrid
                  deals={results.deals}
                  viewer={viewer}
                  fromPath={`/search?q=${encodeURIComponent(q)}`}
                  variant="tripadvisor"
                />
              </div>
            )}

            {count === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("nothingTry", { query: q })}</p>
                {didYouMean.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {didYouMean.map((b) => (
                      <Link key={b.i} href={`/biz/${b.s}`} className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <SafeImage src={b.logoUrl ?? undefined} alt={b.n} className="h-full w-full object-cover" fallback={<div className="flex h-full w-full items-center justify-center"><Store className="h-5 w-5 text-muted-foreground/50" /></div>} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold group-hover:text-primary">{b.n}</p>
                          {b.t > 0 && <p className="text-[11px] font-bold text-primary">{t("memberBadge")}</p>}
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                )}
                {nearPages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {nearPages.map((term) => (
                      <Link key={term.slug} href={`/find/${term.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                        {term.title[lang]}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("allCategories")}</p>
                  <div className="flex flex-wrap gap-2">
                    {allCats.map((c) => (
                      <Link key={c.slug} href={`/category/${c.slug}`} className="inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">
                        {categoryLabel(tc, c.slug, c.name)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("emptyPrompt")}
          </p>
        )}

        {/* PLUS-TIER SPONSOR — ad row at the bottom of search, scoped to the
            dominant result category so a taco search never advertises a
            plumber. With no query (or no clear category) the row stays broad. */}
        <SponsorRow
          categorySlug={
            q
              ? (() => {
                  const tally = new Map<string, number>()
                  for (const b of results.businesses.slice(0, 8)) {
                    if (b.categorySlug) tally.set(b.categorySlug, (tally.get(b.categorySlug) ?? 0) + 1)
                  }
                  const top = Array.from(tally.entries()).sort((a, b) => b[1] - a[1])[0]
                  return top && top[1] >= 2 ? top[0] : null
                })()
              : null
          }
        />
      </section>
    </div>
  )
}
