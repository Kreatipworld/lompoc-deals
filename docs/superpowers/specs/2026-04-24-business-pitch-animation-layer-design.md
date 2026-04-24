# Business-Pitch Animation Layer — Design Spec

**Date:** 2026-04-24
**Status:** Approved (awaiting implementation plan)
**Scope:** Phase 4 — adds a cohesive animation layer to the business-acquisition funnel (for-businesses, homepage biz CTA, signup wizard). Customer-side deal-finding UX is deferred to a later phase.

---

## 1. Goal

Make the business-pitch surfaces feel like a **premium, credible platform worth paying for**. The directory already animates customer-facing pages (map pins, category cards, directory landing). The pricing/signup funnel currently reads flatter than it should given the $29–79/mo ask. This phase closes that gap with six deliberate animation moments, all in the same motion vocabulary.

**Personality:** Polished & Premium — Airbnb/Stripe/Apple territory, not playful or hand-crafted.

**Non-goals:** No parallax, no scroll-hijacking, no full-page route transitions, no customer-side deal-finding changes. These are explicit.

---

## 2. Motion vocabulary

Single source of truth. Every animation in this phase uses these tokens. No bespoke timings.

```ts
// lib/motion.ts
export const DURATION = {
  hover: 220,
  transition: 300,
  entrance: 500,
  success: 900,
} as const

export const EASE = {
  standard: "cubicBezier(0.23, 1, 0.32, 1)", // matches --ease-out in globals.css
} as const

export const STAGGER = 120 // ms between siblings in a group
```

**Why these numbers:** they already match `--ease-out` and `fade-up` in `app/globals.css`. Staying on the existing curve keeps new motion visually consistent with the animations already shipped on the customer side (category cards, map pins).

---

## 3. Shared primitives

Two new files, used by every animation moment in this phase.

### 3.1 `lib/motion.ts`

Exports the motion tokens (above) plus a React hook:

```ts
export function usePrefersReducedMotion(): boolean
```

Returns `true` when the OS/browser has `prefers-reduced-motion: reduce`. SSR-safe (returns `false` on the server; re-reads on mount). Components use this to short-circuit entrance animations to their final state.

### 3.2 `components/reveal.tsx`

Thin client-component wrapper. One primitive, a few presets.

```tsx
<Reveal preset="fadeUp" delay={0}>
  <h1>Premium badge</h1>
</Reveal>

<Reveal preset="stagger" stagger={120}>
  {/* children reveal one-by-one when the group scrolls into view */}
</Reveal>
```

**Presets:**
- `fadeUp` — opacity 0→1, translateY(16px)→0, 500ms
- `fadeIn` — opacity 0→1, 500ms
- `scaleIn` — opacity 0→1, scale(0.98)→1, 500ms
- `stagger` — applies `fadeUp` to each direct child with 120ms stagger (uses `anime.stagger()`)

**Behavior:**
- Uses `IntersectionObserver` (threshold 0.15) — fires once per element; does not re-trigger on scroll-back.
- Respects `usePrefersReducedMotion()` — when true, renders final state immediately with no animation.
- Uses anime.js v4 dynamic import (same pattern as existing `components/AnimeReveal.tsx`), so the anime chunk doesn't bloat the critical path on non-animated routes.

**Why a new `<Reveal>` instead of reusing `AnimeReveal`:** `AnimeReveal` has a broader API surface (direction/distance/duration knobs). Phase 4 needs a constrained, preset-only primitive so every future page stays inside the motion vocabulary. `AnimeReveal` stays for existing uses; new code uses `<Reveal>`.

---

## 4. The six animation moments

All six ship together as one cohesive layer. Ordered by user-journey position.

### 4.1 `/for-businesses` hero entrance
- **File:** `app/[locale]/(public)/for-businesses/page.tsx` (lines 38–131)
- **What:** Headline, subtitle, stat card, and dual CTA buttons fade-up in 120ms stagger on mount.
- **Timing:** 500ms per element. Total sequence ~1s.
- **Implementation:** Wrap the four elements in `<Reveal preset="stagger">`.
- **Why:** First impression. Sets "premium" in the opening second.

### 4.2 `/for-businesses` pricing cards (3 tiers)
- **File:** `app/[locale]/(public)/for-businesses/page.tsx` (pricing section)
- **What:** Free / Standard / Premium cards scroll-reveal with 120ms stagger. The Standard card gets an additional subtle pulse animation on its "Recommended" badge (opacity 0.7→1, scale 1→1.05, 2s loop, ease-in-out).
- **Timing:** 500ms reveal, 2s badge pulse loop.
- **Implementation:** Wrap the three cards in `<Reveal preset="stagger">`. Badge pulse is CSS `@keyframes` added to `globals.css` (no JS).
- **Why:** Pay-the-bill moment. The badge pulse draws the eye to the recommended tier without being gaudy.

### 4.3 `/for-businesses` "How it works" (3-step benefits grid)
- **File:** `app/[locale]/(public)/for-businesses/page.tsx` (benefits grid)
- **What:** Three cards reveal in stagger on scroll-in.
- **Implementation:** Wrap in `<Reveal preset="stagger">`.
- **Why:** Reinforces progression/narrative.

### 4.4 Homepage "Own a Lompoc business?" section
- **File:** `app/[locale]/(public)/page.tsx` (lines 520–557)
- **What:** The gradient-backdrop card fades + gently scales (0.98→1) on scroll-in.
- **Implementation:** Wrap the section wrapper in `<Reveal preset="scaleIn">`.
- **Why:** This is the primary entry-point from the public home into the business funnel. Deserves a landmark moment.

### 4.5 Signup wizard step transitions (1→2→3)
- **File:** `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx`
- **What:** When advancing steps, the outgoing step fades + translates `-20px` x-offset; the incoming step fades + translates `+20px → 0`. 300ms total.
- **Implementation:** anime.js timeline driven by the wizard's current-step state. No library swap — stays with anime.js v4.
- **Reduced-motion fallback:** instant swap.
- **Why:** Conveys forward momentum; reduces cognitive cost when new form fields appear.

### 4.6 Signup success → Stripe redirect moment
- **Files:**
  - `lib/business-signup-actions.ts` (server action — contract change)
  - `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx` (new client-side success component + redirect)
- **What:** Before the browser navigates to Stripe Checkout, show a centered checkmark that scale-ins (`opacity 0→1`, `scale 0.6 → 1.1 → 1`, 450ms with ease-out), accompanied by a 2px-tall gold underline that sweeps left-to-right beneath the checkmark (`scaleX 0→1` originating from left, 450ms, 100ms after the check starts). Total 900ms, then `window.location.href = checkoutUrl`.
- **Implementation approach (design decision — not deferred):**
  1. `businessSignupSubmitAction` currently calls `redirect(checkoutSession.url)` server-side (line 158 of `lib/business-signup-actions.ts`). Change it to return `{ checkoutUrl: checkoutSession.url }` for paid plans instead. This preserves the server-action flow (account creation, subscription row, email) but hands the final navigation to the client so we can animate first.
  2. In the wizard's submit handler, read `checkoutUrl` from the action result. If present: render the `<SignupSuccessMoment>` overlay (anime.js timeline, 900ms). On timeline complete, `window.location.href = checkoutUrl`.
  3. Free plan path stays server-side (`redirect()` to `/signup/business/profile`) — no animation needed, as there's no payment anxiety gap.
- **Reduced-motion fallback:** overlay renders final state instantly (checkmark + full underline), redirect happens after 100ms (just long enough to avoid a flash-of-nothing).
- **Why:** Small earned-moment right before handing the user to Stripe — reduces the "did it work?" anxiety gap.

---

## 5. Accessibility

- **`prefers-reduced-motion: reduce`** — every primitive and timeline checks `usePrefersReducedMotion()` (or `window.matchMedia` in the success moment). When reduced-motion is on: elements render in their final state, no entrance animation plays, no badge pulse, signup steps hard-swap, success moment is instant.
- **Focus not on motion** — focus rings, keyboard navigation, tab order remain unaffected. No animation triggers on `:focus`.
- **No auto-scrolling** — nothing in Phase 4 moves the viewport for the user.
- **Motion doesn't gate content** — every animated element is readable in its final state; if the animation fails (anime chunk doesn't load, JS error), the page still functions (CSS fallback to final state).

---

## 6. Performance

- **anime.js v4** — already in the bundle via `components/AnimeReveal.tsx` and `components/AnimatedCounter.tsx` (~15kb gzipped). Phase 4 adds no new dependencies.
- **IntersectionObserver** — native, zero runtime cost for the scroll triggers.
- **Dynamic import** — `components/reveal.tsx` loads anime.js via `await import("animejs")` on first use. Pages without `<Reveal>` don't pay the cost.
- **CSS for the looping pulse** — pulse on the Recommended badge is CSS keyframes, not JS. Zero JS loop cost.
- **Reduced-motion short-circuit** — when the user opts out, zero animation work runs (no IntersectionObserver attached).

---

## 7. File inventory

### Created
- `lib/motion.ts` — tokens + `usePrefersReducedMotion()` hook
- `components/reveal.tsx` — `<Reveal>` primitive with presets

### Edited
- `app/globals.css` — add `@keyframes recommended-pulse` (CSS-only loop)
- `app/[locale]/(public)/for-businesses/page.tsx` — wrap hero, pricing, benefits
- `app/[locale]/(public)/page.tsx` — wrap "Own a Lompoc business?" section (lines 520–557)
- `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx` — step transitions + new `<SignupSuccessMoment>` overlay
- `lib/business-signup-actions.ts` — return `checkoutUrl` for paid plans instead of server-side `redirect()` (see §4.6)

### Not touched
- `components/AnimeReveal.tsx`, `components/AnimatedCounter.tsx` — left as-is; customer-side uses continue unchanged
- All customer-facing pages (deals feed, map, search, biz profile, deal-card) — out of scope for Phase 4

---

## 8. Open questions resolved

1. **Priority: business-pitch vs customer deal-finding?** → Business-pitch first.
2. **Personality: polished / playful / minimal?** → Polished & Premium.
3. **Scope: how many moments?** → Six, as listed above.
4. **Boundary between phases?** → Hard boundary. Phase 4 touches only the files in §7. Customer-side animations are a separate future phase.

---

## 9. Success criteria

Phase 4 is done when:

1. All six animations run on the correct surfaces with the motion tokens from §2.
2. `prefers-reduced-motion: reduce` fully disables every entrance animation and the badge pulse; final state is correct.
3. No new npm dependencies added.
4. No regressions on customer-side animations (`AnimeReveal`, `AnimatedCounter`, map pins, category cards).
5. Lighthouse performance score on `/for-businesses` unchanged or better vs pre-Phase-4 baseline.
6. Manual walkthrough: home → "Own a Lompoc business?" → `/for-businesses` → signup wizard → success moment. Each step feels deliberate, nothing feels gratuitous or slow.
