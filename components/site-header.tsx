import { BrandLogo } from "@/components/brand-logo"
import { NavLink } from "@/components/nav-link"
import { UserMenu } from "@/components/user-menu"
import { MobileMenu } from "@/components/mobile-menu"
import { HeaderSearch } from "@/components/header-search"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { HeaderShell } from "@/components/motion/header-shell"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { hasEventToday } from "@/lib/nav-today"

/**
 * Five tabs, one search, one button. The map is one of the best features (user, Sep 4)
 * so it keeps its own tab. Ordered by what engaged sessions actually
 * do (business pages, deals, search) and by what drives our traffic (this week's
 * events). Map, Hotels, Neighborhood, Locals live inside Explore, the mobile
 * "More" group, and the footer — nothing was removed from the site.
 */
export async function SiteHeader() {
  const [t, eventToday] = await Promise.all([getTranslations("nav"), hasEventToday()])

  return (
    <HeaderShell>
        <Link
          href="/"
          data-header-logo
          className="group flex items-center"
          aria-label={t("home")}
        >
          <BrandLogo className="h-10 w-auto transition-transform duration-200 group-hover:scale-105" />
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink href="/this-week" className="relative">
            {t("thisWeek")}
            {eventToday && (
              <span
                className="absolute -right-2.5 top-0 h-1.5 w-1.5 rounded-full bg-[#0B992F]"
                title={t("eventToday")}
                aria-label={t("eventToday")}
              />
            )}
          </NavLink>
          <NavLink href="/deals">{t("deals")}</NavLink>
          <NavLink href="/businesses">{t("explore")}</NavLink>
          <NavLink href="/map">{t("map")}</NavLink>
          <NavLink href="/news">{t("news")}</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <HeaderSearch />
          <span className="hidden sm:block">
            <LocaleSwitcher />
          </span>
          <Link
            href="/partners"
            className="hidden rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:inline-flex"
          >
            {t("forBusinesses")}
          </Link>
          <UserMenu />
          <MobileMenu />
        </div>
    </HeaderShell>
  )
}
