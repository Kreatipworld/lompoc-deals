import { auth } from "@/auth"
import createMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"
import { NextResponse } from "next/server"
import {
  CAMPAIGN_COOKIE,
  CAMPAIGN_MAX_AGE,
  campaignFromParams,
  encodeCampaign,
} from "@/lib/analytics/campaign"

const intlMiddleware = createMiddleware(routing)

const protectedPaths = ["/dashboard", "/admin"]

const SESSION_COOKIE = "lompoc_sid"
const SESSION_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * Record how someone arrived, once, on their first tagged visit.
 *
 * Written here rather than in a page because middleware sees every entry point — a business page,
 * a deal, the map — and a campaign link can land on any of them. track() then folds this into the
 * props of every event, which is what makes "this post produced that claim" answerable.
 *
 * First touch wins: skipped entirely when the cookie already exists.
 */
function ensureCampaignCookie(req: Parameters<Parameters<typeof auth>[0]>[0], res: Response): Response {
  if (!(res instanceof NextResponse)) return res
  if (req.cookies.get(CAMPAIGN_COOKIE)) return res
  const campaign = campaignFromParams(req.nextUrl.searchParams)
  if (!campaign) return res
  res.cookies.set({
    name: CAMPAIGN_COOKIE,
    value: encodeCampaign(campaign),
    maxAge: CAMPAIGN_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return res
}

function ensureSessionCookie(req: Parameters<Parameters<typeof auth>[0]>[0], res: Response): Response {
  if (req.headers.get("cookie")?.includes(`${SESSION_COOKIE}=`)) return res
  const sid = crypto.randomUUID()
  if (res instanceof NextResponse) {
    res.cookies.set({
      name: SESSION_COOKIE,
      value: sid,
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
    return res
  }
  // For Response.redirect (used in protected-path bouncing), wrap with NextResponse to attach a cookie.
  const wrapped = NextResponse.redirect(res.headers.get("location") ?? "/", res.status)
  wrapped.cookies.set({
    name: SESSION_COOKIE,
    value: sid,
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return wrapped
}

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl

  // Legacy production host → canonical domain (exact match only, so preview
  // *.vercel.app deployments are untouched). Read the Host header — Auth.js
  // rewrites req.nextUrl's origin to AUTH_URL, so nextUrl can't be trusted here.
  if (req.headers.get("host") === "lompoc-deals.vercel.app") {
    return NextResponse.redirect(
      new URL(pathname + req.nextUrl.search, "https://www.lompoclocals.com"),
      308
    )
  }

  // Skip intl middleware for API routes — they have no locale prefix
  if (pathname.startsWith("/api")) {
    const apiPassthrough = NextResponse.next()
    return ensureSessionCookie(req, apiPassthrough)
  }

  // Tolerate legacy /en/* and /es/* URLs that may be cached or bookmarked.
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)(\/|$)/, "/") || "/"

  const isProtected = protectedPaths.some((p) => pathnameWithoutLocale.startsWith(p))

  const intlResponse = intlMiddleware(req)

  if (isProtected) {
    const role = req.auth?.user?.role

    if (pathnameWithoutLocale.startsWith("/dashboard") && role !== "business") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("from", pathnameWithoutLocale)
      return ensureSessionCookie(req, Response.redirect(url))
    }

    if (pathnameWithoutLocale.startsWith("/admin") && role !== "admin") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("from", pathnameWithoutLocale)
      return ensureSessionCookie(req, Response.redirect(url))
    }
  }

  return ensureCampaignCookie(req, ensureSessionCookie(req, intlResponse))
})

export const config = {
  matcher: [
    // Match all paths except internals, static files, and the extensionless
    // metadata image routes (opengraph-image / twitter-image), which must be
    // served directly instead of being locale-rewritten by the intl middleware.
    "/((?!_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)",
  ],
}
