# Mobile-First UX Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make browse surfaces usable on a phone — at least one business card visible without scrolling at 390×844, filters on one row, and nothing floating over content.

**Architecture:** Four independent presentation changes. No data, query, or routing changes. Every change is mobile-first with the existing desktop treatment preserved at `sm:`/`md:` breakpoints.

**Tech Stack:** Next.js 14 App Router, Tailwind (`darkMode: ["class"]`), next-intl, React 18, lucide-react.

## Global Constraints

- **Mobile-first, desktop-unchanged.** Every change targets the default (mobile) breakpoint and must preserve today's appearance at `sm:` and above. If unsure whether something is desktop-visible, verify before changing it.
- **Nothing fixed may overlap content.** If an element is `fixed`, the page must reserve space for it.
- **Brand tokens only.** Brand purple `#650C75` (`--primary`), gold `#EFC618` (`--gold`), green `#0B992F` (`--success`). Prefer existing CSS custom properties / Tailwind tokens over new hardcoded hex. **No `#4F46E5` may remain anywhere in the codebase.**
- **Minimum 44px touch targets** on anything tappable.
- **Bilingual:** Spanish strings are longer than English. Any layout change must be checked at `/es` as well as `/en`.
- **Dark mode must not break** — the repo uses `darkMode: ["class"]`; if you add a colour, give it a dark variant where siblings have one.
- **No data/query/routing changes.** Presentation only.
- Verify commands: `node_modules/.bin/tsc --noEmit`, `npm run lint`, `npm run build`.

## Reference

Approved design: `docs/superpowers/specs/2026-07-20-mobile-first-ux-design.md` — read it before starting; it contains the measured diagnosis and the success criteria.

An existing horizontal scroll-snap pattern already lives in `components/edition-gallery.tsx` and the `.edition-track` / `.scrollbar-none` utilities in `app/globals.css`. Follow that pattern rather than inventing a new one.

---

### Task 1: Category filters — one scrolling row, with "Open now" inside it

**Files:**
- Modify: `components/category-chips.tsx`
- Modify: `app/[locale]/(public)/category/[slug]/page.tsx` (the "Open now" toggle currently lives here, outside the chip row)
- Possibly modify: `app/globals.css` (only if a new utility is genuinely needed)

**Problem:** `components/category-chips.tsx` renders with `flex flex-wrap`, so 9 categories wrap to ~4 rows (~180px) on a phone. Separately, the "Open now" toggle is rendered inside the category page rather than in the chip component, so it floats orphaned to the right instead of joining the filter flow.

**Required outcome:**
- Chips render as **one horizontally scrollable row** on mobile using scroll-snap and `.scrollbar-none`, following the `components/edition-gallery.tsx` pattern.
- **"Open now" becomes the first item in that same row**, so all filtering reads as a single control. It must keep its current behaviour (toggles the `?open=1` search param) and its active/inactive styling intent.
- The **active chip is scrolled into view on load** so a visitor can see where they are. A small client component or `scroll-into-view` on mount is acceptable; do not convert the whole page to client rendering.
- Each chip keeps a **minimum 44px touch target**.
- At `sm:` and above, keep today's wrapping behaviour — there is room there.
- Row must not cause horizontal overflow of the page body.

- [ ] **Step 1: Read the current implementation**

Read `components/category-chips.tsx` in full, and the section of `app/[locale]/(public)/category/[slug]/page.tsx` that renders the "Open now" toggle (search for `openNow`). Note how the toggle builds its href from `toggledParams` — that logic must be preserved exactly, only relocated.

Also read `components/edition-gallery.tsx` and the `.edition-track` rule in `app/globals.css` to match the established scroll pattern.

- [ ] **Step 2: Move "Open now" into the chip row**

`CategoryChips` is an async server component. Give it an optional prop for the open-now state and href so the category page can pass its existing values in, rather than duplicating the param logic. Render it as the first item in the row.

Keep the visual distinction between the open-now filter and the category chips (it is a different kind of filter) — e.g. its existing status dot — but it must sit in the same row and scroll with it.

- [ ] **Step 3: Convert the row to horizontal scroll**

Replace `flex flex-wrap` with a horizontally scrolling, snapping row on mobile that reverts to wrapping at `sm:`. Use the existing `.scrollbar-none` utility. Add `overscroll-behavior-x: contain` so swiping the row does not trigger browser back-navigation (the `.edition-track` rule already does this — reuse it if appropriate).

- [ ] **Step 4: Scroll the active chip into view**

On mount, scroll the active chip into view within the row (not the page). Respect `prefers-reduced-motion` by using instant rather than smooth scrolling when reduced motion is requested.

- [ ] **Step 5: Verify**

Run: `node_modules/.bin/tsc --noEmit` → no errors.
Run: `npm run lint` → no new errors.
Run: `npm run build` → compiles.

Then start the dev server (`npm run dev` — check the log for the actual port, it may be 3001) and verify with curl on a category page in BOTH locales that the chips and the open-now control render in the same container. Spanish category names are longer — confirm the markup does not force page-level horizontal overflow.

- [ ] **Step 6: Commit**

```bash
git add components/category-chips.tsx app/[locale]/\(public\)/category/\[slug\]/page.tsx app/globals.css
git commit -m "feat: category filters scroll in one row with open-now inline"
```

---

### Task 2: Chat widget — on brand, and sized for mobile

**Files:**
- Modify: `components/ai-chat-widget.tsx`

**Problem:** the widget's design-token block (around line 12) is entirely pre-rebrand:
```ts
brand: "#4F46E5",                        // indigo — brand purple is #650C75
brandShadow: "rgba(79,70,229,0.35)",
brandBubbleShadow: "rgba(79,70,229,0.25)",
brandLight: "#EEF2FF",                   // indigo tint
accent: "#0D9488",                       // teal
```
It also renders a 56px FAB on mobile where 48px is enough.

**Required outcome:**
- `brand` becomes brand purple `#650C75`; the two shadow values become the matching purple rgba; `brandLight` becomes a light purple tint consistent with the brand rather than indigo.
- `accent` moves to a brand colour — prefer brand green `#0B992F` (`--success`, used for positive/online states elsewhere) unless reading the component shows the accent is used somewhere that green would read wrong, in which case use gold `#EFC618`. State your choice and reasoning in the report.
- **No `#4F46E5`, `79,70,229`, `#EEF2FF`, or `#0D9488` remain** in the file.
- The launch FAB is **48px (`w-12 h-12`) on mobile, 56px (`sm:w-14 sm:h-14`) on desktop**.
- Everything else about the widget's behaviour is unchanged.
- Contrast must remain legible — brand purple is dark, so white foreground on it is correct; check any place `brandLight` is used as a background for dark text.

- [ ] **Step 1: Read the component and map token usage**

Read `components/ai-chat-widget.tsx` and find every usage of `T.brand`, `T.brandShadow`, `T.brandBubbleShadow`, `T.brandLight`, and `T.accent`, so you understand what each colour actually paints before changing it.

- [ ] **Step 2: Replace the token values**

Update the token block to the brand palette per the outcome above.

- [ ] **Step 3: Resize the FAB for mobile**

Change the launch button to 48px on mobile and 56px from `sm:` up, keeping its icon proportionate and its 44px+ target satisfied.

- [ ] **Step 4: Verify**

Run: `node_modules/.bin/tsc --noEmit`, `npm run lint`, `npm run build` → all clean.
Run: `grep -rniE "4F46E5|79,70,229|EEF2FF|0D9488" --include="*.ts" --include="*.tsx" --include="*.css" .` (excluding node_modules) → must return nothing.

- [ ] **Step 5: Commit**

```bash
git add components/ai-chat-widget.tsx
git commit -m "feat: chat widget on brand palette, smaller FAB on mobile"
```

---

### Task 3: Nothing floats over content

**Files:**
- Modify: `components/bottom-nav.tsx` (export a shared clearance value or document the height)
- Modify: `app/[locale]/(public)/category/[slug]/page.tsx`, `app/[locale]/(public)/page.tsx`, `app/[locale]/(public)/businesses/page.tsx`, `app/[locale]/(public)/feed/page.tsx` — or, if they share a layout, the layout instead

**Problem:** the bottom nav (`fixed bottom-0`, `h-16`, `sm:hidden`) and the chat FAB (`fixed bottom-[4.5rem] right-3`) both sit above page content, but no page reserves space for them. On the category page the FAB visibly covers the third card.

**Required outcome:**
- In-scope pages reserve bottom space on mobile so **no card is ever underneath the bottom nav or the chat FAB**, with the space removed at `sm:` where the bottom nav is hidden.
- The clearance is derived from **one source of truth**, not a magic number copy-pasted per page. Prefer adding the padding once in the shared public layout if one exists — investigate `app/[locale]/(public)/layout.tsx` and `app/[locale]/layout.tsx` before touching four page files. Fewer edit sites is better here.
- Existing `pb-safe` / safe-area handling for notched devices must be preserved.
- Desktop spacing must not change.

- [ ] **Step 1: Investigate the layout structure**

Read `app/[locale]/layout.tsx` (which renders `<BottomNav />`) and any `(public)` layout. Determine the smallest number of places to add the clearance. Report what you found and why you chose that location.

- [ ] **Step 2: Add the clearance**

Apply bottom padding on mobile only (removed at `sm:`), sized to clear the 64px bottom nav plus the FAB above it. Keep `pb-safe`/safe-area insets working.

- [ ] **Step 3: Verify**

Run: `node_modules/.bin/tsc --noEmit`, `npm run lint`, `npm run build` → all clean.
Confirm by reading your change that the padding applies on mobile and is removed at `sm:`, and that you have not introduced the value in more than one place.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: reserve bottom space so fixed nav and chat never cover content"
```

---

### Task 4: Section headers collapse on mobile

**Files:**
- Modify: `app/[locale]/(public)/category/[slug]/page.tsx`, `app/[locale]/(public)/page.tsx`, `app/[locale]/(public)/businesses/page.tsx`, `app/[locale]/(public)/feed/page.tsx` (only where the pattern appears)

**Problem:** section headers stack an uppercase eyebrow (e.g. "FEATURED MEMBERS"), an H2, and a subtitle at desktop sizes — roughly 110px per section. On the category page this is the last thing between the visitor and the first business card.

**Required outcome:**
- On mobile, each in-scope section header collapses to essentially **one line**: the title at a reduced size, with the eyebrow and subtitle hidden (`hidden sm:block` or equivalent).
- At `sm:` and above the full editorial treatment is unchanged.
- The heading remains a real heading element — do not remove `h2`s or otherwise damage the document outline or screen-reader experience. Hiding decorative eyebrows/subtitles visually is fine; do not hide the actual title.
- Do not delete the eyebrow/subtitle strings or their translation keys — they still render on desktop.

- [ ] **Step 1: Find every occurrence**

Search the four in-scope pages for the eyebrow/title/subtitle pattern. List what you find in your report before editing, so the change set is deliberate rather than incidental.

- [ ] **Step 2: Apply the responsive collapse**

Apply consistently across the occurrences you found. If the pattern repeats more than twice, consider extracting a small shared `SectionHeader` component — but only if it genuinely reduces duplication without churn.

- [ ] **Step 3: Verify**

Run: `node_modules/.bin/tsc --noEmit`, `npm run lint`, `npm run build` → all clean.
Fetch each modified page in BOTH `/en` and `/es` with curl and confirm the title text is still present in the HTML (it must be — it is only visually restyled, not removed).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: compact section headers on mobile, full treatment on desktop"
```

---

### Task 5: Whole-pass verification

**Files:** none (verification only).

- [ ] **Step 1: Full checks**

Run: `node_modules/.bin/tsc --noEmit`, `npm run lint`, `npm run build` → all clean.

- [ ] **Step 2: Brand sweep**

Run `grep -rniE "4F46E5|79,70,229|EEF2FF|0D9488" --include="*.ts" --include="*.tsx" --include="*.css" .` (excluding node_modules) → must return nothing.

- [ ] **Step 3: Bilingual render check**

With the dev server running, fetch each in-scope page in `/en` and `/es`, and confirm each returns 200 and contains its expected content. Report the actual status codes.

- [ ] **Step 4: Report what could NOT be verified**

State plainly that visual appearance at 390×844 was not confirmed by a human or a browser, and list what a person should check: first card visible without scrolling, chips on one row with the active one in view, nothing under the FAB, chat button purple.

---

## Self-Review

**Spec coverage:**
- Filters on one scrolling row, open-now inline, active chip in view → Task 1 ✅
- Section headers collapse on mobile → Task 4 ✅
- Chat button on brand + smaller on mobile → Task 2 ✅
- Nothing floats over content, single source of clearance → Task 3 ✅
- Bottom nav brand alignment → already uses `text-primary` (brand purple); no change needed. Verified before planning — noted here so its absence is deliberate, not an omission.
- Desktop unchanged, bilingual, dark mode, 44px targets → Global Constraints, enforced per task ✅

**Placeholder scan:** No TBDs. Tasks intentionally specify *required outcomes* plus the files and the existing pattern to follow, rather than transcribed markup — the current JSX differs per page and a stale transcription would be worse than an instruction to read the file. Every task begins with a read step for this reason.

**Type consistency:** Only Task 1 changes a component signature (`CategoryChips` gains optional open-now props); its sole consumer, the category page, is edited in the same task.

## Follow-ups for the human

- Visual confirmation at 390×844 (cannot be automated here — the browser extension is not connected).
- Out-of-scope pages (business profiles, deals, events, map, activities, hotels) get the same treatment in a later pass if this direction lands.
