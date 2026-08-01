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
    try {
      track(action, {
        slug,
        ...(category ? { category } : {}),
        ...(detail ? { detail } : {}),
      })
    } catch {
      // Analytics must never break a link. If tracking throws — blocked script, offline — the
      // click still navigates, which is the part that matters to the person clicking.
    }
  }

  return (
    <a href={href} target={target} rel={rel} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  )
}
