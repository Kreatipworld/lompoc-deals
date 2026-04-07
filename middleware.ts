import createMiddleware from "next-intl/middleware"
import { auth } from "@/auth"
import { routing } from "@/i18n/routing"
import type { NextRequest } from "next/server"

const intlMiddleware = createMiddleware(routing)

// Paths that require auth checks (without locale prefix)
const protectedPaths = ["/dashboard", "/admin"]

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Strip locale prefix to check underlying path
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/"

  const isProtected = protectedPaths.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  )

  // Run i18n routing first (locale detection + redirect)
  const intlResponse = intlMiddleware(req)

  if (isProtected) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (auth as any)(req as any)
    const role = session?.auth?.user?.role ?? session?.user?.role

    if (pathnameWithoutLocale.startsWith("/dashboard") && role !== "business") {
      const url = req.nextUrl.clone()
      const locale = pathname.match(/^\/(en|es)/)?.[1] ?? "en"
      url.pathname = `/${locale}/login`
      url.searchParams.set("from", pathname)
      return Response.redirect(url)
    }

    if (pathnameWithoutLocale.startsWith("/admin") && role !== "admin") {
      const url = req.nextUrl.clone()
      const locale = pathname.match(/^\/(en|es)/)?.[1] ?? "en"
      url.pathname = `/${locale}/login`
      url.searchParams.set("from", pathname)
      return Response.redirect(url)
    }
  }

  return intlResponse
}

export const config = {
  matcher: [
    // Match all paths except internals and static files
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
}
