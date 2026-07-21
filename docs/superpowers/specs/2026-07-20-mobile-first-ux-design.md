# Mobile-First UX Pass — Design

**Date:** 2026-07-20
**Status:** Approved design, ready for implementation planning

## Goal

Make the browse experience work on a phone. ~95% of visitors are on mobile, and the current
layout spends most of the first screen on chrome — filters, headings, and a floating chat button
— before showing a single business.

## Measured diagnosis

From the live Food & Drink category page on a phone:

| Problem | Cause | Evidence |
|---|---|---|
| Category filters occupy 4 rows (~180px) | `components/category-chips.tsx` uses `flex-wrap`, so 9 categories wrap | 9 chips × ~44px rows |
| "Open now" floats orphaned to the right | It is rendered in `category/[slug]/page.tsx`, separate from `CategoryChips`, so it never joins the chip flow | visible misalignment |
| Section headers are tall | eyebrow ("FEATURED MEMBERS") + H2 + subtitle stacked, at desktop sizes | ~110px per section |
| Chat button covers card content | `fixed bottom-[4.5rem] right-3` with no compensating page padding | overlaps the third card |
| **Chat button is off-brand** | `components/ai-chat-widget.tsx:13` hardcodes `brand: "#4F46E5"` — **indigo**, never migrated during the rebrand | brand purple is `#650C75` |

**Net effect:** the first business card sits roughly 600px down. On a typical phone viewport
(~650px of usable height) a visitor sees almost no content before scrolling.

## Principles

1. **Content before chrome.** Filters and headings must not consume the first screen. Target: at
   least one business card visible without scrolling on a 390×844 viewport.
2. **Filters scroll sideways, not down.** Horizontal space is cheap on a phone; vertical is not.
3. **Nothing floats over content.** If an element is fixed, the page reserves space for it.
4. **One brand.** No component carries a colour from before the rebrand.
5. **Desktop must not regress.** Every change is mobile-first with the desktop treatment preserved
   at `sm:`/`md:` breakpoints.

## Scope

**In:** category pages, homepage, `/businesses`, `/feed`, the chat button, and the bottom nav.
**Out:** dashboard and admin (primarily desktop use), business profiles, deals, events, map,
activities, hotels — a later pass if this direction lands.

## Changes

### 1. Category filters → single scrolling row
Replace `flex-wrap` in `components/category-chips.tsx` with a horizontal scroll row using the
existing `.scrollbar-none` utility and scroll-snap, mirroring the `/this-week` edition gallery.

- The **active** chip scrolls into view on load, so a visitor on a category page can see where
  they are without hunting.
- **"Open now" moves into the same row as the first item**, so all filtering reads as one
  control instead of two competing ones.
- Chips keep a minimum 44px touch target.
- On `sm:` and wider, the row may wrap as it does today — there is room there.

### 2. Section headers collapse on mobile
The eyebrow / title / subtitle stack becomes a single compact line on mobile: title at a smaller
size, eyebrow and subtitle hidden below `sm:`. The full editorial treatment stays on desktop.

Applies to the featured/section headers on the homepage, category pages, and `/businesses`.

### 3. Chat button: on-brand and out of the way
- Colour changes from `#4F46E5` to the brand purple `#650C75`, with the gold `#EFC618` reserved
  for the unread/active dot. Values come from the existing CSS tokens rather than new hardcoded
  hex where practical.
- Smaller on mobile (48px) than desktop (56px).
- Pages in scope gain bottom padding equal to the bottom nav + FAB clearance, so **no card is
  ever underneath it**.
- Keeps its current position above the bottom nav.

### 4. Bottom nav alignment
Bring the bottom nav in line with the same brand tokens (active state uses brand purple), and
ensure its height is the single source of truth for the page bottom-padding described above,
rather than a magic number repeated per page.

## Non-goals

- No redesign of the card components themselves — this pass is about layout density and
  hierarchy, not restyling every card.
- No new navigation model (no hamburger restructure, no new tabs).
- No change to what data each page shows — purely presentation.
- No dark-mode overhaul, though changes must not break dark mode.

## Success criteria

- On a 390×844 viewport, **at least one business card is visible without scrolling** on the
  category page, homepage, and `/businesses`.
- Category filters occupy **one row**, horizontally scrollable, with the active chip in view.
- "Open now" sits inside the filter row, not floating separately.
- **No fixed element overlaps content** on any in-scope page at 390px wide.
- The chat button renders in brand purple; **no `#4F46E5` remains** in the codebase.
- Desktop layouts at `sm:` and above are visually unchanged from today.
- Both locales still render correctly (Spanish strings are longer — the scrolling row must
  handle them without breaking).
