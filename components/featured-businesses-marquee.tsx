"use client"

import { useEffect, useRef } from "react"
import { Link } from "@/i18n/navigation"
import { Building2, ExternalLink, Tag, ChevronLeft, ChevronRight } from "lucide-react"
import { BusinessAvatar } from "@/components/business-avatar"
import type { DirectoryBusiness } from "@/lib/queries"

type Props = {
  businesses: DirectoryBusiness[]
  dealLabel: string
  dealsLabel: string
  prevLabel: string
  nextLabel: string
}

/**
 * "Popular in Lompoc" as an endlessly-scrolling row. It auto-drifts on its own,
 * but the user can also drag / trackpad-scroll or use the arrows to move back and
 * forward — the row loops seamlessly in both directions. Auto-drift pauses while
 * hovering or touching, and honors prefers-reduced-motion (manual scroll still works).
 */
export function FeaturedBusinessesMarquee({ businesses, dealLabel, dealsLabel, prevLabel, nextLabel }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  // Three identical copies give room to drift/scroll infinitely either direction;
  // we keep the scroll position parked in the middle copy and recenter on the fly.
  const loop = [...businesses, ...businesses, ...businesses]

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Keep scrollLeft within the middle copy so both edges always have runway.
    const recenter = () => {
      const copyW = el.scrollWidth / 3
      if (copyW <= 0) return
      if (el.scrollLeft < copyW * 0.5) el.scrollLeft += copyW
      else if (el.scrollLeft > copyW * 1.5) el.scrollLeft -= copyW
    }

    // Park in the middle copy on mount.
    const copyW = el.scrollWidth / 3
    if (copyW > 0) el.scrollLeft = copyW

    let raf = 0
    const step = () => {
      if (!pausedRef.current && !reduce) el.scrollLeft += 0.4
      recenter()
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    const onScroll = () => recenter()
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("scroll", onScroll)
    }
  }, [])

  const pause = () => { pausedRef.current = true }
  const resume = () => { pausedRef.current = false }
  const nudge = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={() => window.setTimeout(resume, 2000)}
        className="marquee-mask scrollbar-none flex overflow-x-auto scroll-smooth pb-2"
      >
        {loop.map((biz, i) => (
          <Link
            key={`${biz.id}-${i}`}
            href={`/biz/${biz.slug}`}
            aria-hidden={i >= businesses.length}
            tabIndex={i >= businesses.length ? -1 : undefined}
            className="group mr-4 flex w-80 flex-shrink-0 gap-4 rounded-2xl border bg-background p-4 shadow-sm card-lift hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex-shrink-0">
              <BusinessAvatar
                logoUrl={biz.logoUrl}
                photoUrl={biz.photoUrl}
                name={biz.name}
                className="h-14 w-14 overflow-hidden rounded-xl"
                icon={<Building2 className="h-7 w-7" />}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-semibold leading-tight transition-colors group-hover:text-primary">
                  {biz.name}
                </h3>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
              </div>
              {biz.categoryName && (
                <p className="mt-0.5 text-xs text-muted-foreground">{biz.categoryName}</p>
              )}
              {biz.description && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {biz.description}
                </p>
              )}
              {biz.activeDealCount > 0 && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <Tag className="h-2.5 w-2.5" />
                  {biz.activeDealCount} {biz.activeDealCount === 1 ? dealLabel : dealsLabel}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label={prevLabel}
        className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background hover:text-primary sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label={nextLabel}
        className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background hover:text-primary sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
