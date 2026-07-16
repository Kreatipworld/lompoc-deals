# Analytics & Funnel — design

*Date: 2026-05-18 · Goal: instrument the project so we can see what's working and drive the conversion outcomes that turn anonymous visitors into paying merchants.*

## Background

Lompoc Locals has 430 approved businesses, 0 claimed by their owners, and the operator currently has no way to answer questions like "how many people viewed Walgreens this week" or "what's our claim conversion rate." The existing telemetry is limited to a `deal_events` table and `view_count`/`click_count` columns on `deals` — the rest of the funnel is blind.

`docs/THIS_CYCLE.md` calls out this exact gap as REQ-001 ("Conversion Funnel Analytics — Zero baseline data. Can't prove social works, can't justify paid spend"). The merchant pitch is also blocked by lack of per-business visibility ("How do I know anyone will see my deal?" is the #1 outreach objection per the same doc).

This spec covers two cuts in one project, sharing infrastructure:
- **(A) Visibility** — see what's already happening on the site, where users go, where they bounce.
- **(B) Conversion outcomes** — instrument the funnel that turns visitors into local users and businesses into paying customers.

## Goal & non-goals

**Goal:** Every conversion-relevant event in the product is captured into one queryable table with stitched session-to-user identity, and an admin dashboard surfaces the metrics that drive outreach + product decisions.

**Non-goals (parked for later iterations):**
- Merchant-facing per-business analytics (extension of `/dashboard/stats`)
- A/B testing infrastructure
- Session replay
- Conversion goal alerting
- Heavyweight charting library — plain HTML/CSS bars now

## Architecture

Hybrid:
- **Vercel Web Analytics** (`@vercel/analytics`) — page views, referrers, countries. Anonymous, cookieless, free on Hobby. Charts live in Vercel's dashboard; we link out from our admin page.
- **In-house `events` table** — all conversion-relevant events. Source of truth for funnel queries. Lives in Neon alongside the rest of the schema.

A single `lib/analytics/track.ts` helper writes to the events table. Server-side callers (server actions, server components, webhook handlers) call it directly. Client-side callers (search form, map) POST to `/api/track`.

Anonymous visitors are identified by a `lompoc_sid` UUID cookie set by middleware on first request. Logged-in users carry both `session_id` and `user_id`. When a session signs up or logs in, we backfill `user_id` on the session's prior events so funnels stitch cleanly.

## Schema

### New table

```sql
CREATE TABLE events (
  id            SERIAL PRIMARY KEY,
  event_name    TEXT NOT NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id    VARCHAR(36),
  target_type   TEXT,
  target_id     INTEGER,
  props         JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX events_name_created_idx     ON events (event_name, created_at DESC);
CREATE INDEX events_user_created_idx     ON events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX events_session_created_idx  ON events (session_id, created_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX events_target_idx           ON events (target_type, target_id) WHERE target_type IS NOT NULL;
```

`event_name` is a free-form string at the schema level, but the codebase exports a typed union from `lib/analytics/events.ts` so all call sites get type-checked.

### Migration of existing `deal_events`

The current `deal_events` table has rows for deal views (written by `bumpViewCounts`). We fold those into `events` with `event_name='deal_view'`, `target_type='deal'`, `target_id=deal_id`. After the fold, `deal_events` is dropped along with the `deal_event_type` enum.

We do **not** remove `deals.view_count` or `deals.click_count`. The merchant `/dashboard/stats` page already reads them and rendering aggregations from `events` for every stat is slower. The new track helper bumps both the integer counter and inserts an event.

## Session identity

### Cookie

- Name: `lompoc_sid`
- Value: random UUID v4
- Path: `/`
- `HttpOnly: true` (server-only — clients never read it directly; the `/api/track` route reads from the request)
- `SameSite: Lax`
- `Secure: true` in production
- `Max-Age: 31536000` (1 year)

Set by `middleware.ts` if absent on any request. Already-authenticated requests still get the cookie — it's an identity layer independent of auth.

### Stitching

When a `local_signup` or `business_signup` event fires, the server action runs:

```sql
UPDATE events
SET user_id = $newUserId
WHERE session_id = $sid AND user_id IS NULL
  AND created_at > NOW() - INTERVAL '30 days';
```

This is one-shot at signup. No retroactive stitching across multiple devices/sessions; that's a separate problem we're not solving.

### Privacy

`app/[locale]/(public)/privacy/page.tsx` gets one new paragraph: "We set a first-party `lompoc_sid` cookie containing a random session identifier for the purpose of measuring how features are used. It contains no personal information, expires after one year, and is not shared with third parties."

No cookie banner. The session UUID is first-party functional and contains no PII. Vercel Web Analytics is cookieless. Both fit common interpretations of "strictly necessary / functional" for first-party use.

## Event catalogue

Defined in `lib/analytics/events.ts` as a typed union. Each event documents its `target_type` and the expected `props` shape.

### Acquisition

| name | target_type | props |
|---|---|---|
| `search_run` | `'search'` (target_id null) | `{ query: string, resultCount: number, locale: 'en'|'es' }` |
| `map_pin_clicked` | `'business'` | `{ from: 'map'|'list' }` |
| `business_page_viewed` | `'business'` | `{ locale, referrer? }` |

### Local user funnel

| name | target_type | props |
|---|---|---|
| `local_signup` | `'user'` | `{ via: 'email'|'google' }` |
| `digest_subscribed` | `'subscriber'` | `{ doubleOptIn: boolean }` |
| `favorite_added` | `'deal'` | `{}` |

### Business funnel

| name | target_type | props |
|---|---|---|
| `business_signup` | `'business'` | `{ via }` |
| `business_profile_saved` | `'business'` | `{ firstSave: boolean }` |
| `business_claim_submitted` | `'business'` | `{}` |
| `business_claim_approved` | `'business'` | `{ adminUserId: number }` |
| `first_deal_posted` | `'business'` | `{ dealId: number, type: 'coupon'|'special'|'announcement' }` |
| `paid_upgrade` | `'subscription'` | `{ tier: 'standard'|'premium', priceUsdCents: number }` |

### Deal funnel (migrated from `deal_events`)

| name | target_type | props |
|---|---|---|
| `deal_view` | `'deal'` | `{}` |
| `deal_click` | `'deal'` | `{}` |
| `deal_claim` | `'deal'` | `{}` |
| `deal_redeem` | `'deal'` | `{}` |

## Tracking helper

### Server-side: `lib/analytics/track.ts`

```ts
import { db } from "@/db/client"
import { events } from "@/db/schema"
import type { EventName, EventPropsFor } from "./events"

export async function track<N extends EventName>(
  name: N,
  args: {
    userId?: number | null
    sessionId?: string | null
    targetType?: string | null
    targetId?: number | null
    props?: EventPropsFor<N>
  } = {}
): Promise<void> {
  try {
    await db.insert(events).values({
      eventName: name,
      userId: args.userId ?? null,
      sessionId: args.sessionId ?? null,
      targetType: args.targetType ?? null,
      targetId: args.targetId ?? null,
      props: (args.props ?? {}) as never,
    })
  } catch {
    // best-effort, never throw
  }
}

export async function stitchSession(sessionId: string, userId: number): Promise<void> {
  // (full implementation in plan)
}
```

### Session helpers: `lib/analytics/session.ts`

- `getOrSetSessionId(req?, res?)` — middleware-only: reads cookie, sets if missing.
- `getSessionId()` — server component / server action: read-only via `cookies()` from `next/headers`.

### Client API: `app/api/track/route.ts`

Accepts `POST { name, targetType?, targetId?, props? }`. Reads `lompoc_sid` from cookies, reads `userId` from the auth session. Calls `track()`. Returns `204 No Content` on success. Rate-limited to 60 requests per minute per `session_id` via an in-memory sliding-window counter (resets on cold start, acceptable for v1); over-limit requests are dropped silently and never block the caller.

Only the **client-side** events use this route:
- `search_run` (form submit)
- `map_pin_clicked`

Everything else is called server-side from the action/handler that already runs.

## Vercel Web Analytics

Add `@vercel/analytics` to deps; mount `<Analytics />` once in `app/layout.tsx`. No config beyond that. Enable Web Analytics in the Vercel project settings (one toggle; works on Hobby plan up to plan limit).

## Admin dashboard

Path: `/[locale]/admin/analytics/page.tsx`. Server-rendered, admin-only (existing `/admin` auth guard applies). Six sections:

### 1. Top of funnel — Vercel link-out

Card with a "View page views & referrers" button → deep link to Vercel Web Analytics dashboard scoped to last 30 days.

### 2. Conversion funnel

Two funnels side by side:

**Local funnel** (last 30 days):
- Unique sessions with `business_page_viewed` → `local_signup` (% drop)
- `local_signup` → `favorite_added` (% drop)

**Business funnel** (last 30 days):
- Unique sessions → `business_signup` (% drop)
- `business_signup` → `business_profile_saved` (% drop)
- `business_profile_saved` → `first_deal_posted` (% drop)
- `first_deal_posted` → `paid_upgrade` (% drop)

Each step is a horizontal bar (CSS width based on count). Numbers and percentages labeled.

### 3. Claim activity

Table of business claims, newest first:
- Business name (link), claimant email, status, submitted_at, approved_at (if any)
- Above the table: "X pending · Y approved this month · median time-to-approve: Zh"

### 4. Search gaps

Top 20 searches by frequency where `props.resultCount = 0` (last 30 days). Direct signal for outreach ("3 people searched 'Thai food in Lompoc' this month — we should onboard one").

### 5. Top businesses by interest

Top 20 by `business_page_viewed` count (last 30 days). For each row: business name, view count, claim status (Unclaimed/Pending/Claimed). High-interest unclaimed listings are the highest-priority outreach targets.

### 6. Daily metrics

Six small sparklines (CSS-only, no chart lib): daily counts for the last 30 days of:
- Sessions (unique session IDs with any event)
- Local signups
- Business signups
- Claims submitted
- Deals posted
- Paid upgrades

## Files touched

| File | Action |
|---|---|
| `db/schema.ts` | Add `events` table, remove `dealEvents` & `dealEventType` enum |
| `db/migrations/0018_events_and_fold_deal_events.sql` | drizzle-generated, includes fold script as SQL |
| `db/migrate-deal-events.ts` | One-off TS migration script if SQL fold is too gnarly |
| `lib/analytics/events.ts` | **new** — typed event catalogue + `EventPropsFor<N>` |
| `lib/analytics/track.ts` | **new** — `track()` and `stitchSession()` |
| `lib/analytics/session.ts` | **new** — cookie read/write helpers |
| `middleware.ts` | Set `lompoc_sid` cookie if absent |
| `app/api/track/route.ts` | **new** — client-side event endpoint |
| `app/layout.tsx` | Mount `<Analytics />` from `@vercel/analytics/react` |
| `app/[locale]/admin/analytics/page.tsx` | **new** — dashboard |
| `app/[locale]/admin/analytics/queries.ts` | **new** — funnel SQL helpers |
| `app/[locale]/admin/analytics/components.tsx` | **new** — bar, sparkline, funnel-step components |
| `app/[locale]/(public)/privacy/page.tsx` | Add session-cookie paragraph |
| `lib/tracking.ts` | Replace internals with `track()` + keep integer column bumps |
| `lib/biz-actions.ts` | Emit `business_signup`, `business_profile_saved`, `first_deal_posted` |
| `app/[locale]/(auth)/signup/...` | Emit `local_signup` / `business_signup` |
| `app/[locale]/(public)/biz/[slug]/page.tsx` | Emit `business_page_viewed` |
| `components/business-claim-cta.tsx` (and its action) | Emit `business_claim_submitted` |
| `app/[locale]/admin/page.tsx` (claim approval action) | Emit `business_claim_approved` |
| Stripe webhook handler | Emit `paid_upgrade` |
| Favorites action | Emit `favorite_added` |
| Subscribers confirmation handler | Emit `digest_subscribed` |
| Search handler / page | Emit `search_run` |
| Map component | Emit `map_pin_clicked` via `/api/track` |
| `package.json` | Add `@vercel/analytics`; add `db:migrate-deal-events` script if needed |

## Verification

**Automated**
- Unit test for `track()` — happy path inserts a row, error path swallows.
- Unit test for the event-typed catalogue (compile-time check via dummy file that uses `EventPropsFor`).
- Integration test: hit `/api/track`, confirm row appears with correct session/user attribution.

**Manual smoke**
- Visit `/en/biz/walgreens-pharmacy` anonymously → check DB has a `business_page_viewed` event with a fresh `session_id`, `user_id=null`.
- Sign up as local → check `local_signup` event exists and prior session events were stitched to the new `user_id`.
- Add a favorite → `favorite_added` event present.
- Search for "garbage truck" (likely no results) → `search_run` event with `resultCount=0`.
- Sign up as a business, save profile, post a deal → events for each step; `first_deal_posted.props.firstSave=true` only on first.
- Submit a claim from `/biz/<unclaimed-slug>` → `business_claim_submitted` present.
- Approve claim from admin → `business_claim_approved` present.
- Stripe test webhook for invoice paid → `paid_upgrade` present.
- Hit `/admin/analytics` → six sections render, numbers match raw SQL counts.

**Privacy / cookie**
- DevTools → verify `lompoc_sid` cookie is set, `HttpOnly`, 1-year `Max-Age`.
- Verify the privacy page mentions the cookie.

## Risk and rollback

- **Risk: writes per page render.** Each business page view inserts one row. At current traffic this is negligible; at scale, we'd batch. Mitigation: `track()` is fire-and-forget and never blocks render. If event volume explodes we can add a buffered writer.
- **Risk: `events` table grows unbounded.** Add a 12-month retention purge cron in a future iteration; not blocking for v1.
- **Risk: deal_events fold breaks `/dashboard/stats`.** The dashboard reads from `deals.view_count` and `deals.click_count`, not from `deal_events` directly, so the fold doesn't affect it. Verified by code search in this brainstorm.
- **Rollback:** the migration is additive (new table + drop old). If we need to roll back after deploy, we'd restore `deal_events` from a Neon point-in-time recovery (6h window). Plan must call this out before applying.

## Out of scope (parked)

- Merchant-facing per-business analytics
- Charting library (recharts/visx)
- Session replay
- A/B testing
- Conversion goal alerting / Slack notifications
- Cross-device session stitching
- GDPR DSAR tooling (we own the table; a future SQL-based DSAR handler is straightforward)
- Event retention purge
