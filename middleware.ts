import createMiddleware from "next-intl/middleware"
import { getToken } from "next-auth/jwt"
import { routing } from "@/i18n/routing"
import type { NextRequest } from "next/server"

const intlMiddleware = createMiddleware(routing)

// Paths that require auth checks. With localePrefix: "never" the URLs no
// longer have /en or /es prefixes, so we match against the raw pathname.
const protectedPaths = ["/dashboard", "/admin"]

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Also tolerate legacy /en/* and /es/* URLs that may be cached or
  // bookmarked. Strip the prefix so the auth check still works.
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)(\/|$)/, "/") || "/"

  const isProtected = protectedPaths.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  )

  const intlResponse = intlMiddleware(req)

  if (isProtected) {
    // Use getToken to directly decode the JWT — avoids the auth(req) pattern
    // which returns a Response (from handleAuth) rather than the session data.
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    })
    const role = token?.role as string | undefined

    if (pathnameWithoutLocale.startsWith("/dashboard") && role !== "business") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("from", pathnameWithoutLocale)
      return Response.redirect(url)
    }

    if (pathnameWithoutLocale.startsWith("/admin") && role !== "admin") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("from", pathnameWithoutLocale)
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
