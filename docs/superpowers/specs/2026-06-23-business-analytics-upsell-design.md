# Business Analytics Upsell — Design Spec

**Date:** 2026-06-23
**Goal:** Make the paid plans more compelling by surfacing data the app *already collects* —
profile page views, traffic sources, and trends over time — so a business owner can see
"are people finding me, where from, and is it working." Gated to drive Standard→Premium upsell.

---

## Context: what already exists (do NOT rebuild)

- **Paid-gated analytics is live.** `dashboard/stats/page.tsx` blocks free tier and shows an
  upgrade gate; `Standard` ($19.99) and `Premium` ($39.99) set `canViewAnalytics: true`
  (`lib/stripe.ts`).
- **Deal funnel is built & displayed:** views, clicks, claims, redeems, CTR, best deal, and a
  per-deal funnel table (`lib/funnel-queries.ts`).
- **The data we need is already captured:**
  - Every `/biz/[slug]` visit fires `business_page_viewed` into `analyticsEvents`, **with
    `referrer` in `props`**.
  - Deal view/click events are written to `analyticsEvents` (via `lib/tracking.ts`).
- **Feature-gating pattern exists:** `getPlanFeatures(tier)` / `assertFeature()` in
  `lib/plan-features.ts`; flags hardcoded in the `TIERS` object.

So this is a **surface-and-package** feature, not a new analytics system.

## Tier split (monetization)

| Capability | Free | Standard ($19.99) | Premium ($39.99) |
|---|---|---|---|
| Deal funnel (views/clicks/claims/redeems/CTR) | — | ✓ | ✓ |
| **Profile page views** (NEW) | — | ✓ | ✓ |
| **Traffic sources / referrers** (NEW) | — | — | ✓ |
| **Trends over time (charts)** (NEW) | — | — | ✓ |

Standard sees the Premium sections as a small inline "Upgrade to Premium" teaser so they
*see* what they're missing — that's the upsell.

---

## Architecture

Enhance the existing `dashboard/stats/page.tsx`; reuse its tier gate, window selector
(7d/30d/all), and i18n scaffolding. Add three sections, each gated:

1. **"Your page" summary row (Standard+):** add **Profile views** alongside the existing
   Views / Clicks / Claims / Redeems cards.
2. **Traffic Sources card (Premium):** ranked source breakdown with counts + % of total.
3. **Trends section (Premium):** lightweight SVG bar chart of daily profile views & deal
   views over the selected window.

### Data layer

All new reads hit `analyticsEvents` (indexed on `(eventName, createdAt)` and
`(targetType, targetId)`). No schema migration required.

- **`getProfileViews(businessId, window)`** → integer.
  Count `analyticsEvents` where `eventName='business_page_viewed'`,
  `targetType='business'`, `targetId=businessId`, and `createdAt` within window.

- **`getTrafficSources(businessId, window)`** → `{ source, count, pct }[]`.
  Pull `business_page_viewed` rows in window, read `props->>'referrer'`, normalize via
  `normalizeReferrer()`, group + count, sort desc.

- **`getDailySeries(businessId, window)`** → `{ date, profileViews, dealViews }[]`.
  `date_trunc('day', created_at)` group-by over `analyticsEvents` for the business's
  profile-view events and its deals' view events. Zero-fill missing days in JS so the chart
  has a continuous axis.

- **Windowing-bug fix:** `lib/funnel-queries.ts` currently reads the `dealEvents` table for
  the 7d/30d windows, where view/click rows do **not** exist (silent zeros). Repoint the
  windowed view/click aggregation to `analyticsEvents`, where they do exist. The `all`
  window keeps using the denormalized `deals.viewCount/clickCount` columns. This fix is the
  foundation that makes 7d/30d (and therefore trends) correct.

### `normalizeReferrer(raw)` — pure, unit-tested

Maps a raw referrer string to a bucket:

| Contains | Bucket |
|---|---|
| `facebook.com`, `l.facebook.com`, `fb.me`, `lm.facebook.com` | Facebook |
| `instagram.com`, `l.instagram.com` | Instagram |
| `google.`, `google.com` | Google |
| `t.co`, `twitter.com`, `x.com` | Twitter/X |
| `bing.`, `duckduckgo.`, `yahoo.` | Other search |
| empty / null / same-origin (`lompoc-deals`) | Direct |
| anything else | Other |

(Facebook and Instagram are separate buckets — owners running Meta ads want to tell them
apart.)

### Chart component — `components/trend-chart.tsx`

Dependency-free. Renders an inline SVG bar chart (~50–70 lines): one bar group per day, two
series (profile views, deal views), a baseline axis, max-value scaling, and accessible
`<title>` tooltips per bar. Styled to match the existing card aesthetic (rounded, soft
gradients). No external charting library.

### Tier config & copy

- `lib/stripe.ts` `TIERS`: add `canViewTrafficSources` and `canViewTrends` (Premium `true`,
  Standard/Free `false`). Keep `canViewAnalytics` controlling Standard-level access.
- `lib/plan-features.ts`: surface the new flags through `getPlanFeatures()`.
- Premium `features[]` + billing page copy: add
  "Traffic sources & trends — see exactly what's driving visits."
- New i18n keys in `messages/en.json` and `messages/es.json` for all new labels.

---

## Testing

- **Unit:** `normalizeReferrer()` across every bucket incl. null/empty/same-origin; window
  date-math (boundary inclusivity for 7d/30d/all).
- **Query smoke test:** seed a business with a spread of `business_page_viewed` events
  (varied referrers + dates) and assert `getProfileViews`, `getTrafficSources`,
  `getDailySeries` return expected shapes/counts.
- **Gating:** assert a Standard user sees profile views but the Premium sections render the
  teaser, and a Premium user sees all sections.

## Out of scope (YAGNI / defer)

- Recharts or any charting dependency (lightweight SVG only).
- Per-visitor dedup / bot filtering of view counts (counts stay raw, as today).
- Geographic / device breakdowns (data not currently captured).
- Email digests of analytics, CSV export, performance alerts.
- Backfilling `dealEvents` (not needed — `analyticsEvents` already holds the data).

## Files touched (anticipated)

- `lib/funnel-queries.ts` — windowing fix + new query helpers (or a new
  `lib/analytics/business-stats.ts` if cleaner).
- `lib/referrer.ts` — `normalizeReferrer()` (new).
- `components/trend-chart.tsx` — SVG chart (new).
- `app/[locale]/dashboard/stats/page.tsx` — new gated sections.
- `lib/stripe.ts`, `lib/plan-features.ts` — tier flags.
- `app/[locale]/dashboard/billing/page.tsx` — Premium copy.
- `messages/en.json`, `messages/es.json` — i18n keys.
- Tests alongside the above.
