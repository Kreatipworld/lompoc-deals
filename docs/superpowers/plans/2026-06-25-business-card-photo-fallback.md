# Business Card Photo Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Directory business cards show the business logo, falling back to a scraped/uploaded photo, and only then to the generic icon — so the directory feels real instead of icon-only.

**Architecture:** Add a computed `photoUrl` (`coalesce(photos_json->>0, cover_url)`) to the shared `DirectoryBusiness` type and its three queries. A new `BusinessAvatar` component renders logo → photo → icon via nested `SafeImage`. The three card surfaces (homepage featured grid, /businesses browse, /category) swap their inline logo/icon block for `<BusinessAvatar>`, each keeping its current size and icon.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM (Neon Postgres), Tailwind, lucide-react, the existing `SafeImage` primitive. No unit-test harness for presentational components (repo uses standalone `tsx` scripts only for pure logic; these changes are verified via `tsc` + `next build`).

## Global Constraints

- **No DB change, no new dependencies.** Reuse `SafeImage`, lucide-react, Tailwind tokens.
- **Fallback chain per card:** `logoUrl` → scraped photo → generic icon. Logo always wins.
- **Scraped photo source:** `coalesce(photos_json->>0, cover_url)` — gallery lead photo first, then cover (mirrors the profile page's existing priority).
- **Photo fills the same square as the logo** (`object-cover`); no larger banner.
- **`BusinessAvatar` owns the square background** (flat `bg-primary/10` for the icon state). On browse + category this replaces the previous gradient icon square — an accepted, intentional unification.
- **Each card keeps its current icon + size:** homepage `Building2` at `h-14 w-14`; browse + category `Flower2` at `h-12 w-12`.
- **Branch:** `feat/business-card-photo-fallback` (already created off `main`). Conventional commits. Verify with `npx tsc --noEmit` and `npx next build`.

Spec: [2026-06-25-business-card-photo-fallback-design.md](../specs/2026-06-25-business-card-photo-fallback-design.md).

---

## File Structure

- Create `components/business-avatar.tsx` — logo→photo→icon resolver (presentational).
- Modify `lib/queries.ts` — add `photoUrl` to `DirectoryBusiness` type + three selects.
- Modify `app/[locale]/(public)/page.tsx` — homepage featured card uses `BusinessAvatar`.
- Modify `app/[locale]/(public)/businesses/page.tsx` — browse card uses `BusinessAvatar`.
- Modify `app/[locale]/(public)/category/[slug]/page.tsx` — category card uses `BusinessAvatar`.

---

## Task 1: Add `photoUrl` to `DirectoryBusiness` + its three queries

**Files:**
- Modify: `lib/queries.ts` (type at ~line 171; selects in `getDirectoryBusinesses` ~line 186, `getBusinessesByCategorySlug` ~line 211, `getFeaturedBusinesses` ~line 236)

**Interfaces:**
- Produces: `DirectoryBusiness` gains `photoUrl: string | null`. (`sql` and `businesses` are already imported in this file.)

- [ ] **Step 1: Add `photoUrl` to the type**

In `lib/queries.ts`, in the `export type DirectoryBusiness = { ... }` block (starts ~line 171), add a field after `logoUrl: string | null` (match the existing field style):
```typescript
  photoUrl: string | null
```

- [ ] **Step 2: Add the computed column to all three selects**

In EACH of the three selects (`getDirectoryBusinesses`, `getBusinessesByCategorySlug`, `getFeaturedBusinesses`), add this line to the `.select({ ... })` object immediately after the existing `logoUrl: businesses.logoUrl,` line:
```typescript
      photoUrl: sql<string | null>`coalesce(${businesses.photosJson}->>0, ${businesses.coverUrl})`,
```
(`photos_json->>0` returns the first jsonb-array element as text; `coalesce` falls back to `cover_url`; yields `null` when both are absent. The column is functionally dependent on `businesses.id`, which is already in each query's `GROUP BY` — no GROUP BY change needed.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (additive change; existing card code still compiles).

- [ ] **Step 4: Verify the SQL runs (no GROUP BY error)**

Run: `npx tsx -e "import('dotenv/config').then(async()=>{const {getFeaturedBusinesses}=await import('./lib/queries'); const r=await getFeaturedBusinesses(3); console.log('rows', r.length, 'photoUrl key present:', r.every(b=>'photoUrl' in b)); process.exit(0)})"`
Expected: prints `rows <n> photoUrl key present: true` with no SQL error. (`lib/queries.ts` uses `@/`-aliased imports, but this `tsx -e` imports `./lib/queries` directly and only needs DATABASE_URL from `.env.local`; if the alias prevents the import from resolving, skip this step and rely on Step 3 + the build in Task 3 instead — note which path you took in your report.)

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts
git commit -m "feat: add photoUrl (gallery/cover fallback) to DirectoryBusiness"
```

---

## Task 2: `BusinessAvatar` component

**Files:**
- Create: `components/business-avatar.tsx`

**Interfaces:**
- Consumes: `SafeImage` from `@/components/safe-image`.
- Produces: `<BusinessAvatar logoUrl={string|null} photoUrl={string|null} name={string} className={string} icon={ReactNode} />`. Renders logo (object-cover) → photo (object-cover) → `icon` inside a `bg-primary/10` square. `className` carries sizing + rounding (e.g. `"h-14 w-14 rounded-xl"`) and is applied to the image variants and the icon box alike.

- [ ] **Step 1: Write the component**

Create `components/business-avatar.tsx`:
```tsx
import type { ReactNode } from "react"
import { SafeImage } from "@/components/safe-image"

/**
 * Resolves the best available business image for a card avatar:
 * logo → scraped/uploaded photo → generic icon. The photo fills the same
 * square as the logo (object-cover). `className` carries sizing + rounding.
 */
export function BusinessAvatar({
  logoUrl,
  photoUrl,
  name,
  className,
  icon,
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
    return (
      <SafeImage src={logoUrl} alt={name} className={`${className} object-cover`} fallback={photoBlock} />
    )
  }
  return photoBlock
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/business-avatar.tsx
git commit -m "feat: BusinessAvatar (logo -> photo -> icon resolver)"
```

---

## Task 3: Wire `BusinessAvatar` into all three cards

**Files:**
- Modify: `app/[locale]/(public)/page.tsx` (~lines 215–233)
- Modify: `app/[locale]/(public)/businesses/page.tsx` (~lines 266–278)
- Modify: `app/[locale]/(public)/category/[slug]/page.tsx` (~lines 210–222)

**Interfaces:**
- Consumes: `BusinessAvatar` (Task 2); `biz.photoUrl` / `b.photoUrl` (Task 1).

- [ ] **Step 1: Homepage — import and swap the avatar block**

In `app/[locale]/(public)/page.tsx`, add the import (near the other `@/components` imports):
```typescript
import { BusinessAvatar } from "@/components/business-avatar"
```
Replace this block (the `{/* Logo / placeholder */}` wrapper and its contents, ~lines 215–233):
```tsx
                  {/* Logo / placeholder */}
                  <div className="flex-shrink-0">
                    {biz.logoUrl ? (
                      <SafeImage
                        src={biz.logoUrl}
                        alt={biz.name}
                        className="h-14 w-14 rounded-xl object-cover"
                        fallback={
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Building2 className="h-7 w-7" />
                          </div>
                        }
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-7 w-7" />
                      </div>
                    )}
                  </div>
```
with:
```tsx
                  {/* Logo / photo / placeholder */}
                  <div className="flex-shrink-0">
                    <BusinessAvatar
                      logoUrl={biz.logoUrl}
                      photoUrl={biz.photoUrl}
                      name={biz.name}
                      className="h-14 w-14 rounded-xl"
                      icon={<Building2 className="h-7 w-7" />}
                    />
                  </div>
```

- [ ] **Step 2: Browse page — import and swap the avatar block**

In `app/[locale]/(public)/businesses/page.tsx`, add the import (near the other `@/components` imports):
```typescript
import { BusinessAvatar } from "@/components/business-avatar"
```
Replace this block (~lines 267–278):
```tsx
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-accent transition-transform duration-200 group-hover:scale-105">
                        {b.logoUrl ? (
                          <SafeImage
                            src={b.logoUrl}
                            alt=""
                            className="h-12 w-12 rounded-xl object-cover"
                            fallback={<Flower2 className="h-5 w-5 text-primary/70" />}
                          />
                        ) : (
                          <Flower2 className="h-5 w-5 text-primary/70" />
                        )}
                      </div>
```
with (the `flex-shrink-0` + hover-scale move onto the avatar via `className`):
```tsx
                      <BusinessAvatar
                        logoUrl={b.logoUrl}
                        photoUrl={b.photoUrl}
                        name={b.name}
                        className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-105"
                        icon={<Flower2 className="h-5 w-5 text-primary/70" />}
                      />
```

- [ ] **Step 3: Category page — import and swap the avatar block**

In `app/[locale]/(public)/category/[slug]/page.tsx`, add the import (near the other `@/components` imports):
```typescript
import { BusinessAvatar } from "@/components/business-avatar"
```
Replace this block (~lines 211–222):
```tsx
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent">
                          {b.logoUrl ? (
                            <SafeImage
                              src={b.logoUrl}
                              alt=""
                              className="h-12 w-12 rounded-xl object-cover"
                              fallback={<Flower2 className="h-5 w-5 text-primary/70" />}
                            />
                          ) : (
                            <Flower2 className="h-5 w-5 text-primary/70" />
                          )}
                        </div>
```
with:
```tsx
                        <BusinessAvatar
                          logoUrl={b.logoUrl}
                          photoUrl={b.photoUrl}
                          name={b.name}
                          className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl"
                          icon={<Flower2 className="h-5 w-5 text-primary/70" />}
                        />
```

- [ ] **Step 4: Remove now-unused imports**

In each of the three files, check whether `SafeImage` and the icon (`Building2`/`Flower2`) are still referenced elsewhere in that file; remove the import only if it is now unused. Specifically:
- `page.tsx`: `Building2` is still used (passed as `icon`); `SafeImage` is used elsewhere in this file (hero/other sections) — keep both. Verify by `grep -n "SafeImage\|Building2" app/[locale]/(public)/page.tsx`.
- `businesses/page.tsx`: `Flower2` is used elsewhere (a section header) — keep. Check `SafeImage`: `grep -n "SafeImage" app/[locale]/(public)/businesses/page.tsx`; if the only use was the avatar just replaced, remove the import.
- `category/[slug]/page.tsx`: check `grep -n "SafeImage\|Flower2" app/[locale]/(public)/category/[slug]/page.tsx`; remove `SafeImage` import if now unused; keep `Flower2` if still used (it is passed as `icon`).

- [ ] **Step 5: Build**

Run: `npx next build`
Expected: PASS — homepage, `/businesses`, and `/category/[slug]` compile; no type or lint errors (lint flags unused imports, so Step 4 must be clean).

- [ ] **Step 6: Commit**

```bash
git add "app/[locale]/(public)/page.tsx" "app/[locale]/(public)/businesses/page.tsx" "app/[locale]/(public)/category/[slug]/page.tsx"
git commit -m "feat: business cards show logo -> scraped photo -> icon"
```

---

## Task 4: Verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck + build**

```bash
npx tsc --noEmit
npx next build
```
Expected: tsc clean; build passes.

- [ ] **Step 2: Manual visual check (drive the running app)**

Start the dev server on a dedicated port:
```bash
npx next dev -p 3007
```
Then confirm on the homepage featured grid, `/businesses`, and one `/category/<slug>` page:
- A business with a **logo** shows the logo (unchanged).
- A business with **no logo but a scraped photo** now shows the photo in the avatar square (`object-cover`).
- A business with **neither** shows the generic icon (`Building2` on homepage, `Flower2` on browse/category) on a flat `bg-primary/10` square.
- (From the merged seed data, most approved businesses have `coverUrl`/`photosJson`, so logo-less cards should now show photos rather than icons.)

- [ ] **Step 3: Stop the dev server**

```bash
lsof -ti :3007 | xargs kill 2>/dev/null || true
```

---

## Notes for the implementer

- `DirectoryBusiness` is the single type behind all three cards; the Task 1 change makes `photoUrl` available to every card at once.
- `SafeImage` already renders its `fallback` when an image fails to load, so nested `SafeImage` in `BusinessAvatar` degrades gracefully (broken logo → photo → icon) without extra error handling.
- Do not alter the profile page or the `coverUrl`/`photosJson` data — out of scope.
