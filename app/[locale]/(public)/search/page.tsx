import { getTranslations } from "next-intl/server"
import { searchAll } from "@/lib/search"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { SearchBar } from "@/components/search-bar"
import { SafeImage } from "@/components/safe-image"
import { MapPin, Store, ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "search" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
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

  const q = (searchParams.q ?? "").trim()
  const [results, viewer] = await Promise.all([
    q ? searchAll(q) : Promise.resolve({ businesses: [], categories: [], deals: [] }),
    getViewer(),
  ])
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

        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" />
            {t("badge")}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/75 sm:text-base">
            {t("subheading")}
          </p>
          <div className="mx-auto mt-6 max-w-xl">
            <SearchBar defaultValue={q} size="lg" scrim />
          </div>
        </div>
      </section>

      {/* ─── Results ─── */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {q ? (
          <>
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
                      {c.name}
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
                          <p className="truncate text-xs text-muted-foreground">{b.categoryName}</p>
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
              <p className="text-sm text-muted-foreground">{t("noResults")}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("emptyPrompt")}
          </p>
        )}
      </section>
    </div>
  )
}
