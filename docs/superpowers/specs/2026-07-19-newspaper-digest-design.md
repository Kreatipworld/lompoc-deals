# Newspaper Front-Page Digest — Design

**Date:** 2026-07-19
**Status:** Approved design, ready for implementation planning

## Goal

Turn the weekly master digest email into something that reads like the **front page of a
newspaper** — dense, scannable, image-anchored — and give it a matching **interactive web
"edition"** on the site where the real gallery/slide experience lives. The email must work for a
young-to-old audience across every inbox; the interactivity lives on the web where it can be
reliable.

## Why not interactive email

Swipeable carousels and slides depend on JS/CSS that Gmail and Outlook strip, and Gmail is where
most subscribers (especially older ones) read. A carousel that breaks in the majority of inboxes is
worse than a clean layout that always works. So: **the email is a bulletproof teaser; the
interactive experience is a web page** linked from the email. This mirrors how real newsletters
work.

## Two pieces (build email first, web edition second)

Both read from the **existing** `getMasterDigestContent()` in `lib/digest.ts` (events, deals,
things-to-do, partners). No new data layer.

---

### Piece 1 — Newspaper front-page email (replaces the current master digest)

Rebuild `sendMasterDigestEmail` in `lib/email.ts`. Everything else about the digest pipeline
(cron, admin comms preview/test-send, subscriber loop) stays the same — only the rendered HTML and
subject change.

**Visual identity ("branded newspaper"):**
- Newsprint cream ground `#f7f3ec`, ink `#1a1712`, brand purple `#650C75`, gold `#EFC618` rule
  accent, warm hairline `#d8cfc0`.
- **Georgia serif** throughout (email-safe; no webfont — avoids silent fallback).
- Single column, `max-width:620px`, table-based layout (email-bulletproof). Renders fine on phones.

**Structure (top → bottom), tuned for density / minimal scroll:**
1. **Compact masthead** — "The Lompoc Locals" nameplate, gold rule, dateline
   (`Mon · July 20, 2026 · Vol. I, No. N · lompoclocals.com`). Small, not a full screen.
2. **Lead story** — headline + small hero photo **side-by-side** in one row. The lead is the
   single most compelling item that week: the **soonest marquee event** if one exists, otherwise
   the **top deal**.
3. **📅 This Week's Calendar** — tight dated table (date cell + headline + italic location), up to
   ~5 events. No per-item images.
4. **🎟️ Deals of the Week** — one-line entries, gold discount chip + headline + business, up to
   ~4 deals.
5. **🌟 Around Town** and **🤝 Neighbors** — **two columns side-by-side**, text link lists.
6. **CTA** — "Read the full edition online →" → the web edition (`/this-week`). Section-level
   "see more" links also point there.
7. **Footer** — unsubscribe + site link, bilingual.

**Copy decisions:** light emoji kept in section labels (aid scanning, render everywhere).
Bilingual by subscriber locale (en/es), like the current digest.

**Reference mockup:** the dense variant approved in this session
(scratchpad `newspaper-digest-mockup.html`). Port it faithfully, wiring each block to real content;
gracefully omit any section with no content that week.

---

### Piece 2 — Interactive web edition at `/this-week`

New public route: `app/[locale]/(public)/this-week/page.tsx` (served at `/en/this-week` and
`/es/this-week`). Shows the **current week's** edition.

- **Masthead** matching the email's newspaper identity — one consistent brand.
- **Swipeable photo galleries** for businesses / things-to-do: swipe on touch, arrow buttons on
  desktop, keyboard-accessible, `prefers-reduced-motion` respected.
- **Mobile-first, large tap targets, big type, high contrast** — legible young-to-old.
- Reuses `getMasterDigestContent()`; always in sync with the email.
- Bilingual via next-intl like the rest of the site.
- **MVP = current week only.** Dated archive permalinks (`/this-week/2026-07-20`) are explicitly
  out of scope for now (revisit later; keep the data shape archive-friendly).

## Non-goals

- No AMP email. No CSS/JS interactivity inside the email.
- No dated edition archive in the first pass.
- No change to the digest cron schedule, subscriber model, or admin comms plumbing — only the
  rendered email and the new page.

## Success criteria

- The weekly digest email renders as the dense newspaper front page in Gmail, Apple Mail, and
  mobile Outlook, from real DB content, in both locales, with empty sections omitted cleanly.
- `/en/this-week` and `/es/this-week` render the same week's content with working swipeable
  galleries on touch and desktop, accessible via keyboard.
- The email's "full edition" CTA links to the web edition.
