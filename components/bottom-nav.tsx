"use client"

import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { Home, Map, Search, LayoutGrid, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/businesses", icon: LayoutGrid, label: "Directory" },
  { href: "/dashboard", icon: User, label: "Account" },
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
                "flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
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
