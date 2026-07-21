# Page Consistency & First Impression — Design

**Date:** 2026-07-21
**Status:** Approved design, ready for implementation planning

## Goal

Make every public page open the same way, so the site reads as one product instead of a set of
separately-built pages. Remove decorative layers that consume vertical space without telling the
visitor anything.

## Measured diagnosis

Comparing the opening block of each public page:

| Page | Container | Vertical padding | H1 size | Weight | Hero treatment |
|---|---|---|---|---|---|
| Home | `max-w-3xl` | `py-16 sm:py-24` | 4xl→6xl | bold | white on colour |
| Businesses | `max-w-6xl` | `py-8 sm:py-10` | 3xl→4xl | bold | white on colour |
| Feed | `max-w-6xl` | `py-8 sm:py-10` | 3xl→4xl | **semibold** | white on colour |
| Deals | `max-w-3xl` | `py-10 sm:py-12` | 4xl→5xl | bold | white on colour |
| Events | `max-w-5xl` | `py-10` | 3xl→4xl | **semibold** | **none** |
| Activities | — | `py-10` | 4xl | bold | **light accent** |

**Five container widths, four padding scales, three H1 sizes, two font weights, three hero
treatments.** Navigating between pages forces the eye to re-learn the layout each time, which is
what "not smooth" describes.

## Design

### 1. One `PageHeader` component

Every public page except the homepage opens with the same compact brand band:

```
▓▓▓ brand purple ▓▓▓
 Food & Drink
 103 businesses in Lompoc · 2 deals
─────────────────────────
 [content starts here]
```

Contract:
- **Title** — the page's `<h1>`, one consistent size and weight across all pages.
- **Meta line** (optional) — one line of *factual* context (counts, dates, location). Not a
  marketing subtitle.
- **Back link** (optional) — for pages that are a level down (e.g. a category).
- **Actions slot** (optional) — for a page-level control where one genuinely belongs.
- Left-aligned, not centered. Compact vertical padding. Brand purple background, white text.

The homepage is the deliberate exception: it is the front door and keeps a taller hero. Every
other page uses `PageHeader` with no per-page variation in size, weight, alignment, or padding.

### 2. One container width

All content pages use a single container width and horizontal padding. Pages currently ranging
from `max-w-3xl` to `max-w-6xl` converge on one value, so column edges line up as a visitor moves
between pages — a large part of what makes navigation feel smooth.

### 3. One vertical rhythm

Section spacing uses a single consistent scale rather than per-page values (`py-8` / `py-10` /
`py-12` / `py-16` chosen ad hoc). Consistent rhythm is what makes scrolling feel even.

### 4. Cut what doesn't inform

Remove, not merely hide:
- **Eyebrow pills that restate the title.** "● FEATURED MEMBERS" above a heading reading
  "Featured members here" is the same words twice.
- **Subtitles that add no information.** "Local favorites in this part of town" tells a visitor
  nothing they cannot see from the cards below it.
- **Duplicate section labels** where a heading and a badge say the same thing.

Keep any line that carries real information — counts, dates, prices, locations, status. The test
is simple: *if removing the line loses no information, remove it.*

Where copy is genuinely useful but redundant with the heading, prefer keeping the heading and
cutting the decoration around it.

### 5. Translation keys

Strings that become unused must have their translation keys removed from **both** `en.json` and
`es.json`, keeping the two files at parity. Do not leave orphaned keys behind.

## Non-goals

- No redesign of cards, the map, or any data presentation — this is page-frame consistency only.
- No change to navigation structure, routing, or what data each page shows.
- No new brand colours; the existing palette is unchanged.
- The homepage hero is deliberately exempt from the compact treatment.
- Dashboard and admin are out of scope (primarily desktop, different audience).

## Success criteria

- Every in-scope public page opens with the same `PageHeader`: identical title size, weight,
  alignment, padding, and background.
- All in-scope pages share one container width — column edges align when moving between pages.
- No eyebrow or subtitle remains that merely restates the heading beside it.
- No orphaned translation keys; `en.json` and `es.json` remain at exact key parity.
- Desktop and mobile both improve; no page regresses in either.
- Every in-scope page returns 200 in both locales with its title present.
- Content begins higher on the page than before on every page that had a tall hero.
