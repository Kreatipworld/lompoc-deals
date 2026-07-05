# /hotels Trip-Planner Redesign — Design Spec

*Date: 2026-07-05 · Approved by: Andres*

## Goal

Reinvent `/hotels` as a "plan your Lompoc stay" page: hotels immediately after the map, activities at the end, one deduplicated filterable hotel grid, and hooks that pull visitors into the rest of the platform.

## Current defects driving this

- The hotel list renders TWICE: `HotelsFilterGrid` (client component with working price/amenity chips but photo-less gradient cards, a dead wishlist button, and off-brand `sage`/`terracotta` classes) plus a second static photo grid in `page.tsx` that the filters don't affect.
- Section order buries hotels below activities; user wants hotels after the map, activities last.
- Map hero is 60–65vh — inconsistent with the new compact style.
- "About Lompoc" blocks are dead text with no links.

## New section order

1. **Map header** — interactive `HotelsMap` with pins, trimmed to `h-[45vh] min-h-[360px]`; keep title/pill/stat overlays.
2. **Hotels** — single grid: the photo-rich `HotelCard` design from page.tsx, driven by the existing filter chips (price $ / $$ / $$$, amenities pool/breakfast/wifi/parking/pets). Client component (filters need state). Each card adds a "‹X› mi to downtown" chip computed with a haversine helper from hotel lat/lng to downtown Lompoc (H St & Ocean Ave: 34.6392, -120.4579), formatted one decimal, i18n'd ("{miles} mi to downtown" / "a {miles} mi del centro"). Delete the duplicate gradient-card grid, the fake wishlist button, and all `sage-*`/`brand-terracotta` classes. Empty state when no hotels match, with a "clear filters" action.
3. **Why Lompoc** — the three existing blocks (wine/space/flowers), tightened, each now a link: wine → `/category/wineries`, space → `/activities` (space-related), flowers → `/activities`. Reuse existing `about*` i18n copy.
4. **Local-deals hook** — one quiet band: "In town this week? See what's on special" → `/deals`, plus a secondary link to `/subscribe`. New i18n keys in `hotels` namespace (EN + ES).
5. **While you're here** — the featured-activities cards (existing `ActivityCard` + DB query) move here, heading reworded to a "while you're here" frame (reuse `thingsToDoHeading` or add a key if the copy needs the new frame).
6. **Activity ticker** — stays last.

## Constraints

- All copy through next-intl, EN/ES parity; brand tokens only (no sage/terracotta/hex).
- `HOTELS` static data source unchanged; `/hotels/[slug]` detail pages untouched.
- No new dependencies. Verification: tsc + lint clean, manual smoke on `/en/hotels` and `/es/hotels`.

## Error handling

- Activities DB failure: section hides (existing try/catch behavior kept).
- Filters with zero matches: friendly empty state, never a blank area.
