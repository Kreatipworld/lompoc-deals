# Business-Pitch Animation Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the six business-pitch animations defined in `docs/superpowers/specs/2026-04-24-business-pitch-animation-layer-design.md` — hero reveal, pricing-card stagger, "How it works" stagger, homepage biz-CTA scale-in, signup wizard step transitions, and a 900ms pre-Stripe success moment.

**Architecture:** Two shared primitives (`lib/motion.ts` tokens + hook, `components/reveal.tsx` wrapper) back five of the six animations. The sixth (success moment) is a standalone client component gated on a server-action contract change (return `{ checkoutUrl }` instead of server-side `redirect()` for paid plans). anime.js v4 is already installed — no new deps.

**Tech Stack:** Next.js 14 App Router · TypeScript · React 18 · Tailwind · anime.js v4 (already installed, used by `components/anime-reveal.tsx` and `components/animated-counter.tsx`).

**Verification model:** This project has no test runner configured. Each task ends with a manual browser verification step: `npm run dev`, visit the URL, confirm the described behavior. Type-check with `npx tsc --noEmit` before committing. No placeholder comments, no "TBD" — every step has complete code.

---

## File inventory (locked before task list)

### Created
- `lib/motion.ts` — motion tokens + `usePrefersReducedMotion()` hook
- `components/reveal.tsx` — `<Reveal>` primitive with `fadeUp` / `fadeIn` / `scaleIn` / `stagger` presets
- New function `SignupSuccessMoment` *inside* `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx` — keeps the signup flow co-located in one file

### Modified
- `app/globals.css` — add `@keyframes pop-badge-pulse` + `.animate-pop-badge` utility
- `app/[locale]/(public)/for-businesses/page.tsx` — wrap hero, pricing, "How it works"
- `app/[locale]/(public)/page.tsx` (lines 520–557) — wrap the "Own a Lompoc business?" section
- `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx` — step-transition timeline + success moment
- `lib/business-signup-actions.ts` — return `{ checkoutUrl }` for paid plans instead of `redirect()`

### Not touched
- `components/anime-reveal.tsx`, `components/animated-counter.tsx` — left as-is
- All customer-side pages — out of scope

---

## Task 1: Motion tokens + reduced-motion hook

**Files:**
- Create: `lib/motion.ts`

- [ ] **Step 1: Create `lib/motion.ts`**

```ts
/**
 * Shared motion tokens + reduced-motion hook.
 *
 * Every animation in the business-pitch layer uses these tokens — single
 * source of truth for duration, easing, and stagger cadence. Matches the
 * existing --ease-out / fade-up / card-enter timing already in globals.css.
 */

"use client"

import { useEffect, useState } from "react"

export const DURATION = {
  hover: 220,
  transition: 300,
  entrance: 500,
  success: 900,
} as const

// anime.js v4 easing string that matches --ease-out in globals.css
export const EASE = {
  standard: "cubicBezier(0.23, 1, 0.32, 1)",
} as const

export const STAGGER = 120 // ms between siblings in a group

/**
 * True when the OS/browser has `prefers-reduced-motion: reduce`.
 * SSR-safe: returns false on the server and re-reads on mount.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefers(mql.matches)
    const listener = (e: MediaQueryListEvent) => setPrefers(e.matches)
    mql.addEventListener("change", listener)
    return () => mql.removeEventListener("change", listener)
  }, [])

  return prefers
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/motion.ts
git commit -m "feat(motion): add shared motion tokens + usePrefersReducedMotion hook"
```

---

## Task 2: `<Reveal>` primitive component

**Files:**
- Create: `components/reveal.tsx`

- [ ] **Step 1: Create `components/reveal.tsx`**

```tsx
/**
 * <Reveal> — scroll-triggered entrance animation primitive.
 *
 * Constrained, preset-only API so every business-pitch surface animates
 * with the same vocabulary. Uses IntersectionObserver + anime.js v4.
 * Respects `prefers-reduced-motion`: renders final state instantly.
 */

"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { DURATION, EASE, STAGGER, usePrefersReducedMotion } from "@/lib/motion"

type Preset = "fadeUp" | "fadeIn" | "scaleIn" | "stagger"

interface RevealProps {
  children: ReactNode
  preset?: Preset
  /** Additional delay in ms before the animation starts. Default: 0. */
  delay?: number
  /** Stagger ms between children (only used with preset="stagger"). Default: 120. */
  stagger?: number
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Reveal({
  children,
  preset = "fadeUp",
  delay = 0,
  stagger = STAGGER,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const root = ref.current
    if (!root) return

    // Reduced motion — render final state, no animation
    if (reduced) {
      root.style.opacity = "1"
      root.style.transform = "none"
      if (preset === "stagger") {
        for (const child of Array.from(root.children) as HTMLElement[]) {
          child.style.opacity = "1"
          child.style.transform = "none"
        }
      }
      return
    }

    // Set initial state inline (prevents FOUC)
    const setInitial = (el: HTMLElement) => {
      el.style.opacity = "0"
      if (preset === "fadeUp" || preset === "stagger") {
        el.style.transform = "translateY(16px)"
      } else if (preset === "scaleIn") {
        el.style.transform = "scale(0.98)"
      }
    }

    if (preset === "stagger") {
      for (const child of Array.from(root.children) as HTMLElement[]) {
        setInitial(child)
      }
    } else {
      setInitial(root)
    }

    const run = async () => {
      const { animate, stagger: animeStagger } = await import("animejs")

      if (preset === "stagger") {
        const targets = Array.from(root.children) as HTMLElement[]
        animate(targets, {
          opacity: [0, 1],
          translateY: [16, 0],
          duration: DURATION.entrance,
          delay: animeStagger(stagger, { start: delay }),
          easing: EASE.standard,
        })
      } else {
        const keyframes: Record<string, unknown> = {
          opacity: [0, 1],
          duration: DURATION.entrance,
          delay,
          easing: EASE.standard,
        }
        if (preset === "fadeUp") keyframes.translateY = [16, 0]
        if (preset === "scaleIn") keyframes.scale = [0.98, 1]
        animate(root, keyframes)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -32px 0px" }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [preset, delay, stagger, reduced])

  return (
    // @ts-expect-error polymorphic ref
    <Tag ref={ref} className={className} style={{ willChange: "opacity, transform" }}>
      {children}
    </Tag>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual smoke test — render a throwaway usage**

Add temporarily to `app/[locale]/(public)/page.tsx` near the top of the page's return:
```tsx
<Reveal preset="fadeUp"><div style={{padding: 24, background: "red"}}>reveal smoke</div></Reveal>
```
(Don't forget to `import { Reveal } from "@/components/reveal"`.)

Run: `npm run dev` and visit `http://localhost:3000/en`.
Expected: red div fades up into place on load. Then remove the throwaway block before committing.

- [ ] **Step 4: Commit**

```bash
git add components/reveal.tsx
git commit -m "feat(motion): add <Reveal> primitive with fadeUp/fadeIn/scaleIn/stagger presets"
```

---

## Task 3: "Most popular" badge pulse CSS keyframe

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Find the existing keyframes block in `app/globals.css`**

Look for `@keyframes fade-up` or `@keyframes pin-pop-in` — the new keyframe goes adjacent to them so all motion definitions stay co-located.

- [ ] **Step 2: Add the keyframe and utility class**

Append these blocks near the other keyframes in `app/globals.css`:

```css
@keyframes pop-badge-pulse {
  0%, 100% {
    opacity: 0.9;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.06);
  }
}

.animate-pop-badge {
  animation: pop-badge-pulse 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-pop-badge {
    animation: none;
  }
}
```

**Note on the transform:** the "Most popular" badge in `for-businesses/page.tsx` uses `-translate-x-1/2` to center horizontally. The keyframe preserves that with `translateX(-50%)` so the pulse doesn't break centering.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(motion): add pop-badge-pulse keyframe for pricing 'Most popular' badge"
```

---

## Task 4: `/for-businesses` hero entrance animation

**Files:**
- Modify: `app/[locale]/(public)/for-businesses/page.tsx` (hero block, lines 52–131)

- [ ] **Step 1: Add the `Reveal` import**

Top of file, after the existing imports:

```tsx
import { Reveal } from "@/components/reveal"
```

- [ ] **Step 2: Wrap the four left-column hero elements in a single staggered `<Reveal>`**

Replace the current hero left column (the inner `<div>` containing the eyebrow badge, `<h1>`, `<p>`, and the CTA row) so the four children each reveal in sequence.

Change lines 54–93 from:

```tsx
            {/* Left: copy + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <MapPin className="h-3 w-3" />
                For Lompoc business owners
              </div>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                ...
              </h1>
              ...
            </div>
```

To:

```tsx
            {/* Left: copy + CTA */}
            <Reveal preset="stagger" as="div">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <MapPin className="h-3 w-3" />
                For Lompoc business owners
              </div>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                The locals are already looking. <br />
                <span className="italic text-primary">Be where they look.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Lompoc Deals is the free, hometown-first directory for the
                Flower Capital. Post your coupons, specials, and announcements
                in 30 seconds — and reach the people already searching for the
                shops they love.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
                >
                  Get started — it&apos;s free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/businesses"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border bg-background px-7 text-base font-semibold transition-colors hover:bg-accent"
                >
                  See who&apos;s on it
                </Link>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                ✓ Free forever for the basics &nbsp;·&nbsp; ✓ No credit card
                &nbsp;·&nbsp; ✓ 30-second setup
              </p>
            </Reveal>
```

**Important:** This makes the eyebrow badge, `<h1>`, `<p>`, CTA row, and trust footnote into 5 direct children of `<Reveal>`, which stagger in 120ms apart.

- [ ] **Step 3: Wrap the right-column stat card in a fadeIn Reveal with delay**

Change the right-column `<div className="relative">` (around line 96) to:

```tsx
            {/* Right: visual stat card */}
            <Reveal preset="fadeIn" delay={300} className="relative">
              <div className="relative rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5">
                {/* ...existing inner content unchanged... */}
              </div>
              {/* Decorative blob */}
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[40px] bg-primary/5 blur-2xl"
              />
            </Reveal>
```

(Inner content stays identical — just the outer `<div className="relative">` becomes `<Reveal preset="fadeIn" delay={300} className="relative">`.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. Visit `http://localhost:3000/en/for-businesses`.
Expected: On load, the left column's 5 items fade-up one by one (~120ms apart, ~500ms each). The right stat card fades in 300ms after the first left element starts.

- [ ] **Step 6: Reduced-motion check**

In your OS settings, enable "Reduce motion" (macOS: System Settings → Accessibility → Display → Reduce motion). Refresh the page.
Expected: no animation; all elements visible in final state immediately. Disable reduced motion after checking.

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/\(public\)/for-businesses/page.tsx
git commit -m "feat(motion): animate /for-businesses hero entrance"
```

---

## Task 5: `/for-businesses` pricing cards stagger + "Most popular" badge pulse

**Files:**
- Modify: `app/[locale]/(public)/for-businesses/page.tsx` (pricing section, lines 231–341)

- [ ] **Step 1: Wrap the 3-card pricing grid in a staggered `<Reveal>`**

Around line 245, change:

```tsx
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-3xl border bg-card p-7 shadow-sm">
              ...
            </div>

            {/* Standard — highlighted */}
            <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-7 shadow-lg ring-1 ring-primary/20">
              ...
            </div>

            {/* Premium */}
            <div className="flex flex-col rounded-3xl border bg-card p-7 shadow-sm">
              ...
            </div>
          </div>
```

To:

```tsx
          <Reveal preset="stagger" className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-3xl border bg-card p-7 shadow-sm">
              ...
            </div>

            {/* Standard — highlighted */}
            <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-7 shadow-lg ring-1 ring-primary/20">
              ...
            </div>

            {/* Premium */}
            <div className="flex flex-col rounded-3xl border bg-card p-7 shadow-sm">
              ...
            </div>
          </Reveal>
```

(Keep the three `<div>` cards' inner content exactly as-is — only the outer grid wrapper changes from `<div>` to `<Reveal>`.)

- [ ] **Step 2: Add the pulse class to the "Most popular" badge**

Around line 277, change:

```tsx
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                Most popular
              </div>
```

To:

```tsx
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground animate-pop-badge">
                Most popular
              </div>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Visit `http://localhost:3000/en/for-businesses`. Scroll down to the pricing section.
Expected:
- When pricing scrolls into view, cards reveal in stagger (Free → Standard → Premium, 120ms apart)
- The "Most popular" badge gently pulses (2.4s loop, subtle scale + opacity)
- Badge stays horizontally centered during the pulse (no drift)

- [ ] **Step 5: Reduced-motion check**

With reduced-motion enabled: cards render instantly (no stagger), badge pulse is disabled.

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/\(public\)/for-businesses/page.tsx
git commit -m "feat(motion): stagger /for-businesses pricing cards + 'Most popular' badge pulse"
```

---

## Task 6: `/for-businesses` "How it works" 3-step stagger

**Files:**
- Modify: `app/[locale]/(public)/for-businesses/page.tsx` (how-it-works section, lines 136–172; `Step` component at lines 402–429)

- [ ] **Step 1: Wrap the 3-step grid in a staggered `<Reveal>`**

Around line 151, change:

```tsx
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step num="01" title="..." body="..." delay={0} />
            <Step num="02" title="..." body="..." delay={80} />
            <Step num="03" title="..." body="..." delay={160} />
          </div>
```

To:

```tsx
          <Reveal preset="stagger" className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step num="01" title="Claim or list your business" body="Find your business in our directory and click 'Claim it,' or list a brand-new one in 30 seconds. Free forever." />
            <Step num="02" title="Add your details" body="Logo, hours, social links, and a description. Your profile goes live the moment our admin approves it (usually same-day)." />
            <Step num="03" title="Post deals when you want" body="Coupons, specials, announcements — post as many as you want, edit anytime, expire whenever. Locals see them on the feed." />
          </Reveal>
```

**Note:** we're dropping the `delay` prop from each `Step` usage — `<Reveal preset="stagger">` handles the stagger now. Do not delete the `delay` prop from the `Step` component signature yet (it's still used by the `Benefit` grid's sibling pattern in this file); just stop passing it from the "How it works" block.

- [ ] **Step 2: Remove the `animationDelay` style + `card-enter` class from `Step` component**

The staggered `<Reveal>` now controls the entrance. The `Step` component at lines 402–429 currently uses `card-enter` CSS class + inline `animationDelay`, which would double-animate. Change:

```tsx
function Step({
  num,
  title,
  body,
  delay = 0,
}: {
  num: string
  title: string
  body: string
  delay?: number
}) {
  return (
    <div
      className="relative rounded-3xl border bg-card p-7 shadow-sm card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      ...
    </div>
  )
}
```

To:

```tsx
function Step({
  num,
  title,
  body,
}: {
  num: string
  title: string
  body: string
}) {
  return (
    <div className="relative rounded-3xl border bg-card p-7 shadow-sm">
      <div className="font-display text-5xl font-semibold leading-none tracking-tight text-primary/30">
        {num}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. If TypeScript complains about unused `delay` prop at any `<Step>` usage site, remove it from those callsites — there should only be the three usages in the "How it works" block, all inside the new `<Reveal>`.

- [ ] **Step 4: Manual verification**

Visit `http://localhost:3000/en/for-businesses`. Scroll to the "How it works — Three steps. Done." section.
Expected: when the grid scrolls into view, the 3 cards fade-up in sequence (120ms apart). No double-animation, no flicker.

- [ ] **Step 5: Reduced-motion check**

Expected: cards render instantly, no stagger.

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/\(public\)/for-businesses/page.tsx
git commit -m "feat(motion): stagger /for-businesses 'How it works' 3-step grid"
```

---

## Task 7: Homepage "Own a Lompoc business?" section scale-in

**Files:**
- Modify: `app/[locale]/(public)/page.tsx` (lines 520–557)

- [ ] **Step 1: Add the `Reveal` import**

Near the top of `app/[locale]/(public)/page.tsx`, add:

```tsx
import { Reveal } from "@/components/reveal"
```

- [ ] **Step 2: Wrap the business-CTA card in `<Reveal preset="scaleIn">`**

Around line 520, change:

```tsx
      {/* ─────────────────────────────────────────────────
          BUSINESS CTA
         ───────────────────────────────────────────────── */}
      <section className="mx-auto mb-16 max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent to-background p-8 sm:p-12">
          ...
        </div>
      </section>
```

To:

```tsx
      {/* ─────────────────────────────────────────────────
          BUSINESS CTA
         ───────────────────────────────────────────────── */}
      <section className="mx-auto mb-16 max-w-6xl px-4">
        <Reveal preset="scaleIn" className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent to-background p-8 sm:p-12">
          <div
            aria-hidden
            className="absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full bg-primary/10 blur-2xl"
          />
          <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                For business owners
              </div>
              <h3 className="font-display text-3xl font-semibold tracking-tight">
                Own a Lompoc business?
              </h3>
              <p className="mt-3 text-muted-foreground">
                List your business, post your own coupons, and reach locals
                actively looking to spend at home. Free forever for the basics.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link
                href="/for-businesses"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.97]"
              >
                List your business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border bg-background px-5 text-sm font-medium [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-accent active:scale-[0.97]"
              >
                <Mail className="h-4 w-4" />
                Weekly digest
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
```

(The only structural change: the outer `<div className="relative overflow-hidden ...">` becomes `<Reveal preset="scaleIn" className="relative overflow-hidden ...">`.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Visit `http://localhost:3000/en`. Scroll to the "Own a Lompoc business?" section near the bottom of the homepage.
Expected: when it scrolls into view, the gradient card fades + scales from 0.98 → 1 over 500ms.

- [ ] **Step 5: Reduced-motion check**

Expected: card renders instantly in final state.

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/\(public\)/page.tsx
git commit -m "feat(motion): scale-in homepage 'Own a Lompoc business?' CTA section"
```

---

## Task 8: Server action contract change — return `checkoutUrl` for paid plans

**Files:**
- Modify: `lib/business-signup-actions.ts` (the `businessSignupSubmitAction` function)

**Context:** The current server action calls `redirect(checkoutSession.url)` server-side, which navigates the browser before any client-side animation can run. This task changes the contract so paid plans return `{ checkoutUrl }` to the client; the free-plan path keeps its server-side `redirect()` (no animation needed, no payment anxiety gap).

- [ ] **Step 1: Extend the `BizSignupState` type**

Find the type declaration near the top of `lib/business-signup-actions.ts` (around line 29):

```ts
export type BizSignupState = { error?: string } | undefined
```

Change to:

```ts
export type BizSignupState =
  | { error?: string; checkoutUrl?: string }
  | undefined
```

- [ ] **Step 2: Replace the `redirect(checkoutSession.url)` call with a return**

Inside `businessSignupSubmitAction`, find the block that currently reads (around line 158):

```ts
            redirect(checkoutSession.url)
          } catch (err) {
            if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err
            return { error: "Payment setup failed. Please try again or contact support." }
          }
```

Change the `redirect` line to `return`:

```ts
            return { checkoutUrl: checkoutSession.url }
          } catch (err) {
            if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err
            return { error: "Payment setup failed. Please try again or contact support." }
          }
```

- [ ] **Step 3: Find the MAIN paid-plan flow and apply the same change**

There's a second paid-plan code path in the same action (the flow that creates a new account and subscription). Search the file for the string `checkoutSession.url` — any other occurrence of `redirect(checkoutSession.url)` should also become `return { checkoutUrl: checkoutSession.url }`. Leave `redirect()` calls that go to `/signup/business/profile` (the free-plan path) unchanged.

Run: `grep -n "checkoutSession.url\|redirect(" lib/business-signup-actions.ts`
Confirm only free-plan redirects and the profile redirect remain as server-side `redirect()`; all `checkoutSession.url` references are now `return { checkoutUrl: ... }`.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (TypeScript may flag callsites in the wizard — we'll fix those in Task 11.)

- [ ] **Step 5: Commit**

```bash
git add lib/business-signup-actions.ts
git commit -m "refactor(signup): return checkoutUrl to client instead of server-redirecting to Stripe"
```

---

## Task 9: Signup wizard step transitions (1 → 2 → 3)

**Files:**
- Modify: `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx`

- [ ] **Step 1: Add motion imports**

Near the top of the file, after the existing `lucide-react` import block, add:

```tsx
import { useRef } from "react"
import { DURATION, EASE, usePrefersReducedMotion } from "@/lib/motion"
```

**Note:** `useState`, `useTransition`, `useCallback`, `useEffect` are already imported from React at the top; `useRef` may also already be there. Check line 3 — if `useRef` is missing, add it to that existing import line instead of adding a second line.

- [ ] **Step 2: Find the wizard orchestrator and add a ref + step-change effect**

Scroll to `export function BusinessSignupWizard(...)` (around line 371). Find the state declarations for the current step (it will look like `const [step, setStep] = useState(initialStep)` or similar).

Immediately after the state declarations, add:

```tsx
  const stepContainerRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(step)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = stepContainerRef.current
    if (!container) return
    if (reducedMotion) {
      prevStepRef.current = step
      return
    }
    if (prevStepRef.current === step) return

    const forward = step > prevStepRef.current
    prevStepRef.current = step

    let cancelled = false
    ;(async () => {
      const { animate } = await import("animejs")
      if (cancelled) return
      animate(container, {
        opacity: [0, 1],
        translateX: [forward ? 20 : -20, 0],
        duration: DURATION.transition,
        easing: EASE.standard,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [step, reducedMotion])
```

- [ ] **Step 3: Attach the ref to the step content wrapper**

Find the JSX that renders the current step (a conditional like `{step === 0 && <Step1 ... />}` or a switch). Wrap that rendering in a `<div ref={stepContainerRef}>` so the animation target is stable across step changes:

```tsx
      <div ref={stepContainerRef}>
        {step === 0 && <Step1 ... />}
        {step === 1 && <Step2 ... />}
        {step === 2 && <Step3 ... />}
      </div>
```

(Use the actual Step component names in the file. The wrapping div is new; the inner conditional rendering stays identical.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (we haven't wired the `checkoutUrl` return yet — that's Task 11).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. Visit `http://localhost:3000/en/signup/business`.
Go through step 1 → step 2 → back → forward. Expected:
- Forward (1→2, 2→3): content slides in from `+20px` and fades in (300ms)
- Backward (2→1): content slides in from `-20px`
- Reduced-motion: instant swap, no animation

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/\(auth\)/signup/business/business-signup-wizard.tsx
git commit -m "feat(motion): animate signup wizard step transitions with directional slide"
```

---

## Task 10: `SignupSuccessMoment` component

**Files:**
- Modify: `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx` (add new function alongside the other Step components)

- [ ] **Step 1: Add the success-moment component**

At the bottom of `business-signup-wizard.tsx`, after the existing `Step3` component and before the main `BusinessSignupWizard` export (or at the top of the file alongside other helpers — just keep it co-located), add:

```tsx
// ── Success moment — shown briefly before Stripe redirect ───────────────────

function SignupSuccessMoment({ checkoutUrl }: { checkoutUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (reducedMotion) {
      // Short delay just to avoid a flash-of-nothing before redirect
      const t = setTimeout(() => {
        window.location.href = checkoutUrl
      }, 100)
      return () => clearTimeout(t)
    }

    let cancelled = false
    ;(async () => {
      const { animate } = await import("animejs")
      if (cancelled) return

      const check = container.querySelector<HTMLElement>("[data-check]")
      const sweep = container.querySelector<HTMLElement>("[data-sweep]")

      if (check) {
        animate(check, {
          opacity: [0, 1],
          scale: [0.6, 1.1, 1],
          duration: 450,
          easing: EASE.standard,
        })
      }
      if (sweep) {
        animate(sweep, {
          scaleX: [0, 1],
          opacity: [0, 1],
          duration: 450,
          delay: 100,
          easing: EASE.standard,
        })
      }
    })()

    const redirectTimer = setTimeout(() => {
      window.location.href = checkoutUrl
    }, DURATION.success)

    return () => {
      cancelled = true
      clearTimeout(redirectTimer)
    }
  }, [checkoutUrl, reducedMotion])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Account created, redirecting to payment"
    >
      <div
        data-check
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        style={{ opacity: reducedMotion ? 1 : 0 }}
      >
        <Check className="h-10 w-10" strokeWidth={3} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="font-display text-xl font-semibold tracking-tight">
          Account created
        </p>
        <div
          data-sweep
          className="h-[2px] w-32 origin-left rounded-full bg-gradient-to-r from-primary via-primary to-transparent"
          style={{
            opacity: reducedMotion ? 1 : 0,
            transform: reducedMotion ? "none" : "scaleX(0)",
          }}
        />
        <p className="text-sm text-muted-foreground">
          Redirecting to secure payment…
        </p>
      </div>
    </div>
  )
}
```

**Notes:**
- `Check` icon is already imported at the top of the file — verify with the existing import block.
- `useRef`, `useEffect`, `DURATION`, `EASE`, `usePrefersReducedMotion` are imported from Task 9.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/\(auth\)/signup/business/business-signup-wizard.tsx
git commit -m "feat(motion): add SignupSuccessMoment overlay component (checkmark + gold sweep)"
```

---

## Task 11: Wire `SignupSuccessMoment` into `Step3` form handler

**Files:**
- Modify: `app/[locale]/(auth)/signup/business/business-signup-wizard.tsx` (`Step3` function, around lines 282–367)

- [ ] **Step 1: Render the success overlay when the action returns `checkoutUrl`**

Find the `Step3` component (around line 282). Locate the `const [state, action] = useFormState<...>(businessSignupSubmitAction, undefined)` line.

At the top of the JSX returned by `Step3`, before the `<form>`, add a conditional render for the success overlay:

```tsx
  return (
    <>
      {state?.checkoutUrl && <SignupSuccessMoment checkoutUrl={state.checkoutUrl} />}
      <form action={action} className="space-y-5">
        {/* ... rest of existing form unchanged ... */}
      </form>
    </>
  )
```

**Important:** Change the top-level JSX from a single `<form>` to a `<>...</>` Fragment containing both the conditional overlay and the form.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification — requires Stripe test mode**

If `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and the Stripe secret are configured in `.env.local`, walk through the signup wizard with a paid plan to the final submit.

Expected sequence:
1. User submits Step 3 form
2. Account + Stripe checkout session created server-side
3. Action returns `{ checkoutUrl: "https://checkout.stripe.com/..." }`
4. `SignupSuccessMoment` renders full-screen overlay
5. Checkmark scales in (0 → 1.1 → 1, 450ms)
6. Gold underline sweeps L→R beneath "Account created" (100ms delay, 450ms)
7. 900ms after overlay mount, `window.location.href` navigates to Stripe

If Stripe isn't configured, the form shows the "Stripe billing coming soon" branch — the success moment only fires when a real `checkoutUrl` is returned, so this won't animate without Stripe configured. That's expected; confirm via code reading that the wiring is correct.

- [ ] **Step 4: Reduced-motion verification**

With reduced-motion enabled: overlay still mounts; checkmark + sweep render in final state; redirect happens ~100ms later (no animation sequence).

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/\(auth\)/signup/business/business-signup-wizard.tsx
git commit -m "feat(motion): render SignupSuccessMoment before Stripe redirect on paid-plan signup"
```

---

## Task 12: Full-flow verification + lint + build

**Files:** none modified — this task verifies the whole phase.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no new errors from files touched in Tasks 1–11. Fix any lint errors in those files inline; do not fix unrelated pre-existing errors.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds. If there are SSR errors related to `window` references in `components/reveal.tsx` or `business-signup-wizard.tsx`, they must be fixed inline — `usePrefersReducedMotion` and all `window.*` calls should only run inside `useEffect`.

- [ ] **Step 4: Full manual walkthrough**

Run: `npm run dev`. With a normal browser (reduced-motion OFF):

1. Visit `/en` — scroll to "Own a Lompoc business?" → card scale-in fires.
2. Click "List your business" → lands on `/en/for-businesses`. Hero left column staggers in 5 elements; right stat card fades in.
3. Scroll down → "How it works" 3-step grid staggers in.
4. Scroll further → pricing cards stagger in; "Most popular" badge pulses.
5. Click "Get started" on Standard → `/en/signup`. Advance through wizard steps — each transition slides in.
6. (If Stripe configured) Submit final step → success overlay appears with checkmark + gold sweep → redirects to Stripe.

- [ ] **Step 5: Reduced-motion walkthrough**

Enable OS "Reduce motion" setting. Refresh and repeat Step 4.
Expected: every animated surface renders instantly in final state. No animation, no stagger, no pulse. Pages are fully usable.

- [ ] **Step 6: Customer-side regression spot-check**

Visit the following pages and confirm existing animations still work (we should not have regressed anything on the customer side):
- `/en` homepage hero — search + animated counters
- `/en/map` — pin-pop-in animation on pins
- `/en/deals` — category strip, deal cards
- `/en/businesses` — directory cards with `AnimeReveal`

Expected: all existing animations unchanged.

- [ ] **Step 7: Final commit (if any cleanup happened)**

If lint/build fixes touched any file:

```bash
git add -u
git commit -m "chore(motion): lint/build fixes for animation layer"
```

If no cleanup was needed, skip this step.

- [ ] **Step 8: Push to origin**

```bash
git push
```

This triggers Vercel to auto-deploy the full animation layer to preview + production (per `CLAUDE.md` deployment flow).

---

## Post-implementation checks (success criteria from the spec)

After Task 12 completes, confirm each §9 criterion from the spec:

1. ☐ All six animations run on correct surfaces with motion tokens from §2
2. ☐ `prefers-reduced-motion: reduce` fully disables every entrance animation + badge pulse
3. ☐ No new npm dependencies added (`git diff main -- package.json package-lock.json` shows no changes)
4. ☐ No regressions on customer-side animations (verified in Task 12 Step 6)
5. ☐ Lighthouse performance on `/for-businesses` unchanged or better (optional spot-check)
6. ☐ Manual walkthrough feels deliberate, not gratuitous (Task 12 Step 4)

---

## Self-review notes (completed before handoff)

- **Spec coverage:** Every §4 moment (4.1 hero, 4.2 pricing+badge, 4.3 "How it works", 4.4 homepage CTA, 4.5 wizard steps, 4.6 success moment) maps to a task. Both shared primitives from §3 (`motion.ts`, `reveal.tsx`) are Tasks 1–2. Badge CSS from §4.2 is Task 3. Accessibility (§5) is handled per-task via `usePrefersReducedMotion`. Performance budget (§6) honored — no new deps; dynamic anime.js import preserved.
- **Placeholders:** no TBD/TODO strings; every step contains complete code or an exact command with expected output.
- **Type consistency:** `BizSignupState` extended in Task 8 with `checkoutUrl?: string`, consumed in Task 11. `Reveal` preset names consistent across Tasks 2, 4, 5, 6, 7. `DURATION`/`EASE`/`STAGGER` tokens defined in Task 1 are the only motion numbers used in every subsequent task.
- **Benefits grid (6 cards) explicitly NOT animated** per spec §4 scope — the plan preserves the existing `card-enter` CSS-based entrance there, intact. Only `Step` (3 cards) loses `card-enter` because it's replaced by `<Reveal preset="stagger">` in Task 6.
