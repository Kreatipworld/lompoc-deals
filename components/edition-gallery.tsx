"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  children: React.ReactNode
  prevLabel: string
  nextLabel: string
  /** Accessible name for the whole gallery, e.g. "Things to do this week". */
  label: string
}

/**
 * Horizontal, swipeable gallery for the weekly edition.
 *
 * Built on native overflow scrolling + CSS scroll-snap rather than a JS carousel:
 * touch swipe, trackpad, and keyboard all work for free, it degrades to a plain
 * scrollable row if JS never loads, and there is no layout shift on hydration.
 * The arrows are a desktop affordance layered on top — on touch devices people
 * simply swipe, so they stay hidden there.
 */
export function EditionGallery({ children, prevLabel, nextLabel, label }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  // Disable the arrows at the ends so they never look clickable-but-dead.
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setAtStart(el.scrollLeft <= 2)
      setAtEnd(el.scrollLeft >= max - 2)
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // Advance by roughly one card so the snap lands cleanly.
    const step = Math.max(el.clientWidth * 0.8, 260)
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        className="edition-track scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#650C75]"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label={prevLabel}
        disabled={atStart}
        className="absolute -left-3 top-[38%] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8cfc0] bg-[#f7f3ec] text-[#1a1712] shadow-lg transition disabled:pointer-events-none disabled:opacity-0 hover:bg-white hover:text-[#650C75] md:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label={nextLabel}
        disabled={atEnd}
        className="absolute -right-3 top-[38%] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8cfc0] bg-[#f7f3ec] text-[#1a1712] shadow-lg transition disabled:pointer-events-none disabled:opacity-0 hover:bg-white hover:text-[#650C75] md:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  )
}
