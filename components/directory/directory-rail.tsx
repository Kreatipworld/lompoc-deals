"use client"

import { useEffect, useRef, useState } from "react"
import { Link } from "@/i18n/navigation"
import { Flame, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"

export type RailSection = { id: string; label: string; count: number }

/**
 * Sticky category rail that follows the reader: the section currently on screen
 * is highlighted and its chip scrolls itself into view, so on a long directory
 * you always know where you are and can jump anywhere in one tap.
 */
export function DirectoryRail({
  sections,
  mostActiveLabel,
  hasMostActive,
  openNowLabel,
  openNow,
  surpriseLabel,
  surpriseHref,
}: {
  sections: RailSection[]
  mostActiveLabel: string
  hasMostActive: boolean
  openNowLabel: string
  openNow: boolean
  surpriseLabel: string
  surpriseHref: string
}) {
  const [active, setActive] = useState<string | null>(null)
  const chipRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return
    const visible = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top)
          else visible.delete(e.target.id)
        }
        if (visible.size === 0) return
        // The section whose top sits closest to the rail wins.
        const next = Array.from(visible.entries()).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0][0]
        setActive(next)
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.1, 0.5] }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  useEffect(() => {
    if (!active) return
    chipRefs.current.get(active)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [active])

  const chip = "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200"

  return (
    <nav
      aria-label="Directory sections"
      className="sticky top-16 z-40 border-b bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70"
    >
      <div className="scrollbar-none mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2.5">
        {hasMostActive && (
          <a href="#most-active" className={cn(chip, "border-gold bg-gold text-gold-foreground shadow-sm hover:-translate-y-0.5")}>
            <Flame className="h-3.5 w-3.5" />
            {mostActiveLabel}
          </a>
        )}
        <Link
          href={openNow ? "/businesses" : "/businesses?open=1"}
          className={cn(chip, openNow ? "border-success bg-success/10 text-success" : "bg-card text-muted-foreground hover:border-foreground/30")}
        >
          <span className={cn("h-2 w-2 rounded-full", openNow ? "bg-success" : "bg-muted-foreground/40")} />
          {openNowLabel}
        </Link>
        <a href={surpriseHref} className={cn(chip, "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10")}>
          <Shuffle className="h-3.5 w-3.5" />
          {surpriseLabel}
        </a>
        <span className="mx-1 h-5 w-px flex-shrink-0 bg-border" aria-hidden />
        {sections.map((s) => {
          const isActive = active === s.id
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              ref={(el) => { if (el) chipRefs.current.set(s.id, el) }}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                chip,
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              )}
            >
              {s.label}
              <span className={cn("text-xs", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>{s.count}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
