"use client"

import { useEffect, useRef } from "react"

/**
 * Horizontal, swipeable row for category filter chips (mobile) that reverts
 * to a wrapping row at `sm:` and up.
 *
 * Built on the same native overflow-scroll + CSS scroll-snap pattern as
 * `EditionGallery` (see `.edition-track` / `.scrollbar-none` in globals.css).
 * This wrapper is a client component only so it can scroll the active chip
 * into view on mount — the chips themselves are still rendered by the async
 * server component `CategoryChips` and passed in as children.
 */
export function CategoryChipRow({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const active = el.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    active.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    })
  }, [])

  return (
    <div
      ref={trackRef}
      className="edition-track scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto sm:flex-wrap sm:gap-2 sm:overflow-visible sm:snap-none"
    >
      {children}
    </div>
  )
}
