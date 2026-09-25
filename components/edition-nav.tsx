"use client"

import { useEffect, useState } from "react"

export type EditionNavItem = { id: string; label: string }

/**
 * Sticky quick-nav for the weekly edition: one chip per section on the page,
 * the chip for the section in view highlighted, a tap scrolls there. The page
 * is long by nature (games, calendar, news, homes, deals, things to do…);
 * this is how a reader gets to the part they came for without scrolling
 * through the rest (owner, Sep 25 2026: "it takes a long time to scroll").
 */
export function EditionNav({ items, label }: { items: EditionNavItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "")

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    if (!els.length || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      (entries) => {
        // The topmost section crossing the reading line wins.
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive((visible[0].target as HTMLElement).id)
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [items])

  useEffect(() => {
    // Keep the active chip in view inside the strip on phones.
    const chip = document.querySelector<HTMLElement>(`[data-edition-chip="${active}"]`)
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [active])

  if (items.length < 2) return null
  return (
    <nav aria-label={label} className="sticky top-0 z-30 border-b border-[#e3dacb] bg-[#f7f3ec]/90 backdrop-blur supports-[backdrop-filter]:bg-[#f7f3ec]/75">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            data-edition-chip={i.id}
            aria-current={active === i.id ? "location" : undefined}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(i.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              setActive(i.id)
            }}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
              active === i.id ? "bg-[#650C75] text-white shadow-[0_6px_16px_rgba(101,12,117,0.28)]" : "bg-white text-[#4a4155] ring-1 ring-[#e3dacb] hover:text-[#650C75]"
            }`}
          >
            {i.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
