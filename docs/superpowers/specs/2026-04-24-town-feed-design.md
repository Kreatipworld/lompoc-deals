# Town Feed — Design Spec

**Date:** 2026-04-24
**Status:** Approved (awaiting implementation plan)
**Scope:** Phase 5 — a unified, locally-curated community feed where Lompoc residents post `for_sale` items and `info` announcements. Every post is admin-moderated. The display is a masonry grid with stagger reveal, photo zoom on hover, a 2× featured tile, and a 24h "NEW" badge pulse. Replaces the existing `garage_sales` table and route.

---

## 1. Goal

Give Lompoc locals (and visitors browsing the site) a single, lively surface for community-driven posts: items for sale and informational announcements. The current `garage_sales` table is a narrow slice of what the community actually wants to share; the Feed broadens scope while preserving everything garage-sales already does. Every post is reviewed by an administrator before going live, ensuring brand consistency and spam control. The visual design is energetic but disciplined: cards rise into view with a stagger, photos zoom on hover, a featured tile draws the eye, and a brief "NEW" pulse signals fresh content.

**Personality:** local + alive. The Feed should feel like the Lompoc bulletin board, not a marketplace and not a corporate listing.

**Non-goals (explicit):** in-app buyer↔seller messaging, "wanted/looking-for" posts, trust-based auto-approval, push notifications, map view of for_sale posts, dropping the `garage_sales` table in this release. All deferred to a future phase or never.

---

## 2. Context — what already exists

Four tables overlap the Feed concept; only one (`garage_sales`) is fully replaced:

| Table | Creator | Approval flow | Status in this phase |
|---|---|---|---|
| `deals` (db/schema.ts:111) | businesses only | none — auto-publishes | **untouched** |
| `events` (db/schema.ts:219) | locals + Eventbrite | full pending→approved (admin) | **untouched** — approved rows surface in the feed display via UNION |
| `garage_sales` (db/schema.ts:408) | locals | none — manual status enum | **migrated then deprecated** |
| `activities` (db/schema.ts:292) | admin/seed only | n/a | **untouched** |

Admin moderation pattern is already established at `/admin/events` and `lib/admin-actions.ts:356–371`: form-based server actions, hidden ID input, `requireAdmin()` guard, `db.update().set({ status })`, `revalidatePath()`. Feed reuses this pattern.

User roles: `local | business | admin` (db/schema.ts:17). `local` users already submit events and garage sales; the Feed extends that pattern.

---

## 3. Data model

### 3.1 New enums

```ts
export const feedPostType = pgEnum("feed_post_type", ["for_sale", "info"])
export const feedPostStatus = pgEnum("feed_post_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "sold",
])
```

### 3.2 New table — `feed_posts`

```ts
export const feedPosts = pgTable("feed_posts", {
  id: serial("id").primaryKey(),
  postedByUserId: integer("posted_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: feedPostType("type").notNull(),

  // Common
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  photos: jsonb("photos"), // string[] of Vercel Blob URLs, 0–4 items

  // for_sale only
  priceCents: integer("price_cents"), // null = free / OBO / not applicable
  saleStartsAt: timestamp("sale_starts_at", { withTimezone: true }),
  saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }),

  // Optional location (yard sales benefit)
  address: varchar("address", { length: 300 }),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),

  // Moderation
  status: feedPostStatus("status").notNull().default("pending"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedByUserId: integer("approved_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  rejectionReason: text("rejection_reason"),

  // Highlight
  isFeatured: boolean("is_featured").notNull().default(false),

  // Lifecycle
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
```

### 3.3 Indexes

For the public feed query (UNION + filter + sort), add:

```ts
{
  statusExpiresIdx: index("feed_posts_status_expires_idx").on(t.status, t.expiresAt),
  typeStatusIdx: index("feed_posts_type_status_idx").on(t.type, t.status),
  postedByIdx: index("feed_posts_posted_by_idx").on(t.postedByUserId),
}
```

---

## 4. Lifecycle and expiration

`expiresAt` is computed **at approval time** by the admin server action, per these rules:

| Condition | `expiresAt` |
|---|---|
| `type === "for_sale"` AND `saleEndsAt` is present | `saleEndsAt + 24 hours` |
| `type === "for_sale"` AND no `saleEndsAt` | `approvedAt + 30 days` |
| `type === "info"` | `approvedAt + 7 days` |

Locals can extend by clicking "Still valid" on their post in `/feed/my`, which:
- For_sale single-item posts: pushes `expiresAt` forward by 30 days from now
- For_sale yard-sale posts (with `saleEndsAt`): updates `saleEndsAt` to a user-picked new date, recomputes `expiresAt`
- Info posts: pushes `expiresAt` forward by 7 days from now

A daily Vercel cron job at `/api/cron/expire-feed-posts` (runs at 00:00 PT) flips posts to `status: "expired"` once `expiresAt < now()`. The cron route is gated by the existing `CRON_SECRET` env var (already configured in `.env.example`). This keeps the public query simple (`WHERE status = 'approved' AND expires_at > now()`).

Cron schedule lives in `vercel.json` (or `vercel.ts` if the repo migrates to TS config). One new file: `app/api/cron/expire-feed-posts/route.ts`.

Locals can also mark a for_sale post `sold` directly (immediate removal from feed).

---

## 5. Routes

### 5.1 New routes

| Route | Purpose | Auth |
|---|---|---|
| `/feed` | Public masonry feed | none |
| `/feed?type=for_sale` or `?type=info` | Filtered view | none |
| `/feed/post` | Submission form | logged-in `local` user |
| `/feed/[id]` | Single post detail | none |
| `/feed/my` | Poster's own pending/approved/expired posts; mark sold; extend expiry | logged-in poster |
| `/admin/feed` | Pending queue + approve/reject/feature | `admin` only |

### 5.2 Redirects (preserve existing URLs)

| From | To | Status |
|---|---|---|
| `/garage-sales` | `/feed?type=for_sale` | 301 permanent |
| `/garage-sales/post` | `/feed/post?type=for_sale` | 302 (temporary, preserves intent during session) |

These are implemented in the page files themselves via `redirect()` from `next/navigation`.

---

## 6. Submission flow (`/feed/post`)

Single-page form with conditional fields driven by the `type` selection. No multi-step wizard — the form is short.

**Fields, in order:**

1. **Type picker** — segmented control (radio): `For sale` / `Info`. Default: from `?type=` query param if present.
2. **Title** — required, ≤200 chars, plain text.
3. **Description** — required, no length cap, preserves line breaks.
4. **Photos** — 0–4, optional for `info`, encouraged for `for_sale`. Drag-drop or click-to-upload. Uses existing `lib/blob.ts` (`uploadImage`) infrastructure. Each photo is uploaded individually; URLs collected into the `photos` JSONB array.
5. **For-sale-only fields** (rendered conditionally):
   - **Price** — optional, dollars-and-cents input. Stored as `priceCents` (integer). Empty = "free / OBO".
   - **Sale window** — optional date range (start / end). Both dates required if either is provided. Used for yard-sale-style posts; a single-item listing leaves these blank.
   - **Address** — optional. Geocoded via `lib/geocode.ts` on submit. Address must match the existing Lompoc ZIP guard (`lib/lompoc-zip.ts` from Phase 4) — non-Lompoc addresses are rejected with the standard error message.

**Submit behavior:**

1. Server action `submitFeedPostAction(formData)`:
   - Validates with Zod schema
   - Validates address against `lompocAddressError()` if address provided
   - Geocodes address if provided
   - Inserts row with `status: "pending"`, `expiresAt` placeholder set to `createdAt + 60 days` (recomputed correctly at admin approval)
2. Redirects to `/feed/my` with a flash toast: *"Submitted! An admin will review and approve within 24h."*

**Validation rules:**

- `title` 2–200 chars
- `description` ≥ 10 chars
- `photos` ≤ 4 items, each ≤ 5MB, JPEG/PNG/WebP
- `priceCents` 0–9_999_900 ($0–$99,999) when present
- `saleStartsAt` ≤ `saleEndsAt` when both present
- Address (when present): passes `lompocAddressError()`

---

## 7. Admin moderation (`/admin/feed`)

Modeled after `/admin/events` (`app/[locale]/admin/events/page.tsx`).

**View:** Server-rendered list of pending posts, newest first, with full detail visible (no expand). Each card shows:

- Photos (thumbnail strip)
- Type badge + title + price
- Description
- Poster name / email + "X hours ago"
- Address (if any), with a Google Maps link
- Three action buttons: `Approve` · `Reject (with reason)` · `Feature & approve`

**Server actions in `lib/admin-feed-actions.ts`:**

```ts
async function approveFeedPostAction(formData: FormData): Promise<void>
async function rejectFeedPostAction(formData: FormData): Promise<void>
async function featureFeedPostAction(formData: FormData): Promise<void>
```

All three:
- Call `requireAdmin()` from existing auth helpers
- Read `feedPostId` from a hidden form input
- Update the row in a single statement
- Send the appropriate transactional email via `lib/email.ts`
- Call `revalidatePath("/admin/feed")`, `revalidatePath("/feed")`, `revalidatePath("/feed/my")`

**`approveFeedPostAction` specifically:**

```ts
const now = new Date()
const expiresAt = computeExpiration(post)  // per §4 rules
await db.update(feedPosts).set({
  status: "approved",
  approvedAt: now,
  approvedByUserId: adminId,
  expiresAt,
}).where(eq(feedPosts.id, id))
await sendFeedApprovalEmail(poster.email, post.title)
```

**`rejectFeedPostAction`:** flips status to `"rejected"`, stores the admin's rejection reason (free-text textarea), emails the poster.

**`featureFeedPostAction`:** sets `isFeatured: true`. If status is still `"pending"`, also flips to `"approved"` (and runs the approval-time logic above).

---

## 8. Public feed display

### 8.1 Query — `getFeedItems()` in `lib/feed-queries.ts`

Returns up to 60 items combining feed posts and events:

```ts
type FeedDisplayItem = {
  id: string             // "feed-{n}" or "event-{n}"
  source: "feed" | "event"
  type: "for_sale" | "info" | "event"
  title: string
  description: string | null
  imageUrl: string | null
  priceCents: number | null  // for_sale only
  saleEndsAt: Date | null
  startsAt: Date | null      // event only
  isFeatured: boolean
  isNew: boolean             // approvedAt > now() - 24h
  approvedAt: Date           // sort key
  href: string               // /feed/[id] or /events/[id]
}

async function getFeedItems(opts?: {
  type?: "for_sale" | "info" | "event"
  limit?: number
}): Promise<FeedDisplayItem[]>
```

The implementation runs two queries (Drizzle UNION ALL + ORDER BY) and maps each side to the unified shape:

- From `feedPosts` where `status = 'approved' AND expires_at > now()` (filter by `type` if requested)
- From `events` where `status = 'approved' AND starts_at >= now()` (only when `type` is undefined or `"event"`)

Sort: `is_featured DESC, approved_at DESC` (or `events.created_at` for events). Limit 60.

### 8.2 Layout

- **Featured strip** (top): up to 2 items where `isFeatured = true`. On desktop, each is rendered as a 2× tile (spans 2 columns + 2 rows). On mobile, full-width single card.
- **Masonry grid** (below): everything else, in a 3-column (desktop) / 2-column (tablet) / 1-column (mobile) masonry via `react-masonry-css`.
- A small filter bar above the strip: `All` · `For sale` · `Info` · `Events`. Toggling updates the URL `?type=` and re-renders.

### 8.3 Card component (`components/feed-card.tsx`)

Single component renders all three sources (`for_sale`, `info`, `event`) with subtle styling differences:

- `for_sale`: photo prominent, price chip top-right, address chip if present
- `info`: photo optional, no price chip, slightly smaller image
- `event`: date chip prominent (e.g., "Sat May 11, 7pm"), no price

All three share the same hover behavior: `transform: translateY(-3px)` + shadow lift on the card, `transform: scale(1.06)` on the photo.

A 24h "NEW" badge (top-left corner pill) appears when `isNew === true`. The badge has the `animate-feed-new-pulse` class (CSS keyframe added to `globals.css`); reduced-motion disables the pulse.

### 8.4 Motion

Reuses Phase 4's tokens (`lib/motion.ts`):

| Element | Animation | Tokens |
|---|---|---|
| Card grid mount | `<Reveal preset="stagger">` — children fade-up + 80ms stagger (faster than 120ms standard, because the feed has 30+ cards) | `DURATION.entrance` (500ms), `EASE.standard`, custom 80ms stagger |
| Featured tile | `<Reveal preset="scaleIn">` rendered separately above the masonry | `DURATION.entrance`, `EASE.standard` |
| Card hover (whole) | `transform: translateY(-3px)` + shadow change | `DURATION.hover` (220ms), `EASE.standard` |
| Photo hover (inside card) | `transform: scale(1.06)` | 400ms ease |
| 24h NEW pulse | `@keyframes feed-new-pulse` (opacity + scale, 2s loop, infinite) | CSS-only, disabled by `prefers-reduced-motion: reduce` |

The 80ms stagger for masonry uses an extension to `<Reveal>`: callers can pass `stagger={80}` (the prop already exists in the Phase 4 primitive).

---

## 9. Migration plan

### 9.1 SQL migration (Drizzle-generated)

Create the new enums, the `feed_posts` table, the three indexes from §3.3.

### 9.2 Data migration

A one-time migration script `db/migrate-garage-sales-to-feed.ts`:

```ts
// For each garage_sales row:
//   INSERT INTO feed_posts (
//     posted_by_user_id,
//     type,
//     title,           -- "Garage sale" if no description, else first 80 chars
//     description,
//     photos,
//     sale_starts_at,  -- start_date + start_time combined
//     sale_ends_at,    -- end_date + end_time combined
//     address, lat, lng,
//     status,          -- "approved" if active, else "expired"
//     approved_at,     -- = original created_at
//     approved_by_user_id, -- NULL (legacy)
//     expires_at,      -- sale_ends_at + 24h, fallback created_at + 30 days
//     created_at
//   )
```

Run order: schema migration → data migration → verify count matches → deploy redirect routes.

### 9.3 Deprecation of `garage_sales` table

- Keep the table in the database for one release as a read-only fallback.
- Add a deprecation comment in `db/schema.ts` above the table definition.
- Drop in a follow-up release after confirming no traffic / no errors over 2 weeks.

---

## 10. Files

### Created

- `app/api/cron/expire-feed-posts/route.ts` — daily cron handler (gated by `CRON_SECRET`)
- `lib/feed-actions.ts` — `submitFeedPostAction`, `markSoldAction`, `extendExpirationAction`
- `lib/admin-feed-actions.ts` — `approveFeedPostAction`, `rejectFeedPostAction`, `featureFeedPostAction`
- `lib/feed-queries.ts` — `getFeedItems()`, `getMyFeedPosts(userId)`, `getPendingFeedPosts()`
- `lib/feed-expiration.ts` — `computeExpiration(post)` shared helper used by approval action and extend action
- `app/[locale]/(public)/feed/page.tsx` — public masonry feed
- `app/[locale]/(public)/feed/post/page.tsx` — submission entry
- `app/[locale]/(public)/feed/post/feed-post-form.tsx` — client-side form component
- `app/[locale]/(public)/feed/[id]/page.tsx` — single-post detail
- `app/[locale]/(public)/feed/my/page.tsx` — "My posts"
- `app/[locale]/admin/feed/page.tsx` — admin moderation queue
- `components/feed-card.tsx` — reusable card (used by feed grid + my posts + admin)
- `components/feed-masonry.tsx` — masonry wrapper using `react-masonry-css` + `<Reveal>` stagger
- `db/migrations/<n>_create_feed_posts.sql` — schema migration
- `db/migrate-garage-sales-to-feed.ts` — one-time data migration script

### Modified

- `db/schema.ts` — add enums, table, indexes; mark `garageSales` deprecated
- `app/globals.css` — add `@keyframes feed-new-pulse` + `.animate-feed-new-pulse` utility + reduced-motion override
- `app/[locale]/(public)/garage-sales/page.tsx` — replace with `redirect('/feed?type=for_sale', 'permanent')`
- `app/[locale]/(public)/garage-sales/post/page.tsx` — replace with `redirect('/feed/post?type=for_sale')`
- `app/[locale]/admin/page.tsx` — add "Feed" link in admin nav
- `lib/email.ts` — add `sendFeedApprovalEmail`, `sendFeedRejectionEmail`
- `package.json` — add `react-masonry-css` (~3kb gzipped)
- `vercel.json` — add the daily cron schedule for `/api/cron/expire-feed-posts`

### Not touched

- `events`, `deals`, `activities` tables — unchanged
- `lib/business-signup-actions.ts`, `lib/biz-actions.ts` — unchanged
- Customer-side animation (`<Reveal>`, `lib/motion.ts`) — reused, not modified

---

## 11. Accessibility

- Reduced motion: stagger reveal, hover transforms, and "NEW" pulse all respect `prefers-reduced-motion: reduce` (Phase 4 infrastructure already does this).
- The featured tile is a `role="article"` with the same heading hierarchy as a regular card — no ARIA mismatch.
- Photo zoom on hover does not affect screen readers (it's transform-only).
- Submission form uses real `<label>` elements + native validation messages; conditional fields are revealed via `aria-hidden` toggling, not unmounting.
- Reject reason is required when admin clicks Reject — focuses the textarea on click.

---

## 12. Performance

- Public feed query is `LIMIT 60` server-side; users hit a "Load more" button to paginate.
- Photos use `next/image` with size hints from the layout (1× column on mobile, 1/3 on desktop) — Vercel handles responsive variants.
- `react-masonry-css` is ~3kb gzipped. No other new deps.
- The 24h "NEW" pulse is CSS-only (zero JS).
- `<Reveal>` already uses dynamic `import("animejs")` so the masonry page only pays for anime.js when an entry actually animates.

---

## 13. Open questions resolved

1. **Replace garage_sales or coexist?** → Replace (with one-release deprecation window).
2. **Include events in the new table?** → No — events stay separate; their approved rows surface via UNION in the public feed display.
3. **Sub-types in the Feed?** → `for_sale` + `info`. Skip `wanted` for v1.
4. **Who can post?** → Logged-in `local` users only (matches existing garage_sales / submit-event pattern).
5. **Moderation?** → Strict — every post requires admin approval, every time.
6. **Expiration?** → Per-type defaults: for_sale 30d (or `saleEndsAt + 24h` if a sale window is given), info 7d. Both extendable.
7. **Aesthetic?** → Masonry layout + stagger reveal + photo zoom hover + 2× featured tile + 24h "NEW" pulse.

---

## 14. Success criteria

Phase 5 is done when:

1. A logged-in `local` user can submit a `for_sale` post (with photos, optional price, optional sale window) at `/feed/post`.
2. A logged-in `local` user can submit an `info` post.
3. Submissions land in `/admin/feed` as `pending` and trigger no email.
4. Admin can approve, reject (with reason), or feature-and-approve. Approval/rejection sends an email to the poster.
5. Approved posts appear at `/feed` in masonry layout with stagger reveal, photo hover zoom, and a 24h "NEW" badge that pulses.
6. Featured posts render as 2× tiles above the masonry on desktop.
7. Approved events from the existing `events` table appear in the same feed stream.
8. Posters can mark a `for_sale` post as `sold` or extend expiration from `/feed/my`.
9. `/garage-sales` redirects 301 → `/feed?type=for_sale`. `/garage-sales/post` redirects → `/feed/post?type=for_sale`.
10. Existing garage_sales rows are migrated into `feed_posts` with `status: "approved"` and correct `expiresAt`.
11. `prefers-reduced-motion: reduce` disables stagger reveal, photo zoom, and NEW pulse.
12. Lompoc ZIP guard from Phase 4 still applies to any address submitted in a feed post.
