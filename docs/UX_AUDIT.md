# Lompoc Deals — UX Audit
*Auditor: UX Lead (Design Pod) | Date: 2026-04-08 | Site: https://lompoc-deals.vercel.app*

---

## Audit Method

Each of the 8 Design Principles is scored 1–5 (5 = excellent). Issues are flagged with severity: 🔴 Critical, 🟡 Medium, 🟢 Low.

---

## Principle 1 — MOBILE FIRST (375px viewport)

**Score: 3/5**

| ✅ Pass | Issue |
|--------|-------|
| Bottom nav exists and hides on desktop | 🟡 Bottom nav `pb-16` on main — but hero height may feel short on small phones (340px) |
| Search bar is centered and usable | 🟡 Tab strip (Deals / Events / Wineries) overflows at 375px — 3 tabs barely fit |
| Category strip scrolls horizontally | 🟢 Weather widget stacks awkwardly between category strip and tab strip |
| Touch targets ≥ 44px for main CTAs | 🟡 Tab strip items are ~40px tall — just under threshold |

**Action:** Increase tab strip item height to 44px min. Remove WeatherWidget from homepage (move to a dedicated widget). Ensure hero is min-h-[420px] on mobile.

---

## Principle 2 — THREE-SECOND TEST

**Score: 3/5**

Headline "Where to next in Lompoc?" is clear but could be more action-oriented. The sub-headline explains it ("Coupons, specials, and announcements from the local businesses you already love") but takes 2 lines to read. Primary CTA is the search bar — good, but no explicit "Browse Deals" button above the fold. A first-time visitor might not know what to do after reading the headline.

| ✅ Pass | Issue |
|--------|-------|
| Lompoc photo background = instant location signal | 🔴 No explicit "Start here" CTA visible above fold on mobile — search bar alone is passive |
| Location badge "Lompoc, California" prominent | 🟡 Stats row (active deals / businesses) is low-contrast white/70 — not immediately readable |
| Deal count is shown | 🟢 "Updated daily" badge is amber — good, but buried in stats row |

**Action:** Add a primary CTA button below search: "See Today's Deals ↓". Make stats row full opacity.

---

## Principle 3 — ONE PRIMARY CTA PER SECTION

**Score: 4/5**

| Section | Primary CTA | Issue |
|---------|-------------|-------|
| Hero | Search bar | 🟡 Two secondary paths (search + stats link) compete without hierarchy |
| Business CTA | "List your business" | ✅ Clear |
| Footer | Weekly digest | ✅ Clear |
| Tab strip | None | 🟢 Tab strip has no primary CTA — just navigation |

**Action:** Hero section needs a secondary CTA button ("See Today's Deals") with clear hierarchy below the search bar.

---

## Principle 4 — REAL CONTENT

**Score: 3/5**

| ✅ Pass | Issue |
|--------|-------|
| Deal cards pull from real DB | 🔴 If DB has 0 deals, homepage shows empty grid — no empty state |
| Hero photo labeled as Lompoc photo | 🟡 Business CTA section has no real business examples — feels generic |
| Stats show real counts | 🟡 No testimonials or social proof from real Lompoc locals |

**Action:** Add testimonials section with 3 placeholders labeled "REPLACE WITH REAL QUOTE". Add empty state for deal grid. Add 3 specific Lompoc business/neighborhood callouts in the "For Businesses" section.

---

## Principle 5 — ACCESSIBILITY

**Score: 3/5**

| ✅ Pass | Issue |
|--------|-------|
| SiteHeader uses `<header>` semantic element | 🔴 Tab strip uses `<Link>` for tab behavior — should use `role="tab"` / `role="tablist"` |
| Footer uses `<footer>` | 🟡 Hero background image: `aria-hidden` on overlay but background image set via inline style — no `<img alt="">` for screen readers |
| Skip-to-content link: not confirmed present | 🔴 No skip-to-main-content link visible in markup |
| Category strip: icon-only on some breakpoints | 🟡 Weather widget: no aria-label visible on outer container |

**Action:** Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>` in header. Add `id="main-content"` to `<main>`. Ensure tab strip has proper ARIA roles if used as tabs.

---

## Principle 6 — PERFORMANCE

**Score: 4/5**

| ✅ Pass | Issue |
|--------|-------|
| Deal card skeleton component exists | 🟡 Hero background image via inline `style` — not next/image, no lazy priority hint |
| Images lazy-loaded in deal cards | 🟡 Weather widget may block render if weather API is slow |
| Server-side data fetching in page.tsx | 🟢 No explicit `loading.tsx` tested |

**Action:** Convert hero background to `<Image priority fill>` via next/image. Wrap WeatherWidget in Suspense with a minimal skeleton.

---

## Principle 7 — BILINGUAL READY

**Score: 2/5**

| ✅ Pass | Issue |
|--------|-------|
| next-intl configured, EN/ES routes exist | 🔴 Homepage hardcodes most strings in JSX — not using `t()` from next-intl |
| Footer has language switcher link | 🟡 Hero headline, subhead, stats, tab labels are all hardcoded English |
| Language switcher exists in header | 🟡 Business CTA section text is hardcoded English |

**Action:** Wrap all user-visible strings in homepage with `useTranslations()` calls. Add translation keys for homepage sections to `messages/en.json` and `messages/es.json`.

---

## Principle 8 — NO DARK PATTERNS

**Score: 5/5**

✅ No pre-checked boxes, hidden fees, or misleading CTAs found. Subscribe flow is opt-in. Business signup is clearly labeled as free. No countdown timers or artificial urgency.

---

## Summary

| Principle | Score |
|-----------|-------|
| 1. Mobile First | 3/5 |
| 2. Three-Second Test | 3/5 |
| 3. One CTA per section | 4/5 |
| 4. Real Content | 3/5 |
| 5. Accessibility | 3/5 |
| 6. Performance | 4/5 |
| 7. Bilingual Ready | 2/5 |
| 8. No Dark Patterns | 5/5 |
| **Total** | **27/40** |

---

## Priority Fixes (This Sprint)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Add "See Today's Deals" CTA button in hero | S | High |
| 2 | Add testimonials section | M | High |
| 3 | Add How It Works section | M | High |
| 4 | Add FAQ section | M | Medium |
| 5 | Add empty state for deal grid | S | Medium |
| 6 | Fix tab strip ARIA roles | S | Medium |
| 7 | Add skip-to-content link | S | Medium |
| 8 | Wrap homepage strings in i18n | L | Low (next sprint) |

---

## Missing Homepage Sections (vs. Design Brief)

The current homepage is missing 3 of the 9 spec'd sections:

- ❌ **Section 5: How It Works** — 3 steps, icons + one line each
- ❌ **Section 6: Why Locals Love It** — 3 testimonials with name + neighborhood
- ❌ **Section 8: FAQ** — 4-6 questions

These will be implemented in Step 4 of the work protocol.
