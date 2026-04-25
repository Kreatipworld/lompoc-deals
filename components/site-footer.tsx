import { Link } from "@/i18n/navigation"
import { Flower2 } from "lucide-react"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { getTranslations } from "next-intl/server"

export async function SiteFooter() {
  const t = await getTranslations("footer")
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Flower2 className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                Lompoc Deals
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              {t("browse")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  {t("latestDeals")}
                </Link>
              </li>
              <li>
                <Link href="/businesses" className="hover:text-foreground">
                  {t("businessDirectory")}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-foreground">
                  {t("mapView")}
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground">
                  {t("search")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/food-drink"
                  className="hover:text-foreground"
                >
                  {t("foodDrink")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              {t("forBusinesses")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/for-businesses" className="hover:text-foreground">
                  {t("whyList")}
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground">
                  {t("listYourBusiness")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  {t("signIn")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/profile"
                  className="hover:text-foreground"
                >
                  {t("dashboard")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              {t("forLocals")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/locals" className="hover:text-foreground">
                  {t("whyJoin")}
                </Link>
              </li>
              <li>
                <Link href="/signup/user" className="hover:text-foreground">
                  {t("joinFree")}
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="hover:text-foreground">
                  {t("weeklyDigest")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t("copyright", { year })}</p>
          <LocaleSwitcher />
          <p>{t("madeWith")}</p>
        </div>
      </div>
    </footer>
  )
}
