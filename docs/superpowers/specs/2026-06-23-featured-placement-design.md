# Featured Placement (P0) — Design Spec

**Date:** 2026-06-23
**Goal:** Deliver the "pay to be seen" lever the billing page already advertises. Premium
businesses get a labeled **Featured** row at the top of the homepage and category/feed pages,
plus a **⭐ Featured badge** on their deals — without turning the local feed pay-to-win.

> Companion to [business-analytics-upsell](2026-06-23-business-analytics-upsell-design.md);
> together they form the complete upgrade story ("be seen" + "prove it worked"). See the
> [paid-value roadmap](../../product/paid-value-roadmap.md) for why this is P0.

---

## Why this is P0 (and an integrity fix)

`lib/stripe.ts` `TIERS` already exposes `featuredOnHomepage` and `priorityRanking` for
Premium, and the billing page advertises them — but **no query implements them** today
(`lib/queries.ts` orders feeds by `createdAt DESC` only). Paying customers currently get
nothing extra. This spec makes the promise real.

## Ranking model (decided)

**Featured section + chronological feed.** A distinct, clearly-labeled "⭐ Featured" row sits
above the normal feed and shows Premium deals; the main feed stays newest-first. This protects
the local browsing experience (honest, not a buried-by-payers list) while giving paid
businesses prime real estate.

- **Featured placement is Premium-only.** Standard and Free do not appear in the Featured row.
  Standard's paid value remains analytics, social links, and a higher deal limit. Keeps a
  clean Standard→Premium upsell.
- The **⭐ Featured badge** appears on Premium deals wherever a deal card renders (featured row
  *and* in the main feed), so Premium deals are recognizable even in the chronological list.

## Featured row behavior

- **Source:** active (non-expired, non-paused) deals belonging to **Premium** businesses.
- **Cap:** up to 6 deals.
- **One deal per business:** dedupe so a single business can't fill the row. Pick that
  business's most recent active deal.
- **Fair rotation:** order by a **date-seeded shuffle** (stable within a day, rotates daily) so
  exposure is shared across Premium businesses rather than always favoring the newest/oldest.
  Implementation: deterministic shuffle seeded by current date (e.g., hash of
  `YYYY-MM-DD` + business id) — no per-request randomness, so it's cache-friendly and stable
  on refresh.
- **Empty state:** if zero Premium deals exist, the Featured row renders nothing (no empty
  shell) — the page is just the normal feed. Critical for launch, when nobody is Premium yet.
- **Placement:** homepage (top) and each category/feed page (top, scoped to that category).

## Effective-tier resolution

A deal's tier = its business's effective tier. Resolution order:

1. `businesses.plan_override` if set (admin override) — wins.
2. else the owner's `subscriptions.tier` (joined via `businesses.owner_user_id =
   subscriptions.user_id`), **but only if** the subscription is `active`/`trialing`, **or**
   the business is within `grace_period_ends_at`.
3. else `free`.

Implement once as `resolveBusinessTier()` (or a SQL expression reusable in the feed query) so
the Featured query and the badge use identical logic. **No new column** — this is a join +
CASE expression. (A denormalized `effective_tier` column is a possible later optimization;
out of scope here.)

## Data layer

- **`getFeaturedDeals({ categoryId? , limit = 6 })`** → deals for the Featured row.
  Filters to Premium businesses, active deals; applies one-per-business dedupe and the
  date-seeded ordering. Reuses the existing deal-card shape so the UI component is unchanged.
- **Feed/homepage queries (`lib/queries.ts`):** unchanged ordering (newest-first). Add the
  resolved tier to each deal row (via the join) so the card can show the badge. Do **not**
  re-sort the main feed.

Performance: the Premium set is tiny in this market; the Featured query is small and indexed
on existing keys (status, expires_at, owner join). No migration.

## UI

- **`components/featured-row.tsx`** (new): the labeled "⭐ Featured" section; renders existing
  deal cards in a horizontally-scrollable/responsive row; returns `null` when empty.
- **`components/featured-badge.tsx`** (new): small "⭐ Featured" pill; rendered on a deal card
  when the deal's resolved tier is Premium.
- Wire the Featured row into the homepage and category/feed pages above the existing list.
- Badge added to the shared deal-card component, shown conditionally.
- i18n: new keys (`featured.title`, `featured.badge`) in `messages/en.json` + `es.json`.

## Testing

- **Unit:** `resolveBusinessTier()` across cases — plan_override wins; active sub = paid;
  canceled/past_due sub = free; grace-period-not-expired = paid; grace expired = free; no sub
  = free.
- **Unit:** date-seeded shuffle is stable within a day and changes across days; one-per-business
  dedupe holds.
- **Query smoke test:** seed Premium + Standard + free businesses with active deals; assert
  `getFeaturedDeals` returns only Premium, ≤6, ≤1 per business; assert empty state with no
  Premium.
- **Render:** Featured row hidden when empty; badge shows only on Premium deal cards.

## Out of scope (YAGNI / defer)

- Standard-tier ranking boost (Premium-only for now).
- Boost weighting / blended scoring (rejected ranking model).
- Self-serve one-off "boost this deal for $X" purchases.
- Denormalized `effective_tier` column (optimize later if the join shows up in profiling).
- Featuring in the weekly digest — that's **P1**, its own spec.

## Files touched (anticipated)

- `lib/queries.ts` — featured query + tier on feed rows (or new `lib/featured.ts`).
- `lib/plan-features.ts` / `lib/stripe.ts` — reuse existing flags; no flag changes expected.
- `components/featured-row.tsx`, `components/featured-badge.tsx` — new.
- Homepage + category/feed pages — mount the Featured row.
- Shared deal-card component — conditional badge.
- `messages/en.json`, `messages/es.json` — i18n keys.
- Tests alongside.
