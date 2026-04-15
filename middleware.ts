import { auth } from "@/auth"
import createMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

const intlMiddleware = createMiddleware(routing)

// Paths that require auth checks. With localePrefix: "never" the URLs no
// longer have /en or /es prefixes, so we match against the raw pathname.
const protectedPaths = ["/dashboard", "/admin"]

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl

  // Skip intl middleware for API routes — they have no locale prefix
  if (pathname.startsWith("/api")) {
    return
  }

  // Also tolerate legacy /en/* and /es/* URLs that may be cached or
  // bookmarked. Strip the prefix so the auth check still works.
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)(\/|$)/, "/") || "/"

  const isProtected = protectedPaths.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  )

  const intlResponse = intlMiddleware(req)

  if (isProtected) {
    // Use req.auth from the NextAuth v5 session — avoids getToken() which
    // does not correctly decode NextAuth v5 JWTs in Edge middleware.
    const role = req.auth?.user?.role

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
})

export const config = {
  matcher: [
    // Match all paths except internals and static files
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
}
