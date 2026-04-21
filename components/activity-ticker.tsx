"use client"

import { useEffect, useState } from "react"
import { BedDouble, X } from "lucide-react"

const MESSAGES = [
  { name: "Sarah from San Diego", action: "just booked Embassy Suites" },
  { name: "3 travelers", action: "are viewing hotels right now" },
  { name: "John from Los Angeles", action: "booked Hampton Inn for the flower festival" },
  { name: "12 deals", action: "are available this weekend" },
  { name: "Maria from Santa Barbara", action: "checked in at Holiday Inn Express" },
]

export function ActivityTicker() {
  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return
    const initial = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(initial)
  }, [dismissed])

  useEffect(() => {
    if (!visible || dismissed) return
    const hide = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(hide)
  }, [visible, dismissed])

  useEffect(() => {
    if (dismissed) return
    const cycle = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length)
      setVisible(true)
    }, 8000)
    return () => clearInterval(cycle)
  }, [dismissed])

  if (dismissed) return null

  const msg = MESSAGES[index]

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-5 left-5 z-50 transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm max-w-[280px]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <BedDouble className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-tight truncate">{msg.name}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{msg.action}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notification"
          className="ml-1 shrink-0 rounded-full p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
