import { Link } from "@/i18n/navigation"
import { Flower2, LayoutGrid, Map, Building2, Mail } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { LanguageSwitcher } from "@/components/language-switcher"
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
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-105">
            <Flower2 className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Lompoc Deals
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {t("feed")}
          </Link>
          <Link
            href="/businesses"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {t("directory")}
          </Link>
          <Link
            href="/map"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {t("map")}
          </Link>
          <Link
            href="/subscribe"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {t("subscribe")}
          </Link>
          <Link
            href="/for-businesses"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {t("forBusinesses")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>

      <nav className="flex items-center justify-around border-t px-2 sm:hidden">
        {[
          { href: "/", label: t("feed"), Icon: LayoutGrid },
          { href: "/businesses", label: t("directory"), Icon: Building2 },
          { href: "/map", label: t("map"), Icon: Map },
          { href: "/subscribe", label: t("subscribe"), Icon: Mail },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-muted-foreground transition hover:text-foreground"
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  )
}
