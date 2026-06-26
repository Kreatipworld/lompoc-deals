# Business Card Photo Fallback — Design Spec

**Date:** 2026-06-25
**Branch:** `feat/business-card-photo-fallback` off `main`

## Goal

Make directory business cards feel like a real directory instead of a wall of generic icons. Each card shows the business **logo** when available; when there's no logo, it falls back to a **scraped/uploaded photo** (Google cover or gallery photo); only when neither exists does it show the generic icon.

## Background / current state

Three card surfaces render a small avatar (logo or icon) for each business, all fed by the shared `DirectoryBusiness` type (`lib/queries.ts`):

| Surface | File / card block | Query | Current fallback icon | Avatar size |
|---|---|---|---|---|
| Homepage featured grid | `app/[locale]/(public)/page.tsx` (~line 217) | `getFeaturedBusinesses` | `Building2` | `h-14 w-14` (56px) |
| Browse all | `app/[locale]/(public)/businesses/page.tsx` (~line 268) | `getDirectoryBusinesses` | `Flower2` | `h-12 w-12` (48px) |
| Category page | `app/[locale]/(public)/category/[slug]/page.tsx` (~line 212) | `getBusinessesByCategorySlug` | `Flower2` | `h-12 w-12` (48px) |

`DirectoryBusiness` (lib/queries.ts:171) currently selects `logoUrl` but not the scraped images. The `businesses` table has `coverUrl` (varchar) and `photosJson` (jsonb array) — populated by the Google Places scraper and/or owner uploads. The profile page already establishes the photo priority **`photosJson` first, then `coverUrl`** (`app/[locale]/(public)/biz/[slug]/page.tsx`).

All three cards already use the `SafeImage` primitive (`@/components/safe-image`), which renders a `fallback` node if the image fails to load.

## Decisions

- **Fallback chain (per card):** `logoUrl` → scraped photo → generic icon. Logo always wins when present.
- **Scraped photo source:** `coalesce(photos_json->>0, cover_url)` — gallery lead photo first, then cover. Mirrors the profile page's existing priority. A real photo regardless of whether it came from Google or an owner upload.
- **Display treatment:** the photo fills the **same square** the logo uses (`object-cover`), not a larger banner. Storefront photos crop to the avatar — small but real.
- **DRY via a shared component:** extract the three-way fallback into one `BusinessAvatar` component used by all three cards, rather than triplicating nested-image markup.
- **Each card keeps its current icon and size** (homepage `Building2`/56px; browse + category `Flower2`/48px).
- **No DB change, no new dependencies.**

## Data model / query change

Add to `DirectoryBusiness` (lib/queries.ts:171):
```ts
photoUrl: string | null
```
Add the same computed column to all three selects (`getDirectoryBusinesses`, `getBusinessesByCategorySlug`, `getFeaturedBusinesses`):
```ts
photoUrl: sql<string | null>`coalesce(${businesses.photosJson}->>0, ${businesses.coverUrl})`,
```
Notes:
- `photos_json->>0` extracts the first array element of the jsonb array as text; `coalesce` falls back to `cover_url`; yields `null` when both are absent.
- These queries already `groupBy(businesses.id, categories.id)`; a column selected straight from `businesses.*` (or a coalesce of two such columns) is functionally dependent on `businesses.id` and is valid under the existing GROUP BY — no GROUP BY change needed.

## `BusinessAvatar` component (new)

`components/business-avatar.tsx`:
```tsx
import type { ReactNode } from "react"
import { SafeImage } from "@/components/safe-image"

export function BusinessAvatar({
  logoUrl,
  photoUrl,
  name,
  className,   // sizing + rounding, e.g. "h-14 w-14 rounded-xl"
  icon,        // the per-card fallback icon node, e.g. <Building2 className="h-7 w-7" />
}: {
  logoUrl: string | null
  photoUrl: string | null
  name: string
  className: string
  icon: ReactNode
}) {
  const iconBlock = (
    <div className={`${className} flex items-center justify-center bg-primary/10 text-primary`}>
      {icon}
    </div>
  )
  const photoBlock = photoUrl ? (
    <SafeImage src={photoUrl} alt={name} className={`${className} object-cover`} fallback={iconBlock} />
  ) : (
    iconBlock
  )
  if (logoUrl) {
    return <SafeImage src={logoUrl} alt={name} className={`${className} object-cover`} fallback={photoBlock} />
  }
  return photoBlock
}
```
Behavior: logo if present (broken logo → photo); else photo if present (broken photo → icon); else icon. One clear responsibility (resolve the best available business image), well-defined props, testable by reading the JSX.

## Card refactors

Replace the existing logo/icon block in each of the three cards with `<BusinessAvatar>`, preserving each card's current size and icon:

- **Homepage** (`page.tsx`): `className="h-14 w-14 rounded-xl"`, `icon={<Building2 className="h-7 w-7" />}`, pass `logoUrl={biz.logoUrl}` / `photoUrl={biz.photoUrl}` / `name={biz.name}`. (Remove the now-unused inline `bg-primary/10` wrapper the icon had — `BusinessAvatar` owns it.)
- **Browse** (`businesses/page.tsx`): `className="h-12 w-12 rounded-xl"`, `icon={<Flower2 className="h-5 w-5 text-primary/70" />}`. The card currently wraps the avatar in a gradient square (`bg-gradient-to-br from-primary/15 to-accent`); keep the outer wrapper for non-image state OR let `BusinessAvatar` own the background — **decision: `BusinessAvatar` owns the square** (its `iconBlock` background), so the wrapper `div` is replaced by the component. Pass the icon with its existing color class.
- **Category** (`category/[slug]/page.tsx`): same as browse — `className="h-12 w-12 rounded-xl"`, `icon={<Flower2 className="h-5 w-5 text-primary/70" />}`.

Each card then references `biz.photoUrl` (now present on `DirectoryBusiness`). Remove any now-unused `Flower2`/`Building2`/`SafeImage` imports only if they become unused in that file (some files use these icons elsewhere — check before removing).

## Testing & verification

- `npx tsc --noEmit` — clean (the type change propagates to all three queries + three cards).
- `npx next build` — passes; the homepage, `/businesses`, and a `/category/[slug]` route compile.
- Manual: on the homepage featured grid, a business with no logo but a scraped photo shows that photo in the avatar square; a business with a logo still shows the logo; a business with neither shows the icon. Spot-check `/businesses` and one category page for the same three states.

## Out of scope (YAGNI)

- Larger banner/hero imagery on cards (kept to the existing small avatar square).
- Backfilling/altering `coverUrl`/`photosJson` data.
- Changing the profile page (already shows photos).
- Image optimization / `next/image` migration for these avatars (cards use `SafeImage` today; keep consistent).

## File structure

- **Create:** `components/business-avatar.tsx`.
- **Modify:** `lib/queries.ts` (type + 3 selects), `app/[locale]/(public)/page.tsx`, `app/[locale]/(public)/businesses/page.tsx`, `app/[locale]/(public)/category/[slug]/page.tsx`.
