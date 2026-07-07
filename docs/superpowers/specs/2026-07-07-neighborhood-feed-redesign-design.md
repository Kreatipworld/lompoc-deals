# Neighborhood Feed Redesign — the interactive feed of everything

**Date:** 2026-07-07
**Status:** Approved by Andres
**Route:** `/feed` (nav label "Neighborhood" / "El Vecindario")

## Problem

The Neighborhood page (`/feed`) currently shows only community posts (for-sale/info)
and events, filtered by full-page-reload links. It reads as a small classifieds
board, not the front door of the platform. Garage sales — a high-interest local
draw — render as generic for-sale cards with no date emphasis and no map. Deals,
new businesses, and blog content never appear there, so the page goes stale
between community posts.

## Goal

Make `/feed` a living digest of everything happening on Lompoc Locals — community
posts, garage sales, business deals, new-business arrivals, events, and recent
blog posts — with instant filtering by type and neighborhood, a map view, and a
conversation layer (reactions + comments) so locals talk about deals and posts.

## Non-goals

- Real-time / live-updating feed (no polling or streaming in this iteration)
- Nested comment threads (flat replies only for v1)
- Poster-selected neighborhoods (derived from coordinates only; no new form field)
- Any geography outside Lompoc + Vandenberg (ZIPs 93436/37/38)
- New dependencies (Leaflet, next-intl, Drizzle, shadcn/ui already cover it)

## Architecture

The page stays a server component that fetches the unified feed once via
`getFeedItems()`. A new client component, `components/feed-explorer.tsx`, receives
the full item list and owns all interactivity: filter chips, neighborhood chips,
card/map view toggle, and animated transitions. Reactions and comments are server
actions with optimistic client updates. URL query params (`?type=`, `?hood=`)
stay in sync via `router.replace` so filtered views are shareable and crawlable.

```
/feed page (RSC)
  └─ getFeedItems()            lib/feed-queries.ts — one unified, interleaved list
  └─ <FeedExplorer items>      client island
       ├─ filter chips (type + neighborhood) — instant, client-side
       ├─ card grid (FeedMasonry, extended card renderers)
       ├─ map view (Leaflet, dynamic import, color-coded pins)
       └─ per-card: ReactionBar, comment count → detail page
detail pages (feed post, deal)
       └─ <CommentSection subjectType subjectId> — list + form + report
admin command center
       └─ comment moderation queue (reported + recent), remove / block commenter
```

## Section 1 — Content mix

Extend `FeedDisplayItem` in `lib/feed-queries.ts`:

```ts
source: "feed" | "event" | "deal" | "new_business" | "blog"
type:   "for_sale" | "garage_sale" | "info" | "event" | "deal" | "new_business" | "blog"
neighborhood: string | null   // derived, see Section 2
lat: number | null
lng: number | null
reactionCounts?: Record<string, number>
commentCount?: number
```

| Card | Source table | Inclusion rule | Card treatment |
|---|---|---|---|
| Community post | `feed_posts` (approved, non-expired) | As today | As today |
| Garage sale | `feed_posts` where `type = for_sale` AND `saleStartsAt` set | Derived subtype, not a schema change | Distinct card: date badge, "This weekend" ribbon when sale falls within the upcoming Fri–Sun, map-pin address line |
| Event | `events` (approved, upcoming) | As today | As today |
| Deal | `deals` (active window, business approved) | Newest first | Deal card linking to `/deals/[id]` (existing detail route) |
| New in town | `businesses` approved in the last 14 days | Auto-generated | Celebration card ("New in town 🎉"), links to `/biz/[slug]` |
| From the blog | `blogPosts` published in the last 30 days | Max 1 per feed load (most recent) | Reading card, links to the post |

**Interleaving:** sort each stream by `approvedAt`/`createdAt` desc, then merge with
a rationing pass: at most 1 deal card per 4 non-deal items, never two deal cards
adjacent; new-business and blog cards count as community items. Featured items
keep their existing top placement. Total limit stays ~60 items.

## Section 2 — Neighborhoods

New file `lib/neighborhoods.ts`:

- `NEIGHBORHOODS`: ordered list of `{ slug, en, es, bounds: [south, west, north, east] }`
  rectangles for: Old Town, Downtown, Northside, Westside, Southside,
  Mission Hills, Vandenberg Village, Mesa Oaks, Vandenberg SFB.
- `latLngToNeighborhood(lat, lng): string | null` — first matching zone wins
  (list ordered most-specific first); `null` → display "Lompoc".
- Applied at query time in `getFeedItems()` to every item that has coordinates
  (feed posts and events have `lat/lng`; deals and new-business cards use their
  business's `lat/lng`).

Purely derived — **no schema change**. Chips render only for neighborhoods that
actually have items in the current feed load, so empty zones never show.

## Section 3 — Interactive shell (`FeedExplorer`)

- **Type chips:** All / Deals / For Sale / Garage Sales / Events / News (info+blog+new-business).
  "For Sale" includes garage-sale cards (they are for-sale posts); "Garage Sales"
  is the narrower subset with sale dates. Selecting filters client-side
  instantly; cards animate (existing animation utils).
- **Neighborhood chips:** second chip row; combinable with the type filter.
- **URL sync:** `router.replace("/feed?type=…&hood=…", { scroll: false })`; the
  server component reads the same params for first paint, so shared links and
  crawlers see the filtered list. Legacy value `?type=for_sale` (used by the
  `/garage-sales` 308 redirect) keeps working and maps to the For Sale chip.
- **Map toggle:** card ⇄ map switch in the filter bar. The map is
  `react-leaflet` behind `next/dynamic` (`ssr: false`), reusing the pattern from
  `components/garage-sales-map.tsx`. Pins are color-coded by card type (brand
  palette: purple deals, green community, gold garage sales/events); tapping a
  pin opens a popup mini-card linking to the item. Items without coordinates are
  excluded from the map view (a small count note says so).
- Filters apply to both views identically.

## Section 4 — Reactions & comments

Two new tables (Drizzle migration), both polymorphic:

```ts
subjectType: pgEnum("comment_subject_type", ["feed_post", "deal", "event"])

reactions: id, subjectType, subjectId, userId, emoji varchar(8),
           createdAt — UNIQUE (subjectType, subjectId, userId)
comments:  id, subjectType, subjectId, userId, body text (1–1000 chars),
           status pgEnum("comment_status", ["visible", "removed"]) default "visible",
           reportCount integer default 0, createdAt
```

- **Reactions:** fixed emoji set ❤️ 👍 🎉, one reaction per user per subject
  (tapping a different emoji switches it; tapping the same one removes it).
  Counts on every feed card via `ReactionBar`. Server action + optimistic UI.
- **Comments:** flat list, newest last, on feed-post detail and deal detail
  pages via a shared `CommentSection` component. 1–1000 chars, plain text.
  Comment count badge on feed cards ("💬 3").
- **Auth:** both require login; logged-out taps route through the existing
  `?from=` redirect flow (login and signup both preserve it).
- **Moderation (post-first):** comments appear immediately. Every comment has a
  Report button (one report per user per comment; increments `reportCount`).
  The admin command center gains a Comments queue showing reported comments
  first, then recent ones, with actions: **Remove** (sets `status = removed`;
  body hidden, "Removed by moderator" placeholder keeps thread continuity) and
  **Block commenter** (new `commentsBlocked boolean` on `users`; blocked users
  see a "commenting disabled" notice). Rationale: pre-approval kills
  conversation; small-town accountability + fast admin removal is the right
  tradeoff.
- **Rate limit:** max 5 comments per user per 10 minutes (checked in the server
  action) to blunt spam bursts.

## Section 5 — i18n

All new UI strings go through `next-intl` with EN + ES parity (`messages/en.json`
/ `messages/es.json`): chip labels, garage-sale ribbon, "New in town", map
toggle, reaction/comment UI, moderation strings, relative dates via existing
formatting helpers. Neighborhood names carry their own `en`/`es` labels in
`NEIGHBORHOODS` (most are proper nouns and identical in both).

## Phases (each shippable, commit after each)

1. **Feed of everything** — extended `getFeedItems()` with deals, new-business,
   blog sources + interleaving; garage-sale card style; `lib/neighborhoods.ts`;
   `FeedExplorer` with live type + neighborhood chips and URL sync.
2. **Map view** — card/map toggle, color-coded pins, popup mini-cards.
3. **Conversation layer** — reactions + comments schema and migration, server
   actions, `ReactionBar` + `CommentSection`, admin Comments queue, block/remove,
   rate limiting.

## Error handling

- A failing sub-query for a new source (deals, blog, businesses) must not blank
  the feed: wrap the new streams so a failure degrades to the current
  posts+events feed.
- Map view with zero located items shows an empty-state message, not a bare map.
- Comment/reaction server actions validate auth, subject existence, blocked
  status, and rate limit; failures return typed error strings rendered inline.

## Testing

- Unit: `latLngToNeighborhood` (zone hits, overlaps resolve by order, outside →
  null); interleaving ratio (never two adjacent deals; ≤1 blog card);
  garage-sale subtype derivation; "this weekend" boundary logic.
- Smoke: feed page renders all card types; `?type=for_sale` legacy param still
  filters; comment post → visible → report → admin remove → placeholder shown;
  reaction toggle idempotency.
- Manual checklist per phase before deploy (deploy is manual:
  `vercel deploy --prod`).
