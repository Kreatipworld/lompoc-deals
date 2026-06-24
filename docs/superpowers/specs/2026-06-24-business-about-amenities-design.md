# Business "About this place" + Amenities — Design Spec

**Date:** 2026-06-24
**Branch:** continues on profile work (`feat/profile-photo-gallery` or a fresh `feat/business-about-amenities` off `main`)

## Goal

Add richer "info about the place" to the business profile: a long-form **About** write-up and a set of **amenities** (wheelchair accessible, outdoor seating, takeout, etc.). Both are **Google-seeded, owner-editable** — the Google Places scraper fills them in automatically, and the business owner can override them in the dashboard. Owner edits are never clobbered by re-scrapes.

## Background / current state

The profile page (`app/[locale]/(public)/biz/[slug]/page.tsx`) already shows: photo gallery, logo, name, category, the short `description`, a trust strip, social links, contact chips, a map, and business hours. The only free-text field today is `description` (one short paragraph, reused in the header card and SEO meta).

There is an established pattern for "Google fills, owner owns" via the **hours** fields:
- `hoursSource: 'google' | 'owner' | null` column.
- The scraper (`db/scrape-google-places.ts`) only writes hours when `hoursSource !== 'owner'`.
- Saving the dashboard profile form always stamps `hoursSource: 'owner'` (`lib/biz-actions.ts`).
- `BusinessHours` shows a subtle Google attribution caption when sourced from Google.

This feature mirrors that pattern exactly for two new fields.

## Decisions

- **`about` is a separate column** from `description`. `description` stays as the short header/meta blurb; `about` is the longer body write-up. They are independent.
- **Amenities use a curated canonical taxonomy** (~14 slugs), not raw Google passthrough — so the UI is clean and fully bilingual.
- **Source tracking per field**: `aboutSource` and `amenitiesSource`, each `'google' | 'owner' | null`. Mirrors `hoursSource`.
- **No new runtime dependencies.** Reuse Tailwind tokens, lucide-react icons, existing primitives, `next-intl`.

## Data model (Drizzle migration)

Add to the `businesses` table:

| column | type | meaning |
|---|---|---|
| `about` | `text` | long-form write-up; null when unset |
| `about_source` | `text` | `'google' \| 'owner' \| null` |
| `amenities_json` | `jsonb` | array of canonical amenity slugs, e.g. `["takeout","outdoor_seating"]`; null/`[]` when unset |
| `amenities_source` | `text` | `'google' \| 'owner' \| null` |

Drizzle field names: `about`, `aboutSource`, `amenitiesJson`, `amenitiesSource`. Generate the migration with the repo's drizzle-kit flow; no data backfill needed (nulls are fine).

## `lib/amenities.ts` (new)

Pure module — no DOM, no DB.

```ts
export type Amenity = { slug: string; icon: string; labelKey: string }

// Curated canonical set (~14). labelKey resolves under i18n "businesses.amenities".
export const AMENITIES: Amenity[] = [ /* see list below */ ]

export const AMENITY_SLUGS: string[]            // for validation
export function isAmenitySlug(s: string): boolean

/** Translate Google/Apify additionalInfo into our canonical slugs. Pure. */
export function mapGoogleAdditionalInfo(additionalInfo: unknown): string[]
```

**Canonical set (14):** `wheelchair_accessible`, `outdoor_seating`, `dine_in`, `takeout`, `delivery`, `accepts_cards`, `free_wifi`, `parking`, `family_friendly`, `pet_friendly`, `restroom`, `reservations`, `good_for_groups`, `lgbtq_friendly`.

**`mapGoogleAdditionalInfo`** accepts the Apify `additionalInfo` shape — an object of category → array of `{ [label: string]: boolean }` — flattens it to the set of truthy English labels, and maps known labels to canonical slugs via an internal lookup table (case-insensitive, substring-tolerant, e.g. "Wheelchair accessible entrance" → `wheelchair_accessible`). Unknown labels are dropped. Returns a de-duplicated, stably-ordered (AMENITIES order) `string[]`. Defensive: returns `[]` for null/undefined/wrong-shaped input.

**Test:** `lib/amenities.test.ts`, a `tsx` + `node:assert/strict` script (same style as `lib/gallery.test.ts`). Covers: empty/null input → `[]`; a realistic `additionalInfo` blob → expected slugs; false-valued labels excluded; unknown labels dropped; dedupe + stable order.

## Scraper (`db/scrape-google-places.ts`)

1. Extend `GooglePlaceResult` with `description?: string` and `additionalInfo?: unknown`.
2. **Verify the actor returns these.** The `compass/crawler-google-places` actor only includes `additionalInfo` (and the editorial `description`) when place-detail scraping is on. Confirm/enable the relevant actor option (e.g. detail/place-page scraping) and verify on a sample run before relying on it. If unavailable, the field maps to `[]`/null gracefully — document the limitation.
3. **Enrich path** (existing row): set `about` from `place.description` only when `existing.aboutSource !== 'owner'` and `!existing.about`, stamping `aboutSource: 'google'`. Set `amenitiesJson` from `mapGoogleAdditionalInfo(place.additionalInfo)` only when `existing.amenitiesSource !== 'owner'` and the mapped list is non-empty, stamping `amenitiesSource: 'google'`.
4. **Insert path** (new row): set `about`/`aboutSource` and `amenitiesJson`/`amenitiesSource` from Google when present (source `'google'`), else null.

## Profile display

New `components/business-about.tsx` (server component is fine; no client interactivity needed).

```tsx
<BusinessAbout
  about={string | null}
  amenities={string[] | null}      // canonical slugs
  source={{ about: string | null; amenities: string | null }}
/>
```

- Renders an **"About this place"** card (rounded, bordered, `max-w-6xl`, matching the header card) containing:
  - the About paragraph (whitespace-preserved) when `about` is set, and
  - an amenities grid (icon + bilingual label chips) when the slug list is non-empty.
- Renders **nothing** (returns null) when both are empty — no hollow section.
- Shows the same subtle **Google attribution** caption `BusinessHours` uses, when the shown content is Google-sourced.
- Amenity labels come from `useTranslations`/`getTranslations("businesses.amenities")` keyed by slug; icons from a slug→lucide map kept next to `AMENITIES`.

**Placement** in `page.tsx`: its own `<section className="mx-auto max-w-6xl px-4 ...">` placed **after the Claim CTA and before the 2-column body**. Applies to all categories (including real estate).

## Dashboard form

In `app/[locale]/dashboard/profile/profile-form.tsx`, add an **"About this place"** section (new `border-t pt-6` block, consistent with Hours/Social sections):
- About `<Textarea name="about" rows={6}>` bound to `biz.about`.
- Amenity checkboxes for the full canonical set: `<input type="checkbox" name="amenities" value="<slug>">`, pre-checked from `biz.amenitiesJson`. Labels from `dashboardProfile` i18n (or reuse `businesses.amenities`).

In `lib/biz-actions.ts` `saveProfileAction`:
- Read `about` (zod `.optional()`) and collect `formData.getAll("amenities")`, filtered through `isAmenitySlug`.
- On both insert and update, write `about`, `aboutSource: 'owner'`, `amenitiesJson` (the validated slug array, or `null`/`[]`), `amenitiesSource: 'owner'` — exactly as hours are stamped `'owner'`. This guarantees future scrapes won't overwrite owner content.
- Extend the `Biz` type and `getMyBusiness` selection to include `about` and `amenitiesJson`.

## i18n (both `messages/en.json` and `messages/es.json`)

- `businesses.profile`: `aboutTitle` ("About this place" / "Acerca de este lugar"), `amenitiesTitle` ("What this place offers" / "Lo que ofrece este lugar"), and a Google attribution key if not reusing the hours one.
- `businesses.amenities`: one key per canonical slug (14), EN + ES.
- `dashboardProfile`: `aboutLabel`, `aboutHint`, `amenitiesTitle`, `amenitiesHint`, EN + ES.

## Testing & verification

- `npx tsx lib/amenities.test.ts` — passes.
- `npx tsc --noEmit` — clean.
- `node -e` JSON validity check on both message files.
- `npx next build` — passes.
- Manual: run the migration on a branch DB; verify (a) a profile with seeded About+amenities renders the card with attribution; (b) editing in the dashboard persists and flips source to owner; (c) a re-scrape does **not** overwrite owner-edited About/amenities; (d) a profile with neither renders no About card.

## Out of scope (YAGNI)

- Google rating / review count / price level / popular times (separate "Google Place facts" feature).
- Owner-defined custom amenities outside the canonical set.
- Per-amenity verification badges.

## File structure

- **Migration:** new drizzle migration adding the 4 columns.
- **Create:** `lib/amenities.ts`, `lib/amenities.test.ts`, `components/business-about.tsx`.
- **Modify:** `db/schema.ts`, `db/scrape-google-places.ts`, `app/[locale]/(public)/biz/[slug]/page.tsx`, `app/[locale]/dashboard/profile/profile-form.tsx`, `lib/biz-actions.ts`, `messages/en.json`, `messages/es.json`.
