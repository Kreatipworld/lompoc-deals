"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { Menu, X, Home, Tag, Search, LayoutGrid, Map, Building2, User, LogIn, UserPlus, Heart, BedDouble, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/deals", icon: Tag, label: "Deals" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/businesses", icon: LayoutGrid, label: "Directory" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/hotels", icon: BedDouble, label: "Hotels" },
  { href: "/feed", icon: ShoppingBag, label: "Neighborhood" },
  { href: "/locals", icon: Heart, label: "Locals" },
  { href: "/for-businesses", icon: Building2, label: "Businesses" },
  { href: "/account", icon: User, label: "Account" },
] as const

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Mount guard for portal (SSR safety)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const menuPortal = mounted ? createPortal(
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm sm:hidden animate-in fade-in-0 duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-background shadow-xl sm:hidden",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold">Menu</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const isActive =
                href === "/"
                  ? pathname === "/" || pathname === "/en" || pathname === "/es"
                  : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 border-t pt-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/login"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <LogIn className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <UserPlus className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </>,
    document.body
  ) : null

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {menuPortal}
    </>
  )
}
