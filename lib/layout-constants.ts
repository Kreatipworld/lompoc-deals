/**
 * Layout constants shared between Server and Client Components.
 *
 * These deliberately live outside any `"use client"` module: when a Server
 * Component imports a plain value from a client module, Next wraps it in a
 * client-reference object, so interpolating it renders `[object Object]`
 * instead of the value. TypeScript still types it as a string, so the bug is
 * invisible to `tsc` and only shows up in the rendered HTML.
 */

/**
 * Bottom padding that keeps page content clear of the two fixed mobile
 * elements: the bottom nav (`h-16`, `sm:hidden`) and the chat FAB above it,
 * whose top edge sits at 120px (`bottom-[4.5rem]` + a 48px button).
 *
 * Sized to the FAB rather than the nav — the nav alone (64px) is not enough,
 * which is why cards were being covered. Collapses to nothing at `sm:`, where
 * the nav is hidden and the FAB moves to `sm:bottom-6`.
 */
export const MOBILE_BOTTOM_CLEARANCE = "pb-[7.5rem] sm:pb-0"
