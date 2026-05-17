# Hours accuracy — design

*Date: 2026-05-17 · Goal: make every business's hours card accurate, trustworthy, and clearly attributed.*

## Background

Lompoc Deals is positioned as the local guide. Inaccurate hours erode that promise. Today, only **10 of 430 approved businesses (2.3%)** render hours correctly:

| State | Count | Why |
|---|---|---|
| Renders correctly | 10 | Canonical structured shape `{ mon: { open, close }, ... }` |
| Has data but doesn't render | 261 | Google Places scraper wrote `{ monday: "10 AM to 9:30 PM", ... }` — wrong shape, `parseHours()` rejects it |
| No hours | 159 | No data ever entered |

The scraper (`db/scrape-google-places.ts`) pulls from the Apify Google Maps actor and stored Google's raw text as-is. The runtime parser (`lib/hours.ts → parseHours`) only accepts the canonical `{ mon, tue, ... }` keys with `{ open, close }` values, so 261 rows of perfectly-good data are invisible.

Additionally, `isOpenNow` was evaluating in UTC, so a business with 11 AM–9 PM hours showed "Open now" at 7:35 AM Pacific. **This is fixed on `main` in commit `4c0dbfe`** — `isOpenNow` now uses `America/Los_Angeles` and handles cross-midnight ranges. The rest of this spec covers the data-shape problem.

## Goal & non-goals

**Goal:** every business with usable hours data shows a hours card with an accurate "Open now" / "Closed now" badge, and the data source is visible to the user.

**Non-goals:**
- Holiday / exception hours
- Seasonal (summer/winter) hour swaps
- Live refresh from Google Places Details API (parked — requires storing `google_place_id` first; we'll capture it during the scraper patch but defer the sync job)

## Source-of-truth model

Google-seeded with owner override. Source is recorded on every row.

- Google data is normalized and displayed with a "Hours from Google · updated X ago" caption that doubles as a soft CTA for business claims.
- Owner edits in the dashboard always win and never get overwritten by a re-sync.

## Schema

Add three columns to `businesses`:

| Column | Type | Notes |
|---|---|---|
| `hours_source` | `text` (nullable) | `'google'` \| `'owner'` \| `null`. Null = no data ever loaded. |
| `hours_synced_at` | `timestamptz` (nullable) | Set whenever Google data is written. Used by the caption to render "updated N days ago". |
| `google_place_id` | `text` (nullable, unique) | Captured by the scraper. Enables future per-business refresh via Places Details API without a full re-scrape. |

`hours_json` keeps its current shape and column. One additive change: a day value may now optionally carry a `raw` string (see Multi-range below).

```ts
// lib/hours.ts
export type DayHours =
  | { open: string; close: string }   // canonical
  | { raw: string }                   // multi-range or unparseable — display verbatim
  | null                              // closed
```

## Multi-range fallback

Real example from the DB — PNF Fitness Monday: `"9 to 10:30 AM, 5 to 8 PM"`. The schema is one open/close per day; we don't expand it. Instead:

1. The normalizer detects multi-range (presence of `,` or two AM/PM markers).
2. Writes `{ raw: "9–10:30 AM, 5–8 PM" }` for that day only.
3. `BusinessHours` renders the raw string verbatim in the day row.
4. `isOpenNow` returns `false` for any day rendered as raw — we can't reliably compute a single state.
5. The "Open now" / "Closed now" badge logic falls back to "Closed now" only if no other day is currently open; otherwise it follows the other days as normal.

This is honest: we surface the data but won't claim a state we can't verify.

## Normalizer (`lib/hours-normalizer.ts` — new)

Input: object with long-key string values like `{ monday: "10 AM to 9:30 PM", sunday: "Closed", ... }`.
Output: canonical `Hours` (`{ mon, tue, ..., sun }`).

Format variants to handle (drawn from the live data):

| Input | Output |
|---|---|
| `"10 AM to 9:30 PM"` | `{ open: "10:00", close: "21:30" }` |
| `"9 to 11 AM"` | `{ open: "09:00", close: "11:00" }` |
| `"Closed"` | `null` |
| `"Open 24 hours"` | `{ open: "00:00", close: "23:59" }` |
| `"9 to 10:30 AM, 5 to 8 PM"` | `{ raw: "9 to 10:30 AM, 5 to 8 PM" }` |
| `"24 horas"` / unrecognized | `{ raw: <original> }` |

Long → short key map: `monday → mon`, `tuesday → tue`, etc.

The normalizer is pure and unit-tested. No DB or network calls inside.

## One-time migration (`db/normalize-hours.ts` — new)

A standalone tsx script:

1. `SELECT id, hours_json, hours_source FROM businesses WHERE hours_json IS NOT NULL AND hours_source IS DISTINCT FROM 'owner';`
2. For each row, detect shape:
   - Already canonical (`hours_json->'mon'` is object) → set `hours_source='google'` + `hours_synced_at=NOW()` if not already set, leave data untouched.
   - String long-key format → run through normalizer, write canonical shape, set `hours_source='google'`, `hours_synced_at=NOW()`.
   - Other / unknown → log and skip.
3. Print a per-business summary (id, name, before → after) and a final tally.

Dry-run flag: `--dry-run` prints what would change without writing. Default behavior is to apply.

Run: `node --env-file=.env.local node_modules/.bin/tsx db/normalize-hours.ts`

Add an npm script: `"db:normalize-hours"`.

## Scraper patch (`db/scrape-google-places.ts`)

- Import and call `normalizeHoursFromGoogle()` before insert.
- Write canonical shape, not raw strings.
- Set `hours_source='google'`, `hours_synced_at=NOW()`.
- **Capture `google_place_id`** if the Apify response exposes it (it does — `placeId` field). Store in a new `businesses.google_place_id` column (also added in this migration). This unlocks future per-business refreshes via Places Details API without a full re-scrape.
- **Never overwrite rows where `hours_source='owner'`.** The existing dedup-by-slug check already skips re-inserts, but make the update path explicit: if a row exists with `hours_source='owner'`, leave hours untouched and only update other fields.

## Dashboard editor (`app/[locale]/dashboard/profile/profile-form.tsx`)

On save, set `hours_source='owner'` in the same update statement that writes `hours_json`. No UI changes. (The existing `HoursEditor` already produces the canonical shape.)

## Public display (`components/business-hours.tsx`)

Changes:
1. Per-day render: if `hours[day]` has `raw`, render the string verbatim in the right column.
2. Below the day grid, when `hours_source === 'google'`, show a caption:
   > *Hours from Google · updated {relative}. Business owner? [Claim & confirm](/businesses/claim?biz=…)*
   
   When `hours_source === 'owner'` or `null`, hide the caption.
3. The "Open now" / "Closed now" badge calls the existing `isOpenNow` (already returns false for raw days).

Translation keys added under `businesses.profile`:
- `hoursFromGoogle` — "Hours from Google · updated {date}"
- `hoursClaimCta` — "Business owner? Claim & confirm"

Both en + es.

## `lib/hours.ts` updates

- Extend `DayHours` type to include `{ raw: string }`.
- `formatHoursLine` returns `d.raw` directly when present.
- `isOpenNow`: when today is a raw-shape entry, treat as undetermined → skip the today check and only consider yesterday's cross-midnight carryover. Net effect: returns `false` for raw days (correct — we don't know).
- `parseHours`: continue rejecting unknown shapes (the normalizer is the only thing that writes raw shape, never the parser).

## Touched files

| File | Change |
|---|---|
| `db/schema.ts` | Add `hoursSource`, `hoursSyncedAt`, `googlePlaceId` columns |
| `db/migrations/<n>_hours_source_and_place_id.sql` | drizzle-generated migration |
| `lib/hours.ts` | Extend `DayHours`, update `formatHoursLine` + `isOpenNow` |
| `lib/hours-normalizer.ts` | **new** — Google text → canonical structured |
| `lib/hours-normalizer.test.ts` | **new** — variant coverage |
| `db/normalize-hours.ts` | **new** — one-time migration script |
| `db/scrape-google-places.ts` | Pipe through normalizer, capture place_id, set source/timestamp |
| `app/[locale]/dashboard/profile/profile-form.tsx` | Flip `hours_source='owner'` on save |
| `components/business-hours.tsx` | Render `raw` verbatim, show "Hours from Google" caption |
| `messages/en.json` + `messages/es.json` | Two new keys under `businesses.profile` |
| `package.json` | Add `db:normalize-hours` script |

## Verification

**Automated**
- Unit tests for `hours-normalizer` covering each format variant in the wild (Habit Burger, PNF Fitness, Explanada Lompoc, Tachito, etc.).

**Manual smoke (post-migration on staging or branch preview)**
1. Pali Wine Co. (already canonical) — badge still correct, no source caption.
2. Habit Burger (post-migration) — hours card renders, badge accurate, "Hours from Google" caption visible.
3. PNF Fitness (multi-range) — Monday + Wednesday show raw strings, other days normal, badge reflects only the days we can compute.
4. A null-hours business — no hours card at all (unchanged).
5. Dashboard: edit hours on any business, save, reload public page — caption disappears.

**Counts**
After the migration, expect:
- `~261` rows now render correctly (was 0 → ~261 minus a small unparseable tail)
- `~10` rows untouched
- `~159` rows still no hours (unchanged — that's the next problem)

## Out of scope (parked)

- Holiday / exception hours
- Seasonal hour swaps
- A scheduled cron that refreshes hours from Places Details API. We capture `google_place_id` in this work so it's straightforward to add later.
- Backfilling the 159 businesses with no hours data (separate effort — likely an owner-claim campaign or a re-scrape with broader search queries).
