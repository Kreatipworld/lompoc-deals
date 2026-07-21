# Page Consistency & First Impression — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Every browse page opens with the same compact brand band, one container width, one vertical rhythm — and the decorative layers that repeat the heading are gone.

**Architecture:** Build one `PageHeader` component, then adopt it page by page. Presentation only — no data, query, or routing changes.

**Tech Stack:** Next.js 14 App Router, Tailwind, next-intl, React 18.

## Global Constraints

- **Presentation only.** No data, query, or routing changes. No new dependencies.
- **In scope (7 pages):** `businesses`, `feed`, `deals`, `events`, `activities`, `category/[slug]`, `this-week`. Nothing else.
- **The homepage is deliberately exempt** — it is the front door and keeps its tall hero. Do not touch `app/[locale]/(public)/page.tsx`.
- **`this-week` keeps its newspaper masthead.** It is an intentional editorial identity matching the digest email; it must NOT be converted to the standard `PageHeader`. It is in scope only for container width and vertical rhythm.
- **The test for removing copy:** if removing a line loses no information, remove it. Counts, dates, prices, locations and status all carry information — keep them. Restatements of the adjacent heading do not.
- **Delete orphaned translation keys** from BOTH `messages/en.json` and `messages/es.json`. The two files must remain at exact key parity. Never leave a key that nothing renders.
- Accessibility: each page keeps exactly one real `<h1>`; do not damage the heading outline.
- Bilingual: Spanish strings are longer — verify `/es` on every page you touch.
- Dark mode must not break (`darkMode: ["class"]`).
- **Mobile-first work already landed** (compact section headers, scrolling filters, bottom clearance). Do not undo it: `MOBILE_BOTTOM_CLEARANCE` in `lib/layout-constants.ts`, the chip row in `components/category-chip-row.tsx`, and the `hidden sm:block` collapses.
- Verify: `node_modules/.bin/tsc --noEmit`, `npm run lint`, `npm run build`.

## Reference

Approved design: `docs/superpowers/specs/2026-07-21-page-consistency-design.md` — read it first; it holds the measured diagnosis and success criteria.

---

### Task 1: Build the `PageHeader` component

**Files:**
- Create: `components/page-header.tsx`

**Required outcome:** one server component that renders the compact brand band described in the spec.

Contract:
```tsx
export function PageHeader(props: {
  title: string          // becomes the page's single <h1>
  meta?: React.ReactNode // ONE line of factual context (counts, dates, location)
  backHref?: string      // optional "up a level" link
  backLabel?: string
  children?: React.ReactNode // optional actions slot, right-aligned on desktop
}): JSX.Element
```

- Brand purple background, white text, **left-aligned**, compact vertical padding (noticeably tighter than today's `py-16 sm:py-24` homepage hero — target roughly `py-6 sm:py-8`).
- One title size and weight, used by every adopting page — no per-page overrides.
- Uses the same container width constant the pages will use (see Task 2); define that constant here or in `lib/layout-constants.ts` so there is a single source of truth.
- `meta` renders on one line at a smaller size with reduced opacity.
- Back link renders above the title with a left-chevron, using `Link` from `@/i18n/navigation` (locale-aware — NOT `next/link`).
- Must be safe to render with only `title` supplied.

**Important:** if you put any Tailwind class string in `lib/layout-constants.ts`, note that `lib/**` IS already in the Tailwind content globs (added previously) — but a constant exported from a `"use client"` module and imported by a Server Component renders as `[object Object]`. Keep shared constants in a non-client module.

- [ ] **Step 1:** Read `docs/superpowers/specs/2026-07-21-page-consistency-design.md`, then read two existing page headers (`businesses/page.tsx` and `feed/page.tsx`) to see the current markup and the brand classes in use.
- [ ] **Step 2:** Write the component per the contract above.
- [ ] **Step 3:** Verify `node_modules/.bin/tsc --noEmit` and `npm run lint` are clean. The component is unused at this point — that is expected.
- [ ] **Step 4:** Commit — `git add components/page-header.tsx lib/layout-constants.ts && git commit -m "feat: shared PageHeader for consistent page openings"`

---

### Task 2: Adopt `PageHeader` on businesses, feed, deals

**Files:**
- Modify: `app/[locale]/(public)/businesses/page.tsx`, `feed/page.tsx`, `deals/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (removing orphaned keys)

**Required outcome:** all three open with `PageHeader`, share one container width, and lose the decorative layers.

Current state to fix (measured):
- businesses `max-w-6xl` / `py-8 sm:py-10` / h1 3xl→4xl bold
- feed `max-w-6xl` / `py-8 sm:py-10` / h1 3xl→4xl **semibold**
- deals `max-w-3xl` / `py-10 sm:py-12` / h1 4xl→5xl bold, **centered**

- [ ] **Step 1: Inventory before editing.** For each page, list in your report: its current container width, its hero markup, and every eyebrow pill / subtitle, marking each as INFORMATIVE (keep) or RESTATEMENT (cut). Do this before changing anything so the change set is deliberate.
- [ ] **Step 2:** Replace each page's bespoke hero with `PageHeader`. Move genuinely factual context (counts etc.) into `meta`. Cut restatements.
- [ ] **Step 3:** Converge all three on the single container width from Task 1.
- [ ] **Step 4:** Remove now-unused translation keys from BOTH message files. Verify key parity programmatically and paste the result.
- [ ] **Step 5:** Verify `tsc`, `lint`, `build` clean. Then run the dev server (check the log for the actual port — may not be 3000) and curl all three pages in `/en` and `/es`: each must return 200 with its title present.
- [ ] **Step 6:** Commit — `git add -A && git commit -m "feat: businesses, feed and deals adopt the shared page header"`

---

### Task 3: Adopt `PageHeader` on events, activities, category

**Files:**
- Modify: `app/[locale]/(public)/events/page.tsx`, `activities/page.tsx`, `category/[slug]/page.tsx`
- Modify: `messages/en.json`, `messages/es.json`

**Required outcome:** same as Task 2 for the three most divergent pages.

Current state to fix (measured):
- events `max-w-5xl` / `py-10` / h1 3xl→4xl **semibold**, and **no hero at all** (dark text on plain background) — the biggest visual outlier
- activities `py-10` with a **light `bg-accent/30` band** and a light-style eyebrow pill — the other outlier
- category `max-w-6xl` — already carries the mobile chip row from the previous pass

**Do not disturb** the category page's chip row (`components/category-chip-row.tsx`) or its open-now integration — that work shipped and is verified. Replace only the hero block above it.

The category page's meta line ("103 businesses in Lompoc · 2 deals") is INFORMATIVE — keep it, moved into `meta`.

- [ ] **Step 1: Inventory before editing**, same format as Task 2 Step 1.
- [ ] **Step 2:** Adopt `PageHeader` on all three, converting events and activities away from their outlier treatments.
- [ ] **Step 3:** Converge container widths; cut restatements.
- [ ] **Step 4:** Remove orphaned translation keys from both files; verify parity programmatically.
- [ ] **Step 5:** Verify `tsc`, `lint`, `build` clean; curl all three in both locales (category: use a real slug such as `food-drink`) — 200 with titles present. Confirm explicitly in your report that the category chip row still renders.
- [ ] **Step 6:** Commit — `git add -A && git commit -m "feat: events, activities and category adopt the shared page header"`

---

### Task 4: Vertical rhythm + `this-week` container

**Files:**
- Modify: the six pages from Tasks 2–3, plus `app/[locale]/(public)/this-week/page.tsx`

**Required outcome:** one consistent section-spacing scale across the in-scope pages, and `this-week` aligned to the shared container width.

- Sections currently use ad hoc `py-8` / `py-10` / `py-12` / `py-14` / `py-16`. Converge on ONE scale (a mobile value and an `sm:` value), applied consistently.
- **`this-week` keeps its newspaper masthead** — do not replace it with `PageHeader`. Only align its container width and section rhythm.
- Do not undo the mobile work (`hidden sm:block` collapses, chip row, bottom clearance).

- [ ] **Step 1:** Inventory the section paddings actually in use across the seven pages; propose the single scale in your report before applying it.
- [ ] **Step 2:** Apply the scale consistently.
- [ ] **Step 3:** Verify `tsc`, `lint`, `build` clean; curl all seven pages in both locales — all 200. Confirm the `this-week` masthead is intact.
- [ ] **Step 4:** Commit — `git add -A && git commit -m "feat: single vertical rhythm across browse pages"`

---

### Task 5: Whole-pass verification

**Files:** none.

- [ ] **Step 1:** `node_modules/.bin/tsc --noEmit`, `npm run lint`, `npm run build` — all clean.
- [ ] **Step 2:** Translation parity — compare the full key sets of `en.json` and `es.json` programmatically; the symmetric difference must be empty. Paste the result.
- [ ] **Step 3:** Confirm no orphaned keys: for each key removed during this pass, grep that nothing still references it.
- [ ] **Step 4:** Curl all seven in-scope pages in `/en` and `/es` — report the actual status codes and confirm each page's `<h1>` text is present.
- [ ] **Step 5:** Grep the seven pages for leftover bespoke hero markup (e.g. `bg-white/15`, `backdrop-blur-sm` eyebrow pills) and report anything that survived, so nothing is silently half-migrated.
- [ ] **Step 6:** **Report what could NOT be verified** — visual appearance was not confirmed by a human or browser. List what a person should check: consistent header across pages, aligned column edges, no repeated headings, content starting high.

---

## Self-Review

**Spec coverage:** one `PageHeader` → Task 1; adoption → Tasks 2–3; one container width → Tasks 2–4; one vertical rhythm → Task 4; cut non-informative copy → Tasks 2–3; translation-key hygiene → Tasks 2–3, verified in Task 5. Homepage exemption and `this-week` masthead exemption are stated in Global Constraints and Task 4. ✅

**Placeholder scan:** No TBDs. Tasks specify required outcomes, the exact files, and the measured current state, with a mandatory read/inventory step first — the current JSX is the source of truth and a stale transcription would be worse.

**Type consistency:** `PageHeader`'s props are defined once in Task 1 and consumed unchanged in Tasks 2–3.

## Follow-ups for the human

- Visual confirmation across pages (the browser extension is not connected here).
- Remaining pages (map, blog, hotels, garage-sales, search, locals, for-businesses) in a later pass if this direction lands.
