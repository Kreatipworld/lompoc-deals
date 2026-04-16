import { Link } from "@/i18n/navigation"
import { auth } from "@/auth"
import { logoutAction } from "@/lib/auth-actions"
import { getTranslations } from "next-intl/server"
import { UserCircle } from "lucide-react"

export async function UserMenu() {
  const [session, t] = await Promise.all([auth(), getTranslations("userMenu")])

  if (!session?.user) {
    return (
      <Link href="/login" className="text-sm hover:underline">
        {t("signIn")}
      </Link>
    )
  }

  const { email, role } = session.user

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border px-3 py-1 text-sm hover:bg-accent">
        {/* Mobile: show icon only; desktop: show email */}
        <UserCircle className="h-4 w-4 sm:hidden" aria-label={t("account")} />
        <span className="hidden sm:inline">{email}</span>
      </summary>
      <div className="user-menu-dropdown absolute right-0 z-50 mt-1 w-56 rounded-md border bg-background py-1 shadow-lg">
        <div className="hidden px-3 py-1.5 text-xs text-muted-foreground sm:block">
          {email} · {role}
        </div>
        <div className="my-1 hidden border-t sm:block" />
        {role === "business" && (
          <Link
            href="/dashboard/profile"
            className="block px-3 py-1.5 text-sm hover:bg-accent"
          >
            {t("dashboard")}
          </Link>
        )}
        {role === "admin" && (
          <Link
            href="/admin"
            className="block px-3 py-1.5 text-sm hover:bg-accent"
          >
            {t("admin")}
          </Link>
        )}
        {role === "local" && (
          <Link
            href="/account"
            className="block px-3 py-1.5 text-sm hover:bg-accent"
          >
            {t("dashboard")}
          </Link>
        )}
        <div className="my-1 border-t" />
        <form action={logoutAction}>
          <button
            type="submit"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
    </details>
  )
}
