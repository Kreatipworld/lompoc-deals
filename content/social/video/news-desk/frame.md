# Design spec — Lompoc Locals news desk

Brand truth for every frame. Mirrors the static news-kit cards
(`content/social/cards/cards-news-week.html`) so the video and the stills read
as one campaign.

## Palette

- `--purple: #650C75` — brand ground, end card, URL bands
- `--gold: #EFC618` — kicker chips, URL text, accents, serif subheads on dark
- `--green: #0B992F` — "lompoc news" serif label on light, secondary accent
- `--cream: #FAF5EC` — light canvas
- `--ink: #241629` — text on light, dark scrim base
- Scrim over photos: `linear-gradient(to top, rgba(36,22,41,.94), rgba(36,22,41,.55) 45%, rgba(36,22,41,.18))`

## Type

- Headlines: Plus Jakarta Sans 800, 88–120px, line-height ~1.02, white on dark / ink on light
- Serif voice: Georgia italic — subheads, "lompoc news" labels, 40–48px
- Kicker chips: gold bg, ink text, 800, 30–36px, letter-spacing 2–3px, 10px radius
- URL: gold, 800, 42–48px
- Credits: 22–24px, 60% opacity white, bottom-left

## Texture & structure

- SVG fractal-noise grain overlay at 7% on every scene
- Tri-color hairline bar (gold→purple→green gradient) as a structural accent
- Photos always full-bleed behind the ink scrim; content bottom-anchored
- Brand cards (no photo): flat purple or cream field + ambient decoratives
  (radial glow, ghost serif type at low opacity, hairline rules) — never dead flat

## Do / Don't

- Do keep every claim verbatim-verifiable against lompoclocals.com/news
- Do credit member photos ("photo: Spencer's Fresh Market")
- Don't use outlet photos, don't state launch dates/times, don't use pure #000/#fff
