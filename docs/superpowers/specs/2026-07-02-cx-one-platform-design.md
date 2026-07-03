# CX "One Platform" Sprint — Design Spec

*Date: 2026-07-02 · Approved by: Andres · Source: live-site visitor-journey audit (3 legs: homepage/deals, directory/search/map, ES parity/engagement)*

## Goal

Fix the moments where the visitor journey breaks its own promises, remove visible fakeness, and unify the experience so the same features serve both audiences: locals get a working deals loop; businesses get proof (claims, follows, views) that the platform delivers customers.

Out of scope for this sprint: Stripe/live payments (explicitly parked), QR merchant-scan redemption (deferred; coupon-screen model chosen), multi-city anything.

## Audit findings driving this design

Critical: (1) "Get Deal" never delivers a redemption artifact — redirects to the business page, circular on the profile itself, while the FAQ promises "show your phone at the register"; (2) search results page queries deals only — "pizza" returns ~nothing while autocomplete knows the businesses; (3) Spanish subscribers get English confirmation email, confirmation page, and digest (`subscribers` has no locale column); (4) most of ~470 scraped business profiles lead with an empty "No deals yet" box plus a lock-icon claim banner.

Medium: fake sponsor cards + empty ad slots in the homepage digest; testimonials publicly labeled placeholder; `demo-` slugs live; contradictory digest copy (Tuesday/top-5 vs Saturday/top-10 vs Sunday); favorite/follow invisible to logged-out visitors; no open-now anywhere; English Follow button on ES pages; stale $19.99 pricing strings.

## Phase 1 — Fix the core loop

### 1.1 Deal claim flow (decision: coupon screen, no login)
- Unify the verb to **"Claim deal"** across cards, How It Works, FAQ (EN + ES).
- New claim view at `app/[locale]/(public)/deals/[id]/claim/page.tsx`: business name + logo, deal title/description, short deterministic claim code (derived from deal id, format `LOMPOC-XXXX`), "Show this screen at the register", expiry + terms, and an "I used this deal" button.
- Claim view load tracks a `claim` event; "I used this deal" tracks `redeem` (existing `/api/track/claim`, `/api/track/redeem`, `dealEvents` table). No new tables.
- Remove the logged-out "Mark as Redeemed" button from deal cards (superseded by the claim view).
- Merchant dashboard stats (`dashboard/stats`) surfaces claims + redemptions per deal.

### 1.2 Unified search
- `app/[locale]/(public)/search/page.tsx` queries businesses + categories + deals, reusing the autocomplete matching (name, category, description, synonyms) from `app/api/search/autocomplete/route.ts` — extract shared logic into `lib/queries.ts` (or `lib/search.ts`).
- Sectioned results: Businesses, Categories, Deals; sensible empty state only when all three are empty.
- `track("search_run", …)` becomes fire-and-forget.

### 1.3 Spanish funnel end-to-end
- Migration: add `locale` column (text, default `'en'`) to `subscribers`.
- `subscribeAction` captures the current locale; confirmation email and weekly digest (`app/api/cron/digest/route.ts`) send in the subscriber's locale.
- `subscribe/confirm/page.tsx` converted to `getTranslations` (currently hardcoded English JSX).
- `components/follow-business-button.tsx` labels via i18n.

### 1.4 Profiles that never look abandoned
- Zero-deal profiles: replace the dashed "No deals yet" box with a compact "Follow to hear about their deals first" prompt (wired to follow button / signup redirect).
- Move the "Claim this business" banner from the top of the profile to a subtle line near the page footer.
- No-hours profiles: show "Hours not listed — call to confirm" with the `tel:` link instead of nothing.
- Always-visible labeled "Get directions" button built from the address string (works without lat/lng).

## Phase 2 — Honesty pass

- Homepage digest section (`components/deals-digest.tsx`): remove fake sponsor cards (Central Coast Dental, Valley Realty Group) and empty "Your ad here" boxes; keep **one** "Sponsor this digest — reach Lompoc weekly" card linking to `/for-businesses`. (Decision: one real CTA, rest gone.)
- Hide the testimonials section on the homepage until real quotes exist; keep the component. (Decision: hide until real.)
- Strip `demo-` prefix from business slugs via data migration; 301-redirect old `/biz/demo-*` URLs; keep seeded deals. (Decision: reslug + keep.)
- Copy truth pass (EN + ES): digest is **Saturday morning, top 10** everywhere; one business count sourced from the DB, not hardcoded; restore missing "$40" in `subscribePage.testimonial1Quote`; fix stale "Standard $19.99" / "Free = 3 deals" strings to the real tiers (Free listing-only / Growth $39.99 / Plus $99.99).
- Hero `AnimatedCounter` renders real values on first paint (SSR initial state), animates after.

## Phase 3 — Unify the two audiences

- Logged-out visitors see favorite ♥ and Follow buttons; tapping prompts sign-in with `redirectTo` back to the page (pattern already exists on the deal claim login flow). Server actions return a redirect instead of silently no-oping.
- "Open now" toggle on directory (`/businesses`) and category pages — computed server-side from `hoursJson`. (Map toggle deferred: the client-side POI payload has no hours data; add later if the filter proves useful.)
- Business profile footer: quiet "Own this business? Get deals in front of locals →" link to `/for-businesses`.
- Dashboard stats: claims/redemptions funnel per deal (from 1.1), keeping tier gating as-is.

## Data changes

- `subscribers.locale` (new column, default `'en'`).
- Business slug reslug migration + redirect map for `demo-*`.
- No new tables; claim/redeem uses existing `dealEvents`.

## Error handling & edge cases

- Claim view for an expired/removed deal: friendly "This deal has ended" state with a link to the business and current deals.
- Reslug collisions (e.g. `demo-x` → existing `x`): suffix with `-lompoc` and log; redirects must never 404.
- Open-now with missing/malformed `hoursJson`: business simply isn't filtered out and shows no badge (never "Closed" by default).
- Digest/confirmation email for unknown locale: fall back to `en`.

## Testing / verification

- Per phase: `tsc --noEmit` + ESLint clean; manual smoke of the changed journey on the deployed preview (claim a deal EN + ES, search "pizza"/"haircut", subscribe in ES and inspect the email payload locale, view a zero-deal profile).
- Old `/biz/demo-*` URLs return 301 to new slugs.

## Sequencing

Three PRs, shipped in order: Phase 1 (core loop) → Phase 2 (honesty, mostly copy/content — fast) → Phase 3 (unification). Each phase is independently valuable and verifiable; commit after each working phase per the working agreement.
