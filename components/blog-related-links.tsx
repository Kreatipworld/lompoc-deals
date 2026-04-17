import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import type { BlogPostCard } from "@/lib/queries"

interface BlogRelatedLinksProps {
  posts: BlogPostCard[]
  title?: string
}

/**
 * Internal linking component — renders related blog post links.
 * Use in blog post pages to build topical clusters and reduce bounce rate.
 */
export function BlogRelatedLinks({ posts, title = "Related Articles" }: BlogRelatedLinksProps) {
  if (posts.length === 0) return null

  return (
    <aside className="mt-10 pt-8 border-t border-gray-100">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">{title}</h2>
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {post.title}
                </p>
                {post.publishedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(post.publishedAt, "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 shrink-0 mt-0.5 transition-colors" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

/**
 * Inline deal backlink — use inside blog post content to link to a deals page or category.
 * Pass the business slug or category slug.
 */
export function DealBacklink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:text-emerald-700 hover:underline transition-colors"
    >
      {children}
      <ArrowRight className="w-3 h-3" />
    </Link>
  )
}
