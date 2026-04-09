"use client"

import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { ComponentPropsWithoutRef } from "react"

type NavLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  href: string
}

export function NavLink({ href, className, children, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const isActive =
    href === "/"
      ? pathname === "/" || pathname === "/en" || pathname === "/es"
      : pathname.includes(href)

  return (
    <Link
      href={href}
      data-active={isActive}
      className={cn(
        "nav-link text-sm font-medium transition-colors duration-150",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
