import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
import { CalendarDays, ChevronLeft, ChevronRight, ArrowRight, Newspaper } from "lucide-react"
import { getPublishedBlogPosts, countPublishedBlogPosts } from "@/lib/queries"
import { SafeImage } from "@/components/safe-image"
import { getTranslations } from "next-intl/server"
import { pageAlternates } from "@/lib/seo"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"
const PAGE_SIZE = 12
// News lives in the blog engine under one reserved category — same table, same
// article pages, so a story needs no new infrastructure to publish.
const NEWS_CATEGORY = "local-news"

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return {
    title: "Lompoc News — What's Happening in Town",
    description:
      "Local news for Lompoc, CA, written by neighbors: business openings, community updates, launches, and what it all means for you.",
    openGraph: {
      title: "Lompoc News — Lompoc Locals",
      description: "Business openings, community updates, and local happenings in Lompoc, CA.",
      url: `${siteUrl}/news`,
      images: [{ url: `${siteUrl}/lompoc-hero.jpg`, alt: "Lompoc, California" }],
    },
    alternates: pageAlternates("/news", params.locale),
  }
}

export default async function NewsIndexPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { page?: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "news" })

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  const [posts, total] = await Promise.all([
    getPublishedBlogPosts(PAGE_SIZE, offset, NEWS_CATEGORY),
    countPublishedBlogPosts(NEWS_CATEGORY),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const heroPost = page === 1 && posts.length > 0 ? posts[0] : null
  const gridPosts = page === 1 ? posts.slice(1) : posts

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("heading")}</h1>
        <p className="text-gray-500 text-lg max-w-xl">{t("subheading")}</p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Newspaper className="w-10 h-10 mx-auto mb-4 text-gray-300" />
          <p className="text-xl">{t("noPosts")}</p>
        </div>
      ) : (
        <>
          {heroPost && (
            <Link href={`/blog/${heroPost.slug}`} className="group block mb-10">
              <article className="relative rounded-3xl overflow-hidden bg-gray-900 min-h-[380px] flex flex-col justify-end">
                {heroPost.imageUrl && (
                  <div className="absolute inset-0">
                    <SafeImage
                      src={heroPost.imageUrl}
                      alt={heroPost.title}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-300"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                <div className="relative p-8 sm:p-10">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gold mb-3">
                    <Newspaper className="w-3 h-3" />
                    {t("latestBadge")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-gold transition-colors">
                    {heroPost.title}
                  </h2>
                  {heroPost.excerpt && (
                    <p className="text-gray-300 text-sm sm:text-base line-clamp-2 mb-4 max-w-2xl">
                      {heroPost.excerpt}
                    </p>
                  )}
                  {heroPost.publishedAt && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <CalendarDays className="w-3 h-3" />
                      {format(heroPost.publishedAt, "MMMM d, yyyy")}
                    </span>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold/80 group-hover:text-gold transition-colors">
                    {t("readStory")} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </article>
            </Link>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all flex flex-col"
              >
                {post.imageUrl && (
                  <Link href={`/blog/${post.slug}`} className="group block aspect-[16/9] overflow-hidden bg-gray-100">
                    <SafeImage
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-base font-bold text-gray-900 mb-2 leading-snug flex-1">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <span className="mt-auto flex items-center gap-1 text-xs text-gray-400 pt-3 border-t border-gray-50">
                      <CalendarDays className="w-3 h-3" />
                      {format(post.publishedAt, "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label={t("paginationLabel")}>
              {page > 1 && (
                <Link
                  href={`/news?page=${page - 1}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> {t("paginationPrev")}
                </Link>
              )}
              <span className="text-sm text-gray-500">
                {t("paginationPage", { page, total: totalPages })}
              </span>
              {page < totalPages && (
                <Link
                  href={`/news?page=${page + 1}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t("paginationNext")} <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  )
}
