# Analytics Upsell + Featured Placement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the complete paid upgrade story — Premium businesses get a Featured row + badge ("be seen"), and paid businesses get profile-view, traffic-source, and trend analytics ("prove it worked").

**Architecture:** Both features read data the app already collects in the `analytics_events` table — no schema migration. A single shared pure helper, `effectiveTier()`, resolves a business's paid tier (respecting `plan_override` and grace period) and is reused by both the analytics gate and the Featured query. Analytics enhances the existing `dashboard/stats` page; Featured adds a labeled row above the existing chronological feed plus a badge on Premium deal cards.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM (Neon Postgres), next-intl, Tailwind. Tests are standalone `tsx` scripts using `node:assert/strict` (this repo has no vitest/jest).

## Global Constraints

- **No new runtime dependencies.** Charts are hand-rolled SVG. (CLAUDE.md: ask before adding deps.)
- **No DB migration.** All new reads hit existing tables/indexes (`analytics_events`, `subscriptions`, `businesses`).
- **All user-facing strings are i18n keys** in BOTH `messages/en.json` and `messages/es.json` (next-intl). Never hardcode copy.
- **Tests are `tsx` scripts** run via `npx tsx <file>` (pure) or `node --env-file=.env.local node_modules/.bin/tsx <file>` (DB). Use `node:assert/strict`. Follow `lib/analytics/test-track.ts`.
- **Tier flags live in `lib/stripe.ts` `TIERS`**; access via `getPlanFeatures(tier)`. Existing flags: `canViewAnalytics` (standard+), `featuredOnHomepage`/`priorityRanking` (premium).
- **Commit after every task.** Conventional commits (`feat:`, `fix:`, `test:`).
- **Branch:** create `feat/analytics-and-featured` before Task 1; do not commit to `main`.

Specs: [analytics-upsell](../specs/2026-06-23-business-analytics-upsell-design.md), [featured-placement](../specs/2026-06-23-featured-placement-design.md).

---

## File Structure

**Shared:**
- Create `lib/tier.ts` — `effectiveTier()` pure resolver + `EffectiveTierInput` type.
- Create `lib/tier.test.ts` — unit tests.

**Analytics:**
- Modify `lib/funnel-queries.ts` — fix windowed view/click to read `analytics_events`.
- Create `lib/referrer.ts` — `normalizeReferrer()` + `ReferrerSource` type.
- Create `lib/referrer.test.ts` — unit tests.
- Create `lib/analytics/business-stats.ts` — `getProfileViews`, `getTrafficSources`, `getDailySeries`.
- Create `lib/analytics/business-stats.smoke.ts` — DB smoke test.
- Modify `lib/stripe.ts` — add `canViewTrafficSources`, `canViewTrends` flags.
- Modify `lib/plan-features.ts` — extend `FeatureFlag` union + minimum-tier map.
- Create `components/trend-chart.tsx` — SVG bar chart.
- Modify `app/[locale]/dashboard/stats/page.tsx` — profile-views card, traffic-sources + trends sections, Premium teasers, effectiveTier gate.
- Modify `app/[locale]/dashboard/billing/page.tsx` — Premium feature copy.

**Featured:**
- Create `lib/featured.ts` — `getFeaturedDeals()`, `seededShuffle()`, `dateSeed()`.
- Create `lib/featured.test.ts` — unit tests for shuffle/seed/dedupe.
- Create `lib/featured.smoke.ts` — DB smoke test.
- Modify `lib/queries.ts` — extend `DealCardData` with `featured`; add subscription join to `baseDealSelect`/`rowToCard`.
- Create `components/featured-badge.tsx` — ⭐ Featured pill.
- Create `components/featured-row.tsx` — labeled Featured section.
- Modify `components/deal-card.tsx` — render badge when `deal.featured`.
- Modify homepage + category pages — mount `<FeaturedRow>`.
- Modify `messages/en.json`, `messages/es.json` — new keys.

---

## Task 1: Shared `effectiveTier()` resolver

**Files:**
- Create: `lib/tier.ts`
- Test: `lib/tier.test.ts`

**Interfaces:**
- Consumes: `TierKey` from `lib/stripe.ts` (`"free" | "standard" | "premium"`).
- Produces: `effectiveTier(input: EffectiveTierInput): TierKey`; type `EffectiveTierInput`.

- [ ] **Step 1: Write the failing test**

Create `lib/tier.test.ts`:
```typescript
import assert from "node:assert/strict"
import { effectiveTier } from "./tier"

const NOW = new Date("2026-06-23T12:00:00Z")

// plan_override wins over everything
assert.equal(effectiveTier({ planOverride: "premium", subTier: "free", subStatus: "active", now: NOW }), "premium")
// active subscription returns its tier
assert.equal(effectiveTier({ subTier: "standard", subStatus: "active", now: NOW }), "standard")
// trialing counts as paid
assert.equal(effectiveTier({ subTier: "premium", subStatus: "trialing", now: NOW }), "premium")
// canceled with no grace = free
assert.equal(effectiveTier({ subTier: "premium", subStatus: "canceled", now: NOW }), "free")
// canceled but within grace = keeps tier
assert.equal(effectiveTier({ subTier: "premium", subStatus: "canceled", gracePeriodEndsAt: new Date("2026-06-30T00:00:00Z"), now: NOW }), "premium")
// grace expired = free
assert.equal(effectiveTier({ subTier: "premium", subStatus: "canceled", gracePeriodEndsAt: new Date("2026-06-01T00:00:00Z"), now: NOW }), "free")
// past_due with no grace = free
assert.equal(effectiveTier({ subTier: "standard", subStatus: "past_due", now: NOW }), "free")
// no subscription at all = free
assert.equal(effectiveTier({ now: NOW }), "free")

console.log("tier.test: all passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/tier.test.ts`
Expected: FAIL — `Cannot find module './tier'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/tier.ts`:
```typescript
import type { TierKey } from "@/lib/stripe"

export type EffectiveTierInput = {
  planOverride?: TierKey | null
  subTier?: TierKey | null
  subStatus?: "active" | "past_due" | "canceled" | "trialing" | null
  gracePeriodEndsAt?: Date | null
  now?: Date
}

/**
 * Resolve a business's effective paid tier.
 * Order: plan_override (admin) > active/trialing subscription > within grace period > free.
 */
export function effectiveTier(input: EffectiveTierInput): TierKey {
  if (input.planOverride) return input.planOverride

  const isActive = input.subStatus === "active" || input.subStatus === "trialing"
  if (isActive && input.subTier) return input.subTier

  const now = input.now ?? new Date()
  const inGrace = input.gracePeriodEndsAt != null && input.gracePeriodEndsAt.getTime() > now.getTime()
  if (inGrace && input.subTier) return input.subTier

  return "free"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/tier.test.ts`
Expected: PASS — prints `tier.test: all passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/tier.ts lib/tier.test.ts
git commit -m "feat: shared effectiveTier resolver (plan_override + grace aware)"
```

---

## Task 2: `normalizeReferrer()` traffic-source bucketing

**Files:**
- Create: `lib/referrer.ts`
- Test: `lib/referrer.test.ts`

**Interfaces:**
- Produces: `normalizeReferrer(raw: string | null | undefined): ReferrerSource`; type `ReferrerSource`.

- [ ] **Step 1: Write the failing test**

Create `lib/referrer.test.ts`:
```typescript
import assert from "node:assert/strict"
import { normalizeReferrer } from "./referrer"

assert.equal(normalizeReferrer("https://www.facebook.com/somepage"), "Facebook")
assert.equal(normalizeReferrer("https://l.facebook.com/l.php?u=x"), "Facebook")
assert.equal(normalizeReferrer("https://m.facebook.com/"), "Facebook")
assert.equal(normalizeReferrer("https://www.instagram.com/lompoclocals"), "Instagram")
assert.equal(normalizeReferrer("https://l.instagram.com/?u=x"), "Instagram")
assert.equal(normalizeReferrer("https://www.google.com/search?q=lompoc"), "Google")
assert.equal(normalizeReferrer("android-app://com.google.android.googlequicksearchbox/"), "Google")
assert.equal(normalizeReferrer("https://t.co/abc"), "Twitter/X")
assert.equal(normalizeReferrer("https://twitter.com/x"), "Twitter/X")
assert.equal(normalizeReferrer("https://duckduckgo.com/"), "Other search")
assert.equal(normalizeReferrer("https://www.lompoclocals.com/en"), "Direct") // same-origin
assert.equal(normalizeReferrer(""), "Direct")
assert.equal(normalizeReferrer(null), "Direct")
assert.equal(normalizeReferrer(undefined), "Direct")
assert.equal(normalizeReferrer("https://some-random-blog.com/post"), "Other")

console.log("referrer.test: all passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/referrer.test.ts`
Expected: FAIL — `Cannot find module './referrer'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/referrer.ts`:
```typescript
export type ReferrerSource =
  | "Facebook"
  | "Instagram"
  | "Google"
  | "Twitter/X"
  | "Other search"
  | "Direct"
  | "Other"

/** Map a raw referrer string to a coarse traffic-source bucket. */
export function normalizeReferrer(raw: string | null | undefined): ReferrerSource {
  if (!raw) return "Direct"
  const r = raw.toLowerCase()

  if (r.includes("lompoc-deals")) return "Direct" // same-origin navigation
  if (r.includes("facebook.com") || r.includes("fb.me") || r.includes("fb.com")) return "Facebook"
  if (r.includes("instagram.com")) return "Instagram"
  if (r.includes("google.")) return "Google"
  if (r.includes("t.co") || r.includes("twitter.com") || r.includes("x.com")) return "Twitter/X"
  if (r.includes("bing.") || r.includes("duckduckgo.") || r.includes("yahoo.")) return "Other search"
  return "Other"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/referrer.test.ts`
Expected: PASS — prints `referrer.test: all passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/referrer.ts lib/referrer.test.ts
git commit -m "feat: normalizeReferrer traffic-source bucketing"
```

---

## Task 3: Fix windowed view/click in `getDealFunnel`

**Files:**
- Modify: `lib/funnel-queries.ts`
- Test: `lib/funnel-queries.smoke.ts` (create)

**Interfaces:**
- Consumes: `analyticsEvents` table; event names `deal_view`, `deal_click`, `deal_claim`, `deal_redeem` (from `lib/analytics/events.ts`).
- Produces: unchanged `getDealFunnel(businessId, window): Promise<DealFunnelRow[]>` — but windowed views/clicks now non-zero.

**Background:** The current code reads the `deal_events` table for windowed metrics, where `view`/`click` rows do not exist, so 7d/30d views & clicks return 0. Repoint windowed counts to `analytics_events` (where `bumpViewCounts`/`bumpClickCount` already write). Keep `all` window using the denormalized `deals.viewCount`/`clickCount` for complete history.

- [ ] **Step 1: Write the failing smoke test**

Create `lib/funnel-queries.smoke.ts`:
```typescript
import assert from "node:assert/strict"
import { db } from "@/db/client"
import { analyticsEvents, deals, businesses, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getDealFunnel } from "./funnel-queries"

async function main() {
  // Find any deal to attach synthetic events to.
  const deal = await db.query.deals.findFirst()
  assert.ok(deal, "need at least one deal in DB")

  // Insert 2 deal_view events for this deal, dated today.
  await db.insert(analyticsEvents).values([
    { eventName: "deal_view", targetType: "deal", targetId: deal.id, props: {} as never },
    { eventName: "deal_view", targetType: "deal", targetId: deal.id, props: {} as never },
  ])

  const rows7d = await getDealFunnel(deal.businessId, "7d")
  const row = rows7d.find((r) => r.dealId === deal.id)
  assert.ok(row, "deal should appear in funnel")
  assert.ok(row.views >= 2, `expected windowed views >= 2, got ${row.views}`)

  // cleanup
  await db.delete(analyticsEvents).where(eq(analyticsEvents.targetId, deal.id))
  console.log("funnel smoke: passed")
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run smoke test to verify it fails**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/funnel-queries.smoke.ts`
Expected: FAIL — `expected windowed views >= 2, got 0` (current bug).

- [ ] **Step 3: Implement the fix**

In `lib/funnel-queries.ts`, replace the windowed-event aggregation so it reads `analytics_events` instead of `deal_events`. Ensure these imports exist at the top:
```typescript
import { analyticsEvents } from "@/db/schema"
import { and, eq, gte, inArray, sql } from "drizzle-orm"
```
Replace the body of `getDealFunnel` with:
```typescript
export async function getDealFunnel(
  businessId: number,
  window: FunnelWindow = "30d"
): Promise<DealFunnelRow[]> {
  const cutoff = windowCutoff(window)

  const bizDeals = await db
    .select({ id: deals.id, title: deals.title, viewCount: deals.viewCount, clickCount: deals.clickCount })
    .from(deals)
    .where(eq(deals.businessId, businessId))

  if (bizDeals.length === 0) return []
  const dealIds = bizDeals.map((d) => d.id)

  // Count events per deal per type from analytics_events (windowed or all-time).
  const eventRows = await db
    .select({
      dealId: analyticsEvents.targetId,
      eventName: analyticsEvents.eventName,
      n: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.targetId, dealIds),
        inArray(analyticsEvents.eventName, ["deal_view", "deal_click", "deal_claim", "deal_redeem"]),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )
    .groupBy(analyticsEvents.targetId, analyticsEvents.eventName)

  const counts = new Map<number, { views: number; clicks: number; claims: number; redeems: number }>()
  for (const d of bizDeals) counts.set(d.id, { views: 0, clicks: 0, claims: 0, redeems: 0 })
  for (const e of eventRows) {
    if (e.dealId == null) continue
    const c = counts.get(e.dealId)
    if (!c) continue
    if (e.eventName === "deal_view") c.views = e.n
    else if (e.eventName === "deal_click") c.clicks = e.n
    else if (e.eventName === "deal_claim") c.claims = e.n
    else if (e.eventName === "deal_redeem") c.redeems = e.n
  }

  return bizDeals.map((d) => {
    const c = counts.get(d.id)!
    // For all-time, prefer the denormalized counters (complete history pre-analytics_events).
    const views = window === "all" ? d.viewCount : c.views
    const clicks = window === "all" ? d.clickCount : c.clicks
    const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0
    const claimRate = clicks > 0 ? Math.round((c.claims / clicks) * 1000) / 10 : 0
    const redeemRate = c.claims > 0 ? Math.round((c.redeems / c.claims) * 1000) / 10 : 0
    return {
      dealId: d.id,
      dealTitle: d.title,
      views,
      clicks,
      claims: c.claims,
      redeems: c.redeems,
      ctr,
      claimRate,
      redeemRate,
    }
  })
}
```
Keep the existing `FunnelWindow`, `DealFunnelRow`, and `windowCutoff` definitions. Remove the now-unused `dealEvents` import if nothing else uses it in this file.

- [ ] **Step 4: Run smoke test to verify it passes**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/funnel-queries.smoke.ts`
Expected: PASS — prints `funnel smoke: passed`.

- [ ] **Step 5: Lint + commit**

```bash
npx next lint --file lib/funnel-queries.ts
git add lib/funnel-queries.ts lib/funnel-queries.smoke.ts
git commit -m "fix: windowed deal funnel reads analytics_events (7d/30d views/clicks no longer 0)"
```

---

## Task 4: Business-stats query helpers

**Files:**
- Create: `lib/analytics/business-stats.ts`
- Test: `lib/analytics/business-stats.smoke.ts`

**Interfaces:**
- Consumes: `analyticsEvents` table; `normalizeReferrer`/`ReferrerSource` (Task 2); `FunnelWindow` from `lib/funnel-queries.ts`.
- Produces:
  - `getProfileViews(businessId: number, window: FunnelWindow): Promise<number>`
  - `getTrafficSources(businessId: number, window: FunnelWindow): Promise<TrafficSourceRow[]>` where `TrafficSourceRow = { source: ReferrerSource; count: number; pct: number }`
  - `getDailySeries(businessId: number, window: FunnelWindow): Promise<DailyPoint[]>` where `DailyPoint = { date: string; profileViews: number; dealViews: number }`

- [ ] **Step 1: Write the failing smoke test**

Create `lib/analytics/business-stats.smoke.ts`:
```typescript
import assert from "node:assert/strict"
import { db } from "@/db/client"
import { analyticsEvents, deals } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getProfileViews, getTrafficSources, getDailySeries } from "./business-stats"

async function main() {
  const deal = await db.query.deals.findFirst()
  assert.ok(deal, "need a deal")
  const businessId = deal.businessId

  await db.insert(analyticsEvents).values([
    { eventName: "business_page_viewed", targetType: "business", targetId: businessId, props: { locale: "en", referrer: "https://www.facebook.com/x" } as never },
    { eventName: "business_page_viewed", targetType: "business", targetId: businessId, props: { locale: "en", referrer: "https://www.google.com/search" } as never },
    { eventName: "business_page_viewed", targetType: "business", targetId: businessId, props: { locale: "en" } as never },
  ])

  const views = await getProfileViews(businessId, "30d")
  assert.ok(views >= 3, `expected >=3 profile views, got ${views}`)

  const sources = await getTrafficSources(businessId, "30d")
  const fb = sources.find((s) => s.source === "Facebook")
  assert.ok(fb && fb.count >= 1, "expected a Facebook source row")
  const total = sources.reduce((a, s) => a + s.count, 0)
  assert.ok(total >= 3, "sources should sum to all profile views")

  const series = await getDailySeries(businessId, "30d")
  assert.ok(Array.isArray(series) && series.length >= 1, "series should have points")
  assert.ok("date" in series[0] && "profileViews" in series[0] && "dealViews" in series[0], "series point shape")

  await db.delete(analyticsEvents).where(eq(analyticsEvents.targetId, businessId))
  console.log("business-stats smoke: passed")
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run smoke test to verify it fails**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/analytics/business-stats.smoke.ts`
Expected: FAIL — `Cannot find module './business-stats'`.

- [ ] **Step 3: Write the implementation**

Create `lib/analytics/business-stats.ts`:
```typescript
import { db } from "@/db/client"
import { analyticsEvents, deals } from "@/db/schema"
import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { normalizeReferrer, type ReferrerSource } from "@/lib/referrer"
import type { FunnelWindow } from "@/lib/funnel-queries"

export type TrafficSourceRow = { source: ReferrerSource; count: number; pct: number }
export type DailyPoint = { date: string; profileViews: number; dealViews: number }

function cutoffFor(window: FunnelWindow): Date | null {
  if (window === "all") return null
  const days = window === "7d" ? 7 : 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function daysInWindow(window: FunnelWindow): number {
  return window === "7d" ? 7 : 30 // "all" handled separately
}

export async function getProfileViews(businessId: number, window: FunnelWindow): Promise<number> {
  const cutoff = cutoffFor(window)
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "business_page_viewed"),
        eq(analyticsEvents.targetType, "business"),
        eq(analyticsEvents.targetId, businessId),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )
  return row?.n ?? 0
}

export async function getTrafficSources(businessId: number, window: FunnelWindow): Promise<TrafficSourceRow[]> {
  const cutoff = cutoffFor(window)
  const rows = await db
    .select({ referrer: sql<string | null>`${analyticsEvents.props}->>'referrer'` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "business_page_viewed"),
        eq(analyticsEvents.targetType, "business"),
        eq(analyticsEvents.targetId, businessId),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )

  const tally = new Map<ReferrerSource, number>()
  for (const r of rows) {
    const src = normalizeReferrer(r.referrer)
    tally.set(src, (tally.get(src) ?? 0) + 1)
  }
  const total = rows.length || 1
  return [...tally.entries()]
    .map(([source, count]) => ({ source, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export async function getDailySeries(businessId: number, window: FunnelWindow): Promise<DailyPoint[]> {
  const cutoff = cutoffFor(window)

  // Deal ids for this business (to count deal_view events).
  const bizDeals = await db.select({ id: deals.id }).from(deals).where(eq(deals.businessId, businessId))
  const dealIds = bizDeals.map((d) => d.id)

  const profileRows = await db
    .select({ day: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "business_page_viewed"),
        eq(analyticsEvents.targetId, businessId),
        cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
      )
    )
    .groupBy(sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`)

  const dealRows = dealIds.length
    ? await db
        .select({ day: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventName, "deal_view"),
            inArray(analyticsEvents.targetId, dealIds),
            cutoff ? gte(analyticsEvents.createdAt, cutoff) : undefined
          )
        )
        .groupBy(sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`)
    : []

  const profileByDay = new Map(profileRows.map((r) => [r.day, r.n]))
  const dealByDay = new Map(dealRows.map((r) => [r.day, r.n]))

  // Build a continuous, zero-filled axis. For "all", span from earliest event to today.
  const today = new Date()
  let start: Date
  if (cutoff) {
    start = cutoff
  } else {
    const allDays = [...profileByDay.keys(), ...dealByDay.keys()].sort()
    start = allDays.length ? new Date(allDays[0] + "T00:00:00Z") : today
  }

  const points: DailyPoint[] = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    points.push({ date: key, profileViews: profileByDay.get(key) ?? 0, dealViews: dealByDay.get(key) ?? 0 })
  }
  return points
}
```
(`daysInWindow` is exported-helper-free; if your linter flags it as unused, delete it — it is a convenience and not required.)

- [ ] **Step 4: Run smoke test to verify it passes**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/analytics/business-stats.smoke.ts`
Expected: PASS — prints `business-stats smoke: passed`.

- [ ] **Step 5: Lint + commit**

```bash
npx next lint --file lib/analytics/business-stats.ts
git add lib/analytics/business-stats.ts lib/analytics/business-stats.smoke.ts
git commit -m "feat: business-stats queries (profile views, traffic sources, daily series)"
```

---

## Task 5: Add Premium analytics tier flags

**Files:**
- Modify: `lib/stripe.ts`
- Modify: `lib/plan-features.ts`

**Interfaces:**
- Produces: `TIERS[t].canViewTrafficSources`, `TIERS[t].canViewTrends` (boolean); `FeatureFlag` union extended.

- [ ] **Step 1: Add flags to TIERS**

In `lib/stripe.ts`, add to each tier object:
- `free`: `canViewTrafficSources: false,` and `canViewTrends: false,`
- `standard`: `canViewTrafficSources: false,` and `canViewTrends: false,`
- `premium`: `canViewTrafficSources: true,` and `canViewTrends: true,`

Place them next to the existing `canViewAnalytics` line in each block.

- [ ] **Step 2: Extend FeatureFlag + minimum-tier map**

In `lib/plan-features.ts`, add `"canViewTrafficSources"` and `"canViewTrends"` to the `FeatureFlag` union, and add to the `FEATURE_MINIMUM_TIER` map (the object `assertFeature` reads):
```typescript
canViewTrafficSources: "premium",
canViewTrends: "premium",
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS — no type errors (the `as const` TIERS now carries the new flags).

- [ ] **Step 4: Commit**

```bash
git add lib/stripe.ts lib/plan-features.ts
git commit -m "feat: canViewTrafficSources + canViewTrends premium flags"
```

---

## Task 6: `TrendChart` SVG component

**Files:**
- Create: `components/trend-chart.tsx`

**Interfaces:**
- Consumes: `DailyPoint[]` (Task 4).
- Produces: `<TrendChart points={DailyPoint[]} labels={{ profileViews: string; dealViews: string }} />` — a client component, dependency-free SVG.

- [ ] **Step 1: Write the component**

Create `components/trend-chart.tsx`:
```tsx
"use client"

import type { DailyPoint } from "@/lib/analytics/business-stats"

export function TrendChart({
  points,
  labels,
}: {
  points: DailyPoint[]
  labels: { profileViews: string; dealViews: string }
}) {
  if (points.length === 0) return null

  const W = 720
  const H = 180
  const PAD = 24
  const max = Math.max(1, ...points.map((p) => Math.max(p.profileViews, p.dealViews)))
  const innerW = W - PAD * 2
  const innerH = H - PAD * 2
  const slot = innerW / points.length
  const barW = Math.max(2, slot / 3)

  const y = (v: number) => PAD + innerH - (v / max) * innerH

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" role="img" aria-label="Daily views trend">
        {/* baseline */}
        <line x1={PAD} y1={PAD + innerH} x2={W - PAD} y2={PAD + innerH} className="stroke-border" strokeWidth={1} />
        {points.map((p, i) => {
          const x = PAD + i * slot + slot / 2
          return (
            <g key={p.date}>
              <rect x={x - barW} y={y(p.profileViews)} width={barW} height={PAD + innerH - y(p.profileViews)} className="fill-primary" rx={1}>
                <title>{`${p.date}: ${p.profileViews} ${labels.profileViews}`}</title>
              </rect>
              <rect x={x + 1} y={y(p.dealViews)} width={barW} height={PAD + innerH - y(p.dealViews)} className="fill-amber" rx={1}>
                <title>{`${p.date}: ${p.dealViews} ${labels.dealViews}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />{labels.profileViews}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber" />{labels.dealViews}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/trend-chart.tsx
git commit -m "feat: dependency-free SVG TrendChart"
```

---

## Task 7: Wire analytics sections into the stats page

**Files:**
- Modify: `app/[locale]/dashboard/stats/page.tsx`
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Consumes: `effectiveTier` (Task 1), `getProfileViews`/`getTrafficSources`/`getDailySeries` (Task 4), `TrendChart` (Task 6), `getMyBusiness` (existing).

- [ ] **Step 1: Add i18n keys**

In `messages/en.json`, under the existing `"dashboardStats"` namespace, add:
```json
"profileViews": "Profile views ({window})",
"trafficTitle": "Traffic sources",
"trafficSubtitle": "Where your visitors came from ({window})",
"trafficColSource": "Source",
"trafficColVisits": "Visits",
"trafficColShare": "Share",
"trafficEmpty": "No visits yet in this window.",
"trendsTitle": "Trends",
"trendsSubtitle": "Daily profile & deal views ({window})",
"seriesProfileViews": "Profile views",
"seriesDealViews": "Deal views",
"premiumTeaserTitle": "Unlock with Premium",
"premiumTeaserBody": "See exactly where your visitors come from and how your traffic trends over time.",
"premiumTeaserCta": "Upgrade to Premium"
```
In `messages/es.json`, under `"dashboardStats"`, add the Spanish equivalents:
```json
"profileViews": "Visitas al perfil ({window})",
"trafficTitle": "Fuentes de tráfico",
"trafficSubtitle": "De dónde vinieron tus visitantes ({window})",
"trafficColSource": "Fuente",
"trafficColVisits": "Visitas",
"trafficColShare": "Porcentaje",
"trafficEmpty": "Aún no hay visitas en este periodo.",
"trendsTitle": "Tendencias",
"trendsSubtitle": "Visitas diarias al perfil y a las ofertas ({window})",
"seriesProfileViews": "Visitas al perfil",
"seriesDealViews": "Visitas a ofertas",
"premiumTeaserTitle": "Desbloquea con Premium",
"premiumTeaserBody": "Mira exactamente de dónde vienen tus visitantes y cómo evoluciona tu tráfico.",
"premiumTeaserCta": "Mejorar a Premium"
```

- [ ] **Step 2: Update tier resolution + data fetching in the page**

In `app/[locale]/dashboard/stats/page.tsx`:

Add imports:
```typescript
import { effectiveTier } from "@/lib/tier"
import { getProfileViews, getTrafficSources, getDailySeries } from "@/lib/analytics/business-stats"
import { TrendChart } from "@/components/trend-chart"
import { Link } from "@/i18n/navigation"
```
Replace the tier resolution. The current code is:
```typescript
const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) })
const currentTier = sub?.tier ?? "free"
if (currentTier === "free") {
  return <AnalyticsUpgradeGate t={t} />
}
```
with:
```typescript
const [sub, business] = await Promise.all([
  db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) }),
  getMyBusiness(),
])
const currentTier = effectiveTier({
  planOverride: business?.planOverride ?? null,
  subTier: sub?.tier ?? null,
  subStatus: sub?.status ?? null,
  gracePeriodEndsAt: business?.gracePeriodEndsAt ?? null,
})
if (currentTier === "free") {
  return <AnalyticsUpgradeGate t={t} />
}
const isPremium = currentTier === "premium"
```
(If `business` is already loaded elsewhere in the function via `getMyBusiness()`, reuse that single call instead of adding a second.)

Then fetch the new data alongside the existing funnel fetch (use `business.id`):
```typescript
const [profileViews, trafficSources, dailySeries] = await Promise.all([
  getProfileViews(business!.id, window),
  isPremium ? getTrafficSources(business!.id, window) : Promise.resolve([]),
  isPremium ? getDailySeries(business!.id, window) : Promise.resolve([]),
])
```

- [ ] **Step 3: Add the Profile views card (Standard+)**

In the summary-cards grid (currently `grid-cols-2 ... sm:grid-cols-4`), change it to `sm:grid-cols-5` and add as the FIRST `<BigStat>`:
```tsx
<BigStat icon={<Eye className="h-5 w-5" />} label={t("profileViews", { window: windowLabel })} value={profileViews} />
```
(Reuse the already-imported `Eye` icon. If `BigStat` requires more props, match the existing call sites exactly.)

- [ ] **Step 4: Add Traffic Sources + Trends (Premium) with teaser fallback**

After the funnel table block, add:
```tsx
{isPremium ? (
  <>
    <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="font-display text-lg font-semibold">{t("trafficTitle")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("trafficSubtitle", { window: windowLabel })}</p>
      </div>
      {trafficSources.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">{t("trafficEmpty")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="px-6 py-3 text-left font-medium">{t("trafficColSource")}</th>
              <th className="px-6 py-3 text-right font-medium">{t("trafficColVisits")}</th>
              <th className="px-6 py-3 text-right font-medium">{t("trafficColShare")}</th>
            </tr>
          </thead>
          <tbody>
            {trafficSources.map((s) => (
              <tr key={s.source} className="border-t">
                <td className="px-6 py-3">{s.source}</td>
                <td className="px-6 py-3 text-right tabular-nums">{s.count}</td>
                <td className="px-6 py-3 text-right tabular-nums">{s.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>

    <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="font-display text-lg font-semibold">{t("trendsTitle")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("trendsSubtitle", { window: windowLabel })}</p>
      </div>
      <div className="px-6 py-5">
        <TrendChart points={dailySeries} labels={{ profileViews: t("seriesProfileViews"), dealViews: t("seriesDealViews") }} />
      </div>
    </section>
  </>
) : (
  <section className="rounded-3xl border border-dashed bg-muted/20 px-6 py-12 text-center">
    <h3 className="font-display text-lg font-semibold">{t("premiumTeaserTitle")}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("premiumTeaserBody")}</p>
    <Link href="/dashboard/billing" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
      {t("premiumTeaserCta")}
    </Link>
  </section>
)}
```

- [ ] **Step 5: Build to verify the page compiles**

Run: `npx next build`
Expected: PASS — build completes; `/dashboard/stats` compiles with no type errors.

- [ ] **Step 6: Manual check + commit**

Manually: visit `/en/dashboard/stats` as a Standard business (profile-views card shows, Premium teaser shows) and as a Premium business (traffic + trends render). Then:
```bash
git add app/[locale]/dashboard/stats/page.tsx messages/en.json messages/es.json
git commit -m "feat: profile views, traffic sources, trends on stats page (premium-gated)"
```

---

## Task 8: Premium feature copy on billing page

**Files:**
- Modify: `app/[locale]/dashboard/billing/page.tsx`
- Modify: `lib/stripe.ts` (Premium `features[]` array)

- [ ] **Step 1: Add to the Premium `features[]` list**

In `lib/stripe.ts`, in the `premium.features` array, add:
```typescript
"Traffic sources & trends — see exactly what's driving visits",
```
And in `standard.features`, ensure analytics is described (leave existing entries; no change needed if "View & click analytics" is present).

- [ ] **Step 2: Verify billing page renders the new feature**

The billing page maps over `getPlanFeatures(tier).features`, so the new line appears automatically. Run:
```bash
npx next build
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/stripe.ts app/[locale]/dashboard/billing/page.tsx
git commit -m "feat: advertise traffic sources & trends on Premium plan"
```

---

## Task 9: Featured helpers — `seededShuffle`, `dateSeed`

**Files:**
- Create: `lib/featured.ts` (helpers only this task; query added in Task 10)
- Test: `lib/featured.test.ts`

**Interfaces:**
- Produces: `dateSeed(date: Date): number`; `seededShuffle<T>(items: T[], seed: number): T[]` (pure, deterministic, non-mutating).

- [ ] **Step 1: Write the failing test**

Create `lib/featured.test.ts`:
```typescript
import assert from "node:assert/strict"
import { dateSeed, seededShuffle } from "./featured"

// dateSeed: same day → same seed, different day → different seed
assert.equal(dateSeed(new Date("2026-06-23T01:00:00Z")), dateSeed(new Date("2026-06-23T23:00:00Z")))
assert.notEqual(dateSeed(new Date("2026-06-23T12:00:00Z")), dateSeed(new Date("2026-06-24T12:00:00Z")))

// seededShuffle: deterministic for a given seed, does not mutate input, preserves elements
const input = [1, 2, 3, 4, 5]
const a = seededShuffle(input, 42)
const b = seededShuffle(input, 42)
assert.deepEqual(a, b, "same seed → same order")
assert.deepEqual(input, [1, 2, 3, 4, 5], "input not mutated")
assert.deepEqual([...a].sort((x, y) => x - y), [1, 2, 3, 4, 5], "all elements preserved")
const c = seededShuffle(input, 99)
assert.notDeepEqual(a, c, "different seed → (very likely) different order")

console.log("featured.test: all passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/featured.test.ts`
Expected: FAIL — `Cannot find module './featured'`.

- [ ] **Step 3: Write the helpers**

Create `lib/featured.ts`:
```typescript
/** Seed derived from the calendar date (UTC) — stable within a day, changes daily. */
export function dateSeed(date: Date): number {
  const key = date.toISOString().slice(0, 10) // YYYY-MM-DD
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic, non-mutating shuffle (mulberry32 PRNG). */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items]
  let s = seed >>> 0
  const rand = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/featured.test.ts`
Expected: PASS — prints `featured.test: all passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/featured.ts lib/featured.test.ts
git commit -m "feat: deterministic date-seeded shuffle for featured rotation"
```

---

## Task 10: Add `featured` to deal rows + `getFeaturedDeals`

**Files:**
- Modify: `lib/queries.ts`
- Modify: `lib/featured.ts` (add the query)
- Test: `lib/featured.smoke.ts`

**Interfaces:**
- Consumes: `effectiveTier` (Task 1), `seededShuffle`/`dateSeed` (Task 9), `subscriptions` table.
- Produces:
  - `DealCardData` gains `featured: boolean`.
  - `getFeaturedDeals(opts?: { categorySlug?: string; limit?: number }): Promise<DealCardData[]>`.

- [ ] **Step 1: Extend the select + row mapper in `lib/queries.ts`**

Add imports if missing: `import { subscriptions } from "@/db/schema"` and `import { effectiveTier } from "@/lib/tier"`.

Add `featured: boolean` to the `DealCardData` type.

Extend `baseDealSelect` with the columns needed to resolve tier:
```typescript
bizOwnerUserId: businesses.ownerUserId,
bizPlanOverride: businesses.planOverride,
bizGracePeriodEndsAt: businesses.gracePeriodEndsAt,
subTier: subscriptions.tier,
subStatus: subscriptions.status,
```
In every query that uses `baseDealSelect` (`getActiveDeals`, `getDealsByCategorySlug`, and any others), add a left join after the businesses join:
```typescript
.leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
```
In `rowToCard`, compute and set `featured`:
```typescript
const tier = effectiveTier({
  planOverride: row.bizPlanOverride ?? null,
  subTier: row.subTier ?? null,
  subStatus: row.subStatus ?? null,
  gracePeriodEndsAt: row.bizGracePeriodEndsAt ?? null,
})
// ...inside the returned object:
featured: tier === "premium",
```

- [ ] **Step 2: Add `getFeaturedDeals` to `lib/featured.ts`**

Append to `lib/featured.ts`:
```typescript
import type { DealCardData } from "@/lib/queries"
import { getActiveDeals, getDealsByCategorySlug } from "@/lib/queries"

/**
 * Featured row: Premium businesses' active deals, deduped one-per-business,
 * rotated by a date-seeded shuffle, capped at `limit`.
 */
export async function getFeaturedDeals(opts: { categorySlug?: string; limit?: number } = {}): Promise<DealCardData[]> {
  const { categorySlug, limit = 6 } = opts
  // Pull a generous active set, then filter to premium in JS (premium set is small).
  const pool = categorySlug ? await getDealsByCategorySlug(categorySlug, 200) : await getActiveDeals(200)
  const premium = pool.filter((d) => d.featured)

  // One deal per business (keep first encountered = newest, since pool is newest-first).
  const seen = new Set<number>()
  const onePerBiz: DealCardData[] = []
  for (const d of premium) {
    if (seen.has(d.business.id)) continue
    seen.add(d.business.id)
    onePerBiz.push(d)
  }

  return seededShuffle(onePerBiz, dateSeed(new Date())).slice(0, limit)
}
```

- [ ] **Step 3: Write the failing smoke test**

Create `lib/featured.smoke.ts`:
```typescript
import assert from "node:assert/strict"
import { getFeaturedDeals } from "./featured"

async function main() {
  const featured = await getFeaturedDeals({ limit: 6 })
  assert.ok(Array.isArray(featured), "returns an array")
  assert.ok(featured.length <= 6, "respects limit")
  assert.ok(featured.every((d) => d.featured === true), "only premium/featured deals")
  const bizIds = featured.map((d) => d.business.id)
  assert.equal(new Set(bizIds).size, bizIds.length, "one deal per business")
  console.log(`featured smoke: passed (${featured.length} featured deals)`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 4: Run smoke test**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/featured.smoke.ts`
Expected: PASS — prints `featured smoke: passed (...)`. (Count may be 0 if no business is Premium yet; the empty-array case still passes all asserts.)

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npx tsc --noEmit
npx next lint --file lib/queries.ts --file lib/featured.ts
git add lib/queries.ts lib/featured.ts lib/featured.smoke.ts
git commit -m "feat: resolve featured tier on deal rows + getFeaturedDeals"
```

---

## Task 11: `FeaturedBadge` + render it on deal cards

**Files:**
- Create: `components/featured-badge.tsx`
- Modify: `components/deal-card.tsx`
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Consumes: `deal.featured` (Task 10).
- Produces: `<FeaturedBadge label={string} />`.

- [ ] **Step 1: Add i18n keys**

In `messages/en.json` add a new top-level namespace:
```json
"featured": {
  "title": "Featured",
  "subtitle": "Top local businesses",
  "badge": "Featured"
}
```
In `messages/es.json`:
```json
"featured": {
  "title": "Destacados",
  "subtitle": "Negocios locales destacados",
  "badge": "Destacado"
}
```

- [ ] **Step 2: Create the badge**

Create `components/featured-badge.tsx`:
```tsx
import { Star } from "lucide-react"

export function FeaturedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
      <Star className="h-3 w-3 fill-current" />
      {label}
    </span>
  )
}
```

- [ ] **Step 3: Render the badge in `deal-card.tsx`**

In `components/deal-card.tsx`, import:
```typescript
import { FeaturedBadge } from "@/components/featured-badge"
```
`DealCard` already calls `const t = await getTranslations("dealCard")`. Add a second namespace at the top of the component:
```typescript
const tf = await getTranslations("featured")
```
In the MEDIA block (the `<div className="relative h-52 ...">`), add the badge in the top-right, after the existing discount badge:
```tsx
{deal.featured && (
  <div className="absolute right-3 top-3">
    <FeaturedBadge label={tf("badge")} />
  </div>
)}
```
(If a heart/favorite button already occupies the top-right, place the FeaturedBadge at `top-3 left-1/2 -translate-x-1/2` or below the discount badge at `left-3 top-12` instead — match spacing to avoid overlap.)

- [ ] **Step 4: Build to verify**

Run: `npx next build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/featured-badge.tsx components/deal-card.tsx messages/en.json messages/es.json
git commit -m "feat: Featured badge on premium deal cards"
```

---

## Task 12: `FeaturedRow` component

**Files:**
- Create: `components/featured-row.tsx`

**Interfaces:**
- Consumes: `getFeaturedDeals` (Task 10), `DealCard` (existing), `Viewer` (existing, from how pages build it).
- Produces: `<FeaturedRow viewer={Viewer} categorySlug?={string} fromPath?={string} />` — async server component; renders `null` when empty.

- [ ] **Step 1: Inspect how `DealCard` gets its `viewer`**

Open `app/[locale]/(public)` homepage to see how `viewer` is constructed and passed to `DealCard` (e.g., a `getViewer()` helper). Use the exact same construction in the page when mounting `<FeaturedRow>` (Task 13). For this component, accept `viewer` as a prop.

- [ ] **Step 2: Create the component**

Create `components/featured-row.tsx`:
```tsx
import { getTranslations } from "next-intl/server"
import { getFeaturedDeals } from "@/lib/featured"
import { DealCard } from "@/components/deal-card"
import type { ComponentProps } from "react"

type Viewer = ComponentProps<typeof DealCard>["viewer"]

export async function FeaturedRow({
  viewer,
  categorySlug,
  fromPath,
}: {
  viewer: Viewer
  categorySlug?: string
  fromPath?: string
}) {
  const deals = await getFeaturedDeals({ categorySlug, limit: 6 })
  if (deals.length === 0) return null // empty state: render nothing (launch-safe)

  const t = await getTranslations("featured")
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-xl font-semibold tracking-tight">⭐ {t("title")}</h2>
        <span className="text-sm text-muted-foreground">{t("subtitle")}</span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal, i) => (
          <DealCard key={deal.id} deal={deal} viewer={viewer} fromPath={fromPath} staggerIndex={i} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/featured-row.tsx
git commit -m "feat: FeaturedRow section (hidden when empty)"
```

---

## Task 13: Mount `FeaturedRow` on homepage + category pages

**Files:**
- Modify: homepage page (e.g. `app/[locale]/(public)/page.tsx`)
- Modify: category/feed page (e.g. `app/[locale]/(public)/category/[slug]/page.tsx`)

**Interfaces:**
- Consumes: `FeaturedRow` (Task 12).

- [ ] **Step 1: Locate the exact page files**

Run: `git ls-files 'app/[locale]/(public)/**/page.tsx'`
Identify the homepage (renders `getActiveDeals`) and the category page (renders `getDealsByCategorySlug`). Use those exact paths below.

- [ ] **Step 2: Mount on the homepage**

In the homepage page, import:
```typescript
import { FeaturedRow } from "@/components/featured-row"
```
Render it directly above the existing main deals grid, passing the same `viewer` that the page already builds for `DealCard`:
```tsx
<FeaturedRow viewer={viewer} fromPath="/" />
{/* existing chronological deals grid stays exactly as-is below */}
```

- [ ] **Step 3: Mount on the category page**

In the category page, import `FeaturedRow` and render above the grid, scoped to the category:
```tsx
<FeaturedRow viewer={viewer} categorySlug={slug} fromPath={`/category/${slug}`} />
```
(Use the page's existing `slug` variable and its `viewer`.)

- [ ] **Step 3b: Verify empty-state safety**

Because `FeaturedRow` returns `null` when there are no Premium deals, both pages render exactly as before until a business goes Premium. Confirm by reading the rendered output — no empty heading should appear.

- [ ] **Step 4: Build + manual check**

Run: `npx next build`
Expected: PASS.
Manually: load `/en` and a category page. With no Premium businesses, no Featured row appears. (Optional: temporarily set one business's `plan_override` to `premium` in the DB to see the row, then revert.)

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(public)/page.tsx" "app/[locale]/(public)/category/[slug]/page.tsx"
git commit -m "feat: mount Featured row on homepage and category pages"
```

---

## Task 14: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit + smoke suite**

```bash
npx tsx lib/tier.test.ts
npx tsx lib/referrer.test.ts
npx tsx lib/featured.test.ts
node --env-file=.env.local node_modules/.bin/tsx lib/funnel-queries.smoke.ts
node --env-file=.env.local node_modules/.bin/tsx lib/analytics/business-stats.smoke.ts
node --env-file=.env.local node_modules/.bin/tsx lib/featured.smoke.ts
```
Expected: every script prints its `... passed` line and exits 0.

- [ ] **Step 2: Full build + lint**

```bash
npx tsc --noEmit
npx next lint
npx next build
```
Expected: all PASS (pre-existing bcryptjs/jose Edge warnings and Tailwind ambiguous-class warnings are known and not introduced by this work).

- [ ] **Step 3: Manual acceptance pass**

- Free business → `/dashboard/stats` shows the upgrade gate (unchanged).
- Standard business → profile-views card + funnel table show; Premium teaser shows.
- Premium business → traffic sources + trend chart render; deal cards show the Featured badge; the Featured row appears on `/en` and category pages.
- With zero Premium businesses → no Featured row anywhere.

- [ ] **Step 4: Push the branch**

```bash
git push -u origin feat/analytics-and-featured
```
Expected: pre-push lint hook passes; branch is on GitHub ready for PR.
