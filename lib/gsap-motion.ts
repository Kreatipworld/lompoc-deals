"use client"
/**
 * Motion foundation — one place that registers GSAP plugins, sets the house
 * defaults, and names the reduced-motion breakpoints used by gsap.matchMedia.
 *
 * House feel: smooth, weighty, confident. power3.out, ≤0.9s, no bounce.
 * Under prefers-reduced-motion everything renders in its final state.
 */
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

let registered = false
export function ensureGsap(): typeof gsap {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP)
    gsap.defaults({ ease: "power3.out", duration: 0.8 })
    registered = true
  }
  return gsap
}

/** matchMedia conditions — use as keys in gsap.matchMedia().add({ ... }) */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)"
export const MOTION_REDUCED = "(prefers-reduced-motion: reduce)"

export { gsap, ScrollTrigger, useGSAP }
