"use client"

import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { Home, Search, LayoutGrid, User, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"

const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/deals", icon: Tag, labelKey: "deals" },
  { href: "/search", icon: Search, labelKey: "search" },
  { href: "/businesses", icon: LayoutGrid, labelKey: "directory" },
  { href: "/account", icon: User, labelKey: "account" },
] as const

/**
 * Single source of truth for how much bottom clearance mobile page content
 * needs so it never sits underneath this nav or the chat FAB above it.
 *
 * BottomNav is `h-16` (64px). The chat FAB sits at `bottom-[4.5rem]` (72px)
 * with a 48px (`w-12 h-12`) footprint on mobile, so its top edge lands at
 * 72px + 48px = 120px (7.5rem) — the taller of the two fixed elements.
 * Apply this to a page's outermost scrollable container; it collapses to
 * nothing at `sm:` and up, where BottomNav is hidden (`sm:hidden`) and the
 * FAB relocates to `sm:bottom-6`.
 */

export function BottomNav() {
  const t = useTranslations("bottomNav")
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollY.current
        // Show when near top or scrolling up; hide when scrolling down >4px
        if (currentY < 60) {
          setHidden(false)
        } else if (delta > 4) {
          setHidden(true)
        } else if (delta < -4) {
          setHidden(false)
        }
        lastScrollY.current = currentY
        ticking.current = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm sm:hidden",
        "transition-transform duration-300 ease-in-out",
        hidden ? "translate-y-full" : "translate-y-0"
      )}
    >
      <div className="flex h-16 items-center justify-around px-1 pb-safe">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const isActive =
            href === "/"
              ? pathname === "/" || pathname === "/en" || pathname === "/es"
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium",
                "transition-[transform,colors] duration-150 active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-1 h-1 w-5 rounded-full bg-primary opacity-70 animate-in fade-in-0 zoom-in-95 duration-200" />
              )}
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              {t(labelKey)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
