import type { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { PAGE_CONTAINER } from "@/lib/layout-constants"

/**
 * Shared compact brand band every public page (except the homepage, which
 * keeps its taller hero) opens with. One title size/weight, left-aligned,
 * brand purple background — no per-page overrides. See
 * docs/superpowers/specs/2026-07-21-page-consistency-design.md.
 */
export function PageHeader({
  title,
  meta,
  backHref,
  backLabel,
  children,
}: {
  title: string
  meta?: ReactNode
  backHref?: string
  backLabel?: string
  children?: ReactNode
}) {
  return (
    <section className="bg-primary">
      <div
        className={`${PAGE_CONTAINER} flex flex-col gap-4 py-6 sm:py-8 lg:flex-row lg:items-end lg:justify-between`}
      >
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          )}
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {meta && (
            <p className="mt-1 truncate text-sm text-white/70">{meta}</p>
          )}
        </div>
        {children && (
          <div className="flex-shrink-0 lg:self-end">{children}</div>
        )}
      </div>
    </section>
  )
}
