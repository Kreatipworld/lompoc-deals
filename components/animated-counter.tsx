"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({
  value,
  duration = 1200,
  delay = 0,
  className = "",
  suffix = "",
  prefix = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const run = async () => {
      if (triggered.current) return
      triggered.current = true
      const { animate } = await import("animejs")
      const obj = { val: 0 }
      animate(obj, {
        val: value,
        duration,
        delay,
        easing: "cubicBezier(0.23, 1, 0.32, 1)",
        onUpdate: () => setDisplay(Math.round(obj.val)),
      })
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration, delay])

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
