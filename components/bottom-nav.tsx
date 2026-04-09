"use client"

import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { Home, Search, LayoutGrid, User, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/deals", icon: Tag, label: "Deals" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/businesses", icon: LayoutGrid, label: "Directory" },
  { href: "/account", icon: User, label: "Account" },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm sm:hidden"
    >
      <div className="flex h-16 items-center justify-around px-1 pb-safe">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
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
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
