"use client"

import Script from "next/script"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Meta Pixel for the business-owner funnel ONLY (docs/marketing/meta-growth-campaign.md).
 * Loads on /for-businesses, /partners, /signup and /dashboard — never on the pages locals browse,
 * which is what the privacy policy promises. No-op until NEXT_PUBLIC_META_PIXEL_ID (digits) is set.
 * disablePushState + autoConfig off: once loaded, the pixel must not follow the visitor onto other pages.
 *
 * Conversions are read from the URL the server already redirects to (signup, claim and payment are
 * tracked server-side in /api/track, which the browser can't see):
 *   Lead       /signup/business/profile (business signup) · /dashboard/profile?claimed=<slug> (claim)
 *   Subscribe  /dashboard/billing?success=1 · /signup/business/profile?session_id=cs_…  (Stripe paid)
 * Each conversion fires once per browser (localStorage key) so a refresh doesn't double count;
 * the Stripe session id doubles as eventID for Conversions API dedupe later.
 */
const RAW_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
const PIXEL_ID = RAW_ID && /^\d{6,20}$/.test(RAW_ID) ? RAW_ID : undefined
const FUNNEL_PREFIXES = ["/for-businesses", "/partners", "/signup", "/dashboard"]
const GROWTH_PRICE = 39.99

type Fbq = (...args: unknown[]) => void
declare global {
  interface Window {
    fbq?: Fbq
  }
}

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|es)(?=\/|$)/, "") || "/"
}

export function isFunnelPath(path: string): boolean {
  return FUNNEL_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

function once(key: string): boolean {
  try {
    const k = `ll_px_${key}`
    if (localStorage.getItem(k)) return false
    localStorage.setItem(k, "1")
  } catch {
    // storage blocked: still fire, a rare double count beats a missed conversion
  }
  return true
}

function track(fbq: Fbq, path: string, search: URLSearchParams) {
  fbq("track", "PageView")
  if (path === "/for-businesses" || path.startsWith("/for-businesses/") || path === "/partners") {
    fbq("track", "ViewContent", { content_name: path, content_category: "business_offer" })
  }
  const stripeSession = search.get("session_id")
  const paid =
    (path === "/dashboard/billing" && search.get("success") === "1") ||
    (path === "/signup/business/profile" && !!stripeSession?.startsWith("cs_"))
  if (paid) {
    const id = stripeSession ?? `billing-${new Date().toISOString().slice(0, 10)}`
    if (once(`sub_${id}`)) fbq("track", "Subscribe", { value: GROWTH_PRICE, currency: "USD", predicted_ltv: GROWTH_PRICE * 6 }, { eventID: id })
  }
  if (path === "/signup/business/profile") {
    const id = `signup-${search.get("userId") ?? "x"}`
    if (once(`lead_${id}`)) fbq("track", "Lead", { content_name: "business_signup" }, { eventID: id })
  }
  const claimed = search.get("claimed")
  if (path === "/dashboard/profile" && claimed) {
    const id = `claim-${claimed}`
    if (once(`lead_${id}`)) fbq("track", "Lead", { content_name: "business_claim" }, { eventID: id })
  }
}

export function MetaPixel() {
  const pathname = usePathname()
  const last = useRef<string | null>(null)
  const path = pathname ? stripLocale(pathname) : "/"
  const active = Boolean(PIXEL_ID) && isFunnelPath(path)

  useEffect(() => {
    if (!active) return
    const search = typeof window !== "undefined" ? window.location.search : ""
    const key = path + search
    if (last.current === key) return
    let tries = 0
    // fbq is defined synchronously by the stub below, so this normally runs on the first tick.
    const fire = () => {
      if (window.fbq) {
        last.current = key
        try {
          track(window.fbq, path, new URLSearchParams(search))
        } catch {
          // analytics must never affect the page
        }
      } else if (tries++ < 20) setTimeout(fire, 250)
    }
    fire()
  }, [active, path])

  if (!active) return null
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq.disablePushState=true;
fbq('set','autoConfig',false,'${PIXEL_ID}');
fbq('init','${PIXEL_ID}');`}
    </Script>
  )
}
