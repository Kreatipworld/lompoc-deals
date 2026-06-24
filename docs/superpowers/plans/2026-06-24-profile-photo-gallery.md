# Profile Photo Gallery (Mosaic + Lightbox) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full-bleed photo *carousel* on the business profile page with a bounded **mosaic gallery** (large lead photo + thumbnail cluster + "+N · View all") and a **lightbox** that shows each photo whole over a blurred backdrop — so even mediocre Google photos look intentional and never crop where it matters.

**Architecture:** A pure `planGallery()` helper computes the tile layout from the existing `photos: string[]`. A client `BusinessPhotoGallery` renders the mosaic (thumbnails `object-cover`) and opens a client `PhotoLightbox` (current photo `object-contain` over a blurred copy of itself). The server profile page swaps one component and drops the old full-bleed overlap. No new dependencies, no DB changes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, next-intl, lucide-react, the existing `SafeImage` primitive. Tests are standalone `tsx` scripts using `node:assert/strict` (repo has no vitest/jest).

## Global Constraints

- **No new runtime dependencies.** Reuse `SafeImage`, lucide-react icons, Tailwind tokens.
- **No DB change.** Uses the existing `photos` array built in `page.tsx` (`photosJson` → `[coverUrl]` → `[]`).
- **All user-facing strings are i18n keys** under the existing `businesses.profile` namespace, present in BOTH `messages/en.json` and `messages/es.json`.
- **Client components** (`BusinessPhotoGallery`, `PhotoLightbox`) read strings via `useTranslations("businesses.profile")` — the app already uses `useTranslations` in client components.
- **Tests are `tsx` scripts** run via `npx tsx <file>` using `node:assert/strict`.
- **Branch:** create `feat/profile-photo-gallery` off `main` before Task 1; do not commit to `main`.
- Conventional commits. Verify build with `npx next build` (the repo's pre-push hook also runs `next lint`).

Spec: [2026-06-24-profile-photo-gallery-design.md](../specs/2026-06-24-profile-photo-gallery-design.md).

---

## File Structure
- Create `lib/gallery.ts` — `planGallery()` pure helper + `GalleryPlan` type.
- Create `lib/gallery.test.ts` — unit tests.
- Create `components/photo-lightbox.tsx` — full-screen viewer (client).
- Create `components/business-photo-gallery.tsx` — mosaic + empty state (client); opens the lightbox.
- Modify `app/[locale]/(public)/biz/[slug]/page.tsx` — swap component, drop full-bleed overlap.
- Modify `messages/en.json`, `messages/es.json` — 6 new keys.
- Delete `components/business-photo-carousel.tsx` — after confirming no other references.

---

## Task 1: `planGallery()` pure helper

**Files:**
- Create: `lib/gallery.ts`
- Test: `lib/gallery.test.ts`

**Interfaces:**
- Produces: `type GalleryPlan = { lead: string | null; thumbs: string[]; overflow: number; total: number }` and `planGallery(photos: string[], maxThumbs?: number): GalleryPlan`.

- [ ] **Step 1: Write the failing test**

Create `lib/gallery.test.ts`:
```typescript
import assert from "node:assert/strict"
import { planGallery } from "./gallery"

// empty
assert.deepEqual(planGallery([]), { lead: null, thumbs: [], overflow: 0, total: 0 })
// single
assert.deepEqual(planGallery(["a"]), { lead: "a", thumbs: [], overflow: 0, total: 1 })
// two
assert.deepEqual(planGallery(["a", "b"]), { lead: "a", thumbs: ["b"], overflow: 0, total: 2 })
// four — lead + 3 thumbs, no overflow
assert.deepEqual(planGallery(["a", "b", "c", "d"]), { lead: "a", thumbs: ["b", "c", "d"], overflow: 0, total: 4 })
// five — lead + 4 thumbs, no overflow (boundary: +N appears only past 5)
assert.deepEqual(planGallery(["a", "b", "c", "d", "e"]), { lead: "a", thumbs: ["b", "c", "d", "e"], overflow: 0, total: 5 })
// nine — lead + 4 thumbs, overflow 4
assert.deepEqual(planGallery(["a", "b", "c", "d", "e", "f", "g", "h", "i"]), {
  lead: "a", thumbs: ["b", "c", "d", "e"], overflow: 4, total: 9,
})
// custom maxThumbs
assert.deepEqual(planGallery(["a", "b", "c", "d"], 2), { lead: "a", thumbs: ["b", "c"], overflow: 1, total: 4 })

console.log("gallery.test: all passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/gallery.test.ts`
Expected: FAIL — `Cannot find module './gallery'`.

- [ ] **Step 3: Write the implementation**

Create `lib/gallery.ts`:
```typescript
export type GalleryPlan = {
  lead: string | null // first photo, or null when there are no photos
  thumbs: string[] // up to maxThumbs photos after the lead
  overflow: number // photos hidden behind the "+N" tile (>= 0)
  total: number
}

/** Plan the mosaic tiles from a flat photo list. Pure — no DOM, no DB. */
export function planGallery(photos: string[], maxThumbs = 4): GalleryPlan {
  const total = photos.length
  if (total === 0) return { lead: null, thumbs: [], overflow: 0, total: 0 }
  const lead = photos[0]
  const thumbs = photos.slice(1, 1 + maxThumbs)
  const overflow = Math.max(0, total - 1 - thumbs.length)
  return { lead, thumbs, overflow, total }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/gallery.test.ts`
Expected: PASS — prints `gallery.test: all passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/gallery.ts lib/gallery.test.ts
git commit -m "feat: planGallery mosaic layout helper"
```

---

## Task 2: i18n keys for the gallery

**Files:**
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Produces: keys under `businesses.profile`: `photosViewAll`, `photoCounter`, `photoPrev`, `photoNext`, `photoClose`, `photoOpenAria`.

- [ ] **Step 1: Add keys to `messages/en.json`**

In `messages/en.json`, inside the existing `"businesses": { "profile": { … } }` object, add:
```json
"photosViewAll": "View all",
"photoCounter": "{current} of {total}",
"photoPrev": "Previous photo",
"photoNext": "Next photo",
"photoClose": "Close",
"photoOpenAria": "Open photo {n}"
```
(Add a comma after the previous last key so the JSON stays valid.)

- [ ] **Step 2: Add the same keys to `messages/es.json`**

In `messages/es.json`, inside `"businesses": { "profile": { … } }`, add:
```json
"photosViewAll": "Ver todas",
"photoCounter": "{current} de {total}",
"photoPrev": "Foto anterior",
"photoNext": "Foto siguiente",
"photoClose": "Cerrar",
"photoOpenAria": "Abrir foto {n}"
```

- [ ] **Step 3: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('messages/es.json','utf8')); console.log('json ok')"`
Expected: prints `json ok`.

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/es.json
git commit -m "feat: i18n keys for photo gallery + lightbox"
```

---

## Task 3: `PhotoLightbox` component

**Files:**
- Create: `components/photo-lightbox.tsx`

**Interfaces:**
- Consumes: i18n keys from Task 2; `SafeImage` from `@/components/safe-image`.
- Produces: `<PhotoLightbox photos={string[]} startIndex={number} businessName={string} onClose={() => void} />` (client component).

- [ ] **Step 1: Write the component**

Create `components/photo-lightbox.tsx`:
```tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { SafeImage } from "@/components/safe-image"

export function PhotoLightbox({
  photos,
  startIndex,
  businessName,
  onClose,
}: {
  photos: string[]
  startIndex: number
  businessName: string
  onClose: () => void
}) {
  const t = useTranslations("businesses.profile")
  const [index, setIndex] = useState(startIndex)
  const touchX = useRef<number | null>(null)
  const count = photos.length

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count])
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  const src = photos[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={businessName}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 40) prev()
        else if (dx < -40) next()
        touchX.current = null
      }}
    >
      {/* blurred backdrop = same image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label={t("photoClose")}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
      >
        <X className="h-5 w-5" />
      </button>

      {/* main image — whole photo, never cropped; click does not close */}
      <SafeImage
        src={src}
        alt={businessName}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label={t("photoPrev")}
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label={t("photoNext")}
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
            {t("photoCounter", { current: index + 1, total: count })}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add components/photo-lightbox.tsx
git commit -m "feat: PhotoLightbox (whole-photo viewer + blurred backdrop)"
```

---

## Task 4: `BusinessPhotoGallery` component

**Files:**
- Create: `components/business-photo-gallery.tsx`

**Interfaces:**
- Consumes: `planGallery` (Task 1), `PhotoLightbox` (Task 3), i18n keys (Task 2), `SafeImage`.
- Produces: `<BusinessPhotoGallery photos={string[]} businessName={string} logoUrl={string | null} />` (client component).

- [ ] **Step 1: Write the component**

Create `components/business-photo-gallery.tsx`:
```tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Flower2, Images } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { PhotoLightbox } from "@/components/photo-lightbox"
import { planGallery } from "@/lib/gallery"

function LogoBlock({ logoUrl, businessName }: { logoUrl: string | null; businessName: string }) {
  const fallback = (
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-primary/10 shadow-md">
      <Flower2 className="h-9 w-9 text-primary/60" />
    </div>
  )
  if (!logoUrl) return fallback
  return (
    <SafeImage
      src={logoUrl}
      alt={`${businessName} logo`}
      className="h-20 w-20 rounded-2xl border-2 border-background bg-background object-cover shadow-md"
      fallback={fallback}
    />
  )
}

export function BusinessPhotoGallery({
  photos,
  businessName,
  logoUrl,
}: {
  photos: string[]
  businessName: string
  logoUrl: string | null
}) {
  const t = useTranslations("businesses.profile")
  const [openAt, setOpenAt] = useState<number | null>(null)
  const { lead, thumbs, overflow } = planGallery(photos)

  // Empty state — branded banner with the logo (looks deliberate, not broken)
  if (!lead) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex h-40 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-accent via-background to-primary/10 sm:h-52">
          <LogoBlock logoUrl={logoUrl} businessName={businessName} />
        </div>
      </div>
    )
  }

  const thumbCols =
    thumbs.length >= 3 ? "grid-cols-2 grid-rows-2" : thumbs.length === 2 ? "grid-cols-1 grid-rows-2" : "grid-cols-1 grid-rows-1"

  function Tile({ src, index, children }: { src: string; index: number; children?: React.ReactNode }) {
    return (
      <button
        type="button"
        onClick={() => setOpenAt(index)}
        aria-label={t("photoOpenAria", { n: index + 1 })}
        className="group relative h-full w-full overflow-hidden rounded-2xl bg-muted"
      >
        <SafeImage
          src={src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={<div className="h-full w-full bg-gradient-to-br from-primary/15 to-accent" />}
        />
        {children}
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      {thumbs.length === 0 ? (
        // single photo
        <div className="h-64 sm:h-80">
          <Tile src={lead} index={0} />
        </div>
      ) : (
        <div className="flex h-64 gap-2 sm:h-80">
          <div className="min-w-0 flex-[1.6]">
            <Tile src={lead} index={0} />
          </div>
          <div className={`grid min-w-0 flex-1 gap-2 ${thumbCols}`}>
            {thumbs.map((src, i) => {
              const isLast = i === thumbs.length - 1
              return (
                <Tile key={`${src}-${i}`} src={src} index={i + 1}>
                  {isLast && overflow > 0 && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                      <span className="flex items-center gap-1 text-lg font-bold">
                        <Images className="h-4 w-4" />+{overflow}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide">{t("photosViewAll")}</span>
                    </span>
                  )}
                </Tile>
              )
            })}
          </div>
        </div>
      )}

      {openAt !== null && (
        <PhotoLightbox photos={photos} startIndex={openAt} businessName={businessName} onClose={() => setOpenAt(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/business-photo-gallery.tsx
git commit -m "feat: BusinessPhotoGallery mosaic with adaptive states"
```

---

## Task 5: Wire into the profile page + remove the old carousel

**Files:**
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx`
- Delete: `components/business-photo-carousel.tsx` (after grep)

**Interfaces:**
- Consumes: `BusinessPhotoGallery` (Task 4).

- [ ] **Step 1: Confirm the old carousel has no other references**

Run: `grep -rn "BusinessPhotoCarousel\|business-photo-carousel" --include="*.ts" --include="*.tsx" . | grep -v node_modules`
Expected: only `app/[locale]/(public)/biz/[slug]/page.tsx` (import + one usage). If anything else references it, stop and report — do not delete the file in that case.

- [ ] **Step 2: Swap the import**

In `app/[locale]/(public)/biz/[slug]/page.tsx`, replace the carousel import line:
```typescript
import { BusinessPhotoCarousel } from "@/components/business-photo-carousel"
```
with:
```typescript
import { BusinessPhotoGallery } from "@/components/business-photo-gallery"
```

- [ ] **Step 3: Replace the hero block**

Replace this block (the photos ternary + gradient fallback, currently lines ~123–127):
```tsx
{photos.length > 0 ? (
  <BusinessPhotoCarousel photos={photos} businessName={business.name} />
) : (
  <div className="h-24 w-full bg-gradient-to-r from-primary/20 via-accent to-primary/10 sm:h-36" />
)}
```
with (the gallery owns its own empty state, so no ternary):
```tsx
<BusinessPhotoGallery photos={photos} businessName={business.name} logoUrl={business.logoUrl} />
```

- [ ] **Step 4: Drop the full-bleed overlap on the header card**

The header card used a negative top margin to overlap the old full-bleed banner. The gallery is now bounded, so remove the overlap. Change the card's className (currently line ~140):
```tsx
<div className={`rounded-3xl border bg-card p-6 shadow-lg sm:p-8 ${photos.length > 0 ? "-mt-10 sm:-mt-14" : "mt-4"}`}>
```
to:
```tsx
<div className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8 mt-4">
```

- [ ] **Step 5: Delete the old carousel component**

```bash
git rm components/business-photo-carousel.tsx
```

- [ ] **Step 6: Build**

Run: `npx next build`
Expected: PASS — the profile route compiles; no references to the deleted carousel remain; no type/lint errors. (Pre-existing bcryptjs/jose Edge and Tailwind ambiguous-class warnings are known and not introduced here.)

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/(public)/biz/[slug]/page.tsx"
git commit -m "feat: use mosaic photo gallery on business profile; remove old carousel"
```

---

## Task 6: Verification

**Files:** none (verification only)

- [ ] **Step 1: Unit test + build**

```bash
npx tsx lib/gallery.test.ts
npx tsc --noEmit
npx next build
```
Expected: gallery test prints `all passed`; tsc clean; build passes.

- [ ] **Step 2: Manual visual check (drive the running app)**

Start the dev server on a dedicated port (port 3000 may be used by another project):
```bash
npx next dev -p 3007
```
Then check three profiles representing each state (use businesses that have many / one / zero photos — e.g. pick from the DB, or temporarily verify against any approved business). Confirm:
- **Multi-photo:** lead + thumbnail mosaic; the last thumb shows `+N · View all` when there are 6+ photos; clicking any tile opens the lightbox at that photo.
- **Lightbox:** the photo shows **whole** (letterboxed) over a blurred copy; ←/→ and on-screen arrows navigate; the `{current} of {total}` counter updates; Esc and the ✕ close it; clicking the dark area closes, clicking the photo does not; body doesn't scroll behind it.
- **Single photo:** one framed image, opens the lightbox with no arrows.
- **No photos:** the branded banner with the logo renders (no broken/empty band).
- The header card sits cleanly below the gallery (no awkward overlap).

- [ ] **Step 3: Stop the dev server**

Stop only the port-3007 process you started:
```bash
lsof -ti :3007 | xargs kill 2>/dev/null || true
```
