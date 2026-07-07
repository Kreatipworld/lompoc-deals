# /for-businesses Hero + Animated Storyboard — Design Spec

*Date: 2026-07-06 · Approved*

## Goal

Give /for-businesses the community-photo hero treatment (matching /locals) and replace the static how-it-works explanation with a fun auto-playing animated storyboard of the merchant journey.

## Scope

1. **Hero**: background becomes `public/lompoc-community-2.jpg` (Ryon Park festival, ground-level crowd — distinct from /locals' aerial). Left-to-right purple wash (dark ~0.92 behind copy → ~0.22 over the crowd), matching /locals. Hero copy/CTAs unchanged unless a line conflicts with the image framing.
2. **MerchantDemo** (`components/merchant-demo.tsx`, client): mock-panel storyboard, 3 scenes, auto-advance ~4s, clickable dots, pause-on-hover, `prefers-reduced-motion` → static panels/no auto-advance.
   - Scene 1 "Post your deal": mini form; title text types itself; Publish button pulses.
   - Scene 2 "Locals see it": deal card pops into a mini feed; hearts float; claims counter ticks up (animejs, dynamic import like AnimatedCounter).
   - Scene 3 "Watch it work": mini stats; bars grow to views/claims/redeems; numbers count up.
   - Labels via serializable props from the server page.
3. The storyboard replaces the page's existing static explanation section; pricing/tiers/CTAs untouched.

## Constraints

EN/ES parity (page's existing namespace); brand tokens only; no new dependencies (animejs + existing CSS keyframes); tsc + lint clean; smoke EN + ES in prod.
