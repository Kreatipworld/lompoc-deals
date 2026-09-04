import { NextResponse } from "next/server"
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
import { getViewer } from "@/lib/viewer"

export const dynamic = "force-dynamic"

/**
 * Page-view beacon for every public page that is not a business page.
 *
 * Business pages already fire `business_page_viewed` on the server. Everything else (home, events,
 * news, blog, deals, map, …) was invisible to analytics, so a post pointing at /events produced no
 * measurable traffic. The client component `components/analytics/page-view.tsx` posts here on each
 * navigation. Because it runs in the browser, crawlers that never execute JS are excluded for free,
 * and track()'s UA filter still drops the ones that do.
 *
 * Kept deliberately narrow: only `page_viewed`, only pathnames, always 204.
 */
const EXCLUDED_PREFIXES = ["/biz/", "/api", "/dashboard", "/admin", "/login", "/signup", "/_next"]

function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 300 || !raw.startsWith("/")) return null
  const pathname = raw.split("?")[0].split("#")[0]
  const stripped = pathname.replace(/^\/(en|es)(?=\/|$)/, "") || "/"
  if (EXCLUDED_PREFIXES.some((p) => stripped === p.replace(/\/$/, "") || stripped.startsWith(p))) return null
  return stripped
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { name?: unknown; path?: unknown; locale?: unknown; referrer?: unknown }
      | null
    if (!body || body.name !== "page_viewed") return new NextResponse(null, { status: 204 })
    const path = cleanPath(body.path)
    if (!path) return new NextResponse(null, { status: 204 })
    const locale: "en" | "es" = body.locale === "es" ? "es" : "en"
    const referrer =
      typeof body.referrer === "string" && body.referrer.length > 0 ? body.referrer.slice(0, 500) : undefined

    let userId: number | null = null
    try {
      userId = (await getViewer()).userId ?? null
    } catch {
      userId = null
    }

    await track("page_viewed", {
      userId,
      sessionId: getSessionId(),
      props: referrer ? { path, locale, referrer } : { path, locale },
    })
  } catch {
    // best-effort: analytics must never surface an error to a visitor
  }
  return new NextResponse(null, { status: 204 })
}
