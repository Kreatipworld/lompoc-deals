import { NavLink } from "@/components/nav-link"
import { UserMenu } from "@/components/user-menu"
import { WeatherBadge } from "@/components/weather-badge"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export async function SiteHeader() {
  const t = await getTranslations("nav")

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label={t("home")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-110">
            {/* Sweet pea flower mark */}
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden="true">
              <ellipse cx="10" cy="7.5" rx="3" ry="4" fill="currentColor" opacity="0.95"/>
              <ellipse cx="5.8" cy="10.5" rx="2.8" ry="3.8" fill="currentColor" opacity="0.75" transform="rotate(-25 5.8 10.5)"/>
              <ellipse cx="14.2" cy="10.5" rx="2.8" ry="3.8" fill="currentColor" opacity="0.75" transform="rotate(25 14.2 10.5)"/>
              <path d="M10 12 Q9.5 15.5 8.5 18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight">
            Lompoc Deals
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink href="/deals">{t("deals")}</NavLink>
          <NavLink href="/businesses">{t("directory")}</NavLink>
          <NavLink href="/map">{t("map")}</NavLink>
          <NavLink href="/subscribe">{t("subscribe")}</NavLink>
          <NavLink href="/for-businesses">{t("forBusinesses")}</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {/* Weather badge — desktop only, too noisy on mobile */}
          <span className="hidden sm:block">
            <WeatherBadge />
          </span>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
