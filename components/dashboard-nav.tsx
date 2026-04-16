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
    <nav className="flex flex-row gap-1 overflow-x-auto scrollbar-none lg:flex-col lg:overflow-visible">
      {links.map(({ href, icon, label, badge }) => {
        // For the exact dashboard root, require exact segment match to avoid matching all sub-routes
        const segment = href.replace(/^\//, "").split("/").pop() ?? ""
        const active =
          href.endsWith("/dashboard")
            ? /\/dashboard$/.test(pathname)
            : pathname.includes(`/${segment}`)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-none items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition lg:gap-2.5 ${
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
