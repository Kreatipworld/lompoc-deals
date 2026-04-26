import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
import { CalendarDays, Tag, ArrowLeft, User } from "lucide-react"
import { getBlogPostBySlug, getRecentBlogPosts, getBusinessesForBlogCategory } from "@/lib/queries"
import { SafeImage } from "@/components/safe-image"
import { BlogRelatedLinks } from "@/components/blog-related-links"
import { BlogBusinessSpotlight } from "@/components/blog-business-spotlight"
import { getTranslations } from "next-intl/server"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)
  if (!post) return { title: "Post not found — Lompoc Deals" }

  const description =
    post.metaDescription ?? post.excerpt ?? `Read ${post.title} on the Lompoc Deals blog.`

  return {
    title: `${post.title} | Lompoc Deals Blog`,
    description,
    openGraph: {
      title: post.title,
      description,
      url: `${siteUrl}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
      images: post.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : undefined,
    },
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string; locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" })

  const [post, recentPosts] = await Promise.all([
    getBlogPostBySlug(params.slug),
    getRecentBlogPosts(3),
  ])

  if (!post) notFound()

  const relatedBusinesses = await getBusinessesForBlogCategory(post.category ?? null, 3)

  const relatedPosts = recentPosts.filter((p) => p.slug !== post.slug).slice(0, 2)

  // Schema.org BlogPosting structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    image: post.imageUrl ?? undefined,
    url: `${siteUrl}/blog/${post.slug}`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.authorName ?? "Lompoc Deals",
    },
    publisher: {
      "@type": "Organization",
      name: "Lompoc Deals",
      url: siteUrl,
    },
    keywords: post.tags?.join(", "),
    articleSection: post.category ?? undefined,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "Blog",
      name: "Lompoc Deals Blog",
      url: `${siteUrl}/blog`,
    },
  }

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Back nav */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("backToBlog")}
        </Link>

        <article>
          {/* Category */}
          {post.category && (
            <Link
              href={`/blog?category=${encodeURIComponent(post.category)}`}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-3 hover:text-emerald-700"
            >
              <Tag className="w-3 h-3" />
              {post.category}
            </Link>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {format(post.publishedAt, "MMMM d, yyyy")}
              </span>
            )}
            {post.authorName && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.authorName}
              </span>
            )}
          </div>

          {/* Featured image */}
          {post.imageUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
              <SafeImage
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Excerpt/intro */}
          {post.excerpt && (
            <p className="text-lg text-gray-600 mb-6 font-medium leading-relaxed border-l-4 border-emerald-500 pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-gray prose-headings:font-bold prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("tags")}</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Internal linking — related posts + deals CTA */}
        {relatedPosts.length > 0 && (
          <BlogRelatedLinks posts={relatedPosts} title={t("relatedArticles")} />
        )}

        {/* Platform business recommendations */}
        <BlogBusinessSpotlight businesses={relatedBusinesses} title={t("localBusinesses")} supportLocalText={t("supportLocal")} browseAllText={t("browseAllBusinesses")} />

        {/* CTA to deals */}
        <div className="mt-10 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
          <p className="text-emerald-800 font-semibold mb-2">
            {t("lookingForDeals")}
          </p>
          <p className="text-emerald-700 text-sm mb-4">
            {t("lookingForDealsBody")}
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            {t("browseDeals")}
          </Link>
        </div>
      </main>
    </>
  )
}
