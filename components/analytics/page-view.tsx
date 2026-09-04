"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"

/** Paths the server already tracks or that are not public surfaces. Mirrors app/api/track/route.ts. */
const EXCLUDED_PREFIXES = ["/biz/", "/api", "/dashboard", "/admin", "/login", "/signup", "/_next"]

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|es)(?=\/|$)/, "") || "/"
}

/**
 * Fires one `page_viewed` beacon per client-side navigation. Mounted once in the locale layout.
 * Renders nothing. Dedupes consecutive identical paths (React strict-mode double effects, hash
 * changes) and never throws — analytics must not affect the page.
 */
export function PageView() {
  const pathname = usePathname()
  const locale = useLocale()
  const last = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    const path = stripLocale(pathname)
    if (EXCLUDED_PREFIXES.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p))) return
    if (last.current === path) return
    last.current = path

    const payload = JSON.stringify({
      name: "page_viewed",
      path,
      locale: locale === "es" ? "es" : "en",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    })
    try {
      const blob = new Blob([payload], { type: "application/json" })
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/track", blob)) {
        return
      }
      void fetch("/api/track", { method: "POST", body: payload, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {})
    } catch {
      // ignore
    }
  }, [pathname, locale])

  return null
}
