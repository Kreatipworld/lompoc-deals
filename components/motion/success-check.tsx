"use client"
import { useRef } from "react"
import { ensureGsap, useGSAP, MOTION_OK } from "@/lib/gsap-motion"

interface SuccessCheckProps {
  /** Pixel size of the mark (it is square). */
  size?: number
  /** Colour comes from `currentColor` — pass a text-* class to tint it. */
  className?: string
  strokeWidth?: number
  /** Seconds before the ring starts drawing. */
  delay?: number
  /** Accessible name; omit for a purely decorative mark. */
  label?: string
}

/**
 * A ring + check-mark that draws itself in: ring 0.5s, then the tick 0.35s,
 * both power2.out. The SVG is server-rendered complete (dashoffset 0), so
 * reduced-motion users, crawlers, and a failed JS bundle all see a finished
 * mark; GSAP rewinds and draws it only when motion is allowed.
 */
export function SuccessCheck({
  size = 56,
  className = "text-success",
  strokeWidth = 2.5,
  delay = 0,
  label,
}: SuccessCheckProps) {
  const ref = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      const gsap = ensureGsap()
      const svg = ref.current
      if (!svg) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const ring = svg.querySelector("[data-ring]")
        const tick = svg.querySelector("[data-tick]")
        if (!ring || !tick) return
        // pathLength="1" on both shapes normalises their length, so the
        // dash offset runs 1 → 0 regardless of geometry.
        const tl = gsap.timeline({ delay, defaults: { ease: "power2.out" } })
        tl.fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5 })
          .fromTo(tick, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35 }, "-=0.06")
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [delay] }
  )

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle
        data-ring
        cx="26"
        cy="26"
        r="23"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="0"
        transform="rotate(-90 26 26)"
      />
      <path
        data-tick
        d="M15.5 27 L22.5 34 L36.5 19.5"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="0"
      />
    </svg>
  )
}
