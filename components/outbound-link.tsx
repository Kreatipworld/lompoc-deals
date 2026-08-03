"use client"

import { track } from "@vercel/analytics"
import type { ReactNode } from "react"

/**
 * A link that records where someone went when they left us.
 *
 * Pageviews already tell us which listings get looked at. They do not tell us whether a listing
 * did its job — whether anyone actually called the shop, asked for directions, or opened its
 * website. Those are the only events on a directory that mean a real-world visit, and they were
 * invisible.
 *
 * Each action gets its own event name rather than one "outbound" event with an action property,
 * because property-level breakdowns depend on the analytics plan while distinct event names show
 * up regardless. The business slug rides along so a winning listing can be identified, not just a
 * winning action.
 *
 * `track()` is a no-op in development and when the visitor blocks analytics, so this never
 * interferes with the navigation itself — the href does its normal work either way.
 *
 * The same click is also written to our own `analytics_events`. Vercel's dashboard answers "how is
 * the site doing"; only our table can answer "how did MY listing do", which is the question a
 * business owner actually pays for. It goes out via `sendBeacon` because the click is navigating
 * away and an ordinary fetch would be cancelled mid-flight — losing exactly the events that matter.
 */
export type OutboundAction =
  | "website_click"
  | "phone_click"
  | "directions_click"
  | "map_click"
  | "social_click"
  | "reviews_click"

export function OutboundLink({
  action,
  slug,
  businessId,
  category,
  href,
  children,
  className,
  target,
  rel,
  ariaLabel,
  detail,
}: {
  action: OutboundAction
  /** Which listing sent them — so we can see which pages actually convert. */
  slug: string
  /** Lets a click be counted per business without a slug lookup, for the owner-facing numbers. */
  businessId?: number
  category?: string | null
  href: string
  children: ReactNode
  className?: string
  target?: string
  rel?: string
  ariaLabel?: string
  /** Which network, for social links. */
  detail?: string
}) {
  const onClick = () => {
    const props = {
      slug,
      ...(category ? { category } : {}),
      ...(detail ? { detail } : {}),
    }
    try {
      track(action, props)
    } catch {
      // Analytics must never break a link. If tracking throws — blocked script, offline — the
      // click still navigates, which is the part that matters to the person clicking.
    }
    try {
      const body = JSON.stringify({
        name: action,
        ...(businessId ? { targetType: "business", targetId: businessId } : {}),
        props,
      })
      // sendBeacon survives the navigation; fetch(keepalive) is the fallback for browsers without
      // it. Both are fire-and-forget — we never wait, and never block the link.
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track/event", new Blob([body], { type: "application/json" }))
      } else {
        void fetch("/api/track/event", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Same contract as above: a listing that cannot be measured is still a listing that works.
    }
  }

  return (
    <a href={href} target={target} rel={rel} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  )
}
