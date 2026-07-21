import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { safeInternalPath } from "@/lib/safe-redirect"
import { getTranslations } from "next-intl/server"
import { LoginForm } from "./login-form"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" })
  return {
    title: t("login.metaTitle"),
    description: t("login.metaDescription"),
  }
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { from?: string; reset?: string }
}) {
  const session = await auth()
  if (session?.user) {
    const role = session.user.role as string
    const from = searchParams.from ?? null
    let destination: string
    // `from` is attacker-controlled — validate it is an internal path before use,
    // otherwise ?from=https://evil.com would redirect the user straight off-site.
    const safeFrom = safeInternalPath(from)
    if (safeFrom && safeFrom.startsWith("/dashboard") && role === "business") {
      destination = safeFrom
    } else if (safeFrom && safeFrom.startsWith("/admin") && role === "admin") {
      destination = safeFrom
    } else if (safeFrom && !safeFrom.startsWith("/dashboard") && !safeFrom.startsWith("/admin")) {
      destination = safeFrom
    } else if (role === "business") {
      destination = "/dashboard"
    } else if (role === "admin") {
      destination = "/admin"
    } else {
      destination = "/account"
    }
    redirect(destination)
  }

  const t = await getTranslations({ locale: params.locale, namespace: "auth" })

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("login.heading")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("login.subheading")}
        </p>
      </div>
      {searchParams.reset === "1" && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm text-green-800">
          {t("login.passwordResetBanner")}
        </p>
      )}
      <div className="mt-8">
        <LoginForm from={searchParams.from} />
      </div>
    </>
  )
}
