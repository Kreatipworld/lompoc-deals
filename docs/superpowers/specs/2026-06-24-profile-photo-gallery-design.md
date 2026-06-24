# Business Profile Photo Gallery — Design Spec

**Date:** 2026-06-24
**Problem:** The profile page's top is a full-bleed photo *carousel* (`components/business-photo-carousel.tsx`, `h-44 sm:h-60`, `object-cover`) that crops arbitrary Google Places photos into unflattering extreme close-ups (e.g. an eyebrow filling the whole banner). It's unappealing and hard to read as a business.
**Goal:** Replace it with a bounded, **mosaic gallery grid** (Yelp/Airbnb pattern) that makes even mediocre Google photos look intentional, plus a **lightbox** that shows each photo *whole* (never cropped) where it actually matters.

---

## Decision (from brainstorming)

- **Direction A — gallery grid**, composition **A1 — Mosaic**: a large lead photo + a 2×2 thumbnail cluster, the last visible tile showing a "+N · View all" overlay that opens a lightbox.
- The grid lives **within the page's bounded content width** (`max-w-6xl`, matching the info card) — no more full-bleed band.
- **Thumbnails crop (`object-cover`)** — acceptable because they're small previews. **The lightbox shows the whole photo (`object-contain`) over a blurred copy of itself** — so the place people actually look never crops, and odd/tall shots look deliberate.

## Adaptive states (photo count drives layout)

The gallery is built from the existing `photos: string[]` array (page.tsx lines 109–116: `photosJson` → else `[coverUrl]` → else `[]`). A pure helper plans the layout:

| Photos | Layout |
|---|---|
| **0** | A branded banner (cream→lavender gradient) with the business logo centered — looks deliberate, not broken. Replaces today's bare `h-24` gradient. |
| **1** | A single framed image at a fixed ratio (no stretched band). Click → lightbox. |
| **2–4** | Mosaic using the available tiles (lead + up to 4 thumbs); no overflow badge. |
| **5+** | Full mosaic (lead + 4 thumbs); the 4th thumb shows a `+{N} · View all` overlay. |

Mobile: the mosaic collapses to a full-width lead photo (fixed ratio) + a horizontal row of small thumbnails beneath; the last thumb still shows `+{N}`.

## Components

### `lib/gallery.ts` — `planGallery(photos, maxThumbs = 4)` (pure, unit-tested)
Returns the tile plan so layout logic is testable without a DOM:
```ts
type GalleryPlan = {
  lead: string | null          // first photo, or null when empty
  thumbs: string[]             // up to maxThumbs photos after the lead
  overflow: number             // count hidden behind the "+N" tile (>= 0)
  total: number
}
export function planGallery(photos: string[], maxThumbs?: number): GalleryPlan
```
Rules: empty → `{lead:null, thumbs:[], overflow:0, total:0}`. `overflow = max(0, total - 1 - thumbs.length)`. The `+N` overlay shows only when `overflow > 0`.

### `components/business-photo-gallery.tsx` (client) — replaces `business-photo-carousel.tsx`
- Renders the mosaic from `planGallery(photos)`.
- Props: `{ photos: string[]; businessName: string; logoUrl: string | null }`. Strings come from `useTranslations("businesses.profile")` **inside** this client component (the app already uses `useTranslations` in client components, e.g. the deal form) — no labels prop.
- Thumbnails: `SafeImage` + `object-cover`, rounded tiles, subtle hover scale (reuse existing transition style).
- Clicking any tile (or the `+N` tile) opens the lightbox at that index.
- Empty state (0 photos) renders the branded banner with the logo instead of the grid.
- Keyboard/focus: tiles are real `<button>`s with `aria-label`.

### Lightbox (in the same file or `components/photo-lightbox.tsx`, client)
- Full-screen `role="dialog"` `aria-modal="true"` overlay; dark scrim.
- Current photo: `object-contain`, centered, over a **blurred, scaled copy of the same image** as backdrop (`filter: blur` + `scale`), so letterbox gaps look intentional.
- Controls: prev/next buttons, **←/→ arrow keys**, **Esc to close**, swipe on touch, a `{current} of {total}` counter, and a close button. Focus is trapped; body scroll locked while open; focus returns to the originating tile on close.
- Single photo: no prev/next, just the contained image + close.

## Page integration — `app/[locale]/(public)/biz/[slug]/page.tsx`
- Replace the `BusinessPhotoCarousel` block **and** the `else` gradient placeholder (lines 119–127) with a single `<BusinessPhotoGallery photos={photos} businessName={business.name} logoUrl={business.logoUrl} labels={…} />` inside a `max-w-6xl` wrapper (the gallery owns its own empty state).
- The info card no longer overlaps a full-bleed band: drop the `-mt-10 sm:-mt-14` negative margin (lines ~140) and let the card sit in normal flow below the gallery with the existing logo at its top-left. (The logo stays in the card; it no longer needs to straddle the banner.)
- Everything below (breadcrumb, name, chips, claim CTA, deals, map) is unchanged.

## i18n (new keys, BOTH `messages/en.json` + `es.json`, under `businesses.profile`)
- `photosViewAll`: "View all" / "Ver todas"
- `photosCount`: "{count} photos" / "{count} fotos"
- `photoCounter`: "{current} of {total}" / "{current} de {total}"
- `photoPrev`: "Previous photo" / "Foto anterior"
- `photoNext`: "Next photo" / "Foto siguiente"
- `photoClose`: "Close" / "Cerrar"
- `photoOpenAria`: "Open photo {n}" / "Abrir foto {n}"

## Styling (within existing tokens)
Cream `#FAF7F2` page, white cards, purple `#7B4F9E` primary, lavender accent. Tiles `rounded-2xl`; gallery block matches card radius. Reuse `SafeImage`, existing hover transition, and the chip/badge patterns. Lead tile ratio ~4:3 on desktop within the mosaic; mobile lead ~16:9.

## Testing
- **Unit (`lib/gallery.test.ts`, `tsx` + `node:assert/strict`):** `planGallery` across 0, 1, 2, 4, 5, 9 photos — asserts `lead`, `thumbs.length`, `overflow`, and that `+N` only appears for `total > 5`.
- **Build:** `npx next build` compiles the new client component.
- **Manual / visual:** drive the running app (temporarily point a business at a 1-photo, multi-photo, and 0-photo case) — confirm mosaic, lightbox whole-photo + blur backdrop, keyboard nav, Esc, mobile collapse, and the branded empty state.

## Out of scope (YAGNI)
- Owner photo upload/reordering UI (separate dashboard feature).
- Re-scraping or re-cropping stored Google photos.
- Zoom/pan within the lightbox (contain + blur backdrop is enough).
- Video, captions, or alt-text per photo (Google photos carry none).

## Files touched
- Create `lib/gallery.ts`, `lib/gallery.test.ts`.
- Create `components/business-photo-gallery.tsx` (+ optional `components/photo-lightbox.tsx`).
- Modify `app/[locale]/(public)/biz/[slug]/page.tsx` (swap component, drop overlap margin).
- Delete `components/business-photo-carousel.tsx` once no longer referenced (grep first).
- Modify `messages/en.json`, `messages/es.json`.
