/**
 * Shared motion tokens + reduced-motion hook.
 *
 * Every animation in the business-pitch layer uses these tokens — single
 * source of truth for duration, easing, and stagger cadence. Matches the
 * existing --ease-out / fade-up / card-enter timing already in globals.css.
 */

"use client"

import { useEffect, useState } from "react"

export const DURATION = {
  hover: 220,
  transition: 300,
  entrance: 500,
  success: 900,
} as const

// anime.js v4 easing string that matches --ease-out in globals.css
export const EASE = {
  standard: "cubicBezier(0.23, 1, 0.32, 1)",
} as const

export const STAGGER = 120 // ms between siblings in a group

/**
 * True when the OS/browser has `prefers-reduced-motion: reduce`.
 * SSR-safe: returns false on the server and re-reads on mount.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefers(mql.matches)
    const listener = (e: MediaQueryListEvent) => setPrefers(e.matches)
    mql.addEventListener("change", listener)
    return () => mql.removeEventListener("change", listener)
  }, [])

  return prefers
}
