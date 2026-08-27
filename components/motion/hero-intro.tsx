"use client"
import { useRef, type ReactNode } from "react"
import { ensureGsap, useGSAP, MOTION_OK } from "@/lib/gsap-motion"

interface HeroIntroProps {
  children: ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

/**
 * Staged hero entrance. Wrap a hero and mark descendants with `data-hero`:
 *
 *   "line"   — copy that rises in sequence (kicker, headline, subheadline)
 *   "accent" — the gold italic word; settles last with a slight scale.
 *              Must be a block/inline-block element (transforms skip inline).
 *   "cta"    — search box, buttons, stat strip; glides up after the copy
 *   "bg"     — background image layer; slow Ken Burns drift. Transform only —
 *              its opacity is never touched and nothing waits on it, so the
 *              LCP image paints exactly as it did before.
 *
 * Everything renders in its final state on the server, for reduced-motion
 * users, and if JS never runs: GSAP applies the "from" states only at the
 * moment it starts animating, and clears its inline styles when done so no
 * transform/stacking context lingers (the search dropdown needs that).
 */
export function HeroIntro({ children, className = "", as: Tag = "div" }: HeroIntroProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const gsap = ensureGsap()
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(el)
        const lines = q('[data-hero="line"]')
        const accent = q('[data-hero="accent"]')
        const ctas = q('[data-hero="cta"]')
        const bg = q('[data-hero="bg"]')

        // Ken Burns — independent of the copy timeline so it starts on frame 1.
        if (bg.length) {
          gsap.to(bg, { scale: 1.06, duration: 8, ease: "none", transformOrigin: "50% 50%" })
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } })
        if (lines.length) {
          tl.from(lines, { y: 28, opacity: 0, duration: 0.9, stagger: 0.12 })
        }
        if (accent.length) {
          // Overlap the tail of the last line so the gold word lands as the
          // headline finishes settling, not after a gap.
          tl.from(accent, { opacity: 0, scale: 0.96, duration: 0.7 }, tl.duration() ? "-=0.55" : 0)
        }
        if (ctas.length) {
          tl.from(ctas, { y: 22, opacity: 0, duration: 0.7, stagger: 0.08 }, tl.duration() ? "-=0.45" : 0)
        }
      })
      return () => mm.revert()
    },
    { scope: ref }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any
  return (
    <Comp ref={ref} className={className}>
      {children}
    </Comp>
  )
}
