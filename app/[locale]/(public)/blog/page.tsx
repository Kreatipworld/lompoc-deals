import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
import { CalendarDays, Tag, ChevronLeft, ChevronRight } from "lucide-react"
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Lompoc Deals Blog</h1>
        <p className="text-gray-500 text-lg">
          Local stories, business spotlights, and community tips for Lompoc, CA.
        </p>
      </header>

      {/* Category filter */}
      {categories.length > 0 && (
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Blog categories">
          <Link
            href="/blog"
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              !category
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-emerald-600 hover:text-emerald-600"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors capitalize ${
                category === cat
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-emerald-600 hover:text-emerald-600"
              }`}
            >
              {cat}
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {post.imageUrl && (
                  <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-gray-100">
                    <SafeImage
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                )}
                <div className="p-5 flex flex-col flex-1">
                  {post.category && (
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.category)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-2 hover:text-emerald-700"
                    >
                      <Tag className="w-3 h-3" />
                      {post.category}
                    </Link>
                  )}
                  <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-emerald-700 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-500 text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(post.publishedAt, "MMM d, yyyy")}
                      </span>
                    )}
                    {post.authorName && <span>{post.authorName}</span>}
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
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
