"use client"

import { useRef } from "react"
import { Link } from "@/i18n/navigation"
import { Building2, ExternalLink, Tag, ChevronLeft, ChevronRight } from "lucide-react"
import { BusinessAvatar } from "@/components/business-avatar"
import { ensureGsap, useGSAP, MOTION_OK } from "@/lib/gsap-motion"
import type { DirectoryBusiness } from "@/lib/queries"

type Props = {
  businesses: DirectoryBusiness[]
  dealLabel: string
  dealsLabel: string
  prevLabel: string
  nextLabel: string
}

/** Resting auto-drift speed, in px per 60fps frame (the ticker scales it to real time). */
const BASE_VELOCITY = 0.4
/** Fastest the rail may travel after a fling, in px per 60fps frame. */
const MAX_VELOCITY = 40
/** How long momentum takes to ease back to the resting velocity (seconds). */
const MOMENTUM_SECONDS = 1.2
/** How quickly the drift glides to a stop when the mouse arrives (seconds). */
const HOVER_STOP_SECONDS = 0.5
/** Fraction of a wheel event's horizontal delta that becomes momentum. */
const WHEEL_GAIN = 0.02
/** Pointer movement (px) beyond which a card press counts as a drag, not a click. */
const DRAG_CLICK_THRESHOLD = 6
/** A release more than this long after the last move is a stop, not a fling (ms). */
const FLING_MAX_GAP_MS = 80
/** Arrow-button step (px) and the pause before the drift resumes after it (seconds). */
const NUDGE_PX = 340
const NUDGE_RESUME_DELAY = 1
/** Pause after a touch gesture before the drift resumes (seconds). */
const TOUCH_RESUME_DELAY = 1

const clampVelocity = (v: number) => Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v))

type DragState = {
  startX: number
  startScroll: number
  moved: number
  dragging: boolean
  /** Last two pointer samples — the fling speed on release is read from these. */
  lastX: number
  lastT: number
  prevX: number
  prevT: number
}

/**
 * "Popular in Lompoc" as an endlessly-scrolling row. It auto-drifts on its own,
 * but the user can browse back and forward freely — arrows (all screen sizes),
 * touch, trackpad, or mouse drag — and the row loops seamlessly in both
 * directions.
 *
 * Motion model: one velocity number (px per 60fps frame) that a GSAP ticker
 * applies to scrollLeft every frame. A wheel or a drag-fling adds to that
 * velocity in its own direction, and GSAP then eases it back to rest over
 * ~1.2s — real momentum instead of a hard stop. Hovering with a mouse eases the
 * drift to zero so nobody fights the animation; leaving resumes it. Under
 * prefers-reduced-motion the ticker never starts: no drift, no momentum, but
 * drag, wheel, touch, and the arrows still scroll the rail.
 */
export function FeaturedBusinessesMarquee({ businesses, dealLabel, dealsLabel, prevLabel, nextLabel }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef(false)
  /** True only while the reduced-motion check passes and the ticker is running. */
  const driftOnRef = useRef(false)
  /** The rail's current velocity. GSAP tweens it; the ticker reads it. */
  const velRef = useRef({ v: 0 })
  const dragRef = useRef<DragState>({
    startX: 0,
    startScroll: 0,
    moved: 0,
    dragging: false,
    lastX: 0,
    lastT: 0,
    prevX: 0,
    prevT: 0,
  })

  // Three identical copies give room to drift/scroll infinitely either direction;
  // we keep the scroll position parked in the middle copy and recenter on the fly.
  const loop = [...businesses, ...businesses, ...businesses]

  const { contextSafe } = useGSAP(
    () => {
      const gsap = ensureGsap()
      const el = scrollerRef.current
      if (!el) return

      // Sub-pixel position the ticker accumulates into. Browsers snap scrollLeft
      // to device pixels, so writing a 0.4px step straight to scrollLeft can round
      // to nothing on a 1x screen; accumulating here keeps the drift moving.
      let pos = 0
      let lastWritten = 0
      let synced = false

      // Keep scrollLeft within the middle copy so both edges always have runway.
      const recenter = () => {
        const copyW = el.scrollWidth / 3
        if (copyW <= 0) return
        let shift = 0
        if (el.scrollLeft < copyW * 0.5) shift = copyW
        else if (el.scrollLeft > copyW * 1.5) shift = -copyW
        if (!shift) return
        el.scrollLeft += shift
        if (synced) {
          pos += shift
          lastWritten = el.scrollLeft
        }
        // A drag in progress measures from where it started; carry that across
        // the wrap so the next pointer move doesn't snap the rail back.
        dragRef.current.startScroll += shift
      }

      // Park in the middle copy on mount.
      const copyW = el.scrollWidth / 3
      if (copyW > 0) el.scrollLeft = copyW

      // Native scrolling (wheel, touch, smooth nudges) still needs the loop illusion.
      const onScroll = () => recenter()
      el.addEventListener("scroll", onScroll, { passive: true })

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const vel = velRef.current
        const tick = () => {
          const v = vel.v
          if (Math.abs(v) < 0.001) {
            synced = false
            return
          }
          const cur = el.scrollLeft
          // Anything else that moved the rail (wheel, drag, touch) wins; resync to it.
          if (!synced || cur !== lastWritten) pos = cur
          pos += v * gsap.ticker.deltaRatio(60)
          el.scrollLeft = pos
          lastWritten = el.scrollLeft
          synced = true
          recenter()
        }
        gsap.ticker.add(tick)
        driftOnRef.current = true
        vel.v = hoverRef.current ? 0 : BASE_VELOCITY
        return () => {
          gsap.ticker.remove(tick)
          gsap.killTweensOf(vel)
          driftOnRef.current = false
          vel.v = 0
          synced = false
        }
      })

      return () => {
        el.removeEventListener("scroll", onScroll)
        mm.revert()
      }
    },
    { scope: scrollerRef }
  )

  /** Ease the velocity back to rest: the base drift, or zero while the mouse is over the rail. */
  const settle = contextSafe((seconds: number = MOMENTUM_SECONDS, delay = 0) => {
    if (!driftOnRef.current) return
    ensureGsap().to(velRef.current, {
      v: hoverRef.current ? 0 : BASE_VELOCITY,
      duration: seconds,
      delay,
      ease: "power3.out",
      overwrite: true,
    })
  })

  /** Stop the rail dead — used while the user (or the browser's smooth scroll) owns it. */
  const halt = contextSafe(() => {
    if (!driftOnRef.current) return
    ensureGsap().killTweensOf(velRef.current)
    velRef.current.v = 0
  })

  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    // Any scrollLeft write would cancel the browser's smooth scroll, so go quiet
    // for the ride and resume the drift once the step has landed.
    halt()
    el.scrollBy({ left: dir * NUDGE_PX, behavior: "smooth" })
    settle(MOMENTUM_SECONDS, NUDGE_RESUME_DELAY)
  }

  // Mouse hover pauses the drift; pointer events let us ignore the emulated
  // mouseenter a tap fires on touch screens, which would otherwise freeze the rail.
  const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return
    hoverRef.current = true
    settle(HOVER_STOP_SECONDS)
  }
  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return
    hoverRef.current = false
    settle()
  }

  // Wheel scrolls natively; its horizontal push also becomes a little momentum
  // that carries the rail on in the same direction, then eases back.
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!driftOnRef.current) return
    const dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX
    if (!dx) return
    velRef.current.v = clampVelocity(velRef.current.v + dx * WHEEL_GAIN)
    settle()
  }

  // Touch scrolls natively; stay out of its way, then drift again after a beat.
  const onTouchStart = () => halt()
  const onTouchEnd = () => settle(MOMENTUM_SECONDS, TOUCH_RESUME_DELAY)

  // Mouse drag-to-scroll (touch devices already scroll natively).
  // IMPORTANT: don't capture the pointer on pointerdown — capturing retargets
  // the compat mouseup to the scroller, so the click's common-ancestor target
  // is never the card's <Link> and plain clicks silently die (seen on the
  // homepage "Hungry right now?" rail). Capture only once a real drag starts.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = {
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
      dragging: true,
      lastX: e.clientX,
      lastT: e.timeStamp,
      prevX: e.clientX,
      prevT: e.timeStamp,
    }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    const el = scrollerRef.current
    if (!d.dragging || !el) return
    const dx = e.clientX - d.startX
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (d.moved <= DRAG_CLICK_THRESHOLD) return // still a click, not a drag
    if (!el.hasPointerCapture(e.pointerId)) {
      el.setPointerCapture(e.pointerId)
      halt() // the hand owns the rail now
    }
    d.prevX = d.lastX
    d.prevT = d.lastT
    d.lastX = e.clientX
    d.lastT = e.timeStamp
    el.scrollLeft = d.startScroll - dx
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    const d = dragRef.current
    if (!d.dragging) return
    d.dragging = false
    if (!el?.hasPointerCapture(e.pointerId)) return // never became a drag
    el.releasePointerCapture(e.pointerId)
    // Fling: hand speed at release becomes rail velocity (drag right = scroll
    // left, hence the sign), then eases back to rest. A pause before letting go
    // means the user parked the rail — no fling.
    const gap = e.timeStamp - d.lastT
    const dt = d.lastT - d.prevT
    if (driftOnRef.current && gap < FLING_MAX_GAP_MS && dt > 0) {
      const pxPerFrame = ((d.lastX - d.prevX) / dt) * (1000 / 60)
      velRef.current.v = clampVelocity(-pxPerFrame)
    }
    settle()
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
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onWheel={onWheel}
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
