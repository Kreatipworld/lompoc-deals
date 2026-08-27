"use client"
import { useRef } from "react"
import { ensureGsap, useGSAP, MOTION_OK } from "@/lib/gsap-motion"

interface CountUpProps {
  value: number
  prefix?: string
  suffix?: string
  /** seconds */
  duration?: number
  /** seconds before counting starts (e.g. wait for a hero entrance) */
  delay?: number
  className?: string
  locale?: string
}

/** A number you watch land. Renders the final value for SSR/reduced-motion. */
export function CountUp({ value, prefix = "", suffix = "", duration = 1.4, delay = 0, className, locale = "en-US" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const fmt = (n: number) => `${prefix}${Math.round(n).toLocaleString(locale)}${suffix}`

  useGSAP(
    () => {
      const gsap = ensureGsap()
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const obj = { n: 0 }
        gsap.to(obj, {
          n: value,
          duration,
          delay,
          ease: "power2.out",
          onUpdate: () => { el.textContent = fmt(obj.n) },
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [value, duration, delay, prefix, suffix] }
  )

  return <span ref={ref} className={className}>{fmt(value)}</span>
}
