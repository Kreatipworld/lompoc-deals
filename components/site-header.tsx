import { BrandLogo } from "@/components/brand-logo"
import { NavLink } from "@/components/nav-link"
import { UserMenu } from "@/components/user-menu"
import { MobileMenu } from "@/components/mobile-menu"
import { HeaderSearch } from "@/components/header-search"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { HeaderShell } from "@/components/motion/header-shell"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export async function SiteHeader() {
  const t = await getTranslations("nav")

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
          <NavLink href="/news">{t("news")}</NavLink>
          <NavLink href="/deals">{t("deals")}</NavLink>
          <NavLink href="/businesses">{t("directory")}</NavLink>
          <NavLink href="/map">{t("map")}</NavLink>
          <NavLink href="/hotels">{t("hotels")}</NavLink>
          <NavLink href="/feed">{t("neighborhood")}</NavLink>
          <NavLink href="/partners">{t("forBusinesses")}</NavLink>
          <NavLink href="/locals">{t("forLocals")}</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <HeaderSearch />
          <span className="hidden sm:block">
            <LocaleSwitcher />
          </span>
          <UserMenu />
          <MobileMenu />
        </div>
    </HeaderShell>
  )
}
