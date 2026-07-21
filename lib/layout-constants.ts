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

/**
 * Single container width + horizontal gutter for every content page.
 *
 * Chosen because `max-w-6xl` is already the most common width in the
 * codebase (businesses directory, feed, and most `deals` sections all use
 * it) and it's wide enough for 3-column card grids without feeling
 * cavernous on narrower content. Pages previously ranged from `max-w-3xl`
 * to `max-w-7xl`; this is the convergence point every page adopts so
 * column edges line up when navigating between them.
 */
export const PAGE_CONTAINER = "mx-auto max-w-6xl px-4"
