"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface AnimeRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "scale"
  distance?: number
  duration?: number
  as?: keyof JSX.IntrinsicElements
  once?: boolean
}

export function AnimeReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 32,
  duration = 700,
  as: Tag = "div",
  once = true,
}: AnimeRevealProps) {
  const ref = useRef<HTMLElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const initialTransform = {
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`,
      left: `translateX(${distance}px)`,
      right: `translateX(-${distance}px)`,
      scale: "scale(0.9)",
    }[direction]

    el.style.opacity = "0"
    el.style.transform = initialTransform

    const run = async () => {
      if (animated.current && once) return
      animated.current = true
      const { animate } = await import("animejs")
      animate(el, {
        opacity: [0, 1],
        translateY: direction === "up" ? [distance, 0] : direction === "down" ? [-distance, 0] : 0,
        translateX: direction === "left" ? [distance, 0] : direction === "right" ? [-distance, 0] : 0,
        scale: direction === "scale" ? [0.9, 1] : 1,
        duration,
        delay,
        easing: "cubicBezier(0.23, 1, 0.32, 1)",
      })
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run()
          if (once) observer.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, direction, distance, duration, once])

  return (
    // @ts-expect-error polymorphic ref
    <Tag ref={ref} className={className} style={{ willChange: "opacity, transform" }}>
      {children}
    </Tag>
  )
}
