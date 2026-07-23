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

/** How long auto-drift stays paused after the user browses manually. */
const MANUAL_GRACE_MS = 4000
/** Pointer movement (px) beyond which a card press counts as a drag, not a click. */
const DRAG_CLICK_THRESHOLD = 6

/**
 * "Popular in Lompoc" as an endlessly-scrolling row. It auto-drifts on its own,
 * but the user can browse back and forward freely — arrows (all screen sizes),
 * touch, trackpad, or mouse drag — and the row loops seamlessly in both
 * directions. Any manual move pauses the drift for a few seconds so the user is
 * never fighting the animation. Honors prefers-reduced-motion (manual still works).
 */
export function FeaturedBusinessesMarquee({ businesses, dealLabel, dealsLabel, prevLabel, nextLabel }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const hoverPausedRef = useRef(false)
  const manualUntilRef = useRef(0)
  const dragRef = useRef<{ startX: number; startScroll: number; moved: number; dragging: boolean }>({
    startX: 0,
    startScroll: 0,
    moved: 0,
    dragging: false,
  })

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
      const manualHold = Date.now() < manualUntilRef.current
      if (!hoverPausedRef.current && !manualHold && !reduce) el.scrollLeft += 0.4
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

  const holdDrift = () => {
    manualUntilRef.current = Date.now() + MANUAL_GRACE_MS
  }
  const nudge = (dir: 1 | -1) => {
    holdDrift()
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" })
  }

  // Mouse drag-to-scroll (touch devices already scroll natively).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft, moved: 0, dragging: true }
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    const el = scrollerRef.current
    if (!d.dragging || !el) return
    const dx = e.clientX - d.startX
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (d.moved > 0) holdDrift()
    el.scrollLeft = d.startScroll - dx
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    if (dragRef.current.dragging && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
    dragRef.current.dragging = false
  }
  // After a real drag, swallow the click so the card underneath doesn't navigate.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved > DRAG_CLICK_THRESHOLD) {
      e.preventDefault()
      e.stopPropagation()
      dragRef.current.moved = 0
    }
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onMouseEnter={() => { hoverPausedRef.current = true }}
        onMouseLeave={() => { hoverPausedRef.current = false }}
        onTouchStart={holdDrift}
        onTouchMove={holdDrift}
        onWheel={holdDrift}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="marquee-mask scrollbar-none flex cursor-grab overflow-x-auto pb-2 select-none active:cursor-grabbing"
      >
        {loop.map((biz, i) => (
          <Link
            key={`${biz.id}-${i}`}
            href={`/biz/${biz.slug}`}
            aria-hidden={i >= businesses.length}
            tabIndex={i >= businesses.length ? -1 : undefined}
            draggable={false}
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
        className="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background hover:text-primary"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label={nextLabel}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background hover:text-primary"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
