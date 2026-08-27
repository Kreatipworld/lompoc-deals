"use client"
import { useRef, type ReactNode } from "react"
import { ensureGsap, useGSAP, MOTION_OK } from "@/lib/gsap-motion"

interface RevealProps {
  children: ReactNode
  className?: string
  /** seconds */
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "scale"
  distance?: number
  /** milliseconds (kept for AnimeReveal compatibility) */
  duration?: number
  as?: keyof JSX.IntrinsicElements
  once?: boolean
  /** Animate direct children one after another (seconds between each). */
  stagger?: number
}

/**
 * Scroll-triggered entrance. Drop-in for the old AnimeReveal (same props),
 * plus `stagger` for grids. Elements start visible in the DOM and are hidden
 * only by GSAP once it's running — no flash, and nothing is hidden for
 * reduced-motion users or if JS fails.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 28,
  duration = 800,
  as: Tag = "div",
  once = true,
  stagger,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const gsap = ensureGsap()
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const targets = stagger ? Array.from(el.children) : [el]
        if (!targets.length) return
        const from: Record<string, number> = { opacity: 0 }
        if (direction === "up") from.y = distance
        if (direction === "down") from.y = -distance
        if (direction === "left") from.x = distance
        if (direction === "right") from.x = -distance
        if (direction === "scale") from.scale = 0.94
        gsap.from(targets, {
          ...from,
          duration: duration / 1000,
          delay,
          stagger: stagger ?? 0,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: el, start: "top 88%", once, toggleActions: once ? "play none none none" : "play none none reverse" },
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [direction, distance, duration, delay, once, stagger] }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any
  return (
    <Comp ref={ref} className={className}>
      {children}
    </Comp>
  )
}
