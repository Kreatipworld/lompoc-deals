# Lompoc Deals — Frontend Redesign Spec
*Date: 2026-04-08 | Author: CTO Agent | Status: Approved*

---

## Problem

The current site is a functional MVP (7/10) with solid architecture but a design that feels generic. It does not yet project the "warm, community-first, trustworthy" brand that local merchants and consumers in Lompoc, CA need to feel confident using the platform. The goal is to elevate from "works" to "delights" — without changing the tech stack.

## Design Principles

1. **Community warmth** — feels like your town, not a Silicon Valley product
2. **Mobile-first** — Lompoc locals browse on phones; every interaction must be thumb-friendly
3. **Visual hierarchy clarity** — deals must "pop," CTAs must be obvious
4. **Bilingual parity** — EN/ES switching must be first-class, not an afterthought
5. **Performance** — skeleton states, lazy images, no layout shift

---

## Design System

### Color Palette

Keep the existing Iris violet as primary brand color. Add warm amber as secondary for CTAs and highlights.

```css
/* Existing (keep) */
--primary: 258 65% 55%;            /* Iris violet — brand */
--primary-foreground: 0 0% 100%;   /* White */
--background: 45 20% 98%;          /* Warm cream */
--foreground: 220 15% 12%;         /* Dark charcoal */
--muted-foreground: 220 9% 46%;    /* Mid gray */
--accent: 258 65% 96%;             /* Pale iris tint */

/* New additions */
--amber: 38 90% 52%;               /* California gold — for highlights, CTAs */
--amber-foreground: 30 50% 15%;    /* Dark amber text */
--success: 150 40% 38%;            /* Forest sage — for verified, active */
--badge-bg: 258 60% 95%;           /* Light violet for badges */
```

### Typography Scale

```
Display (h1): font-display, 48px/56px, weight 700, tracking -0.04em
Headline (h2): font-display, 36px/44px, weight 700, tracking -0.03em
Title (h3):   font-display, 24px/32px, weight 600, tracking -0.02em
Subtitle:     font-sans,   18px/28px, weight 500
Body:         font-sans,   16px/24px, weight 400
Caption:      font-sans,   13px/20px, weight 400
Label:        font-sans,   12px/16px, weight 500, tracking +0.04em UPPERCASE
```

### Spacing System (8pt grid)

```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
3xl: 64px
```

### Border Radius

```
sm:  8px   (inputs, badges)
md:  12px  (buttons)
lg:  16px  (cards)
xl:  24px  (panels)
full: 9999px (pills, avatars)
```

---

## Page-by-Page Redesign

### 1. Global Header (`components/site-header.tsx`)

**Current issues:** Header feels cramped on mobile; logo is too small; weather badge competes with user menu.

**Changes:**
- Increase logo area — "Lompoc Deals" wordmark alongside icon
- Add thin amber bottom-border on active nav link (replaces nothing — better visual cue)
- Move weather badge to desktop only (hidden on mobile to reduce noise)
- Mobile: only show logo + search icon + user menu in header (moves main nav to category strip)
- Ensure header height is exactly 64px (h-16) with 16px horizontal padding

### 2. Category Strip (`components/category-strip.tsx`)

**Current issues:** Underline active state is subtle. Icons feel small. Strip doesn't have enough breathing room.

**Changes:**
- Active category: pill background (bg-primary/10, text-primary, ring-1 ring-primary/20) instead of underline
- Icon size: 22px (was ~20px); bump category item min-width to 82px
- Add "All" pill as first item, auto-selected by default
- Smooth scroll snap on mobile so categories don't partially show

### 3. Homepage Hero (`app/[locale]/(public)/page.tsx`)

**Current issues:** Hero is functional but generic. Headline is too small on mobile. Social proof not prominent enough.

**Changes:**
- Hero height: min-h-[340px] (mobile) → min-h-[480px] (desktop) — give it more breathing room
- Headline size: text-4xl sm:text-5xl lg:text-6xl (from text-4xl sm:text-5xl)
- Add "Lompoc, CA" location text with amber dot accent above headline
- Tagline: add "Updated daily" amber badge next to deal count
- Search bar: increase to h-14 on mobile, add category dropdown on right side
- Below hero: show 3 quick-access category chips (most popular) as CTA area

### 4. Deal Card (`components/deal-card.tsx`)

**Current issues:** Image area too short (h-48). Business name hierarchy unclear. Discount badge styling could be bolder.

**Changes:**
- Image height: h-52 (from h-48) — more visual impact
- Discount badge: Larger, bolder — bg-amber text-amber-foreground (was primary color), font-bold text-base
- Layout: Business name ABOVE deal title (helps brand recognition), both with clearer type scale
- Add thin colored top-border strip on card matching business category color (subtle brand differentiation)
- "Get Deal" button: full-width, primary variant, h-10 (was unspecified)
- Hover: scale to 1.02 (was 1.0), shadow-xl (was shadow-lg) — more dramatic lift
- Skeleton loading state: add shimmer animation matching card layout

### 5. Business Profile Page (`app/[locale]/(public)/biz/[slug]/page.tsx`)

**Current issues:** No cover image displayed prominently; header card feels flat; map is buried.

**Changes:**
- Cover image: Show as full-width 16:9 hero at top of page (h-48 sm:h-64) with gradient overlay
- Logo: Float over cover image, bottom-left, 80x80px with white ring border
- Header metadata: Move below cover image in a clean info bar (category, deal count, address)
- Map: Move to prominent position (top of sidebar, always visible without scrolling)
- "Claim Business" CTA: sticky bottom bar on mobile (not buried in content)

### 6. Mobile Navigation (Bottom Tab Bar)

**Current issues:** Mobile nav items are crammed into header or scattered. Not true tab bar pattern.

**Changes:**
- True bottom tab bar: fixed, h-16, safe-area padding, frosted glass bg
- 5 items max: Home (feed), Explore (map), Search, Deals (category), Profile
- Active: icon filled + label, primary color
- Inactive: icon outline + label, muted-foreground
- Hide on scroll down (like iOS YouTube), reveal on scroll up

### 7. Search Page (`app/[locale]/(public)/search/page.tsx`)

**Current issues:** Search page is bare. No recent searches, no category filters.

**Changes:**
- Add category filter chips below search bar
- Show "recent searches" when query empty (stored in localStorage)
- Results grid: same deal-card component, no changes needed

### 8. Empty States

- Add friendly illustrated empty states for: no deals in category, no search results, empty favorites
- Style: simple SVG illustration + warm headline + CTA button
- Use Lompoc landmarks as illustration subjects (flower field, mission, downtown)

---

## Implementation Plan (Phased)

### Phase 1 — Design Tokens + Deal Card (Highest Impact)
1. Add amber color tokens to `app/globals.css`
2. Redesign `deal-card.tsx` — image height, badge, business name hierarchy, hover state, skeleton
3. Add deal card skeleton component `components/deal-card-skeleton.tsx`
4. Test on homepage — commit

### Phase 2 — Homepage Hero
5. Rework hero section in `app/[locale]/(public)/page.tsx`
6. Bigger headline, amber location badge, taller container, improved search bar CTA area
7. Commit

### Phase 3 — Category Strip + Header
8. Update category strip — pill active state, better icon sizing, "All" pill
9. Update header — logo refinement, mobile simplification, weather badge desktop-only
10. Commit

### Phase 4 — Business Profile Page
11. Full-width cover image banner
12. Floating logo over cover
13. Map to top of sidebar
14. Mobile sticky "Claim Business" CTA
15. Commit

### Phase 5 — Mobile Bottom Nav
16. New `components/bottom-nav.tsx` component
17. Integrate into root layout for mobile
18. Hide/show on scroll behavior
19. Commit

### Phase 6 — Empty States + Polish
20. Empty state components
21. Skeleton loaders for deal grid
22. Final typography and spacing pass
23. Commit

---

## Constraints

- Stack: Next.js 14, Tailwind CSS, shadcn/ui — no new UI libraries
- No new npm dependencies without ADR entry
- All changes backward-compatible (no schema changes)
- Must maintain bilingual (EN/ES) support
- Must not break existing functionality

---

## Success Criteria

- Lighthouse mobile performance score ≥ 85 (current unknown)
- All touch targets ≥ 44px
- Color contrast ≥ 4.5:1 on all text
- Zero horizontal scroll on 375px viewport
- Deal card skeleton loads instead of content jump
- Business owner feedback: "looks professional enough to show a client"
