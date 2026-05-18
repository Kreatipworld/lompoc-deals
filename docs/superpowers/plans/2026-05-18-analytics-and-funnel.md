# Analytics & Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture every conversion-relevant action into one queryable `events` table with stitched session-to-user identity, ship Vercel Web Analytics for page views, and build an admin dashboard that surfaces the funnel from anonymous visitor to paid merchant.

**Architecture:** Single generic `events` table absorbing the existing `deal_events`. A `lib/analytics/track.ts` helper writes server-side from actions/handlers; client-side events post to `/api/track/event`. Anonymous visitors get a `lompoc_sid` UUID cookie set by middleware; signup actions backfill `user_id` onto the session's prior events. Funnel queries are plain SQL rendered into a server-side admin page at `/admin/analytics` with CSS bars (no chart library).

**Tech Stack:** Next.js 14 App Router, Drizzle ORM, Neon Postgres (`twilight-boat-62678930`), next-intl, `@vercel/analytics`. Tests: tsx + `node:assert` (project has no test runner).

**Reference spec:** `docs/superpowers/specs/2026-05-18-analytics-and-funnel-design.md`

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `db/schema.ts` | Modify | Add `events` table |
| `db/migrations/0018_events_table.sql` | Create | SQL migration for `events` + indexes (drop of `deal_events` deferred to Task 13) |
| `lib/analytics/events.ts` | Create | Typed event catalogue + `EventName` union + `EventPropsFor<N>` type helper |
| `lib/analytics/track.ts` | Create | `track()` (fire-and-forget insert) and `stitchSession()` (backfill user_id on signup) |
| `lib/analytics/session.ts` | Create | Cookie read helper for server components and API routes |
| `lib/analytics/test-track.ts` | Create | tsx smoke test |
| `middleware.ts` | Modify | Set `lompoc_sid` cookie if missing |
| `app/api/track/event/route.ts` | Create | Client-side event endpoint with in-memory rate limit |
| `app/layout.tsx` | Modify | Mount `<Analytics />` from `@vercel/analytics/react` |
| `lib/user-signup-actions.ts` | Modify | Emit `local_signup` / `business_signup` + call `stitchSession()` |
| `lib/biz-actions.ts` | Modify | Emit `business_profile_saved`, `first_deal_posted` |
| `lib/favorite-actions.ts` | Modify | Emit `favorite_added` |
| `lib/subscribe-actions.ts` | Modify | Emit `digest_subscribed` on double-opt-in confirm |
| `lib/admin-actions.ts` | Modify | Emit `business_claim_approved` in `approveClaimAction` |
| `app/api/track/claim/route.ts` | Modify | Emit `business_claim_submitted` alongside existing `business_claims` insert |
| `app/api/stripe/webhook/route.ts` | Modify | Emit `paid_upgrade` on successful subscription event |
| `app/[locale]/(public)/biz/[slug]/page.tsx` | Modify | Emit `business_page_viewed` |
| `lib/tracking.ts` | Modify | Have `bumpViewCounts`/`bumpClickCount` ALSO emit `deal_view`/`deal_click` events |
| `app/[locale]/(public)/search/page.tsx` | Modify | Emit `search_run` with query and resultCount |
| `components/businesses-map.tsx` (or current map file) | Modify | Emit `map_pin_clicked` via `/api/track/event` |
| `app/[locale]/(public)/privacy/page.tsx` | Modify | Add session-cookie paragraph |
| `app/[locale]/admin/analytics/queries.ts` | Create | All funnel SQL helpers |
| `app/[locale]/admin/analytics/components.tsx` | Create | `<FunnelStep>`, `<Sparkline>`, `<MetricRow>` |
| `app/[locale]/admin/analytics/page.tsx` | Create | Dashboard with six sections |
| `messages/en.json`, `messages/es.json` | Modify | Translation keys for the admin analytics page |
| `package.json` | Modify | Add `@vercel/analytics` dep; add `test:analytics` script |

---

## Task 1: Schema — `events` table

**Files:**
- Modify: `db/schema.ts`
- Create: `db/migrations/0018_events_table.sql`

- [ ] **Step 1: Add the table to `db/schema.ts`**

Find the existing imports at the top of the file. Confirm `jsonb` and `index` are already imported (they are — verified). Then, near the end of the file (after the last `pgTable` block), add:

```ts
// ---------- analytics events ----------
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    eventName: text("event_name").notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: varchar("session_id", { length: 36 }),
    targetType: text("target_type"),
    targetId: integer("target_id"),
    props: jsonb("props"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    eventsNameCreatedIdx: index("events_name_created_idx").on(t.eventName, t.createdAt),
    eventsUserCreatedIdx: index("events_user_created_idx").on(t.userId, t.createdAt),
    eventsSessionCreatedIdx: index("events_session_created_idx").on(t.sessionId, t.createdAt),
    eventsTargetIdx: index("events_target_idx").on(t.targetType, t.targetId),
  })
)
```

- [ ] **Step 2: Apply the schema to the live DB via direct SQL**

Use the Neon MCP `run_sql` against `twilight-boat-62678930`, running each statement separately (Neon's prepared-statement transport rejects multi-statement bodies):

```sql
CREATE TABLE IF NOT EXISTS events (
  id            SERIAL PRIMARY KEY,
  event_name    TEXT NOT NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id    VARCHAR(36),
  target_type   TEXT,
  target_id     INTEGER,
  props         JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

```sql
CREATE INDEX IF NOT EXISTS events_name_created_idx ON events (event_name, created_at DESC);
```

```sql
CREATE INDEX IF NOT EXISTS events_user_created_idx ON events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
```

```sql
CREATE INDEX IF NOT EXISTS events_session_created_idx ON events (session_id, created_at DESC) WHERE session_id IS NOT NULL;
```

```sql
CREATE INDEX IF NOT EXISTS events_target_idx ON events (target_type, target_id) WHERE target_type IS NOT NULL;
```

This sidesteps the drizzle journal drift issue noted in Task 1 of the previous (hours-accuracy) plan.

- [ ] **Step 2b: Fold historical `deal_events` rows into `events`**

```sql
INSERT INTO events (event_name, user_id, session_id, target_type, target_id, props, created_at)
SELECT
  CASE event_type
    WHEN 'view' THEN 'deal_view'
    WHEN 'click' THEN 'deal_click'
    WHEN 'claim' THEN 'deal_claim'
    WHEN 'redeem' THEN 'deal_redeem'
  END,
  user_id,
  session_id,
  'deal',
  deal_id,
  '{}'::jsonb,
  created_at
FROM deal_events;
```

Verify the row count moved over:

```sql
SELECT
  (SELECT COUNT(*) FROM deal_events) AS old_count,
  (SELECT COUNT(*) FROM events WHERE event_name IN ('deal_view','deal_click','deal_claim','deal_redeem')) AS new_count;
```

Expected: `new_count >= old_count`. The `deal_events` table stays in place for now — it'll be dropped in Task 13 after the new write path has been verified live.

- [ ] **Step 3: Verify**

Run via Neon MCP:
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='events' ORDER BY ordinal_position;
```

Expected: 8 rows, types matching the spec.

```sql
SELECT indexname FROM pg_indexes WHERE tablename='events' ORDER BY indexname;
```

Expected: 5 indexes (4 named + `events_pkey`).

- [ ] **Step 4: Write the migration file**

Create `db/migrations/0018_events_table.sql` with the contents:

```sql
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"user_id" integer,
	"session_id" varchar(36),
	"target_type" text,
	"target_id" integer,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_name_created_idx" ON "events" USING btree ("event_name","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_user_created_idx" ON "events" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_session_created_idx" ON "events" USING btree ("session_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_target_idx" ON "events" USING btree ("target_type","target_id");
```

Update `db/migrations/meta/_journal.json` — append an entry with the next index, `tag: "0018_events_table"`, and the current epoch milliseconds. Check the previous entry (`0017_business_hours_meta`) for the exact JSON shape.

- [ ] **Step 5: Type-check**

```bash
cd /Users/kreatip/Projects/lompoc-deals
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add db/schema.ts db/migrations/0018_events_table.sql db/migrations/meta/_journal.json
git commit -m "feat(db): add events table for funnel analytics"
```

---

## Task 2: Typed event catalogue

**Files:**
- Create: `lib/analytics/events.ts`

- [ ] **Step 1: Create the file**

Create `lib/analytics/events.ts` with exactly:

```ts
export type EventName =
  | "search_run"
  | "map_pin_clicked"
  | "business_page_viewed"
  | "local_signup"
  | "digest_subscribed"
  | "favorite_added"
  | "business_signup"
  | "business_profile_saved"
  | "business_claim_submitted"
  | "business_claim_approved"
  | "first_deal_posted"
  | "paid_upgrade"
  | "deal_view"
  | "deal_click"
  | "deal_claim"
  | "deal_redeem"

export interface EventProps {
  search_run: { query: string; resultCount: number; locale: "en" | "es" }
  map_pin_clicked: { from: "map" | "list" }
  business_page_viewed: { locale: "en" | "es"; referrer?: string }
  local_signup: { via: "email" | "google" }
  digest_subscribed: { doubleOptIn: boolean }
  favorite_added: Record<string, never>
  business_signup: { via: "email" | "google" }
  business_profile_saved: { firstSave: boolean }
  business_claim_submitted: Record<string, never>
  business_claim_approved: { adminUserId: number }
  first_deal_posted: { dealId: number; type: "coupon" | "special" | "announcement" }
  paid_upgrade: { tier: "standard" | "premium"; priceUsdCents: number }
  deal_view: Record<string, never>
  deal_click: Record<string, never>
  deal_claim: Record<string, never>
  deal_redeem: Record<string, never>
}

export type EventPropsFor<N extends EventName> = EventProps[N]
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/analytics/events.ts
git commit -m "feat(analytics): typed event catalogue"
```

---

## Task 3: `track()` and `stitchSession()` helpers

**Files:**
- Create: `lib/analytics/track.ts`
- Create: `lib/analytics/test-track.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `lib/analytics/track.ts`**

```ts
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { and, eq, gt, isNull, sql } from "drizzle-orm"
import type { EventName, EventPropsFor } from "./events"

interface TrackArgs<N extends EventName> {
  userId?: number | null
  sessionId?: string | null
  targetType?: string | null
  targetId?: number | null
  props?: EventPropsFor<N>
}

/** Fire-and-forget insert into the events table. Never throws. */
export async function track<N extends EventName>(name: N, args: TrackArgs<N> = {}): Promise<void> {
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
    // best-effort
  }
}

/** Attach a freshly-created user_id to all anonymous events from the same session in the last 30 days. */
export async function stitchSession(sessionId: string, userId: number): Promise<void> {
  if (!sessionId || !userId) return
  try {
    await db
      .update(events)
      .set({ userId })
      .where(
        and(
          eq(events.sessionId, sessionId),
          isNull(events.userId),
          gt(events.createdAt, sql`now() - interval '30 days'`)
        )
      )
  } catch {
    // best-effort
  }
}
```

- [ ] **Step 2: Create smoke test `lib/analytics/test-track.ts`**

```ts
import assert from "node:assert/strict"
import { track, stitchSession } from "./track"
import { db } from "../../db/client"
import { events } from "../../db/schema"
import { eq } from "drizzle-orm"

let passed = 0
let failed = 0

function check(label: string, actual: unknown, expected: unknown) {
  try {
    assert.deepEqual(actual, expected)
    console.log(`  ok  ${label}`)
    passed++
  } catch {
    console.log(`  FAIL ${label}`)
    console.log(`       expected: ${JSON.stringify(expected)}`)
    console.log(`       actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

async function main() {
  const sid = "00000000-0000-4000-8000-test" + Math.random().toString(36).slice(2, 8)

  await track("business_page_viewed", {
    sessionId: sid,
    targetType: "business",
    targetId: 1,
    props: { locale: "en" },
  })

  const rows = await db.select().from(events).where(eq(events.sessionId, sid))
  check("track inserted one row", rows.length, 1)
  check("event name", rows[0]?.eventName, "business_page_viewed")
  check("target type", rows[0]?.targetType, "business")
  check("target id", rows[0]?.targetId, 1)
  check("user id null", rows[0]?.userId, null)

  // stitchSession should be a no-op without a real user; verify it doesn't throw
  await stitchSession(sid, 999999) // 999999 does not exist; FK is set-null on delete, but no row deletion here.
  // The update should still succeed (FK enforces existence at insert; updates of user_id can be to any existing or null).
  // To stay safe, just confirm the row is still queryable.
  const after = await db.select().from(events).where(eq(events.sessionId, sid))
  check("row still exists after stitch attempt", after.length, 1)

  // Cleanup
  await db.delete(events).where(eq(events.sessionId, sid))

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

**Important:** The stitchSession test uses a non-existent userId 999999 — the FK on `events.user_id` references `users.id`, and the update will fail because of the FK constraint. To make this test pass without seeding a real user, either:
1. Skip the stitchSession assertion (delete those two checks), or
2. Insert a temp user, run the assertion, then delete the user (cascades nullify the events row's user_id).

**Take option 1 for v1.** Replace the `stitchSession` block with just:

```ts
  // Cleanup
  await db.delete(events).where(eq(events.sessionId, sid))
```

(Skip the stitchSession test entirely — the helper is small and the integration test in Task 13 will exercise it.)

- [ ] **Step 3: Add npm script to `package.json`**

In the `"scripts"` block, after the existing `db:backfill-multi-range` entry, add:

```json
    "test:analytics": "node --env-file=.env.local node_modules/.bin/tsx lib/analytics/test-track.ts",
```

- [ ] **Step 4: Run smoke test**

```bash
cd /Users/kreatip/Projects/lompoc-deals
npm run test:analytics
```

Expected: `5 passed, 0 failed`.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/track.ts lib/analytics/test-track.ts package.json
git commit -m "feat(analytics): track() helper with smoke test"
```

---

## Task 4: Session cookie via middleware

**Files:**
- Create: `lib/analytics/session.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Create `lib/analytics/session.ts`**

```ts
import { cookies } from "next/headers"

export const SESSION_COOKIE = "lompoc_sid"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/** Read the session id from request cookies. Returns null if absent. Server components / actions only. */
export function getSessionId(): string | null {
  try {
    return cookies().get(SESSION_COOKIE)?.value ?? null
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Patch `middleware.ts` to set the cookie**

Open `middleware.ts`. Currently it returns `intlResponse` or a `Response.redirect`. We need to attach the cookie to the response when missing.

Replace the entire file with:

```ts
import { auth } from "@/auth"
import createMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"
import { NextResponse } from "next/server"

const intlMiddleware = createMiddleware(routing)

const protectedPaths = ["/dashboard", "/admin"]

const SESSION_COOKIE = "lompoc_sid"
const SESSION_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function ensureSessionCookie(req: Parameters<Parameters<typeof auth>[0]>[0], res: Response): Response {
  if (req.cookies.get(SESSION_COOKIE)) return res
  const sid = crypto.randomUUID()
  // NextResponse exposes cookies.set; cast through unknown for non-NextResponse responses (e.g., Response.redirect).
  if (res instanceof NextResponse) {
    res.cookies.set({
      name: SESSION_COOKIE,
      value: sid,
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
    return res
  }
  // For Response.redirect (used in protected-path bouncing), wrap with NextResponse to attach a cookie.
  const wrapped = NextResponse.redirect(res.headers.get("location") ?? "/", res.status)
  wrapped.cookies.set({
    name: SESSION_COOKIE,
    value: sid,
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return wrapped
}

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl

  // Skip intl middleware for API routes — they have no locale prefix
  if (pathname.startsWith("/api")) {
    const apiPassthrough = NextResponse.next()
    return ensureSessionCookie(req, apiPassthrough)
  }

  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)(\/|$)/, "/") || "/"

  const isProtected = protectedPaths.some((p) => pathnameWithoutLocale.startsWith(p))

  const intlResponse = intlMiddleware(req)

  if (isProtected) {
    const role = req.auth?.user?.role

    if (pathnameWithoutLocale.startsWith("/dashboard") && role !== "business") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("from", pathnameWithoutLocale)
      return ensureSessionCookie(req, Response.redirect(url))
    }

    if (pathnameWithoutLocale.startsWith("/admin") && role !== "admin") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("from", pathnameWithoutLocale)
      return ensureSessionCookie(req, Response.redirect(url))
    }
  }

  return ensureSessionCookie(req, intlResponse)
})

export const config = {
  matcher: [
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean. If `req.cookies.get` complains, the type comes from NextAuth's wrapped request — fall back to `req.headers.get("cookie")?.includes(SESSION_COOKIE)` as a workaround.

- [ ] **Step 4: Build to catch edge-runtime issues**

```bash
npm run build
```

Expected: success. Middleware runs in the edge runtime — `crypto.randomUUID()` is available there.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts lib/analytics/session.ts
git commit -m "feat(analytics): set lompoc_sid session cookie via middleware"
```

---

## Task 5: Client event API route

**Files:**
- Create: `app/api/track/event/route.ts`

- [ ] **Step 1: Create the route**

Note: We're choosing `/api/track/event` rather than `/api/track` because three legacy routes (`/api/track/claim`, `/api/track/click`, `/api/track/redeem`) already exist and we don't want to disrupt them.

```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { track } from "@/lib/analytics/track"
import type { EventName } from "@/lib/analytics/events"

// Module-level sliding-window rate limit: 60 requests/min per session_id.
// In-memory only; resets on cold start. Acceptable for v1.
const WINDOW_MS = 60_000
const LIMIT = 60
const hits = new Map<string, number[]>()

function withinLimit(sid: string): boolean {
  const now = Date.now()
  const arr = (hits.get(sid) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= LIMIT) {
    hits.set(sid, arr)
    return false
  }
  arr.push(now)
  hits.set(sid, arr)
  return true
}

const ALLOWED: Set<EventName> = new Set([
  "search_run",
  "map_pin_clicked",
])

interface Body {
  name?: string
  targetType?: string
  targetId?: number
  props?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("lompoc_sid")?.value ?? null
  if (!sid || !withinLimit(sid)) return new NextResponse(null, { status: 204 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new NextResponse(null, { status: 204 })
  }
  if (!body.name || !ALLOWED.has(body.name as EventName)) {
    return new NextResponse(null, { status: 204 })
  }

  const session = await auth()
  const userIdRaw = session?.user?.id
  const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : null

  await track(body.name as EventName, {
    userId: userId && !Number.isNaN(userId) ? userId : null,
    sessionId: sid,
    targetType: body.targetType ?? null,
    targetId: body.targetId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: (body.props ?? {}) as any,
  })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Both expected clean.

- [ ] **Step 3: Smoke test locally**

This step is optional during implementation — Task 13 will exercise the endpoint via the search form. Skip unless you want to verify in isolation.

- [ ] **Step 4: Commit**

```bash
git add app/api/track/event/route.ts
git commit -m "feat(analytics): /api/track/event endpoint with rate limiting"
```

---

## Task 6: Vercel Web Analytics

**Files:**
- Modify: `app/layout.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
cd /Users/kreatip/Projects/lompoc-deals
npm install @vercel/analytics
```

Expected: `@vercel/analytics` appears in `package.json` dependencies and `package-lock.json` updates.

- [ ] **Step 2: Mount the Analytics component**

Open `app/layout.tsx`. Add the import near the other imports:

```tsx
import { Analytics } from "@vercel/analytics/react"
```

In the JSX, place `<Analytics />` immediately before the closing `</body>` tag (or before the closing `</html>` if there is no body wrapping). It's a void component — no children.

- [ ] **Step 3: Build to confirm**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx package.json package-lock.json
git commit -m "feat(analytics): mount Vercel Web Analytics"
```

- [ ] **Step 5: Enable in Vercel dashboard**

Manual step the operator must do once: go to the Vercel project settings → Analytics tab → enable Web Analytics. No code change. Note this in the commit message OR in the final task's report.

---

## Task 7: Wire server-side user/local events

**Files:**
- Modify: `lib/user-signup-actions.ts`
- Modify: `lib/biz-actions.ts`
- Modify: `lib/favorite-actions.ts`
- Modify: `lib/subscribe-actions.ts`

These are mostly mechanical — find the success path of each action, call `track()` and (for signups) `stitchSession()`.

- [ ] **Step 1: Inspect each action's signature**

```bash
grep -n "export async function" lib/user-signup-actions.ts lib/biz-actions.ts lib/favorite-actions.ts lib/subscribe-actions.ts
```

Note the exact function names and where success is determined in each.

- [ ] **Step 2: Add imports to each file**

At the top of each of the four files, add:

```ts
import { track, stitchSession } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
```

(Skip `stitchSession` import in files that don't need it.)

- [ ] **Step 3: Emit `local_signup` and `business_signup` in `lib/user-signup-actions.ts`**

After a successful insert into the `users` table (the action returns success), before returning, add:

```ts
const sid = getSessionId()
const role = /* whichever value was inserted: "local" or "business" */
if (sid) await stitchSession(sid, newUser.id)
await track(role === "business" ? "business_signup" : "local_signup", {
  userId: newUser.id,
  sessionId: sid,
  targetType: role === "business" ? "business" : "user",
  targetId: null,
  props: { via: "email" },
})
```

Adjust `newUser.id` to the variable holding the inserted row's id (look at the existing insert call's `.returning()` or `RETURNING` clause). If the insert doesn't return the id, change it to do so:

```ts
const [newUser] = await db.insert(users).values({ ... }).returning({ id: users.id })
```

For Google OAuth signups in `lib/google-auth-action.ts` (separate file), emit with `props: { via: "google" }`. Same pattern. **Add `google-auth-action.ts` to the file list and modify it too.**

- [ ] **Step 4: Emit `business_profile_saved` in `lib/biz-actions.ts:saveProfileAction`**

Inside `saveProfileAction`, after the update/insert branches both end, before `revalidatePath` calls. Detect whether this is the first save: `const firstSave = !existing`.

```ts
const sid = getSessionId()
await track("business_profile_saved", {
  userId,
  sessionId: sid,
  targetType: "business",
  targetId: existing?.id ?? null, // null on first save — we don't have the id back yet without RETURNING
  props: { firstSave },
})
```

If `existing.id` isn't enough for first saves, add `.returning({ id: businesses.id })` to the insert and use that id.

- [ ] **Step 5: Emit `first_deal_posted` in `lib/biz-actions.ts:saveDealAction`**

Inside `saveDealAction`, after a successful new deal insert (NOT on edits), determine if it's the user's first deal:

```ts
const existingDealCount = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(deals)
  .where(eq(deals.businessId, biz.id))
const isFirst = existingDealCount[0]?.count === 1 // 1 because we just inserted

if (isFirst) {
  const sid = getSessionId()
  await track("first_deal_posted", {
    userId,
    sessionId: sid,
    targetType: "business",
    targetId: biz.id,
    props: { dealId: newDeal.id, type: data.type },
  })
}
```

Where `newDeal.id` comes from `.returning({ id: deals.id })` on the insert (add if not present), and `data.type` is the deal type from the form. Adjust variable names to match the actual code.

- [ ] **Step 6: Emit `favorite_added` in `lib/favorite-actions.ts`**

Find the action that creates a favorite (it's likely a toggle — emit only on the ADD path, not REMOVE). After the insert succeeds:

```ts
const sid = getSessionId()
await track("favorite_added", {
  userId,
  sessionId: sid,
  targetType: "deal",
  targetId: dealId,
})
```

- [ ] **Step 7: Emit `digest_subscribed` in `lib/subscribe-actions.ts`**

The double-opt-in confirmation handler is the action that flips a subscriber from pending to confirmed. Find it (likely `confirmSubscriberByToken` or similar). After confirming:

```ts
const sid = getSessionId()
await track("digest_subscribed", {
  userId: null, // subscribers are decoupled from users in this codebase
  sessionId: sid,
  targetType: "subscriber",
  targetId: sub.id,
  props: { doubleOptIn: true },
})
```

For the initial-subscribe action (`subscribeAction` line 22), emit with `props: { doubleOptIn: false }`.

- [ ] **Step 8: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 9: Build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 10: Commit**

```bash
git add lib/user-signup-actions.ts lib/google-auth-action.ts lib/biz-actions.ts lib/favorite-actions.ts lib/subscribe-actions.ts
git commit -m "feat(analytics): emit local/business signup, profile/deal saves, favorite, subscribe"
```

---

## Task 8: Wire server-side claim + paid_upgrade + business_page_viewed + deal events

**Files:**
- Modify: `app/api/track/claim/route.ts`
- Modify: `lib/admin-actions.ts`
- Modify: `app/api/stripe/webhook/route.ts`
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx`
- Modify: `lib/tracking.ts`

- [ ] **Step 1: Emit `business_claim_submitted` in the existing claim route**

Open `app/api/track/claim/route.ts`. Note what it currently does (likely inserts into `business_claims`). After the insert succeeds, add:

```ts
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
// …
const sid = getSessionId()
await track("business_claim_submitted", {
  userId, // whatever the route already has from auth
  sessionId: sid,
  targetType: "business",
  targetId: businessId,
})
```

Adjust variable names to match.

- [ ] **Step 2: Emit `business_claim_approved` in `lib/admin-actions.ts:approveClaimAction` (line 289)**

After the claim's status update to "approved" succeeds, add:

```ts
import { track } from "@/lib/analytics/track"
// at top of file
// …
await track("business_claim_approved", {
  userId: claim.userId, // the user being awarded ownership
  sessionId: null,
  targetType: "business",
  targetId: claim.businessId,
  props: { adminUserId: adminUser.id }, // the admin doing the approving
})
```

Adjust `claim` and `adminUser` variable names to match the existing code.

- [ ] **Step 3: Emit `paid_upgrade` in the Stripe webhook**

Open `app/api/stripe/webhook/route.ts`. Find the case handling `customer.subscription.created` OR `invoice.payment_succeeded` for new subscriptions. After the subscription record is updated in our DB, emit:

```ts
import { track } from "@/lib/analytics/track"
// …
const tier = subscription.tier // 'standard' | 'premium' from your code
const priceUsdCents = /* line item amount from event */
await track("paid_upgrade", {
  userId: subscription.userId,
  sessionId: null,
  targetType: "subscription",
  targetId: subscription.id,
  props: { tier, priceUsdCents },
})
```

Stripe event payloads carry the price in cents on `event.data.object.amount_paid` (for `invoice.payment_succeeded`) or on `event.data.object.items.data[0].price.unit_amount` (for subscription objects). Map `tier` from the price ID using whatever lookup the existing code already does to determine the tier (the codebase has this mapping somewhere — `lib/stripe.ts` is the likely file). Read the existing case for the same event before adding `track()`; the variables you need are almost certainly already in scope.

- [ ] **Step 4: Emit `business_page_viewed` in the public business page**

Open `app/[locale]/(public)/biz/[slug]/page.tsx`. The page already calls `bumpViewCounts(dealIds)` for deal views. After fetching `biz` (the business object) and before rendering, add:

```ts
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
import { headers } from "next/headers"
// …
const sid = getSessionId()
const ref = headers().get("referer") ?? undefined
await track("business_page_viewed", {
  userId: viewer?.id ?? null,
  sessionId: sid,
  targetType: "business",
  targetId: biz.id,
  props: { locale, referrer: ref },
})
```

Adjust `viewer` and `locale` to match the existing variables on the page.

- [ ] **Step 5: Emit `deal_view` / `deal_click` from `lib/tracking.ts`**

Replace `lib/tracking.ts` with:

```ts
import { sql, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { deals, events } from "@/db/schema"
import { getSessionId } from "@/lib/analytics/session"

/**
 * Bump view counts for the given deal ids and emit deal_view events.
 * Fire-and-forget — never block the page render on this.
 */
export async function bumpViewCounts(dealIds: number[], userId: number | null = null) {
  if (dealIds.length === 0) return
  try {
    const sid = getSessionId()
    await Promise.all([
      db
        .update(deals)
        .set({ viewCount: sql`${deals.viewCount} + 1` })
        .where(inArray(deals.id, dealIds)),
      db.insert(events).values(
        dealIds.map((id) => ({
          eventName: "deal_view" as const,
          userId,
          sessionId: sid,
          targetType: "deal",
          targetId: id,
          props: {},
        }))
      ),
    ])
  } catch {
    // best-effort
  }
}

export async function bumpClickCount(dealId: number, userId: number | null = null) {
  try {
    const sid = getSessionId()
    await Promise.all([
      db
        .update(deals)
        .set({ clickCount: sql`${deals.clickCount} + 1` })
        .where(sql`${deals.id} = ${dealId}`),
      db.insert(events).values({
        eventName: "deal_click",
        userId,
        sessionId: sid,
        targetType: "deal",
        targetId: dealId,
        props: {},
      }),
    ])
  } catch {
    // best-effort
  }
}
```

Existing callers of `bumpViewCounts(dealIds)` and `bumpClickCount(dealId)` keep working because `userId` is optional. If you want to pass the viewer's id where available (e.g. from the biz page that already has `viewer`), update those call sites — but it's optional in v1.

- [ ] **Step 6: Type-check + build**

```bash
npx tsc --noEmit
npm run build
```

Both expected clean.

- [ ] **Step 7: Commit**

```bash
git add app/api/track/claim/route.ts lib/admin-actions.ts app/api/stripe/webhook/route.ts app/[locale]/\(public\)/biz/\[slug\]/page.tsx lib/tracking.ts
git commit -m "feat(analytics): emit claim, claim-approved, paid_upgrade, page-view, deal events"
```

---

## Task 9: Wire client-side events (search + map)

**Files:**
- Modify: `app/[locale]/(public)/search/page.tsx`
- Modify: a map component (find via `grep -rln "Marker\|<Map" components/`)

- [ ] **Step 1: Emit `search_run` from the search page**

Open `app/[locale]/(public)/search/page.tsx`. This is a server component that receives `searchParams`. After computing the `resultCount`, emit the event server-side (search happens on the server, no client roundtrip needed):

```tsx
import { track } from "@/lib/analytics/track"
import { getSessionId } from "@/lib/analytics/session"
// …
const query = searchParams.q ?? ""
const results = /* existing query */
const resultCount = results.length
if (query) {
  const sid = getSessionId()
  await track("search_run", {
    sessionId: sid,
    targetType: "search",
    targetId: null,
    props: { query, resultCount, locale },
  })
}
```

Server-side firing of `search_run` is preferred because:
- We know the result count authoritatively
- It survives ad blockers
- No client JS needed

- [ ] **Step 2: Identify the map component**

```bash
grep -rln "react-leaflet\|MapContainer\|Marker" /Users/kreatip/Projects/lompoc-deals/components --include="*.tsx" | head
```

Pick the one that renders business pins on the public `/map` page.

- [ ] **Step 3: Emit `map_pin_clicked` from the map component**

The map component is a client component. Inside the Marker's click handler (likely an `onClick` or `eventHandlers={{ click: ... }}`), add:

```ts
async function trackMapPinClick(businessId: number) {
  try {
    await fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "map_pin_clicked",
        targetType: "business",
        targetId: businessId,
        props: { from: "map" },
      }),
    })
  } catch {
    // best-effort
  }
}
```

Call this from the marker's click handler before navigation/popup logic. If the page also has a list view that links to the same business pages, optionally call with `props.from = "list"` from the list-item click — but this is a v2 nicety; v1 is just map pins.

- [ ] **Step 4: Type-check + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/\(public\)/search/page.tsx components/<map-component>.tsx
git commit -m "feat(analytics): emit search_run and map_pin_clicked"
```

---

## Task 10: Privacy page update

**Files:**
- Modify: `app/[locale]/(public)/privacy/page.tsx`
- Modify: `messages/en.json`, `messages/es.json`

- [ ] **Step 1: Read the current privacy page**

```bash
cat app/[locale]/\(public\)/privacy/page.tsx | head -80
```

Note the existing structure — most likely uses translation keys from a `privacy.*` namespace.

- [ ] **Step 2: Add a translation key for the session-cookie paragraph**

In `messages/en.json`, inside the `privacy` block (or wherever the page's keys live), add:

```json
"sessionCookieHeading": "Session Identifier",
"sessionCookieBody": "We set a first-party cookie named lompoc_sid containing a random session identifier so we can measure how features are used. It contains no personal information, expires after one year, and is not shared with third parties."
```

In `messages/es.json`:

```json
"sessionCookieHeading": "Identificador de sesión",
"sessionCookieBody": "Establecemos una cookie de origen llamada lompoc_sid que contiene un identificador de sesión aleatorio para medir cómo se utilizan las funciones. No contiene información personal, caduca después de un año y no se comparte con terceros."
```

- [ ] **Step 3: Render the new section on the privacy page**

In `app/[locale]/(public)/privacy/page.tsx`, after the last existing section, add:

```tsx
<section className="mt-8">
  <h2 className="font-semibold text-lg">{t("sessionCookieHeading")}</h2>
  <p className="mt-2 text-muted-foreground">{t("sessionCookieBody")}</p>
</section>
```

Match the existing visual pattern on that page — copy classNames from an existing section.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: clean (no missing-translation warnings).

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/\(public\)/privacy/page.tsx messages/en.json messages/es.json
git commit -m "docs(privacy): disclose lompoc_sid session cookie"
```

---

## Task 11: Admin analytics queries

**Files:**
- Create: `app/[locale]/admin/analytics/queries.ts`

- [ ] **Step 1: Create the queries module**

This file holds all the SQL helpers the admin page needs. Each helper returns plain TypeScript objects, no chart-library types.

```ts
import { db } from "@/db/client"
import { events, businessClaims, businesses, users, deals } from "@/db/schema"
import { sql, and, eq, desc, gt, isNull, isNotNull } from "drizzle-orm"

const THIRTY_DAYS = sql`now() - interval '30 days'`

// ──────────────────────────────────────────────────────────────────────────────
// FUNNELS

export interface FunnelStep {
  name: string
  count: number
}

/** Local funnel: unique sessions w/ a business page view → local_signup → favorite_added. */
export async function localFunnel(): Promise<FunnelStep[]> {
  const [pageViews] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(DISTINCT session_id)::int AS c
        FROM events
        WHERE event_name = 'business_page_viewed' AND session_id IS NOT NULL AND created_at > ${THIRTY_DAYS}`
  )
  const [signups] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(DISTINCT user_id)::int AS c
        FROM events
        WHERE event_name = 'local_signup' AND created_at > ${THIRTY_DAYS}`
  )
  const [favorites] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(DISTINCT user_id)::int AS c
        FROM events
        WHERE event_name = 'favorite_added' AND created_at > ${THIRTY_DAYS}`
  )
  return [
    { name: "Visitors", count: pageViews?.c ?? 0 },
    { name: "Signed up", count: signups?.c ?? 0 },
    { name: "Favorited a deal", count: favorites?.c ?? 0 },
  ]
}

/** Business funnel: sessions → business_signup → profile_saved → first_deal_posted → paid_upgrade. */
export async function businessFunnel(): Promise<FunnelStep[]> {
  const [sessions] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(DISTINCT session_id)::int AS c FROM events WHERE session_id IS NOT NULL AND created_at > ${THIRTY_DAYS}`
  )
  const [bizSignups] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_name = 'business_signup' AND created_at > ${THIRTY_DAYS}`
  )
  const [profiles] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_name = 'business_profile_saved' AND created_at > ${THIRTY_DAYS}`
  )
  const [firstDeals] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_name = 'first_deal_posted' AND created_at > ${THIRTY_DAYS}`
  )
  const [paid] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_name = 'paid_upgrade' AND created_at > ${THIRTY_DAYS}`
  )
  return [
    { name: "All sessions", count: sessions?.c ?? 0 },
    { name: "Business signups", count: bizSignups?.c ?? 0 },
    { name: "Profile completed", count: profiles?.c ?? 0 },
    { name: "First deal posted", count: firstDeals?.c ?? 0 },
    { name: "Paid upgrade", count: paid?.c ?? 0 },
  ]
}

// ──────────────────────────────────────────────────────────────────────────────
// CLAIMS

export interface ClaimRow {
  id: number
  businessName: string
  businessSlug: string
  userEmail: string | null
  status: string
  submittedAt: Date
}

export async function recentClaims(): Promise<ClaimRow[]> {
  const rows = await db
    .select({
      id: businessClaims.id,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      userEmail: users.email,
      status: businessClaims.status,
      submittedAt: businessClaims.createdAt,
    })
    .from(businessClaims)
    .leftJoin(businesses, eq(businessClaims.businessId, businesses.id))
    .leftJoin(users, eq(businessClaims.userId, users.id))
    .orderBy(desc(businessClaims.createdAt))
    .limit(20)
  return rows.map((r) => ({ ...r, businessName: r.businessName ?? "—", businessSlug: r.businessSlug ?? "" }))
}

export async function claimSummary(): Promise<{ pending: number; approvedThisMonth: number }> {
  const [pending] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM business_claims WHERE status = 'pending'`
  )
  const [approved] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM business_claims WHERE status = 'approved' AND created_at > ${THIRTY_DAYS}`
  )
  return { pending: pending?.c ?? 0, approvedThisMonth: approved?.c ?? 0 }
}

// ──────────────────────────────────────────────────────────────────────────────
// SEARCH GAPS

export interface SearchGap {
  query: string
  count: number
}

export async function topZeroResultSearches(): Promise<SearchGap[]> {
  const rows = await db.execute<{ query: string; count: number }>(
    sql`SELECT (props->>'query') AS query, COUNT(*)::int AS count
        FROM events
        WHERE event_name = 'search_run'
          AND (props->>'resultCount')::int = 0
          AND created_at > ${THIRTY_DAYS}
        GROUP BY props->>'query'
        ORDER BY count DESC
        LIMIT 20`
  )
  return rows.filter((r) => r.query)
}

// ──────────────────────────────────────────────────────────────────────────────
// TOP BUSINESSES BY INTEREST

export interface TopBusiness {
  id: number
  name: string
  slug: string
  viewCount: number
  claimStatus: "claimed" | "pending" | "unclaimed"
}

export async function topBusinessesByInterest(): Promise<TopBusiness[]> {
  const rows = await db.execute<{ id: number; name: string; slug: string; view_count: number; claim_status: string | null }>(
    sql`
      SELECT b.id, b.name, b.slug,
             COUNT(e.id)::int AS view_count,
             COALESCE(
               (SELECT bc.status FROM business_claims bc
                WHERE bc.business_id = b.id
                ORDER BY bc.created_at DESC LIMIT 1),
               'unclaimed'
             ) AS claim_status
      FROM businesses b
      JOIN events e ON e.target_type = 'business' AND e.target_id = b.id
                  AND e.event_name = 'business_page_viewed'
                  AND e.created_at > ${THIRTY_DAYS}
      GROUP BY b.id, b.name, b.slug
      ORDER BY view_count DESC
      LIMIT 20
    `
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    viewCount: r.view_count,
    claimStatus: (r.claim_status === "approved" ? "claimed" : r.claim_status === "pending" ? "pending" : "unclaimed"),
  }))
}

// ──────────────────────────────────────────────────────────────────────────────
// DAILY METRICS (last 30 days, one number per day, fills missing days with 0)

export interface DailySeries {
  label: string
  points: number[]
}

async function dailyCount(eventName: string): Promise<number[]> {
  const rows = await db.execute<{ day: string; c: number }>(
    sql`
      WITH series AS (
        SELECT generate_series(date_trunc('day', now() - interval '29 days'), date_trunc('day', now()), '1 day')::date AS day
      ),
      counts AS (
        SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS c
        FROM events
        WHERE event_name = ${eventName} AND created_at > now() - interval '30 days'
        GROUP BY 1
      )
      SELECT s.day::text AS day, COALESCE(c.c, 0)::int AS c
      FROM series s
      LEFT JOIN counts c ON c.day = s.day
      ORDER BY s.day
    `
  )
  return rows.map((r) => r.c)
}

export async function dailyMetrics(): Promise<DailySeries[]> {
  const [sessions, locals, biz, claims, deals, paid] = await Promise.all([
    db
      .execute<{ day: string; c: number }>(
        sql`
          WITH series AS (
            SELECT generate_series(date_trunc('day', now() - interval '29 days'), date_trunc('day', now()), '1 day')::date AS day
          ),
          counts AS (
            SELECT date_trunc('day', created_at)::date AS day, COUNT(DISTINCT session_id)::int AS c
            FROM events
            WHERE created_at > now() - interval '30 days' AND session_id IS NOT NULL
            GROUP BY 1
          )
          SELECT s.day::text AS day, COALESCE(c.c, 0)::int AS c FROM series s LEFT JOIN counts c ON c.day = s.day ORDER BY s.day
        `
      )
      .then((rows) => rows.map((r) => r.c)),
    dailyCount("local_signup"),
    dailyCount("business_signup"),
    dailyCount("business_claim_submitted"),
    dailyCount("first_deal_posted"),
    dailyCount("paid_upgrade"),
  ])
  return [
    { label: "Sessions", points: sessions },
    { label: "Local signups", points: locals },
    { label: "Business signups", points: biz },
    { label: "Claims submitted", points: claims },
    { label: "Deals posted", points: deals },
    { label: "Paid upgrades", points: paid },
  ]
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean. **If `db.execute<T>(sql\`…\`)` complains about the generic, Drizzle's neon-http driver may need a different shape — fall back to:**

```ts
const result = await db.$client(sql.raw("SELECT …")) // OR
const result = await db.execute(sql`…`)
const rows = result as unknown as YourType[]
```

Inspect `db/client.ts` to see which Drizzle driver is configured and how queries are typed in existing code (e.g., `lib/admin-actions.ts` `getAdminStats`). Mirror that pattern.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/admin/analytics/queries.ts
git commit -m "feat(analytics): admin dashboard SQL queries"
```

---

## Task 12: Admin analytics page + components

**Files:**
- Create: `app/[locale]/admin/analytics/components.tsx`
- Create: `app/[locale]/admin/analytics/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (page strings)

- [ ] **Step 1: Create the components file**

```tsx
"use client"
// NOTE: This file is "use client" only if any child needs interactivity. The current components
// are pure presentational — remove the directive if not needed.

import { Link } from "@/i18n/navigation"

export function FunnelStep({
  name,
  count,
  maxCount,
}: {
  name: string
  count: number
  maxCount: number
}) {
  const pct = maxCount === 0 ? 0 : Math.round((count / maxCount) * 100)
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-sm">
        <span>{name}</span>
        <span className="tabular-nums text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="mt-1 h-2 w-full rounded bg-muted">
        <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Sparkline({ label, points }: { label: string; points: number[] }) {
  const max = Math.max(1, ...points)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="tabular-nums text-sm">{points[points.length - 1] ?? 0}</span>
      </div>
      <div className="mt-1 flex h-8 items-end gap-[1px]">
        {points.map((p, i) => (
          <div
            key={i}
            className="w-[3px] flex-shrink-0 bg-primary"
            style={{ height: `${Math.max(2, (p / max) * 32)}px`, opacity: 0.6 + (p / max) * 0.4 }}
          />
        ))}
      </div>
    </div>
  )
}

export function BusinessLink({ slug, name, locale }: { slug: string; name: string; locale: string }) {
  return (
    <Link href={`/biz/${slug}`} locale={locale} className="hover:underline">
      {name}
    </Link>
  )
}
```

If TypeScript complains about the `<Link>` import shape, look at the existing usage in `app/[locale]/admin/page.tsx` and copy that import path.

Remove `"use client"` if none of these need interactivity (they don't — they're pure display). Keep it only if you encounter SSR issues with the `<Link>` from `@/i18n/navigation`.

- [ ] **Step 2: Create the page**

```tsx
import {
  localFunnel,
  businessFunnel,
  recentClaims,
  claimSummary,
  topZeroResultSearches,
  topBusinessesByInterest,
  dailyMetrics,
} from "./queries"
import { FunnelStep, Sparkline, BusinessLink } from "./components"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage({ params: { locale } }: { params: { locale: "en" | "es" } }) {
  const t = await getTranslations("adminAnalytics")
  const [local, biz, claims, claimSum, searches, topBusinesses, daily] = await Promise.all([
    localFunnel(),
    businessFunnel(),
    recentClaims(),
    claimSummary(),
    topZeroResultSearches(),
    topBusinessesByInterest(),
    dailyMetrics(),
  ])

  const localMax = Math.max(...local.map((s) => s.count), 1)
  const bizMax = Math.max(...biz.map((s) => s.count), 1)

  return (
    <main className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>

      {/* 1. Top of funnel — Vercel link out */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-2 font-semibold">{t("topOfFunnel")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("vercelHint")}</p>
        <a
          href="https://vercel.com/kreatipworlds-projects/lompoc-deals/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          {t("openVercel")} →
        </a>
      </section>

      {/* 2. Funnels */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">{t("localFunnel")}</h2>
          {local.map((s) => (
            <FunnelStep key={s.name} name={s.name} count={s.count} maxCount={localMax} />
          ))}
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">{t("businessFunnel")}</h2>
          {biz.map((s) => (
            <FunnelStep key={s.name} name={s.name} count={s.count} maxCount={bizMax} />
          ))}
        </div>
      </section>

      {/* 3. Claims */}
      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("claims")}</h2>
          <span className="text-sm text-muted-foreground">
            {t("claimsSummary", { pending: claimSum.pending, approved: claimSum.approvedThisMonth })}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2">{t("business")}</th>
              <th>{t("email")}</th>
              <th>{t("status")}</th>
              <th>{t("submitted")}</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="py-2"><BusinessLink slug={c.businessSlug} name={c.businessName} locale={locale} /></td>
                <td className="text-muted-foreground">{c.userEmail ?? "—"}</td>
                <td>{c.status}</td>
                <td className="text-muted-foreground">{new Date(c.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">{t("noClaims")}</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 4. Search gaps */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">{t("searchGaps")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("searchGapsHint")}</p>
        {searches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSearchGaps")}</p>
        ) : (
          <ul className="space-y-1">
            {searches.map((g) => (
              <li key={g.query} className="flex justify-between text-sm">
                <span>{g.query}</span>
                <span className="tabular-nums text-muted-foreground">{g.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 5. Top businesses */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">{t("topBusinesses")}</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2">{t("business")}</th>
              <th className="text-right">{t("views30d")}</th>
              <th>{t("claimStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {topBusinesses.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="py-2"><BusinessLink slug={b.slug} name={b.name} locale={locale} /></td>
                <td className="text-right tabular-nums">{b.viewCount.toLocaleString()}</td>
                <td className="text-muted-foreground">{t(`claimStatus_${b.claimStatus}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 6. Daily metrics */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">{t("daily")}</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {daily.map((s) => (
            <Sparkline key={s.label} label={s.label} points={s.points} />
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Add translation keys**

In `messages/en.json`, add a top-level `adminAnalytics` block:

```json
"adminAnalytics": {
  "title": "Analytics",
  "subtitle": "Funnel, claims, and 30-day activity.",
  "topOfFunnel": "Top of funnel",
  "vercelHint": "Page views, referrers, and country data live in Vercel Analytics.",
  "openVercel": "Open Vercel Analytics",
  "localFunnel": "Local visitor funnel",
  "businessFunnel": "Business funnel",
  "claims": "Claim activity",
  "claimsSummary": "{pending} pending · {approved} approved this month",
  "business": "Business",
  "email": "Email",
  "status": "Status",
  "submitted": "Submitted",
  "noClaims": "No claims yet.",
  "searchGaps": "Search gaps (zero results)",
  "searchGapsHint": "Searches users ran in the last 30 days that returned nothing. Outreach signal.",
  "noSearchGaps": "No zero-result searches recorded yet.",
  "topBusinesses": "Top businesses by interest (30 days)",
  "views30d": "Views (30d)",
  "claimStatus": "Claim status",
  "claimStatus_claimed": "Claimed",
  "claimStatus_pending": "Pending",
  "claimStatus_unclaimed": "Unclaimed",
  "daily": "Daily activity (last 30 days)"
}
```

In `messages/es.json`:

```json
"adminAnalytics": {
  "title": "Analíticas",
  "subtitle": "Embudo, reclamos y actividad de 30 días.",
  "topOfFunnel": "Tope del embudo",
  "vercelHint": "Las visitas, referentes y países viven en Vercel Analytics.",
  "openVercel": "Abrir Vercel Analytics",
  "localFunnel": "Embudo de visitantes locales",
  "businessFunnel": "Embudo de negocios",
  "claims": "Actividad de reclamos",
  "claimsSummary": "{pending} pendientes · {approved} aprobados este mes",
  "business": "Negocio",
  "email": "Correo",
  "status": "Estado",
  "submitted": "Enviado",
  "noClaims": "Aún no hay reclamos.",
  "searchGaps": "Búsquedas sin resultados",
  "searchGapsHint": "Búsquedas de los últimos 30 días que no devolvieron resultados. Señal para outreach.",
  "noSearchGaps": "Aún no hay búsquedas sin resultados.",
  "topBusinesses": "Negocios con más interés (30 días)",
  "views30d": "Visitas (30d)",
  "claimStatus": "Estado del reclamo",
  "claimStatus_claimed": "Reclamado",
  "claimStatus_pending": "Pendiente",
  "claimStatus_unclaimed": "Sin reclamar",
  "daily": "Actividad diaria (últimos 30 días)"
}
```

- [ ] **Step 4: Add a link from the existing admin landing page**

Open `app/[locale]/admin/page.tsx`. Find the list of admin pages/sections (there's likely a card grid). Add a link to `/admin/analytics` with title and description from the same `adminAnalytics` namespace.

```tsx
import { Link } from "@/i18n/navigation"
// …
<Link href="/admin/analytics" className="…existing card classNames…">
  <h3>{t("adminAnalytics.title")}</h3>
  <p>{t("adminAnalytics.subtitle")}</p>
</Link>
```

Adjust to whatever the existing admin nav pattern is.

- [ ] **Step 5: Type-check + build**

```bash
npx tsc --noEmit
npm run build
```

Expected: clean. The build will surface any missing translation keys.

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/admin/analytics/ app/[locale]/admin/page.tsx messages/en.json messages/es.json
git commit -m "feat(analytics): admin /admin/analytics dashboard"
```

---

## Task 13: End-to-end verification + cleanup

**Files:** none (verification only) + drop legacy `deal_events` table

- [ ] **Step 1: Push to feature branch and trigger preview build**

```bash
git push -u origin feat/analytics-and-funnel
```

(Create the branch first if you've been working on `main`: `git checkout -b feat/analytics-and-funnel` before this step. If you've been working directly on `main`, skip the `-u origin` and proceed to a direct deploy.)

Wait for the preview to build (~1–2 min). Get the preview URL from `vercel ls`.

- [ ] **Step 2: Walk the funnel manually**

The preview is auth-gated. Spot-check on the production deploy after merge (Task 13 Step 8), or sign in to the preview to test. For each interaction, query the DB after to confirm the event was recorded.

Interactions:
1. Visit `/en/biz/walgreens-pharmacy` anonymously → `business_page_viewed` row with fresh `session_id`, `user_id` null.
2. Open `/en/search?q=garbage+truck` → `search_run` with `props.resultCount` (likely 0).
3. Click a map pin on `/en/map` → `map_pin_clicked` row.
4. Sign up as a new local user → `local_signup` row; prior session events now have `user_id`.
5. Add a deal to favorites → `favorite_added`.
6. Sign up the digest with a test email → `digest_subscribed` (initial) and another after confirming via email link (`doubleOptIn: true`).
7. Sign up as a new business → `business_signup`.
8. Complete profile in `/dashboard/profile` → `business_profile_saved` with `firstSave: true`.
9. Post a deal → `first_deal_posted`.
10. On an unclaimed business page, submit a claim → `business_claim_submitted`.
11. Log in as admin, approve the claim → `business_claim_approved`.
12. (Optional, requires Stripe test mode) Run a paid upgrade → `paid_upgrade`.

After each, run via Neon MCP:
```sql
SELECT event_name, user_id, session_id, target_type, target_id, props, created_at
FROM events ORDER BY id DESC LIMIT 10;
```

Verify the row matches the interaction.

- [ ] **Step 3: Verify the admin dashboard renders**

Visit `/en/admin/analytics` (signed in as admin). Verify each of the six sections renders without errors. Check that numbers roughly match the raw event counts:

```sql
SELECT event_name, COUNT(*) FROM events WHERE created_at > now() - interval '30 days' GROUP BY event_name ORDER BY 2 DESC;
```

- [ ] **Step 4: Verify cookie is set**

DevTools → Application → Cookies → `lompoc_sid` should be present, HttpOnly, Max-Age ~1 year, SameSite=Lax, Secure=true on production.

- [ ] **Step 5: Verify Vercel Analytics is collecting**

After enabling Web Analytics in the Vercel dashboard (manual step from Task 6 Step 5), wait 5+ minutes for data to start showing. Visit `https://vercel.com/<team>/lompoc-deals/analytics` — the page views chart should have at least one data point.

- [ ] **Step 6: Drop legacy `deal_events` table**

Run via Neon MCP (`twilight-boat-62678930`):

```sql
DROP TABLE IF EXISTS deal_events;
```

```sql
DROP TYPE IF EXISTS deal_event_type;
```

Then remove the same from `db/schema.ts`:
- Delete the `dealEventType` pgEnum export
- Delete the `dealEvents` pgTable export

Type-check + grep to confirm nothing else imports `dealEvents`:

```bash
grep -rn "dealEvents\|deal_events" /Users/kreatip/Projects/lompoc-deals --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Expected: only the now-deleted lines in `db/schema.ts` and any migration files (those are historical and fine). If `lib/tracking.ts` still imports `dealEvents`, you missed the Task 8 Step 5 migration — fix.

- [ ] **Step 7: Final type-check + build**

```bash
npx tsc --noEmit
npm run build
```

Both expected clean.

- [ ] **Step 8: Commit and merge**

```bash
git add db/schema.ts
git commit -m "chore(db): drop legacy deal_events table after fold into events"
```

If you used a feature branch:
```bash
git checkout main
git pull --ff-only origin main
git merge --ff-only feat/analytics-and-funnel
git push origin main
```

If you've been working directly on `main`:
```bash
git push origin main
```

- [ ] **Step 9: Production verification**

After production deploys:
1. Visit `https://lompoc-deals.vercel.app/en/biz/pali-wine-co` anonymously (a fresh browser/incognito).
2. Confirm `lompoc_sid` cookie is set.
3. Query the DB to confirm a `business_page_viewed` event landed.
4. Visit `https://lompoc-deals.vercel.app/en/admin/analytics` (signed in as admin).
5. Confirm the dashboard renders with the new event.

- [ ] **Step 10: Note the one manual step in the final report**

In the wrap-up message, remind the operator to:
- Enable Web Analytics in the Vercel dashboard (Task 6 Step 5) if not already done.
- (Optional) Set the Vercel Analytics dashboard link in the admin page if the URL slug differs.
