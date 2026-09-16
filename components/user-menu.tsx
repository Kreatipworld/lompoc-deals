"use client"

import { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { UserCircle } from "lucide-react"
import { logoutAction } from "@/lib/auth-actions"

/**
 * Header user menu. Client-side on purpose: reading the session on the server
 * here made every page dynamic (see app/api/me/route.ts). Renders "Sign in"
 * until /api/me answers, then the account menu for signed-in people.
 */
type Me = { email: string | null; role: string } | null

export function UserMenu() {
  const t = useTranslations("userMenu")
  const [me, setMe] = useState<Me | undefined>(undefined)

  useEffect(() => {
    let alive = true
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: Me }) => { if (alive) setMe(d.user) })
      .catch(() => { if (alive) setMe(null) })
    return () => { alive = false }
  }, [])

  if (!me) {
    return (
      <Link href="/login" className="text-sm hover:underline" data-user-menu={me === undefined ? "loading" : "signed-out"}>
        {t("signIn")}
      </Link>
    )
  }

  const { email, role } = me
  return (
    <details className="relative" data-user-menu="signed-in">
      <summary className="cursor-pointer list-none rounded-md border px-3 py-1 text-sm hover:bg-accent">
        <UserCircle className="h-4 w-4 sm:hidden" aria-label={t("account")} />
        <span className="hidden sm:inline">{email}</span>
      </summary>
      <div className="user-menu-dropdown absolute right-0 z-50 mt-1 w-56 rounded-md border bg-background py-1 shadow-lg">
        <div className="hidden px-3 py-1.5 text-xs text-muted-foreground sm:block">
          {email} · {role}
        </div>
        <div className="my-1 hidden border-t sm:block" />
        {role === "business" && (
          <Link href="/dashboard/profile" className="block px-3 py-1.5 text-sm hover:bg-accent">
            {t("dashboard")}
          </Link>
        )}
        {role === "admin" && (
          <Link href="/admin" className="block px-3 py-1.5 text-sm hover:bg-accent">
            {t("admin")}
          </Link>
        )}
        {role === "local" && (
          <Link href="/account" className="block px-3 py-1.5 text-sm hover:bg-accent">
            {t("dashboard")}
          </Link>
        )}
        <div className="my-1 border-t" />
        <form action={logoutAction}>
          <button type="submit" className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent">
            {t("signOut")}
          </button>
        </form>
      </div>
    </details>
  )
}
