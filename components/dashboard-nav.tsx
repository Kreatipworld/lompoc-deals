"use client"

import { usePathname } from "next/navigation"
import { Link } from "@/i18n/navigation"

export function DashboardNav({
  links,
}: {
  links: { href: string; icon: React.ReactNode; label: string; badge?: number }[]
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row gap-1 lg:flex-col">
      {links.map(({ href, icon, label, badge }) => {
        // Match active: the pathname (after locale) should start with or equal the href segment
        const active = pathname.includes(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:flex-initial ${
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <span className={active ? "text-primary" : "text-primary/70"}>{icon}</span>
            <span className="hidden lg:inline">{label}</span>
            <span className="lg:hidden">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
