"use client"
import { useRef, type ReactNode } from "react"
import { ensureGsap, useGSAP, ScrollTrigger, MOTION_OK, MOTION_REDUCED } from "@/lib/gsap-motion"

/**
 * The fixed site header's scroll behavior. Past 80px of scroll the row
 * compacts (64 → 56px), the logo shrinks a touch, and a frosted-glass
 * background layer (backdrop-blur + hairline border + soft shadow) fades in
 * over the solid one. Scrolling back to the top reverses it.
 *
 * Only the header's own layers move — the page layout is untouched (the
 * header is position: fixed and <main> keeps its static top padding). Under
 * prefers-reduced-motion the same states are applied instantly, no tween.
 */
const COMPACT_AT = 80

export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const gsap = ensureGsap()
      const el = ref.current
      if (!el) return

      const build = (duration: number) => {
        const solid = el.querySelector("[data-header-solid]")
        const glass = el.querySelector("[data-header-glass]")
        const row = el.querySelector("[data-header-row]")
        const logo = el.querySelector("[data-header-logo]")
        if (!solid || !glass || !row) return

        const tl = gsap
          .timeline({ paused: true, defaults: { duration, ease: "power3.out" } })
          .to(row, { height: 56 }, 0)
          .to(solid, { opacity: 0 }, 0)
          .to(glass, { opacity: 1 }, 0)
        if (logo) tl.to(logo, { scale: 0.88, transformOrigin: "left center" }, 0)

        ScrollTrigger.create({
          start: COMPACT_AT,
          end: "max",
          animation: tl,
          toggleActions: "play none none reverse",
        })
      }

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => build(0.35))
      mm.add(MOTION_REDUCED, () => build(0))
      return () => mm.revert()
    },
    { scope: ref }
  )

  return (
    <header ref={ref} className="fixed left-0 right-0 top-0 z-40">
      {/* Background layers — only their opacity animates. */}
      <div aria-hidden data-header-solid className="absolute inset-0 bg-background" />
      <div
        aria-hidden
        data-header-glass
        className="absolute inset-0 border-b bg-background/80 opacity-0 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60"
      />
      <div data-header-row className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {children}
      </div>
    </header>
  )
}
