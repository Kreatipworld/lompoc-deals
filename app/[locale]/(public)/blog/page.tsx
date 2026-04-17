import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
import { CalendarDays, Tag, ChevronLeft, ChevronRight, User, ArrowRight } from "lucide-react"
import { getPublishedBlogPosts, getBlogCategories, countPublishedBlogPosts } from "@/lib/queries"
import { SafeImage } from "@/components/safe-image"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"
const PAGE_SIZE = 12

export const metadata: Metadata = {
  title: "Blog — Lompoc Deals | Local News, Tips & Community Stories",
  description:
    "Discover local stories, business spotlights, community events, and insider tips for Lompoc, CA. Stay connected with what's happening in your city.",
  openGraph: {
    title: "Blog — Lompoc Deals",
    description: "Local stories, tips, and community news for Lompoc, CA.",
    url: `${siteUrl}/blog`,
  },
  alternates: { canonical: `${siteUrl}/blog` },
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string }
}) {
  const category = searchParams.category ?? undefined
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  const [posts, categories, total] = await Promise.all([
    getPublishedBlogPosts(PAGE_SIZE, offset, category),
    getBlogCategories(),
    countPublishedBlogPosts(category),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Split hero from grid only on first page with no category filter
  const isDefaultView = !category && page === 1
  const heroPost = isDefaultView && posts.length > 0 ? posts[0] : null
  const gridPosts = isDefaultView ? posts.slice(1) : posts

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Page header */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
          Lompoc Deals Blog
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Local Stories &amp; Community Tips
        </h1>
        <p className="text-gray-500 text-lg max-w-xl">
          Business spotlights, neighborhood guides, and insider tips for Lompoc, CA.
        </p>
      </header>

      {/* Category filter */}
      {categories.length > 0 && (
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Blog categories">
          <Link
            href="/blog"
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !category
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                category === cat
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              {cat.replace(/-/g, " ")}
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl">No posts yet — check back soon!</p>
        </div>
      ) : (
        <>
          {/* Hero post — first post on default view */}
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
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

                <div className="relative p-8 sm:p-10">
                  {heroPost.category && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-400 mb-3">
                      <Tag className="w-3 h-3" />
                      {heroPost.category.replace(/-/g, " ")}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-emerald-100 transition-colors">
                    {heroPost.title}
                  </h2>
                  {heroPost.excerpt && (
                    <p className="text-gray-300 text-sm sm:text-base line-clamp-2 mb-4 max-w-2xl">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {heroPost.publishedAt && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(heroPost.publishedAt, "MMMM d, yyyy")}
                      </span>
                    )}
                    {heroPost.authorName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {heroPost.authorName}
                      </span>
                    )}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    Read article <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </article>
            </Link>
          )}

          {/* Post grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-100 transition-all flex flex-col"
              >
                {post.imageUrl && (
                  <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-gray-100">
                    <SafeImage
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                )}
                <div className="p-5 flex flex-col flex-1">
                  {post.category && (
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.category)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-2 hover:text-emerald-700 w-fit"
                    >
                      <Tag className="w-3 h-3" />
                      {post.category.replace(/-/g, " ")}
                    </Link>
                  )}
                  <h2 className="text-base font-bold text-gray-900 mb-2 leading-snug flex-1">
                    <Link href={`/blog/${post.slug}`} className="hover:text-emerald-700 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(post.publishedAt, "MMM d, yyyy")}
                      </span>
                    )}
                    {post.authorName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.authorName}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`/blog?${category ? `category=${encodeURIComponent(category)}&` : ""}page=${page - 1}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Link>
              )}
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/blog?${category ? `category=${encodeURIComponent(category)}&` : ""}page=${page + 1}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  )
}
