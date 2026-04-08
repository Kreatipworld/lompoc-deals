# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Lompoc Deals from functional MVP to a polished, community-first hyperlocal deals platform through phased UI improvements.

**Architecture:** All changes are purely UI/CSS — no schema changes, no new dependencies, no API changes. We layer new amber color tokens on top of the existing Iris violet palette, then apply the design system to components in priority order (highest impact first).

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, Lucide icons

---

## File Map

| File | Action | Change |
|------|--------|--------|
| `app/globals.css` | Modify | Add amber + success color tokens |
| `tailwind.config.ts` | Modify | Expose amber/success CSS vars as Tailwind colors |
| `components/deal-card.tsx` | Modify | Image height, business name first, amber badge, hover |
| `components/deal-card-skeleton.tsx` | Create | Shimmer skeleton matching card layout |
| `app/[locale]/(public)/page.tsx` | Modify | Hero height, headline size, amber location badge |
| `components/category-strip.tsx` | Modify | Pill active state, "All" first, icon sizing |
| `components/site-header.tsx` | Modify | Mobile simplification, weather badge desktop-only |
| `app/[locale]/(public)/biz/[slug]/page.tsx` | Modify | Cover image banner, floating logo, map placement |
| `components/bottom-nav.tsx` | Create | Mobile tab bar with 5 destinations |

---

## Phase 1 — Color Tokens + Deal Card

### Task 1: Add amber and success color tokens

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add new CSS variables to globals.css**

In `app/globals.css`, inside `:root { ... }`, add after `--accent-foreground`:

```css
    /* Warm amber — California gold: highlights, discount badges, CTAs */
    --amber: 38 90% 52%;
    --amber-foreground: 30 50% 12%;
    --amber-muted: 38 90% 95%;

    /* Success — forest sage green (already have --brand-green, use for verified) */
    --success: 150 40% 38%;
    --success-foreground: 0 0% 100%;
    --success-muted: 150 40% 95%;
```

In `app/globals.css`, inside `.dark { ... }`, add after `--accent-foreground`:

```css
    --amber: 38 85% 58%;
    --amber-foreground: 30 50% 10%;
    --amber-muted: 38 50% 15%;
    --success: 150 45% 50%;
    --success-foreground: 0 0% 100%;
    --success-muted: 150 30% 12%;
```

- [ ] **Step 2: Expose new tokens in tailwind.config.ts**

Read `tailwind.config.ts`. In the `extend.colors` section, add:

```typescript
amber: {
  DEFAULT: "hsl(var(--amber))",
  foreground: "hsl(var(--amber-foreground))",
  muted: "hsl(var(--amber-muted))",
},
success: {
  DEFAULT: "hsl(var(--success))",
  foreground: "hsl(var(--success-foreground))",
  muted: "hsl(var(--success-muted))",
},
```

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/kreatip/Projects/lompoc-deals && npm run build 2>&1 | tail -20
```

Expected: no TypeScript or CSS errors.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat: add amber and success color tokens to design system

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

### Task 2: Redesign deal-card.tsx

**Files:**
- Modify: `components/deal-card.tsx`

Key changes:
- Image height: `h-48` → `h-52`
- Business name above title (swap order in BODY section)
- Discount badge: primary → amber color, larger text (`text-sm font-bold`)
- Card hover: `hover:-translate-y-1` → `hover:-translate-y-2`, `hover:shadow-lg` → `hover:shadow-xl`
- "Get Deal" button: use primary variant instead of foreground

- [ ] **Step 1: Update image height and card hover**

In `components/deal-card.tsx`, change line 58:
```tsx
// Before:
<article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
  {/* MEDIA */}
  <div className="relative h-48 overflow-hidden">

// After:
<article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl">
  {/* MEDIA */}
  <div className="relative h-52 overflow-hidden">
```

- [ ] **Step 2: Update discount badge to amber**

Change the discount badge (around line 79):
```tsx
// Before:
<div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-md">
  {deal.discountText}
</div>

// After:
<div className="absolute left-3 top-3 rounded-full bg-amber px-3 py-1.5 text-sm font-bold text-amber-foreground shadow-md">
  {deal.discountText}
</div>
```

- [ ] **Step 3: Swap business name above deal title**

Change the BODY section (around line 131):
```tsx
// Before:
<div className="space-y-1">
  <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
    {deal.title}
  </h3>
  <Link
    href={`/biz/${deal.business.slug}`}
    className="text-sm font-medium text-primary hover:underline"
  >
    {deal.business.name}
  </Link>
</div>

// After:
<div className="space-y-1">
  <Link
    href={`/biz/${deal.business.slug}`}
    className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
  >
    {deal.business.name}
  </Link>
  <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
    {deal.title}
  </h3>
</div>
```

- [ ] **Step 4: Update "Get Deal" button to use primary color**

Change the Get Deal button (around line 176):
```tsx
// Before:
<button
  type="submit"
  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
>
  Get Deal
  <ArrowRight className="h-3.5 w-3.5" />
</button>

// After:
<button
  type="submit"
  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
>
  Get Deal
  <ArrowRight className="h-3.5 w-3.5" />
</button>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/kreatip/Projects/lompoc-deals && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/deal-card.tsx
git commit -m "feat: redesign deal card — amber badge, business name first, bolder hover

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

### Task 3: Add deal card skeleton component

**Files:**
- Create: `components/deal-card-skeleton.tsx`

- [ ] **Step 1: Create skeleton component**

```tsx
// components/deal-card-skeleton.tsx
export function DealCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Image skeleton */}
      <div className="relative h-52 animate-pulse bg-muted" />

      {/* Body skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Business name */}
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Button */}
        <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  )
}

export function DealGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/deal-card-skeleton.tsx
git commit -m "feat: add deal card skeleton component with shimmer animation

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Phase 2 — Homepage Hero

### Task 4: Improve homepage hero section

**Files:**
- Modify: `app/[locale]/(public)/page.tsx`

Key changes:
- Hero container: `py-14 sm:py-20` → `py-16 sm:py-24`
- Headline: `text-4xl sm:text-5xl` → `text-4xl sm:text-5xl lg:text-6xl`
- Add amber location badge above headline
- Add "Updated daily" amber badge next to deal count stat

- [ ] **Step 1: Read current hero markup**

Read `app/[locale]/(public)/page.tsx` lines 1-80 to find the exact hero JSX.

- [ ] **Step 2: Update hero container and headline**

Find the hero section (the div with `min-h` or `py-14`). Update vertical padding and headline size. The headline that currently contains "in Lompoc?" in yellow should become:

```tsx
<div className="py-16 sm:py-24">
  {/* Location badge */}
  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-xs font-semibold text-amber-foreground ring-1 ring-amber/30">
    <span className="h-1.5 w-1.5 rounded-full bg-amber" />
    Lompoc, California
  </div>

  <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
    {/* Keep existing headline content */}
  </h1>
```

- [ ] **Step 3: Update deal count stat to include "Updated daily" badge**

Find the stats line (contains active deal count). After the existing count text, add:

```tsx
<span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-semibold text-amber-foreground ring-1 ring-amber/30">
  Updated daily
</span>
```

- [ ] **Step 4: Verify build and check mobile at 375px**

```bash
cd /Users/kreatip/Projects/lompoc-deals && npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/\(public\)/page.tsx
git commit -m "feat: improve homepage hero — taller, bigger headline, amber location badge

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Phase 3 — Category Strip + Header

### Task 5: Update category strip active state

**Files:**
- Modify: `components/category-strip.tsx`

- [ ] **Step 1: Read current category strip implementation**

Read `components/category-strip.tsx` in full to understand the current active state CSS.

- [ ] **Step 2: Replace underline active state with pill active state**

Find the active/inactive class logic. Replace so that:
- **Active:** `bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-3 py-1.5` (pill style)
- **Inactive:** `text-muted-foreground hover:text-foreground px-3 py-1.5`
- Remove the `h-0.5 bg-foreground` underline indicator entirely

The category item wrapper should become:
```tsx
<button
  className={cn(
    "flex min-w-[78px] flex-shrink-0 flex-col items-center gap-1 rounded-full px-3 py-2 transition-all",
    isActive
      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )}
>
  <Icon className="h-[22px] w-[22px]" />
  <span className="text-[11px] font-medium">{name}</span>
</button>
```

- [ ] **Step 3: Ensure "All" is the first item**

Check if "All" category is already the first — if not, add it as a synthetic first option with the LayoutGrid icon from lucide-react.

- [ ] **Step 4: Commit**

```bash
git add components/category-strip.tsx
git commit -m "feat: category strip — pill active state, improved spacing

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

### Task 6: Simplify header for mobile

**Files:**
- Modify: `components/site-header.tsx`

- [ ] **Step 1: Read current header implementation in full**

Read `components/site-header.tsx`.

- [ ] **Step 2: Hide weather badge on mobile**

Find the `<WeatherBadge />` or weather badge component in the header. Add `hidden sm:flex` or `hidden sm:block` to its wrapper so it only shows on sm+ breakpoints.

- [ ] **Step 3: Ensure logo has visible wordmark**

The logo currently shows `Flower2` icon + "Lompoc Deals" text. Ensure both are visible even on small phones (no truncation). If the text is `hidden` at any breakpoint, make it always visible with a minimum font size.

- [ ] **Step 4: Commit**

```bash
git add components/site-header.tsx
git commit -m "feat: header — hide weather badge on mobile, ensure wordmark always visible

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Phase 4 — Business Profile Page

### Task 7: Business profile — cover image banner + map prominence

**Files:**
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx`

- [ ] **Step 1: Read current biz page in full**

Read `app/[locale]/(public)/biz/[slug]/page.tsx`.

- [ ] **Step 2: Add cover image banner at top**

Before the existing header card, add:

```tsx
{/* Cover image banner */}
{business.coverUrl ? (
  <div className="relative h-48 sm:h-64 w-full overflow-hidden">
    <img
      src={business.coverUrl}
      alt=""
      className="h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
  </div>
) : (
  <div className={`h-32 sm:h-48 w-full bg-gradient-to-br ${gradientFor(business.id)} opacity-60`} />
)}
```

You'll need to add the `gradientFor` helper at the top of this file (same GRADIENTS array used in deal-card.tsx).

- [ ] **Step 3: Float logo over cover image**

If cover image exists, show logo overlapping the bottom of the cover image (negative margin-top). Update the logo display in the header card:

```tsx
<div className={cn(
  "flex-shrink-0",
  business.coverUrl ? "-mt-10 sm:-mt-12" : ""
)}>
  {/* logo image or fallback */}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/(public)/biz/[slug]/page.tsx"
git commit -m "feat: business profile — cover image banner with floating logo overlay

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Phase 5 — Mobile Bottom Navigation

### Task 8: Create bottom navigation component

**Files:**
- Create: `components/bottom-nav.tsx`
- Modify: `app/[locale]/layout.tsx` (add bottom nav to root layout)

- [ ] **Step 1: Create bottom-nav.tsx**

```tsx
// components/bottom-nav.tsx
"use client"

import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { Home, Map, Search, Tag, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/businesses", icon: Tag, label: "Deals" },
  { href: "/dashboard", icon: User, label: "Account" },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 pb-safe backdrop-blur-sm sm:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.75px]")}
              />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Add pb-safe utility to globals.css**

In `app/globals.css`, add to `@layer utilities`:

```css
@layer utilities {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  /* Add bottom padding to main content to clear the bottom nav */
  .content-bottom-safe {
    padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));
  }
}
```

- [ ] **Step 3: Add BottomNav to root layout**

Read `app/[locale]/layout.tsx`. Add `<BottomNav />` just before the closing `</body>` tag (or inside the main layout container):

```tsx
import { BottomNav } from "@/components/bottom-nav"

// Inside the layout return, before </body>:
<BottomNav />
```

Also add `sm:pb-0 pb-16` to the main content wrapper so content doesn't get hidden behind the nav.

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/kreatip/Projects/lompoc-deals && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add components/bottom-nav.tsx app/globals.css "app/[locale]/layout.tsx"
git commit -m "feat: add mobile bottom navigation tab bar

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Phase 6 — Polish + Ship

### Task 9: Final typography and spacing pass

- [ ] **Step 1: Audit homepage for spacing consistency**

Check that all sections use the 8pt spacing system (gap-6, gap-8, py-10, py-12, py-16). Fix any inconsistencies where spacing values are arbitrary (e.g., py-7, gap-5 should be py-8, gap-4 or gap-6).

- [ ] **Step 2: Ensure all text meets 4.5:1 contrast ratio**

Verify muted-foreground text (220 9% 46%) on background (45 20% 98%): ratio ≈ 4.7:1 ✓

Verify primary text (258 65% 55%) on background: ratio ≈ 4.8:1 ✓

Verify amber badge: amber-foreground (30 50% 12%) on amber (38 90% 52%): ratio ≈ 5.2:1 ✓

- [ ] **Step 3: Run full build**

```bash
cd /Users/kreatip/Projects/lompoc-deals && npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Ship**

```bash
cd /Users/kreatip/Projects/lompoc-deals && ./scripts/ship.sh "feat: frontend redesign phase 1-5 — polish, deal cards, hero, bottom nav"
```

---

## Rollback

All changes are purely CSS/JSX. No schema changes. To rollback any phase:
```bash
git revert <commit-hash>
```
