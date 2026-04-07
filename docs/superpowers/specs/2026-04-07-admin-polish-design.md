# Admin Page Polish — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Owner:** kreatip

## Goal

Bring `/admin` visually in line with the rest of the polished business dashboard (Fraunces display serif, coral accents, rounded-2xl/3xl cards, brand stat cards). Add a small read-only stats strip so the page feels balanced. **No new features, no new routes, no schema changes.**

## Scope

**In scope:**
- Visual rework of `app/admin/page.tsx` to match `/dashboard/*` pages
- Read-only stat strip showing 4 numbers: total businesses, pending businesses, total deals, total users
- Polished pending-business cards with amber status pill, serif name, address/phone/website rows, coral Approve + ghost Reject
- Friendly empty state when nothing pending
- Targeted refactor: extract the inline `StatCard` component from `/dashboard/deals/page.tsx` into `components/stat-card.tsx` so `/admin` can reuse it (DRY)

**Out of scope:**
- Sidebar navigation for `/admin` (single-page area for now)
- New admin features (search, filtering, viewing all-not-just-pending businesses, deal moderation queue)
- Test framework setup — project currently has none, this is a visual change, manual test plan in §Testing
- Anything affecting `/dashboard/*`, `/biz/*`, `/category/*`, the homepage, or auth flow

## Architecture

Single Server Component page that fetches stats and pending businesses in parallel from the existing Drizzle/Neon DB. No client-side JS, no new dependencies, no new routes, no schema changes. Auth gating already exists at the middleware and layout layers — no changes there.

## Files

| File | Action | Responsibility |
|---|---|---|
| `components/stat-card.tsx` | **Create** | Reusable presentational stat card. Props: `icon`, `label`, `value`. Identical visual to the existing inline `StatCard` in `/dashboard/deals/page.tsx`. |
| `app/dashboard/deals/page.tsx` | **Modify** | Replace the local inline `StatCard` function with `import { StatCard } from "@/components/stat-card"`. No behavior change. |
| `lib/admin-actions.ts` | **Modify** | Add `getAdminStats(): Promise<{ totalBusinesses, pendingBusinesses, totalDeals, totalUsers }>`. Uses `Promise.all` over 4 COUNT queries. Gated by `requireAdmin()`. |
| `app/admin/layout.tsx` | **Modify** | Remove the existing "Admin" heading + subtitle paragraph (they move into `page.tsx` so we can use the display serif). Keep the auth-gate redirect and the max-width container. |
| `app/admin/page.tsx` | **Rewrite** | Whole new layout: header with H1 + role badge, stat strip, pending businesses section. See §Page Layout. |

## Data Flow

```
/admin/page.tsx (server component)
  ├─ const session = await auth()                      [gated by layout]
  ├─ const [stats, pending] = await Promise.all([
  │     getAdminStats(),                               [lib/admin-actions.ts]
  │     getPendingBusinesses(),                        [already exists]
  │   ])
  └─ render <StatCard /> x4 + pending grid
```

`getAdminStats()` runs 4 parallel COUNT(*) queries:
- `select count(*)::int from businesses`
- `select count(*)::int from businesses where status = 'pending'`
- `select count(*)::int from deals`
- `select count(*)::int from users`

Returns plain object. No caching needed for v1 — admin page is rarely visited.

## New Component: StatCard

```tsx
type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: number | string
}
```

Visual: rounded-2xl border, bg-card, shadow-sm, p-5. Top row: coral icon + uppercase tracking-wider muted label. Bottom: display serif 3xl tracking-tight value.

This is identical to the existing inline `StatCard` in `app/dashboard/deals/page.tsx`. The refactor extracts it to `components/stat-card.tsx` and updates the dashboard import. No visual change for the dashboard.

## Page Layout

Inside the existing `app/admin/layout.tsx` container (`max-w-6xl px-4 py-8`):

### Header section
- **H1** "Admin" — `font-display text-3xl font-semibold tracking-tight`
- **Subtitle** — `mt-1 text-sm text-muted-foreground`: "Manage businesses and review pending listings."
- **Role badge** (top-right, on the same row as H1 via `flex justify-between`): coral pill `<span class="rounded-full bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-xs font-medium">Admin</span>`

### Stat strip
- `grid grid-cols-2 sm:grid-cols-4 gap-4`
- 4 `<StatCard>` instances with these icons (lucide):
  - `<Store />` Total businesses
  - `<Clock />` Pending
  - `<Tag />` Total deals
  - `<Users />` Total users

### Pending businesses section
- **H2** "Pending businesses" — `font-display text-xl font-semibold tracking-tight`
- Inline count after the title: `· {n}` if n > 0
- **Grid**: `grid grid-cols-1 md:grid-cols-2 gap-4`
- **Empty state** when n = 0: dashed-border card with `<CheckCircle />` icon and "All caught up — nothing to review."
- **Pending business card**: `rounded-2xl border bg-card shadow-sm p-5 flex flex-col gap-3`
  - Amber "Pending" status pill at the top: `rounded-full border-amber-200 bg-amber-50 text-amber-700 px-2.5 py-0.5 text-[11px] font-medium uppercase`
  - Business name in display serif: `font-display text-lg font-semibold leading-tight`
  - Description: `line-clamp-2 text-sm text-muted-foreground` (only shown if present)
  - Info rows (small text-xs muted-foreground, each with a coral lucide icon):
    - `<MapPin />` address
    - `<Phone />` phone
    - `<Globe />` website (with `https://` stripped)
  - Border-top divider: `border-t pt-3 mt-auto flex gap-2`
    - **Approve button**: coral primary (`bg-primary text-primary-foreground hover:bg-primary/90`), small size, in a `<form action={approveBusinessAction}>` with hidden businessId. Uses existing `Button` component.
    - **Reject button**: ghost variant (`variant="ghost"`), small size, in a `<form action={rejectBusinessAction}>` with hidden businessId. Existing `Button` component.

## Mobile

- Stat strip: 2 columns instead of 4
- Pending grid: 1 column instead of 2
- Header row stays — H1 and badge wrap if needed
- All responsive logic via Tailwind classes (`sm:`, `md:`). No JS, no media queries.

## Auth & Error Handling

- **Auth**: already enforced by `middleware.ts` (`/admin/:path*` matcher → redirects non-admins to `/login?from=/admin`). The existing `app/admin/layout.tsx` does a second `auth()` check as defense-in-depth and is unchanged.
- **`getAdminStats()`** also calls `requireAdmin()` (existing helper in `lib/admin-actions.ts`) so anyone bypassing the route gating still hits an error.
- **Empty pending list**: shows the friendly empty state, not an error.
- **DB errors**: bubble up to the existing root `app/error.tsx` boundary (already styled).

## Testing

Manual test plan, executed against the live preview after deploy:

| # | Step | Expected |
|---|---|---|
| 1 | Sign in as `admin@lompocdeals.test` / `admin123` | Redirect to home, header shows admin email |
| 2 | Click email → Admin link → land on `/admin` | New polished layout renders |
| 3 | Visually compare stat strip to `/dashboard/deals` stat cards | Same component, identical look |
| 4 | Cross-check stat numbers against `npm run db:studio` | All 4 counts match |
| 5 | If pending businesses exist, click Approve | Card disappears, page revalidates, business now visible publicly |
| 6 | If pending businesses exist, click Reject | Card disappears, business set to status='rejected' |
| 7 | If no pending, see "All caught up" empty state | Dashed card with check icon |
| 8 | Visit `/admin` on mobile width (DevTools) | Stat strip → 2 cols, business grid → 1 col |
| 9 | Sign out → visit `/admin` directly | Redirected to `/login?from=/admin` |
| 10 | Sign in as `owner@lompocdeals.test` (business role) → visit `/admin` | Redirected to `/login?from=/admin` |

No automated tests. The project has zero test infrastructure; adding a test framework is a scope expansion outside this design.

## Acceptance Criteria

- `/admin` visually matches the `/dashboard/*` family (same display serif, same StatCard component, same brand coral)
- 4 stat numbers are accurate at page-load time
- Approve / Reject still work end-to-end with no behavior changes
- Auth gating still works for unauthed and non-admin users
- No new dependencies, no new routes, no schema changes
- `npx tsc --noEmit` passes
- `next build` succeeds with no new lint errors

## What is explicitly NOT changing

- Database schema (no new columns, no new tables)
- Auth flow (same providers, same middleware, same role check)
- The "Admin: soft-delete" button on every public deal card (lives outside `/admin`, stays as-is)
- Any `/dashboard/*` behavior (only the import line in `dashboard/deals/page.tsx` changes for the StatCard refactor)
- Any public-facing page (`/`, `/biz/*`, `/category/*`, `/search`, `/map`, `/businesses`, `/subscribe`, `/favorites`)
- Server actions (`approveBusinessAction`, `rejectBusinessAction`) — wired exactly as today
