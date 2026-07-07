# Neighborhood Feed Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/feed` ("Neighborhood") into an interactive digest of everything on Lompoc Locals — community posts, garage-sale cards, rationed deals, new-business arrivals, events, blog — with instant type/neighborhood filtering, a Mapbox map view, and reactions + comments.

**Architecture:** The page stays an RSC that calls one unified `getFeedItems()`; a new `FeedExplorer` client island owns filtering, chips, view toggle, and URL sync. Reactions/comments are new polymorphic tables driven by server actions with an admin moderation queue.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle + Neon, next-intl, Tailwind + shadcn/ui, `react-map-gl/mapbox`, Auth.js v5.

**Spec:** `docs/superpowers/specs/2026-07-07-neighborhood-feed-redesign-design.md`

## Global Constraints

- No new dependencies. Maps use `react-map-gl/mapbox` (NOT Leaflet — Leaflet is installed but unused in this repo).
- Every user-facing string goes through next-intl with EN + ES parity (`messages/en.json` / `messages/es.json`).
- Events have no `lat`/`lng` columns — they get `neighborhood: null` and are excluded from the map view.
- Legacy URL `?type=for_sale` (target of the `/garage-sales` 308 redirect) must keep working.
- Interleaving ratio: at most 1 deal card per 4 non-deal items, never two deal cards adjacent; max 1 blog card per load; total limit 60.
- Brand palette for pins/badges: purple `#650C75` (deals), green `#0B992F` (community), gold `#EFC618` (garage sales/events).
- Tests are plain `node:assert/strict` scripts run with `npx tsx <file>` (repo convention, see `lib/amenities.test.ts`). There is no vitest/jest.
- Typecheck with `npx tsc --noEmit`, lint with `npm run lint` before every commit.
- Never commit `.env.local`. Deploys are manual: `vercel deploy --prod` (merging to main does NOT auto-deploy).
- Commit after every task.

## Phase map

- Phase 1 (ship after Task 5): Tasks 1–5 — unified feed + garage-sale cards + live filters/chips
- Phase 2 (ship after Task 6): Task 6 — map view
- Phase 3 (ship after Task 11): Tasks 7–11 — reactions, comments, moderation

---

### Task 1: `lib/neighborhoods.ts` — zones + point lookup

**Files:**
- Create: `lib/neighborhoods.ts`
- Test: `lib/neighborhoods.test.ts`

**Interfaces:**
- Produces: `NEIGHBORHOODS: Neighborhood[]`, `latLngToNeighborhood(lat: number, lng: number): string | null` (returns slug), `neighborhoodLabel(slug: string, locale: string): string`. Type `Neighborhood = { slug: string; en: string; es: string; bounds: [number, number, number, number] }` with bounds `[south, west, north, east]`.

- [ ] **Step 1: Write the failing test**

Create `lib/neighborhoods.test.ts`:

```ts
import assert from "node:assert/strict"
import {
  NEIGHBORHOODS,
  latLngToNeighborhood,
  neighborhoodLabel,
} from "./neighborhoods"

// shape: every zone has slug, labels, and a [S, W, N, E] box that is coherent
assert.ok(NEIGHBORHOODS.length >= 8)
for (const n of NEIGHBORHOODS) {
  assert.ok(n.slug && n.en && n.es)
  const [s, w, no, e] = n.bounds
  assert.ok(s < no, `${n.slug}: south < north`)
  assert.ok(w < e, `${n.slug}: west < east`)
}

// Old Town core (H St & Ocean Ave area) — must win over the wider Downtown box
assert.equal(latLngToNeighborhood(34.6391, -120.4579), "old-town")
// Wider central Lompoc, outside the Old Town core
assert.equal(latLngToNeighborhood(34.632, -120.448), "downtown")
// North of Central Ave, inside city
assert.equal(latLngToNeighborhood(34.665, -120.45), "northside")
// West of V St
assert.equal(latLngToNeighborhood(34.64, -120.475), "westside")
// South of Olive Ave
assert.equal(latLngToNeighborhood(34.62, -120.45), "southside")
// Vandenberg Village
assert.equal(latLngToNeighborhood(34.708, -120.461), "vandenberg-village")
// Mission Hills
assert.equal(latLngToNeighborhood(34.683, -120.428), "mission-hills")
// Mesa Oaks
assert.equal(latLngToNeighborhood(34.693, -120.462), "mesa-oaks")
// Vandenberg SFB (far west)
assert.equal(latLngToNeighborhood(34.73, -120.57), "vsfb")
// Way outside (Santa Maria) → null
assert.equal(latLngToNeighborhood(34.953, -120.435), null)

// labels
assert.equal(neighborhoodLabel("downtown", "es"), "Centro")
assert.equal(neighborhoodLabel("downtown", "en"), "Downtown")
assert.equal(neighborhoodLabel("not-a-zone", "en"), "Lompoc")

console.log("neighborhoods.test.ts OK")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/neighborhoods.test.ts`
Expected: FAIL — `Cannot find module './neighborhoods'`

- [ ] **Step 3: Write the implementation**

Create `lib/neighborhoods.ts`:

```ts
/**
 * Approximate neighborhood zones for Lompoc + Vandenberg (v1).
 * Bounds are [south, west, north, east] lat/lng rectangles.
 * Ordered most-specific first — latLngToNeighborhood returns the FIRST match,
 * so small cores (Old Town) must precede the wider boxes that contain them.
 */
export type Neighborhood = {
  slug: string
  en: string
  es: string
  bounds: [number, number, number, number]
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { slug: "old-town", en: "Old Town", es: "Old Town", bounds: [34.635, -120.465, 34.652, -120.452] },
  { slug: "downtown", en: "Downtown", es: "Centro", bounds: [34.628, -120.468, 34.658, -120.44] },
  { slug: "northside", en: "Northside", es: "Northside", bounds: [34.658, -120.48, 34.678, -120.42] },
  { slug: "westside", en: "Westside", es: "Westside", bounds: [34.62, -120.5, 34.658, -120.465] },
  { slug: "southside", en: "Southside", es: "Southside", bounds: [34.6, -120.465, 34.628, -120.42] },
  { slug: "mesa-oaks", en: "Mesa Oaks", es: "Mesa Oaks", bounds: [34.685, -120.48, 34.7, -120.45] },
  { slug: "mission-hills", en: "Mission Hills", es: "Mission Hills", bounds: [34.67, -120.45, 34.7, -120.41] },
  { slug: "vandenberg-village", en: "Vandenberg Village", es: "Vandenberg Village", bounds: [34.7, -120.49, 34.725, -120.43] },
  { slug: "vsfb", en: "Vandenberg SFB", es: "Base Vandenberg", bounds: [34.58, -120.65, 34.8, -120.49] },
]

export function latLngToNeighborhood(lat: number, lng: number): string | null {
  for (const n of NEIGHBORHOODS) {
    const [s, w, no, e] = n.bounds
    if (lat >= s && lat <= no && lng >= w && lng <= e) return n.slug
  }
  return null
}

/** Display label for a slug; unknown slugs fall back to "Lompoc". */
export function neighborhoodLabel(slug: string, locale: string): string {
  const n = NEIGHBORHOODS.find((z) => z.slug === slug)
  if (!n) return "Lompoc"
  return locale === "es" ? n.es : n.en
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/neighborhoods.test.ts`
Expected: `neighborhoods.test.ts OK`

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/neighborhoods.ts lib/neighborhoods.test.ts
git commit -m "feat: lompoc neighborhood zones + point lookup"
```

---

### Task 2: `lib/feed-interleave.ts` — garage-sale derivation, weekend logic, deal rationing

**Files:**
- Create: `lib/feed-interleave.ts`
- Test: `lib/feed-interleave.test.ts`

**Interfaces:**
- Produces:
  - `isGarageSale(type: string, saleStartsAt: Date | null): boolean`
  - `isThisWeekend(saleStartsAt: Date | null, saleEndsAt: Date | null, now: Date): boolean`
  - `interleaveDeals<T extends { source: string }>(nonDeals: T[], deals: T[]): T[]`
- These are pure functions — no DB, no imports from feed-queries (avoids import cycles).

- [ ] **Step 1: Write the failing test**

Create `lib/feed-interleave.test.ts`:

```ts
import assert from "node:assert/strict"
import { isGarageSale, isThisWeekend, interleaveDeals } from "./feed-interleave"

// --- isGarageSale
assert.equal(isGarageSale("for_sale", new Date("2026-07-10")), true)
assert.equal(isGarageSale("for_sale", null), false)
assert.equal(isGarageSale("info", new Date("2026-07-10")), false)

// --- isThisWeekend (Tue Jul 7 2026 → upcoming weekend is Fri Jul 10 – Sun Jul 12)
const tue = new Date("2026-07-07T12:00:00-07:00")
assert.equal(isThisWeekend(new Date("2026-07-11T08:00:00-07:00"), null, tue), true)
assert.equal(isThisWeekend(new Date("2026-07-18T08:00:00-07:00"), null, tue), false)
// sale spanning into the window counts
assert.equal(
  isThisWeekend(new Date("2026-07-09T08:00:00-07:00"), new Date("2026-07-11T17:00:00-07:00"), tue),
  true
)
// on a Saturday, the CURRENT weekend counts
const sat = new Date("2026-07-11T09:00:00-07:00")
assert.equal(isThisWeekend(new Date("2026-07-12T08:00:00-07:00"), null, sat), true)
assert.equal(isThisWeekend(null, null, tue), false)

// --- interleaveDeals: 1 deal after every 4 non-deals, never adjacent, leftovers dropped
const nd = (n: number) => Array.from({ length: n }, (_, i) => ({ source: "feed", i }))
const dl = (n: number) => Array.from({ length: n }, (_, i) => ({ source: "deal", i }))

const mixed = interleaveDeals(nd(10), dl(5))
// 10 non-deals → deals inserted after positions 4 and 8 → 12 items, 2 deals
assert.equal(mixed.length, 12)
assert.equal(mixed.filter((x) => x.source === "deal").length, 2)
for (let i = 1; i < mixed.length; i++) {
  assert.ok(
    !(mixed[i].source === "deal" && mixed[i - 1].source === "deal"),
    "no adjacent deals"
  )
}
// order of non-deals preserved
assert.deepEqual(
  mixed.filter((x) => x.source === "feed").map((x: any) => x.i),
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
)
// no deals → passthrough
assert.deepEqual(interleaveDeals(nd(3), []), nd(3))
// no non-deals → at most one deal (nothing to separate them)
assert.equal(interleaveDeals([], dl(4)).length, 1)

console.log("feed-interleave.test.ts OK")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx lib/feed-interleave.test.ts`
Expected: FAIL — `Cannot find module './feed-interleave'`

- [ ] **Step 3: Write the implementation**

Create `lib/feed-interleave.ts`:

```ts
/** Pure feed-composition helpers. No DB access — unit-testable. */

/** A for-sale post with a sale start date is a garage sale. */
export function isGarageSale(type: string, saleStartsAt: Date | null): boolean {
  return type === "for_sale" && saleStartsAt !== null
}

/**
 * True when the sale window overlaps the upcoming Fri 00:00 – Sun 23:59:59
 * weekend relative to `now` (if `now` is already Fri–Sun, that's the current
 * weekend). Uses local server time — close enough for a badge.
 */
export function isThisWeekend(
  saleStartsAt: Date | null,
  saleEndsAt: Date | null,
  now: Date
): boolean {
  if (!saleStartsAt) return false
  const day = now.getDay() // 0 Sun … 6 Sat
  // days until Friday; Sat(6)/Sun(0) belong to the weekend already under way
  const untilFriday = day === 0 ? -2 : day === 6 ? -1 : 5 - day
  const friday = new Date(now)
  friday.setDate(now.getDate() + untilFriday)
  friday.setHours(0, 0, 0, 0)
  const sundayEnd = new Date(friday)
  sundayEnd.setDate(friday.getDate() + 2)
  sundayEnd.setHours(23, 59, 59, 999)
  const saleEnd = saleEndsAt ?? saleStartsAt
  return saleStartsAt <= sundayEnd && saleEnd >= friday
}

/**
 * Rations deal cards into the feed: one deal after every 4 non-deal items,
 * never two deals adjacent. Surplus deals are dropped (next load rotates by
 * recency). With no non-deals, returns at most one deal.
 */
export function interleaveDeals<T extends { source: string }>(
  nonDeals: T[],
  deals: T[]
): T[] {
  if (nonDeals.length === 0) return deals.slice(0, 1)
  const out: T[] = []
  let di = 0
  for (let i = 0; i < nonDeals.length; i++) {
    out.push(nonDeals[i])
    if ((i + 1) % 4 === 0 && di < deals.length) out.push(deals[di++])
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx lib/feed-interleave.test.ts`
Expected: `feed-interleave.test.ts OK`

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/feed-interleave.ts lib/feed-interleave.test.ts
git commit -m "feat: feed interleave helpers — garage-sale + weekend derivation, deal rationing"
```

---

### Task 3: Extend `getFeedItems()` — deals, new businesses, blog, neighborhoods

**Files:**
- Modify: `lib/feed-queries.ts`
- Test: `lib/feed-queries.smoke.ts` (new, DB-dependent smoke script)

**Interfaces:**
- Consumes: `latLngToNeighborhood` (Task 1); `isGarageSale`, `interleaveDeals` (Task 2).
- Produces the extended `FeedDisplayItem` every later task relies on:

```ts
export type FeedDisplayItem = {
  id: string // "feed-{n}" | "event-{n}" | "deal-{n}" | "biz-{n}" | "blog-{n}"
  source: "feed" | "event" | "deal" | "new_business" | "blog"
  type: "for_sale" | "garage_sale" | "info" | "event" | "deal" | "new_business" | "blog"
  title: string
  description: string | null
  imageUrl: string | null
  priceCents: number | null
  badgeText: string | null // deal discountText
  businessName: string | null // deal / new_business cards
  address: string | null
  lat: number | null
  lng: number | null
  neighborhood: string | null // slug from lib/neighborhoods
  saleStartsAt: Date | null
  saleEndsAt: Date | null
  startsAt: Date | null
  isFeatured: boolean
  isNew: boolean
  approvedAt: Date
  href: string
}
```

- `getFeedItems(opts?: { limit?: number })` — the `type` opt is REMOVED (filtering moves client-side; grep confirms `app/[locale]/(public)/feed/page.tsx` is the only caller — update it in Task 5; until then it still compiles because the opt was optional... it does NOT: it passes `{ type: typeFilter }`. So in THIS task change that call to `getFeedItems()` with no filter — the page still works, filters just show everything until Task 5 replaces them).

- [ ] **Step 1: Rewrite `lib/feed-queries.ts`'s type + `getFeedItems`**

Replace the `FeedDisplayItem` type with the block above, keep `firstPhotoUrl`, and replace `getFeedItems` with:

```ts
import { and, desc, eq, gt, gte, lte } from "drizzle-orm"
import { db } from "@/db/client"
import { feedPosts, events, users, deals, businesses, blogPosts } from "@/db/schema"
import { latLngToNeighborhood } from "@/lib/neighborhoods"
import { isGarageSale, interleaveDeals } from "@/lib/feed-interleave"
```

```ts
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function hood(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) return null
  return latLngToNeighborhood(lat, lng)
}

/** Wrap a stream so one failing source degrades instead of blanking the feed. */
async function safeStream(
  name: string,
  fn: () => Promise<FeedDisplayItem[]>
): Promise<FeedDisplayItem[]> {
  try {
    return await fn()
  } catch (err) {
    console.error(`feed stream "${name}" failed:`, err)
    return []
  }
}

/**
 * Unified public feed: community posts (garage sales derived), upcoming
 * events, active deals (rationed in), businesses approved in the last 14
 * days, and at most one blog post from the last 30 days.
 * Sorted: featured first, then approvedAt desc, deals interleaved 1-per-4.
 */
export async function getFeedItems(opts?: { limit?: number }): Promise<FeedDisplayItem[]> {
  const limit = opts?.limit ?? 60
  const now = new Date()

  const [postItems, eventItems, dealItems, bizItems, blogItems] = await Promise.all([
    safeStream("posts", async () => {
      const rows = await db
        .select()
        .from(feedPosts)
        .where(and(eq(feedPosts.status, "approved"), gt(feedPosts.expiresAt, now)))
        .orderBy(desc(feedPosts.isFeatured), desc(feedPosts.approvedAt))
        .limit(limit)
      return rows.map((row) => {
        const approvedAt = row.approvedAt ?? row.createdAt
        return {
          id: `feed-${row.id}`,
          source: "feed" as const,
          type: isGarageSale(row.type, row.saleStartsAt)
            ? ("garage_sale" as const)
            : row.type,
          title: row.title,
          description: row.description,
          imageUrl: firstPhotoUrl(row.photos),
          priceCents: row.priceCents,
          badgeText: null,
          businessName: null,
          address: row.address,
          lat: row.lat,
          lng: row.lng,
          neighborhood: hood(row.lat, row.lng),
          saleStartsAt: row.saleStartsAt,
          saleEndsAt: row.saleEndsAt,
          startsAt: null,
          isFeatured: row.isFeatured,
          isNew: now.getTime() - approvedAt.getTime() < TWENTY_FOUR_HOURS_MS,
          approvedAt,
          href: `/feed/${row.id}`,
        }
      })
    }),

    safeStream("events", async () => {
      const rows = await db
        .select()
        .from(events)
        .where(and(eq(events.status, "approved"), gte(events.startsAt, now)))
        .orderBy(desc(events.createdAt))
        .limit(limit)
      return rows.map((row) => ({
        id: `event-${row.id}`,
        source: "event" as const,
        type: "event" as const,
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        priceCents: null,
        badgeText: null,
        businessName: null,
        address: row.location,
        lat: null,
        lng: null,
        neighborhood: null,
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: row.startsAt,
        isFeatured: false,
        isNew: now.getTime() - row.createdAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt: row.createdAt,
        href: `/events/${row.id}`,
      }))
    }),

    safeStream("deals", async () => {
      const rows = await db
        .select({ deal: deals, biz: businesses })
        .from(deals)
        .innerJoin(businesses, eq(businesses.id, deals.businessId))
        .where(
          and(
            eq(businesses.status, "approved"),
            eq(deals.paused, false),
            lte(deals.startsAt, now),
            gt(deals.expiresAt, now)
          )
        )
        .orderBy(desc(deals.createdAt))
        .limit(15)
      return rows.map(({ deal, biz }) => ({
        id: `deal-${deal.id}`,
        source: "deal" as const,
        type: "deal" as const,
        title: deal.title,
        description: deal.description,
        imageUrl: deal.imageUrl,
        priceCents: null,
        badgeText: deal.discountText,
        businessName: biz.name,
        address: biz.address,
        lat: biz.lat,
        lng: biz.lng,
        neighborhood: hood(biz.lat, biz.lng),
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: null,
        isFeatured: false,
        isNew: now.getTime() - deal.createdAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt: deal.createdAt,
        href: `/deals/${deal.id}`,
      }))
    }),

    safeStream("new-businesses", async () => {
      const cutoff = new Date(now.getTime() - FOURTEEN_DAYS_MS)
      const rows = await db
        .select()
        .from(businesses)
        .where(and(eq(businesses.status, "approved"), gte(businesses.createdAt, cutoff)))
        .orderBy(desc(businesses.createdAt))
        .limit(10)
      return rows.map((row) => ({
        id: `biz-${row.id}`,
        source: "new_business" as const,
        type: "new_business" as const,
        title: row.name,
        description: row.description,
        imageUrl: row.coverUrl ?? row.logoUrl,
        priceCents: null,
        badgeText: null,
        businessName: row.name,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        neighborhood: hood(row.lat, row.lng),
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: null,
        isFeatured: false,
        isNew: now.getTime() - row.createdAt.getTime() < TWENTY_FOUR_HOURS_MS,
        approvedAt: row.createdAt,
        href: `/biz/${row.slug}`,
      }))
    }),

    safeStream("blog", async () => {
      const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS)
      const rows = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.status, "published"), gte(blogPosts.publishedAt, cutoff)))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(1)
      return rows.map((row) => ({
        id: `blog-${row.id}`,
        source: "blog" as const,
        type: "blog" as const,
        title: row.title,
        description: row.excerpt,
        imageUrl: row.imageUrl,
        priceCents: null,
        badgeText: null,
        businessName: null,
        address: null,
        lat: null,
        lng: null,
        neighborhood: null,
        saleStartsAt: null,
        saleEndsAt: null,
        startsAt: null,
        isFeatured: false,
        isNew: false,
        approvedAt: row.publishedAt ?? row.createdAt,
        href: `/blog/${row.slug}`,
      }))
    }),
  ])

  const nonDeals = [...postItems, ...eventItems, ...bizItems, ...blogItems].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
    return b.approvedAt.getTime() - a.approvedAt.getTime()
  })

  return interleaveDeals(nonDeals, dealItems).slice(0, limit)
}
```

Leave `getFeedPostById`, `getMyFeedPosts`, `getPendingFeedPosts` untouched.

- [ ] **Step 2: Fix the one caller so the app still compiles**

In `app/[locale]/(public)/feed/page.tsx` change:

```ts
const items: FeedDisplayItem[] = await getFeedItems({ type: typeFilter })
```

to:

```ts
const items: FeedDisplayItem[] = await getFeedItems()
```

(The `typeFilter` variable and chips are replaced entirely in Task 5 — for now the server chips just all show the full feed. Delete the now-unused `typeFilter` narrowing if lint flags it.)

Also `components/feed-card.tsx` `typeLabel` now misses new type values — add a temporary passthrough so it compiles (Task 4 replaces this file's rendering):

```ts
const typeLabel = (type: FeedDisplayItem["type"]): string => {
  if (type === "for_sale" || type === "garage_sale") return t("forSale")
  if (type === "info") return t("info")
  if (type === "event") return t("event")
  return t("info")
}
```

- [ ] **Step 3: Write the smoke script**

Create `lib/feed-queries.smoke.ts` (mirrors `lib/funnel-queries.smoke.ts` conventions — hits the real DB read-only):

```ts
import { getFeedItems } from "./feed-queries"

async function main() {
  const items = await getFeedItems()
  const bySource: Record<string, number> = {}
  for (const it of items) bySource[it.source] = (bySource[it.source] ?? 0) + 1
  console.log("total:", items.length, bySource)

  // invariants
  if (items.length > 60) throw new Error("limit exceeded")
  for (let i = 1; i < items.length; i++) {
    if (items[i].source === "deal" && items[i - 1].source === "deal")
      throw new Error(`adjacent deals at ${i}`)
  }
  if (items.filter((i) => i.source === "blog").length > 1)
    throw new Error("more than one blog card")
  for (const it of items) {
    if (it.source === "deal" && !it.href.startsWith("/deals/")) throw new Error("bad deal href")
    if (it.neighborhood !== null && typeof it.neighborhood !== "string")
      throw new Error("bad neighborhood")
  }
  const hoods = new Set(items.map((i) => i.neighborhood).filter(Boolean))
  console.log("neighborhoods present:", [...hoods])
  console.log("feed-queries.smoke.ts OK")
}

main().then(() => process.exit(0))
```

- [ ] **Step 4: Run the smoke script**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/feed-queries.smoke.ts`
Expected: `feed-queries.smoke.ts OK` with per-source counts (deals > 0 if any active deals exist in prod data).

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/feed-queries.ts lib/feed-queries.smoke.ts "app/[locale]/(public)/feed/page.tsx" components/feed-card.tsx
git commit -m "feat: unified feed query — deals, new businesses, blog, neighborhoods"
```

---

### Task 4: Card renderers — FeedCard goes client, new card treatments, i18n keys

**Files:**
- Modify: `components/feed-card.tsx` (server → client component, new type renderings)
- Modify: `messages/en.json`, `messages/es.json` (`feedCard` namespace)

**Interfaces:**
- Consumes: extended `FeedDisplayItem` (Task 3), `isThisWeekend` (Task 2).
- Produces: `<FeedCard item={FeedDisplayItem} />` — now a **client** component (`"use client"`, `useTranslations("feedCard")` — `NextIntlClientProvider` already wraps the app in `app/[locale]/layout.tsx`). Task 5's client island renders these directly. The card root becomes a `<div className="relative">` with a stretched-link overlay (`<Link className="absolute inset-0" aria-label={item.title} />`) instead of wrapping everything in `<Link>` — Phase 3 puts buttons on cards and buttons inside anchors are invalid HTML.

- [ ] **Step 1: Add i18n keys**

In `messages/en.json`, extend the `feedCard` namespace (keep existing keys):

```json
"feedCard": {
  "forSale": "For sale",
  "info": "Community",
  "event": "Event",
  "free": "Free",
  "freeObo": "Free / OBO",
  "new": "New",
  "garageSale": "Garage sale",
  "thisWeekend": "This weekend",
  "deal": "Deal",
  "newInTown": "New in town",
  "fromTheBlog": "From the blog",
  "at": "at {name}"
}
```

In `messages/es.json` the same keys:

```json
"garageSale": "Venta de garaje",
"thisWeekend": "Este fin de semana",
"deal": "Oferta",
"newInTown": "Nuevo en Lompoc",
"fromTheBlog": "Del blog",
"at": "en {name}"
```

- [ ] **Step 2: Rewrite `components/feed-card.tsx`**

```tsx
"use client"

import { Link } from "@/i18n/navigation"
import { Calendar, MapPin, Newspaper, PartyPopper, Tag, Ticket } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"
import { isThisWeekend } from "@/lib/feed-interleave"
import { neighborhoodLabel } from "@/lib/neighborhoods"

function formatPrice(cents: number | null, freeLabel: string): string | null {
  if (cents === null) return null
  if (cents === 0) return freeLabel
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(d: Date | null, withTime: boolean): string | null {
  if (!d) return null
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  })
}

const TYPE_META: Record<
  FeedDisplayItem["type"],
  { labelKey: string; icon: typeof Tag; accent: string }
> = {
  for_sale: { labelKey: "forSale", icon: Tag, accent: "text-primary" },
  garage_sale: { labelKey: "garageSale", icon: Tag, accent: "text-gold-dark" },
  info: { labelKey: "info", icon: Newspaper, accent: "text-primary" },
  event: { labelKey: "event", icon: Calendar, accent: "text-primary" },
  deal: { labelKey: "deal", icon: Ticket, accent: "text-primary" },
  new_business: { labelKey: "newInTown", icon: PartyPopper, accent: "text-success" },
  blog: { labelKey: "fromTheBlog", icon: Newspaper, accent: "text-muted-foreground" },
}

export function FeedCard({ item }: { item: FeedDisplayItem }) {
  const t = useTranslations("feedCard")
  const locale = useLocale()
  const meta = TYPE_META[item.type]
  const Icon = meta.icon

  const priceStr = formatPrice(item.priceCents, t("free"))
  const dateStr =
    item.type === "garage_sale"
      ? formatDate(item.saleStartsAt, false)
      : item.source === "event"
        ? formatDate(item.startsAt, true)
        : null
  const weekend =
    item.type === "garage_sale" &&
    isThisWeekend(item.saleStartsAt, item.saleEndsAt, new Date())

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={item.href} className="absolute inset-0 z-[1]" aria-label={item.title} />

      {item.isNew && (
        <span className="animate-feed-new-pulse absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
          {t("new")}
        </span>
      )}
      {weekend && (
        <span className="absolute right-0 top-4 z-10 rounded-l-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
          {t("thisWeekend")}
        </span>
      )}

      {item.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.06]"
            loading="lazy"
          />
          {priceStr && (
            <span className="absolute right-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-sm font-bold text-foreground shadow-sm backdrop-blur-sm">
              {priceStr}
            </span>
          )}
          {item.badgeText && (
            <span className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm">
              {item.badgeText}
            </span>
          )}
        </div>
      ) : null}

      <div className="p-4">
        <div className={`mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${meta.accent}`}>
          <Icon className="h-3 w-3" />
          {t(meta.labelKey)}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          {item.title}
        </h3>
        {item.source === "deal" && item.businessName && (
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {t("at", { name: item.businessName })}
          </p>
        )}
        {!item.imageUrl && priceStr && (
          <p className="mt-1 text-sm font-bold text-primary">{priceStr}</p>
        )}
        {!item.imageUrl && item.badgeText && (
          <p className="mt-1 text-sm font-bold text-primary">{item.badgeText}</p>
        )}
        {item.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
        {dateStr && (
          <p className="mt-2 text-xs font-medium text-foreground">{dateStr}</p>
        )}
        {(item.address || item.neighborhood) && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.neighborhood ? neighborhoodLabel(item.neighborhood, locale) : item.address}
          </p>
        )}
      </div>
    </div>
  )
}
```

Notes for the implementer:
- `text-gold-dark`, `bg-gold`, `text-success` — check `tailwind.config.ts` for the brand token names; if `gold-dark` doesn't exist use `text-gold` on a dark background or the closest existing token. Do NOT invent hex values inline.
- `TYPE_META` uses `labelKey: string`, so call `t(meta.labelKey)` — next-intl accepts dynamic keys at runtime; if the typed `t` complains, type `labelKey` as `Parameters<typeof t>[0]` or cast at the call site.

- [ ] **Step 3: Check callers still compile**

`FeedCard` was `async` and awaited in `components/feed-masonry.tsx` — a client component is directly renderable there (server components can render client components). Run:

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean. Then `npm run dev`, open `http://localhost:3000/en/feed`, verify: cards render, garage-sale posts (for-sale with dates) show the gold ribbon when applicable, deal cards show "at {business}", price badges intact, ES page (`/es/feed`) shows translated labels.

- [ ] **Step 4: Commit**

```bash
git add components/feed-card.tsx messages/en.json messages/es.json
git commit -m "feat: feed card client renderer — garage sale, deal, new-business, blog treatments"
```

---

### Task 5: `FeedExplorer` island — live filters, neighborhood chips, URL sync (ships Phase 1)

**Files:**
- Create: `components/feed-explorer.tsx`
- Modify: `app/[locale]/(public)/feed/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (`feed` namespace)
- Delete: `components/feed-masonry.tsx` (its layout moves into FeedExplorer — first `grep -rn "FeedMasonry" app components` to confirm the feed page is the only consumer; if another exists, keep the file)

**Interfaces:**
- Consumes: `FeedDisplayItem`, `FeedCard`, `NEIGHBORHOODS`/`neighborhoodLabel`, `Reveal` (`components/reveal.tsx` — client, already used by FeedMasonry).
- Produces: `<FeedExplorer items={FeedDisplayItem[]} initialType={string} initialHood={string} />`. Filter values: type ∈ `all | deal | for_sale | garage_sale | event | news`; hood ∈ `all | <slug>`.
- Filter semantics: `for_sale` matches `for_sale` OR `garage_sale`; `news` matches `info | new_business | blog`; others match exactly. Legacy `?type=info` maps to `news`.

- [ ] **Step 1: Add i18n keys**

`messages/en.json`, `feed` namespace — add:

```json
"filterDeals": "Deals",
"filterGarageSales": "Garage sales",
"filterNews": "News",
"hoodAll": "All of Lompoc",
"viewCards": "Cards",
"viewMap": "Map"
```

`messages/es.json`:

```json
"filterDeals": "Ofertas",
"filterGarageSales": "Ventas de garaje",
"filterNews": "Noticias",
"hoodAll": "Todo Lompoc",
"viewCards": "Tarjetas",
"viewMap": "Mapa"
```

(Existing keys `filterAll`, `filterForSale`, `filterInfo`, `filterEvents`, `emptyState` are reused; `filterInfo` becomes the label for `news` — check its current copy reads well as a bucket label, update to "News"/"Noticias" if it says "Info".)

- [ ] **Step 2: Write `components/feed-explorer.tsx`**

```tsx
"use client"

import { useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"
import { neighborhoodLabel } from "@/lib/neighborhoods"
import { FeedCard } from "@/components/feed-card"
import { Reveal } from "@/components/reveal"

type TypeFilter = "all" | "deal" | "for_sale" | "garage_sale" | "event" | "news"

const TYPE_FILTERS: { value: TypeFilter; labelKey: string }[] = [
  { value: "all", labelKey: "filterAll" },
  { value: "deal", labelKey: "filterDeals" },
  { value: "for_sale", labelKey: "filterForSale" },
  { value: "garage_sale", labelKey: "filterGarageSales" },
  { value: "event", labelKey: "filterEvents" },
  { value: "news", labelKey: "filterNews" },
]

export function normalizeType(raw: string | undefined): TypeFilter {
  if (raw === "info") return "news" // legacy param
  if (raw && ["deal", "for_sale", "garage_sale", "event", "news"].includes(raw))
    return raw as TypeFilter
  return "all"
}

function matchesType(item: FeedDisplayItem, f: TypeFilter): boolean {
  if (f === "all") return true
  if (f === "for_sale") return item.type === "for_sale" || item.type === "garage_sale"
  if (f === "news")
    return item.type === "info" || item.type === "new_business" || item.type === "blog"
  return item.type === f
}

export function FeedExplorer({
  items,
  initialType,
  initialHood,
}: {
  items: FeedDisplayItem[]
  initialType: string
  initialHood: string
}) {
  const t = useTranslations("feed")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [type, setType] = useState<TypeFilter>(normalizeType(initialType))
  const [hood, setHood] = useState<string>(initialHood || "all")

  // chips only for neighborhoods that actually have items
  const hoods = useMemo(() => {
    const present = new Set(items.map((i) => i.neighborhood).filter(Boolean) as string[])
    return [...present]
  }, [items])

  const visible = useMemo(
    () =>
      items.filter(
        (i) => matchesType(i, type) && (hood === "all" || i.neighborhood === hood)
      ),
    [items, type, hood]
  )

  function sync(nextType: TypeFilter, nextHood: string) {
    const params = new URLSearchParams()
    if (nextType !== "all") params.set("type", nextType)
    if (nextHood !== "all") params.set("hood", nextHood)
    const qs = params.toString()
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    )
  }

  const chip = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  )

  const featured = visible.filter((i) => i.isFeatured).slice(0, 2)
  const featuredIds = new Set(featured.map((i) => i.id))
  const rest = visible.filter((i) => !featuredIds.has(i.id))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) =>
          chip(
            type === f.value,
            t(f.labelKey),
            () => {
              setType(f.value)
              sync(f.value, hood)
            },
            `type-${f.value}`
          )
        )}
      </div>

      {hoods.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chip(hood === "all", t("hoodAll"), () => { setHood("all"); sync(type, "all") }, "hood-all")}
          {hoods.map((h) =>
            chip(
              hood === h,
              neighborhoodLabel(h, locale),
              () => {
                setHood(h)
                sync(type, h)
              },
              `hood-${h}`
            )
          )}
        </div>
      )}

      {rest.length === 0 && featured.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t("emptyState")}</p>
      ) : (
        <div key={`${type}-${hood}`} className="space-y-8">
          {featured.length > 0 && (
            <Reveal preset="scaleIn" className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featured.map((item) => (
                <div key={item.id}>
                  <FeedCard item={item} />
                </div>
              ))}
            </Reveal>
          )}
          {rest.length > 0 && (
            <Reveal preset="stagger" stagger={60} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {rest.map((item) => (
                <div key={item.id} className="mb-4 break-inside-avoid">
                  <FeedCard item={item} />
                </div>
              ))}
            </Reveal>
          )}
        </div>
      )}
    </div>
  )
}
```

(The `key={type-hood}` on the card container re-mounts `Reveal` on every filter change so cards re-animate — that's the "cards animate in/out" behavior. Check `components/reveal.tsx` prop names — `preset`/`stagger` are the ones FeedMasonry used; keep exactly those. If `t(f.labelKey)` trips typed-message checking, cast: `t(f.labelKey as never)` matches repo precedent — grep for existing dynamic `t(` casts first.)

- [ ] **Step 3: Rewire `app/[locale]/(public)/feed/page.tsx`**

- Delete the `filterLink` helper, the `isFeedType`/`FeedType` narrowing, and the `FeedMasonry` import/usage.
- Accept `searchParams?: { type?: string; hood?: string }`.
- Replace the filter row + masonry block with:

```tsx
<FeedExplorer
  items={items}
  initialType={searchParams?.type ?? ""}
  initialHood={searchParams?.hood ?? ""}
/>
```

Keep the header band and the `NeighborhoodDemo` storyboard sections untouched.

- [ ] **Step 4: Delete `components/feed-masonry.tsx`** (after `grep -rn "FeedMasonry" app components lib` shows the feed page was the only consumer).

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run lint
npm run dev
```

Manual checks on `http://localhost:3000/en/feed`:
- Chips filter instantly (no page reload; watch the network tab — no document request).
- URL updates to `/en/feed?type=deal` etc.; hard-refreshing that URL restores the filter.
- `http://localhost:3000/en/feed?type=for_sale` (legacy redirect target) shows for-sale + garage-sale cards.
- `http://localhost:3000/en/garage-sales` still 308s into the feed.
- Neighborhood chips appear only for zones with items; combining type + hood works.
- `/es/feed` fully translated.

- [ ] **Step 6: Commit and ship Phase 1**

```bash
git add -A
git commit -m "feat: FeedExplorer island — live type + neighborhood filtering with URL sync"
git push
vercel deploy --prod
```

Then verify production: `https://lompoc-deals.vercel.app/en/feed` filters instantly. **STOP — report Phase 1 to the user for testing before continuing.**

---

### Task 6: Map view (ships Phase 2)

**Files:**
- Create: `components/feed-map.tsx`
- Modify: `components/feed-explorer.tsx` (view toggle)
- Modify: `messages/en.json`, `messages/es.json` (`feed` namespace additions from Task 5 already include `viewCards`/`viewMap`; add `mapNoLocation` here)

**Interfaces:**
- Consumes: `FeedDisplayItem`; Mapbox pattern from `components/garage-sales-map.tsx` (`react-map-gl/mapbox`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `LOMPOC_CENTER = { longitude: -120.4579, latitude: 34.6391 }`).
- Produces: `<FeedMap items={FeedDisplayItem[]} />` — plots only items with `lat`/`lng`.

- [ ] **Step 1: Add i18n keys**

`en.json` `feed`: `"mapNoLocation": "{count} items without a map location are hidden"`
`es.json` `feed`: `"mapNoLocation": "{count} publicaciones sin ubicación no se muestran"`

- [ ] **Step 2: Write `components/feed-map.tsx`**

Model it directly on `components/garage-sales-map.tsx` (read it first — same `Map`, `Marker`, `Popup`, `NavigationControl` imports from `react-map-gl/mapbox`, same token guard rendering a fallback if `NEXT_PUBLIC_MAPBOX_TOKEN` is missing). Differences:

```tsx
"use client"

import { useState } from "react"
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import type { FeedDisplayItem } from "@/lib/feed-queries"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const LOMPOC_CENTER = { longitude: -120.4579, latitude: 34.6391 }

// brand palette per card family
const PIN_COLORS: Record<string, string> = {
  deal: "#650C75",
  garage_sale: "#EFC618",
  event: "#EFC618",
  for_sale: "#0B992F",
  info: "#0B992F",
  new_business: "#0B992F",
  blog: "#0B992F",
}

function Pin({ color, selected }: { color: string; selected: boolean }) {
  return (
    <svg
      viewBox="0 0 36 50"
      width={selected ? 40 : 30}
      height={selected ? 56 : 42}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 3px 6px rgba(0,0,0,${selected ? "0.45" : "0.3"}))` }}
    >
      <path
        d="M18 0 C8 0 0 8 0 18 C0 31 18 50 18 50 C18 50 36 31 36 18 C36 8 28 0 18 0 Z"
        fill={color}
      />
      <circle cx="18" cy="18" r="8" fill="white" fillOpacity="0.9" />
    </svg>
  )
}

export function FeedMap({ items }: { items: FeedDisplayItem[] }) {
  const t = useTranslations("feed")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const located = items.filter((i) => i.lat !== null && i.lng !== null)
  const hiddenCount = items.length - located.length
  const selected = located.find((i) => i.id === selectedId) ?? null

  if (!MAPBOX_TOKEN) {
    return (
      <p className="py-12 text-center text-muted-foreground">{t("emptyState")}</p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-[520px] overflow-hidden rounded-2xl border">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ ...LOMPOC_CENTER, zoom: 12.5 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <NavigationControl position="top-right" />
          {located.map((item) => (
            <Marker
              key={item.id}
              longitude={item.lng!}
              latitude={item.lat!}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedId(item.id)
              }}
            >
              <Pin color={PIN_COLORS[item.type] ?? "#0B992F"} selected={item.id === selectedId} />
            </Marker>
          ))}
          {selected && (
            <Popup
              longitude={selected.lng!}
              latitude={selected.lat!}
              anchor="top"
              onClose={() => setSelectedId(null)}
              closeButton
              maxWidth="280px"
            >
              <Link href={selected.href} className="block p-1">
                <p className="text-sm font-semibold leading-snug">{selected.title}</p>
                {selected.badgeText && (
                  <p className="mt-0.5 text-xs font-bold text-primary">{selected.badgeText}</p>
                )}
                {selected.address && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{selected.address}</p>
                )}
              </Link>
            </Popup>
          )}
        </Map>
      </div>
      {hiddenCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {t("mapNoLocation", { count: hiddenCount })}
        </p>
      )}
    </div>
  )
}
```

(Match the exact `Map` props of `garage-sales-map.tsx` — mapStyle string, token guard behavior — over the sketch above where they differ. If that file renders a nicer no-token fallback, copy it.)

- [ ] **Step 3: Add the toggle to `FeedExplorer`**

- `const [view, setView] = useState<"cards" | "map">("cards")`
- Next to the type chips row, render a two-button segmented control using the same chip styles: `t("viewCards")` / `t("viewMap")`.
- When `view === "map"`, render `<FeedMap items={visible} />` instead of the card sections. Import `FeedMap` with `next/dynamic` and `ssr: false` (match how other pages load their Mapbox components — grep `dynamic(` usage for `business-map` or `hotels-map` and copy that pattern).
- Filters (type + hood) must affect the map identically — they already do since `visible` is shared.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint && npm run dev
```

Manual: `/en/feed` → Map toggle shows pins color-coded (purple deals, green community, gold garage sales); clicking a pin opens the mini-card linking to the item; type/hood chips filter pins; hidden-count note appears when items lack coordinates; toggling back to Cards works.

- [ ] **Step 5: Commit and ship Phase 2**

```bash
git add -A
git commit -m "feat: feed map view — color-coded pins with popup mini-cards"
git push
vercel deploy --prod
```

**STOP — report Phase 2 to the user for testing before continuing.**

---

### Task 7: Schema — reactions, comments, reports, blocked commenters

**Files:**
- Modify: `db/schema.ts`
- Generated: `db/migrations/00xx_*.sql` (via drizzle-kit)

**Interfaces:**
- Produces Drizzle tables imported by Tasks 8–11: `reactions`, `comments`, `commentReports`, enums `commentSubjectType` (`feed_post | deal | event`), `commentStatus` (`visible | removed`), and `users.commentsBlocked: boolean`.

- [ ] **Step 1: Add to `db/schema.ts`** (bottom of file, matching house style):

```ts
// ---------- reactions & comments (Neighborhood feed conversation layer) ----------
export const commentSubjectType = pgEnum("comment_subject_type", [
  "feed_post",
  "deal",
  "event",
])
export const commentStatus = pgEnum("comment_status", ["visible", "removed"])

export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    subjectType: commentSubjectType("subject_type").notNull(),
    subjectId: integer("subject_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    oneReactionPerUser: uniqueIndex("reactions_subject_user_idx").on(
      t.subjectType,
      t.subjectId,
      t.userId
    ),
  })
)

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    subjectType: commentSubjectType("subject_type").notNull(),
    subjectId: integer("subject_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    status: commentStatus("status").notNull().default("visible"),
    reportCount: integer("report_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    subjectIdx: index("comments_subject_idx").on(t.subjectType, t.subjectId),
  })
)

export const commentReports = pgTable(
  "comment_reports",
  {
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.commentId, t.userId] }),
  })
)
```

Add to the `users` table columns:

```ts
commentsBlocked: boolean("comments_blocked").notNull().default(false),
```

(Check the file's import list already includes `index`; add it to the `drizzle-orm/pg-core` import if missing.)

- [ ] **Step 2: Generate + apply the migration**

```bash
npm run db:generate
npm run db:push
```

Expected: a new `db/migrations/00xx_*.sql` containing `CREATE TABLE reactions/comments/comment_reports`, the two enums, and `ALTER TABLE users ADD COLUMN comments_blocked`. `db:push` exits 0.

- [ ] **Step 3: Verify tables exist**

```bash
node --env-file=.env.local -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`select table_name from information_schema.tables where table_name in ('reactions','comments','comment_reports')\`.then(r => { console.log(r); process.exit(0) })
"
```

Expected: all three table names.

- [ ] **Step 4: Typecheck, commit**

```bash
npx tsc --noEmit && npm run lint
git add db/schema.ts db/migrations
git commit -m "feat: reactions, comments, reports schema + commentsBlocked flag"
```

---

### Task 8: Server actions — react, comment, report

**Files:**
- Create: `lib/comment-actions.ts`
- Create: `lib/reaction-actions.ts`

**Interfaces:**
- Consumes: Task 7 tables; `auth` from `@/auth` (pattern: `lib/tracking-actions.ts`); `revalidatePath` from `next/cache`.
- Produces (exact signatures — client components in Tasks 9–10 call these):

```ts
export type ActionResult = { ok: true } | { ok: false; error: "auth" | "blocked" | "rateLimit" | "invalid" | "notFound" }
// comment-actions.ts
export async function addCommentAction(input: { subjectType: "feed_post" | "deal" | "event"; subjectId: number; body: string }): Promise<ActionResult>
export async function reportCommentAction(commentId: number): Promise<ActionResult>
// reaction-actions.ts
export async function toggleReactionAction(input: { subjectType: "feed_post" | "deal" | "event"; subjectId: number; emoji: string }): Promise<ActionResult>
```

- [ ] **Step 1: Write `lib/reaction-actions.ts`**

```ts
"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { reactions } from "@/db/schema"

export type ActionResult =
  | { ok: true }
  | { ok: false; error: "auth" | "blocked" | "rateLimit" | "invalid" | "notFound" }

const ALLOWED_EMOJI = ["❤️", "👍", "🎉"] as const
const SUBJECT_TYPES = ["feed_post", "deal", "event"] as const
type SubjectType = (typeof SUBJECT_TYPES)[number]

export async function toggleReactionAction(input: {
  subjectType: SubjectType
  subjectId: number
  emoji: string
}): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  if (!userId) return { ok: false, error: "auth" }
  if (
    !SUBJECT_TYPES.includes(input.subjectType) ||
    !Number.isInteger(input.subjectId) ||
    !ALLOWED_EMOJI.includes(input.emoji as (typeof ALLOWED_EMOJI)[number])
  ) {
    return { ok: false, error: "invalid" }
  }

  const existing = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.subjectType, input.subjectType),
        eq(reactions.subjectId, input.subjectId),
        eq(reactions.userId, userId)
      )
    )
    .limit(1)

  if (existing[0]?.emoji === input.emoji) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id))
  } else if (existing[0]) {
    await db.update(reactions).set({ emoji: input.emoji }).where(eq(reactions.id, existing[0].id))
  } else {
    await db.insert(reactions).values({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      userId,
      emoji: input.emoji,
    })
  }
  revalidatePath("/[locale]/feed", "page")
  return { ok: true }
}
```

- [ ] **Step 2: Write `lib/comment-actions.ts`**

```ts
"use server"

import { and, count, eq, gte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { commentReports, comments, deals, events, feedPosts, users } from "@/db/schema"
import type { ActionResult } from "@/lib/reaction-actions"

const SUBJECT_TYPES = ["feed_post", "deal", "event"] as const
type SubjectType = (typeof SUBJECT_TYPES)[number]
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000

async function subjectExists(subjectType: SubjectType, subjectId: number): Promise<boolean> {
  if (subjectType === "feed_post") {
    const r = await db.select({ id: feedPosts.id }).from(feedPosts).where(eq(feedPosts.id, subjectId)).limit(1)
    return r.length > 0
  }
  if (subjectType === "deal") {
    const r = await db.select({ id: deals.id }).from(deals).where(eq(deals.id, subjectId)).limit(1)
    return r.length > 0
  }
  const r = await db.select({ id: events.id }).from(events).where(eq(events.id, subjectId)).limit(1)
  return r.length > 0
}

export async function addCommentAction(input: {
  subjectType: SubjectType
  subjectId: number
  body: string
}): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  if (!userId) return { ok: false, error: "auth" }

  const body = input.body?.trim()
  if (!SUBJECT_TYPES.includes(input.subjectType) || !Number.isInteger(input.subjectId))
    return { ok: false, error: "invalid" }
  if (!body || body.length < 1 || body.length > 1000) return { ok: false, error: "invalid" }

  const me = await db.select({ blocked: users.commentsBlocked }).from(users).where(eq(users.id, userId)).limit(1)
  if (me[0]?.blocked) return { ok: false, error: "blocked" }

  if (!(await subjectExists(input.subjectType, input.subjectId)))
    return { ok: false, error: "notFound" }

  const windowStart = new Date(Date.now() - RATE_WINDOW_MS)
  const recent = await db
    .select({ n: count() })
    .from(comments)
    .where(and(eq(comments.userId, userId), gte(comments.createdAt, windowStart)))
  if ((recent[0]?.n ?? 0) >= RATE_LIMIT) return { ok: false, error: "rateLimit" }

  await db.insert(comments).values({
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    userId,
    body,
  })
  revalidatePath("/[locale]/feed", "page")
  return { ok: true }
}

export async function reportCommentAction(commentId: number): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
  if (!userId) return { ok: false, error: "auth" }
  if (!Number.isInteger(commentId)) return { ok: false, error: "invalid" }

  const inserted = await db
    .insert(commentReports)
    .values({ commentId, userId })
    .onConflictDoNothing()
    .returning({ commentId: commentReports.commentId })

  if (inserted.length > 0) {
    await db
      .update(comments)
      .set({ reportCount: sql`${comments.reportCount} + 1` })
      .where(eq(comments.id, commentId))
  }
  return { ok: true }
}
```

(`revalidatePath("/[locale]/feed", "page")` — verify the repo's existing revalidate calls: grep `revalidatePath` in `lib/feed-actions.ts` and copy the exact path convention used there.)

- [ ] **Step 3: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/comment-actions.ts lib/reaction-actions.ts
git commit -m "feat: reaction + comment server actions with rate limit and reports"
```

---

### Task 9: ReactionBar on cards + engagement counts in the feed query

**Files:**
- Create: `components/reaction-bar.tsx`
- Modify: `lib/feed-queries.ts` (aggregate counts + viewer reaction)
- Modify: `components/feed-card.tsx` (render the bar)
- Modify: `app/[locale]/(public)/feed/page.tsx` (pass viewer id)
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Consumes: `toggleReactionAction` (Task 8), `reactions`/`comments` tables (Task 7).
- Produces:
  - `FeedDisplayItem` gains `reactionCounts: Record<string, number>`, `viewerEmoji: string | null`, `commentCount: number`.
  - `getFeedItems(opts?: { limit?: number; viewerId?: number | null })`.
  - `<ReactionBar subjectType subjectId reactionCounts viewerEmoji commentCount commentsHref isLoggedIn fromPath />` (client).
  - `subjectTypeOf(item): "feed_post" | "deal" | "event" | null` — maps source `feed→feed_post`, `deal→deal`, `event→event`, else null (new_business/blog cards get no bar).

- [ ] **Step 1: Extend `getFeedItems` with engagement data**

After building the merged `items` list (before `return`):

```ts
// engagement counts for the three commentable subject types
const idsByType: Record<"feed_post" | "deal" | "event", number[]> = {
  feed_post: [],
  deal: [],
  event: [],
}
for (const it of merged) {
  const st = it.source === "feed" ? "feed_post" : it.source === "deal" ? "deal" : it.source === "event" ? "event" : null
  if (st) idsByType[st].push(parseInt(it.id.split("-")[1], 10))
}

const [reactionRows, commentRows, viewerRows] = await Promise.all([
  db
    .select({
      subjectType: reactions.subjectType,
      subjectId: reactions.subjectId,
      emoji: reactions.emoji,
      n: count(),
    })
    .from(reactions)
    .groupBy(reactions.subjectType, reactions.subjectId, reactions.emoji),
  db
    .select({ subjectType: comments.subjectType, subjectId: comments.subjectId, n: count() })
    .from(comments)
    .where(eq(comments.status, "visible"))
    .groupBy(comments.subjectType, comments.subjectId),
  opts?.viewerId
    ? db
        .select({ subjectType: reactions.subjectType, subjectId: reactions.subjectId, emoji: reactions.emoji })
        .from(reactions)
        .where(eq(reactions.userId, opts.viewerId))
    : Promise.resolve([]),
])
```

Then stamp each item (`key = `${st}:${id}``) from three lookup Maps. Tables are town-scale (hundreds of rows) — unfiltered grouped scans are fine; add `inArray` narrowing only if this ever shows up in slow queries.

Default the three new fields (`reactionCounts: {}`, `viewerEmoji: null`, `commentCount: 0`) in every stream mapper, then overwrite from the maps.

In `app/[locale]/(public)/feed/page.tsx`:

```ts
const session = await auth()
const viewerId = session?.user?.id ? parseInt(session.user.id, 10) : null
const items = await getFeedItems({ viewerId })
```

(import `auth` from `@/auth`.)

- [ ] **Step 2: i18n keys**

`en.json`, new `reactions` namespace: `{ "signInToReact": "Sign in to react", "comments": "{count} comments" }`
`es.json`: `{ "signInToReact": "Inicia sesión para reaccionar", "comments": "{count} comentarios" }`

- [ ] **Step 3: Write `components/reaction-bar.tsx`**

```tsx
"use client"

import { useOptimistic, useTransition } from "react"
import { MessageCircle } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { toggleReactionAction } from "@/lib/reaction-actions"

const EMOJI = ["❤️", "👍", "🎉"] as const

export function ReactionBar(props: {
  subjectType: "feed_post" | "deal" | "event"
  subjectId: number
  reactionCounts: Record<string, number>
  viewerEmoji: string | null
  commentCount: number
  commentsHref: string
  isLoggedIn: boolean
  fromPath: string
}) {
  const t = useTranslations("reactions")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [optimistic, applyOptimistic] = useOptimistic(
    { counts: props.reactionCounts, mine: props.viewerEmoji },
    (state, emoji: string) => {
      const counts = { ...state.counts }
      if (state.mine) counts[state.mine] = Math.max(0, (counts[state.mine] ?? 1) - 1)
      if (state.mine === emoji) return { counts, mine: null }
      counts[emoji] = (counts[emoji] ?? 0) + 1
      return { counts, mine: emoji }
    }
  )

  function react(emoji: string) {
    if (!props.isLoggedIn) {
      router.push(`/login?from=${encodeURIComponent(props.fromPath)}`)
      return
    }
    startTransition(async () => {
      applyOptimistic(emoji)
      await toggleReactionAction({
        subjectType: props.subjectType,
        subjectId: props.subjectId,
        emoji,
      })
    })
  }

  return (
    <div className="relative z-10 mt-3 flex items-center gap-1.5 border-t pt-2.5">
      {EMOJI.map((e) => {
        const n = optimistic.counts[e] ?? 0
        const active = optimistic.mine === e
        return (
          <button
            key={e}
            type="button"
            disabled={pending}
            onClick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              react(e)
            }}
            title={props.isLoggedIn ? undefined : t("signInToReact")}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
              active
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            <span>{e}</span>
            {n > 0 && <span>{n}</span>}
          </button>
        )
      })}
      <a
        href={props.commentsHref}
        className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {props.commentCount}
      </a>
    </div>
  )
}
```

(Check the repo's login route + `from` param convention — grep `?from=` in `components/deal-card.tsx` and match it exactly, including `usePathname` usage. Pass `fromPath` down from `FeedCard` via `usePathname()` there.)

- [ ] **Step 4: Render the bar in `FeedCard`**

At the bottom of the card `<div className="p-4">`, for commentable items:

```tsx
{subjectTypeOf(item) && (
  <ReactionBar
    subjectType={subjectTypeOf(item)!}
    subjectId={numericId(item)}
    reactionCounts={item.reactionCounts}
    viewerEmoji={item.viewerEmoji}
    commentCount={item.commentCount}
    commentsHref={item.href}
    isLoggedIn={isLoggedIn}
    fromPath={pathname}
  />
)}
```

Add helpers in `feed-card.tsx`:

```ts
function subjectTypeOf(item: FeedDisplayItem): "feed_post" | "deal" | "event" | null {
  if (item.source === "feed") return "feed_post"
  if (item.source === "deal") return "deal"
  if (item.source === "event") return "event"
  return null
}
function numericId(item: FeedDisplayItem): number {
  return parseInt(item.id.split("-")[1], 10)
}
```

`isLoggedIn` threads: `feed/page.tsx` (has session) → `FeedExplorer` prop → `FeedCard` prop. The stretched-link overlay from Task 4 keeps the bar clickable because the bar is `relative z-10`.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run lint && npm run dev
```

Manual: logged out → tapping ❤️ routes to `/en/login?from=/en/feed`; logged in → tap toggles instantly (optimistic), refresh persists, switching emoji moves the count, re-tap removes. Comment count badge shows 0 and links to the detail page.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: reaction bar on feed cards with optimistic toggle + engagement counts"
```

---

### Task 10: CommentSection on detail pages

**Files:**
- Create: `components/comment-section.tsx`
- Create: `lib/comment-queries.ts`
- Modify: `app/[locale]/(public)/feed/[id]/page.tsx`
- Modify: `app/[locale]/(public)/deals/[id]/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (new `comments` namespace)

**Interfaces:**
- Consumes: `addCommentAction`, `reportCommentAction` (Task 8).
- Produces:
  - `getComments(subjectType, subjectId): Promise<CommentView[]>` where `CommentView = { id: number; body: string; status: "visible" | "removed"; authorName: string; createdAt: Date }` (authorName = users.name ?? email local-part).
  - `<CommentSection subjectType subjectId comments isLoggedIn viewerBlocked fromPath />` (client).

- [ ] **Step 1: `lib/comment-queries.ts`**

```ts
import { and, asc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { comments, users } from "@/db/schema"

export type CommentView = {
  id: number
  body: string
  status: "visible" | "removed"
  authorName: string
  createdAt: Date
}

export async function getComments(
  subjectType: "feed_post" | "deal" | "event",
  subjectId: number
): Promise<CommentView[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      status: comments.status,
      createdAt: comments.createdAt,
      name: users.name,
      email: users.email,
    })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.userId))
    .where(and(eq(comments.subjectType, subjectType), eq(comments.subjectId, subjectId)))
    .orderBy(asc(comments.createdAt))
  return rows.map((r) => ({
    id: r.id,
    body: r.status === "removed" ? "" : r.body,
    status: r.status,
    authorName: r.name ?? r.email?.split("@")[0] ?? "Neighbor",
    createdAt: r.createdAt,
  }))
}
```

(Removed comments keep their slot but ship an empty body — the client renders the "removed" placeholder string; the original text never reaches the browser.)

- [ ] **Step 2: i18n keys**

`en.json`, new top-level `comments` namespace:

```json
"comments": {
  "heading": "Neighbors are saying",
  "empty": "No comments yet — start the conversation.",
  "placeholder": "Say something about this…",
  "submit": "Comment",
  "signInPrompt": "Sign in to join the conversation",
  "removed": "Removed by moderator",
  "report": "Report",
  "reported": "Reported",
  "blockedNotice": "Commenting is disabled for your account.",
  "rateLimited": "You're commenting too fast — try again in a few minutes.",
  "error": "Something went wrong. Try again."
}
```

`es.json`:

```json
"comments": {
  "heading": "Los vecinos comentan",
  "empty": "Aún no hay comentarios — inicia la conversación.",
  "placeholder": "Comparte algo sobre esto…",
  "submit": "Comentar",
  "signInPrompt": "Inicia sesión para unirte a la conversación",
  "removed": "Eliminado por un moderador",
  "report": "Reportar",
  "reported": "Reportado",
  "blockedNotice": "Los comentarios están deshabilitados para tu cuenta.",
  "rateLimited": "Estás comentando muy rápido — intenta de nuevo en unos minutos.",
  "error": "Algo salió mal. Intenta de nuevo."
}
```

- [ ] **Step 3: `components/comment-section.tsx`**

```tsx
"use client"

import { useState, useTransition } from "react"
import { Flag } from "lucide-react"
import { Link, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { addCommentAction, reportCommentAction } from "@/lib/comment-actions"
import type { CommentView } from "@/lib/comment-queries"

export function CommentSection(props: {
  subjectType: "feed_post" | "deal" | "event"
  subjectId: number
  comments: CommentView[]
  isLoggedIn: boolean
  viewerBlocked: boolean
  fromPath: string
}) {
  const t = useTranslations("comments")
  const router = useRouter()
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [reported, setReported] = useState<Set<number>>(new Set())
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await addCommentAction({
        subjectType: props.subjectType,
        subjectId: props.subjectId,
        body,
      })
      if (res.ok) {
        setBody("")
        router.refresh()
      } else if (res.error === "rateLimit") setError(t("rateLimited"))
      else if (res.error === "blocked") setError(t("blockedNotice"))
      else setError(t("error"))
    })
  }

  function report(id: number) {
    setReported((s) => new Set(s).add(id))
    startTransition(async () => {
      await reportCommentAction(id)
    })
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">
        {t("heading")}
      </h2>

      {props.comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-4">
          {props.comments.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-3.5">
              {c.status === "removed" ? (
                <p className="text-sm italic text-muted-foreground">{t("removed")}</p>
              ) : (
                <>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{c.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                  {props.isLoggedIn && (
                    <button
                      type="button"
                      disabled={reported.has(c.id)}
                      onClick={() => report(c.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-60"
                    >
                      <Flag className="h-3 w-3" />
                      {reported.has(c.id) ? t("reported") : t("report")}
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        {!props.isLoggedIn ? (
          <Link
            href={`/login?from=${encodeURIComponent(props.fromPath)}`}
            className="text-sm font-medium text-primary underline underline-offset-4"
          >
            {t("signInPrompt")}
          </Link>
        ) : props.viewerBlocked ? (
          <p className="text-sm text-muted-foreground">{t("blockedNotice")}</p>
        ) : (
          <div className="space-y-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={t("placeholder")}
              className="w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={pending || body.trim().length === 0}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {t("submit")}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Wire into detail pages**

In `app/[locale]/(public)/feed/[id]/page.tsx` (server component — read it first for layout): after the main post content, add:

```tsx
const session = await auth()
const viewerId = session?.user?.id ? parseInt(session.user.id, 10) : null
const viewer = viewerId
  ? await db.select({ blocked: users.commentsBlocked }).from(users).where(eq(users.id, viewerId)).limit(1)
  : []
const commentList = await getComments("feed_post", id)
```

```tsx
<CommentSection
  subjectType="feed_post"
  subjectId={id}
  comments={commentList}
  isLoggedIn={!!viewerId}
  viewerBlocked={viewer[0]?.blocked ?? false}
  fromPath={`/feed/${id}`}
/>
```

Same in `app/[locale]/(public)/deals/[id]/page.tsx` with `subjectType="deal"` and `fromPath={`/deals/${id}`}` — read that page first and place the section after the deal content, inside the main content column. Also add a `<ReactionBar …>` on both detail pages above the comments (props from the same queries: reuse the grouped-count queries via a small `getEngagement(subjectType, subjectId, viewerId)` helper added to `lib/comment-queries.ts`:

```ts
export async function getEngagement(
  subjectType: "feed_post" | "deal" | "event",
  subjectId: number,
  viewerId: number | null
): Promise<{ reactionCounts: Record<string, number>; viewerEmoji: string | null }> {
  const rows = await db
    .select({ emoji: reactions.emoji, userId: reactions.userId })
    .from(reactions)
    .where(and(eq(reactions.subjectType, subjectType), eq(reactions.subjectId, subjectId)))
  const reactionCounts: Record<string, number> = {}
  let viewerEmoji: string | null = null
  for (const r of rows) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1
    if (viewerId !== null && r.userId === viewerId) viewerEmoji = r.emoji
  }
  return { reactionCounts, viewerEmoji }
}
```

with `reactions` added to the imports.)

- [ ] **Step 5: Verify end-to-end**

```bash
npx tsc --noEmit && npm run lint && npm run dev
```

Manual, with a logged-in local account: comment on a feed post → appears after refresh-free `router.refresh()`; comment on a deal page; post 5 comments fast → 6th shows the rate-limit message; report a comment → button flips to "Reported"; logged out → sign-in prompt links with `from` param and returns to the page after login.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: comments on feed posts and deals — section, queries, detail wiring"
```

---

### Task 11: Admin moderation queue + ship Phase 3

**Files:**
- Create: `app/[locale]/admin/comments/page.tsx`
- Create: `lib/admin-comment-actions.ts`
- Modify: `app/[locale]/admin/page.tsx` (queue tile/link — follow the existing pattern for the Feed queue tile)
- Modify: `messages/en.json`, `messages/es.json` (`adminComments` namespace)

**Interfaces:**
- Consumes: Task 7 tables; admin-check pattern from `lib/admin-feed-actions.ts` (read it and copy its session/role guard exactly).
- Produces: `removeCommentAction(commentId: number)`, `blockCommenterAction(userId: number)` — both admin-gated, both `revalidatePath` the admin comments page.

- [ ] **Step 1: `lib/admin-comment-actions.ts`**

```ts
"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { comments, users } from "@/db/schema"

async function requireAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === "admin"
}

export async function removeCommentAction(commentId: number): Promise<void> {
  if (!(await requireAdmin())) return
  await db.update(comments).set({ status: "removed" }).where(eq(comments.id, commentId))
  revalidatePath("/[locale]/admin/comments", "page")
}

export async function blockCommenterAction(userId: number): Promise<void> {
  if (!(await requireAdmin())) return
  await db.update(users).set({ commentsBlocked: true }).where(eq(users.id, userId))
  revalidatePath("/[locale]/admin/comments", "page")
}
```

(Verify how `session.user.role` is exposed — grep `role` in `lib/admin-feed-actions.ts` or `lib/admin-actions.ts` and mirror the exact guard, including any redirect behavior.)

- [ ] **Step 2: Admin page**

`app/[locale]/admin/comments/page.tsx` — server component listing all comments, reported first:

```tsx
import { desc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { comments, users } from "@/db/schema"
import { getTranslations } from "next-intl/server"
import { removeCommentAction, blockCommenterAction } from "@/lib/admin-comment-actions"

export default async function AdminCommentsPage() {
  const t = await getTranslations("adminComments")
  const rows = await db
    .select({ c: comments, u: { id: users.id, name: users.name, email: users.email, blocked: users.commentsBlocked } })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.userId))
    .orderBy(desc(comments.reportCount), desc(comments.createdAt))
    .limit(200)

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">{t("heading")}</h1>
      {rows.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
      <ul className="space-y-3">
        {rows.map(({ c, u }) => (
          <li key={c.id} className={`rounded-xl border p-4 ${c.reportCount > 0 && c.status === "visible" ? "border-destructive/50 bg-destructive/5" : "bg-card"}`}>
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{u?.name ?? u?.email}</span>
              <span>· {c.subjectType} #{c.subjectId}</span>
              <span>· {c.createdAt.toLocaleString()}</span>
              {c.reportCount > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 font-bold text-destructive-foreground">
                  {t("reports", { count: c.reportCount })}
                </span>
              )}
              {c.status === "removed" && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{t("removedBadge")}</span>
              )}
              {u?.blocked && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{t("blockedBadge")}</span>
              )}
            </div>
            <p className="text-sm">{c.body}</p>
            <div className="mt-3 flex gap-2">
              {c.status === "visible" && (
                <form action={removeCommentAction.bind(null, c.id)}>
                  <button className="rounded-full border border-destructive px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    {t("remove")}
                  </button>
                </form>
              )}
              {u && !u.blocked && (
                <form action={blockCommenterAction.bind(null, u.id)}>
                  <button className="rounded-full border px-3 py-1 text-xs font-semibold hover:bg-accent">
                    {t("block")}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Admin gating: check how `app/[locale]/admin/layout.tsx` guards — if the layout already enforces the admin role, the page needs no extra guard. Verify before adding one.

i18n `adminComments` (en): `{ "heading": "Comments", "empty": "No comments yet.", "reports": "{count} reports", "removedBadge": "Removed", "blockedBadge": "Blocked", "remove": "Remove", "block": "Block commenter" }`
(es): `{ "heading": "Comentarios", "empty": "Aún no hay comentarios.", "reports": "{count} reportes", "removedBadge": "Eliminado", "blockedBadge": "Bloqueado", "remove": "Eliminar", "block": "Bloquear usuario" }`

- [ ] **Step 3: Command-center link**

Read `app/[locale]/admin/page.tsx`, find the pulse tiles / queue links (the Feed queue tile is the model), and add a Comments tile linking to `/admin/comments` with a count badge of reported visible comments:

```ts
const reportedCount = await db
  .select({ n: count() })
  .from(comments)
  .where(and(eq(comments.status, "visible"), gt(comments.reportCount, 0)))
```

Follow the tile's existing markup/i18n pattern exactly.

- [ ] **Step 4: Full verification**

```bash
npx tsx lib/neighborhoods.test.ts && npx tsx lib/feed-interleave.test.ts
node --env-file=.env.local node_modules/.bin/tsx lib/feed-queries.smoke.ts
npx tsc --noEmit && npm run lint
```

i18n parity check:

```bash
node -e "
const en=require('./messages/en.json'), es=require('./messages/es.json');
const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?flat(v,p+k+'.'):[p+k]);
const a=new Set(flat(en)), b=new Set(flat(es));
const miss=[...a].filter(k=>!b.has(k)).concat([...b].filter(k=>!a.has(k)));
console.log(miss.length?miss:'EN/ES parity OK');
if (miss.length) process.exit(1)
"
```

Manual admin flow: report a comment as a local → tile badge increments → remove it → detail page shows "Removed by moderator" → block the commenter → their next comment attempt shows the blocked notice.

- [ ] **Step 5: Commit and ship Phase 3**

```bash
git add -A
git commit -m "feat: admin comment moderation — queue, remove, block commenter"
git push
vercel deploy --prod
```

Production smoke: feed loads, filters work, map loads, react + comment on a real post, admin queue reachable. **Report Phase 3 completion to the user.**
