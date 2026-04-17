import { Link } from "@/i18n/navigation"
import { Building2, Tag, ArrowRight, Store } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import type { BlogBusinessCard } from "@/lib/queries"

interface BlogBusinessSpotlightProps {
  businesses: BlogBusinessCard[]
  title?: string
}

/**
 * Shows platform businesses relevant to the blog post's category.
 * Renders as a sidebar-style card list below article content.
 */
export function BlogBusinessSpotlight({
  businesses,
  title = "Local Businesses on Lompoc Deals",
}: BlogBusinessSpotlightProps) {
  if (businesses.length === 0) return null

  return (
    <aside className="mt-10 pt-8 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <Store className="w-4 h-4 text-emerald-600" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          {title}
        </h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Support local — these businesses are listed on Lompoc Deals.
      </p>

      <ul className="space-y-3">
        {businesses.map((biz) => (
          <li key={biz.id}>
            <Link
              href={`/businesses?highlight=${biz.slug}`}
              className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
            >
              {/* Logo or fallback icon */}
              <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {biz.logoUrl ? (
                  <SafeImage
                    src={biz.logoUrl}
                    alt={biz.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors leading-snug">
                  {biz.name}
                </p>
                {biz.categoryName && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 mt-0.5">
                    <Tag className="w-3 h-3" />
                    {biz.categoryName}
                  </span>
                )}
                {biz.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {biz.description}
                  </p>
                )}
                {biz.activeDealCount > 0 && (
                  <p className="text-xs font-medium text-emerald-600 mt-1">
                    {biz.activeDealCount} active deal{biz.activeDealCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 shrink-0 mt-1 transition-colors" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 text-center">
        <Link
          href="/businesses"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
        >
          Browse all Lompoc businesses →
        </Link>
      </div>
    </aside>
  )
}
