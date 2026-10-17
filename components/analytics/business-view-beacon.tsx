"use client"

import { useEffect, useRef } from "react"
import { useLocale } from "next-intl"

/**
 * Counts a business page view from the browser (Oct 17 2026). The server used to
 * do it inside the page, reading cookies and the Referer header — which made every
 * /biz page a per-visit render. Posts `business_page_viewed` (plus the deal ids
 * shown, for their view counts) to /api/track once per mount. Renders nothing.
 */
export function BusinessViewBeacon({ businessId, dealIds }: { businessId: number; dealIds: number[] }) {
  const locale = useLocale()
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    const payload = JSON.stringify({
      name: "business_page_viewed",
      businessId,
      dealIds: dealIds.slice(0, 50),
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
      // ignore — analytics must not affect the page
    }
  }, [businessId, dealIds, locale])

  return null
}
