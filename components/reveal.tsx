/**
 * <Reveal> — scroll-triggered entrance animation primitive.
 *
 * Constrained, preset-only API so every business-pitch surface animates
 * with the same vocabulary. Uses IntersectionObserver + anime.js v4.
 * Respects `prefers-reduced-motion`: renders final state instantly.
 */

"use client"

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { DURATION, EASE, STAGGER, usePrefersReducedMotion } from "@/lib/motion"
import type { AnimationParams } from "animejs"

type Preset = "fadeUp" | "fadeIn" | "scaleIn" | "stagger"

interface RevealProps {
  children: ReactNode
  preset?: Preset
  /** Additional delay in ms before the animation starts. Default: 0. */
  delay?: number
  /** Stagger ms between children (only used with preset="stagger"). Default: 120. */
  stagger?: number
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Reveal({
  children,
  preset = "fadeUp",
  delay = 0,
  stagger = STAGGER,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()

  // Render-time initial style prevents FOUC. Stagger handles children in
  // useEffect — root stays visible so children can reveal against a stable parent.
  const initialStyle: CSSProperties =
    preset === "stagger"
      ? { willChange: "opacity, transform" }
      : preset === "fadeUp"
        ? { opacity: 0, transform: "translateY(16px)", willChange: "opacity, transform" }
        : preset === "scaleIn"
          ? { opacity: 0, transform: "scale(0.98)", willChange: "opacity, transform" }
          : { opacity: 0, willChange: "opacity, transform" } // fadeIn

  useEffect(() => {
    const root = ref.current
    if (!root) return

    // Reduced motion — render final state, no animation
    if (reduced) {
      root.style.opacity = "1"
      root.style.transform = "none"
      if (preset === "stagger") {
        for (const child of Array.from(root.children) as HTMLElement[]) {
          child.style.opacity = "1"
          child.style.transform = "none"
        }
      }
      return
    }

    // Only stagger needs to initialize children imperatively here —
    // non-stagger presets are already hidden via initialStyle above.
    if (preset === "stagger") {
      for (const child of Array.from(root.children) as HTMLElement[]) {
        child.style.opacity = "0"
        child.style.transform = "translateY(16px)"
      }
    }

    const run = async () => {
      const { animate, stagger: animeStagger } = await import("animejs")

      if (preset === "stagger") {
        const targets = Array.from(root.children) as HTMLElement[]
        animate(targets, {
          opacity: [0, 1],
          translateY: [16, 0],
          duration: DURATION.entrance,
          delay: animeStagger(stagger, { start: delay }),
          easing: EASE.standard,
        })
      } else {
        const keyframes: AnimationParams = {
          opacity: [0, 1],
          duration: DURATION.entrance,
          delay,
          easing: EASE.standard,
        }
        if (preset === "fadeUp") keyframes.translateY = [16, 0]
        if (preset === "scaleIn") keyframes.scale = [0.98, 1]
        animate(root, keyframes)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -32px 0px" }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [preset, delay, stagger, reduced])

  return (
    // @ts-expect-error polymorphic ref
    <Tag ref={ref} className={className} style={initialStyle}>
      {children}
    </Tag>
  )
}
