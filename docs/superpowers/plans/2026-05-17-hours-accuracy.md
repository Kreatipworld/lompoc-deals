# Hours Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every approved business with usable hours data render an accurate "Open now" badge and show where the data came from, fixing 261 currently-invisible Google-scraped rows.

**Architecture:** Google-seeded with owner overrides. A normalizer converts Google's raw text strings into the app's canonical `{ open, close }` shape, with multi-range days falling back to a verbatim string. Source attribution is tracked on each business row so re-syncs never trample owner edits.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM, Neon Postgres (`twilight-boat-62678930`), next-intl. No test runner currently installed — smoke tests run via tsx + node:assert.

**Reference spec:** `docs/superpowers/specs/2026-05-17-hours-accuracy-design.md`

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `db/schema.ts` | Modify | Add `hoursSource`, `hoursSyncedAt`, `googlePlaceId` columns to `businesses` |
| `db/migrations/0017_business_hours_meta.sql` | Create (via drizzle-kit) | SQL migration for the three columns + unique index on place_id |
| `lib/hours.ts` | Modify | Extend `DayHours` with `{ raw: string }` shape; update `formatHoursLine` and `isOpenNow` |
| `lib/hours-normalizer.ts` | Create | Pure function: Google text input → canonical `Hours` output |
| `db/test-hours-normalizer.ts` | Create | Smoke test using `node:assert` — runs via tsx |
| `db/normalize-hours.ts` | Create | One-time migration script, walks rows, writes canonical shape + source/timestamp |
| `lib/biz-actions.ts` | Modify | Set `hoursSource: 'owner'` on profile save |
| `db/scrape-google-places.ts` | Modify | Pipe Google text through normalizer; capture `placeId`; set source/timestamp |
| `components/business-hours.tsx` | Modify | Render `raw` lines verbatim; show "Hours from Google · updated N days ago" caption |
| `messages/en.json` | Modify | Add `businesses.profile.hoursFromGoogle`, `hoursClaimCta` |
| `messages/es.json` | Modify | Same keys, Spanish |
| `package.json` | Modify | Add `db:normalize-hours` and `test:hours-normalizer` scripts |

---

## Task 1: Schema — add `hours_source`, `hours_synced_at`, `google_place_id`

**Files:**
- Modify: `db/schema.ts` (businesses table block, after line 96)
- Create: `db/migrations/0017_business_hours_meta.sql` (auto-generated)

- [ ] **Step 1: Edit schema**

Open `db/schema.ts`. Find the `businesses` table (around line 79). After the `hoursJson` line (96), insert:

```ts
    hoursSource: text("hours_source"), // 'google' | 'owner' | null
    hoursSyncedAt: timestamp("hours_synced_at", { withTimezone: true }),
    googlePlaceId: varchar("google_place_id", { length: 255 }),
```

In the table's index callback (around line 116), add a unique index on the new column:

```ts
  (t) => ({
    slugIdx: uniqueIndex("businesses_slug_idx").on(t.slug),
    googlePlaceIdIdx: uniqueIndex("businesses_google_place_id_idx").on(t.googlePlaceId),
  })
```

- [ ] **Step 2: Generate the migration**

```bash
npm run db:generate
```

Expected: a new file `db/migrations/0017_*.sql` containing `ALTER TABLE businesses ADD COLUMN hours_source TEXT;` plus the two other columns and the unique index.

- [ ] **Step 3: Rename the migration file**

Rename whatever drizzle-kit produced to `db/migrations/0017_business_hours_meta.sql`. Update `db/migrations/meta/_journal.json` if drizzle wrote a name there — adjust the `tag` field for entry index 17 to `0017_business_hours_meta`.

- [ ] **Step 4: Apply the migration**

```bash
npm run db:push
```

Expected output: drizzle reports 3 columns added, 1 unique index created, no data loss.

- [ ] **Step 5: Verify in DB**

Run via Neon MCP (`run_sql` with `projectId: twilight-boat-62678930`):

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name IN ('hours_source','hours_synced_at','google_place_id');
```

Expected: 3 rows returned. `hours_source` = text, `hours_synced_at` = timestamp with time zone, `google_place_id` = character varying.

- [ ] **Step 6: Commit**

```bash
git add db/schema.ts db/migrations/0017_business_hours_meta.sql db/migrations/meta/
git commit -m "feat(db): add hours source/synced_at + google_place_id to businesses"
```

---

## Task 2: Extend `DayHours` type and helpers in `lib/hours.ts`

**Files:**
- Modify: `lib/hours.ts`

- [ ] **Step 1: Update the type and helpers**

Open `lib/hours.ts`. Replace the existing file contents with:

```ts
export type CanonicalDayHours = { open: string; close: string }
export type RawDayHours = { raw: string }
export type DayHours = CanonicalDayHours | RawDayHours | null

export type Hours = {
  mon: DayHours
  tue: DayHours
  wed: DayHours
  thu: DayHours
  fri: DayHours
  sat: DayHours
  sun: DayHours
}

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
export const DAY_LABELS: Record<keyof Hours, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
}

export function emptyHours(): Hours {
  return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null }
}

export function isCanonical(d: DayHours): d is CanonicalDayHours {
  return d !== null && "open" in d && "close" in d
}

export function isRaw(d: DayHours): d is RawDayHours {
  return d !== null && "raw" in d
}

/** "09:00" → "9:00 AM"; "17:30" → "5:30 PM" */
export function format12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h >= 12 ? "PM" : "AM"
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${m.toString().padStart(2, "0")} ${period}`
}

export function formatHoursLine(d: DayHours): string {
  if (d === null) return "Closed"
  if (isRaw(d)) return d.raw
  return `${format12h(d.open)} – ${format12h(d.close)}`
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

/** Determine if a business is open right now in Lompoc's timezone. Handles ranges that cross midnight. Returns false for raw-shape days (can't compute). */
export function isOpenNow(hours: Hours | null | undefined): boolean {
  if (!hours) return false
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date())

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? ""
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "NaN", 10)
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "NaN", 10)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false

  const weekdayMap: Record<string, keyof Hours> = {
    Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat",
  }
  const todayKey = weekdayMap[weekday]
  if (!todayKey) return false
  const todayIdx = DAY_KEYS.indexOf(todayKey)
  const yesterdayKey = DAY_KEYS[(todayIdx + DAY_KEYS.length - 1) % DAY_KEYS.length]
  const cur = (hour % 24) * 60 + minute

  const today = hours[todayKey]
  if (isCanonical(today)) {
    const open = toMinutes(today.open)
    const close = toMinutes(today.close)
    if (!Number.isNaN(open) && !Number.isNaN(close)) {
      if (close > open) {
        if (cur >= open && cur < close) return true
      } else if (close < open) {
        if (cur >= open) return true
      }
    }
  }

  const yesterday = hours[yesterdayKey]
  if (isCanonical(yesterday)) {
    const open = toMinutes(yesterday.open)
    const close = toMinutes(yesterday.close)
    if (!Number.isNaN(open) && !Number.isNaN(close) && close < open) {
      if (cur < close) return true
    }
  }

  return false
}

/** Coerce unknown JSON into canonical Hours. Accepts existing canonical shape AND raw-shape entries. Unknown shapes → null per day. */
export function parseHours(json: unknown): Hours {
  const out = emptyHours()
  if (!json || typeof json !== "object") return out
  const obj = json as Record<string, unknown>
  for (const k of DAY_KEYS) {
    const v = obj[k]
    if (v && typeof v === "object") {
      const vo = v as Record<string, unknown>
      if (typeof vo.open === "string" && typeof vo.close === "string") {
        out[k] = { open: vo.open, close: vo.close }
      } else if (typeof vo.raw === "string") {
        out[k] = { raw: vo.raw }
      }
    }
  }
  return out
}
```

- [ ] **Step 2: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: clean exit, no errors. (`profile-form.tsx`, `business-hours.tsx`, and `biz-actions.ts` currently use `DayHours` and `parseHours` — they'll keep compiling because canonical shape narrowing still works.)

- [ ] **Step 3: Commit**

```bash
git add lib/hours.ts
git commit -m "feat(hours): extend DayHours with raw-string shape for multi-range days"
```

---

## Task 3: Build the Google-text normalizer + smoke test

**Files:**
- Create: `lib/hours-normalizer.ts`
- Create: `db/test-hours-normalizer.ts`
- Modify: `package.json` (add `test:hours-normalizer` script)

- [ ] **Step 1: Create the normalizer**

Create `lib/hours-normalizer.ts`:

```ts
import { DAY_KEYS, emptyHours, type DayHours, type Hours } from "./hours"

const LONG_TO_SHORT: Record<string, keyof Hours> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sunday: "sun",
}

/** Parse a single Google-text day value (e.g. "10 AM to 9:30 PM") into a DayHours. */
export function parseDayString(input: string): DayHours {
  const s = input.trim()
  if (!s) return null

  // Closed
  if (/^closed$/i.test(s)) return null

  // 24 hours
  if (/open\s+24\s+hours/i.test(s) || /24\s*hours/i.test(s)) {
    return { open: "00:00", close: "23:59" }
  }

  // Multi-range (comma OR two separate "to" connectors) — preserve verbatim
  const toCount = (s.match(/\bto\b/gi) || []).length
  if (s.includes(",") || toCount > 1) {
    return { raw: s }
  }

  // Single range: "<start> to <end>"
  const m = s.match(/^(.+?)\s+to\s+(.+)$/i)
  if (!m) return { raw: s }

  const startRaw = m[1].trim()
  const endRaw = m[2].trim()

  // Determine end period (AM/PM) from the end side
  const endPeriod = /pm/i.test(endRaw) ? "PM" : /am/i.test(endRaw) ? "AM" : null
  if (!endPeriod) return { raw: s }

  const startPeriodMatch = /am|pm/i.exec(startRaw)
  const startPeriod = startPeriodMatch ? startPeriodMatch[0].toUpperCase() : endPeriod

  const start = parseClock(startRaw, startPeriod)
  const end = parseClock(endRaw, endPeriod)
  if (!start || !end) return { raw: s }

  return { open: start, close: end }
}

/** Parse "10", "10:30", "9 AM", "9:30 PM" with explicit period. */
function parseClock(input: string, period: string): string | null {
  const cleaned = input.replace(/am|pm/gi, "").trim()
  const m = cleaned.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const minute = m[2] ? parseInt(m[2], 10) : 0
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null

  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}

/** Normalize a Google-text hours object (long keys with string values) into canonical Hours. */
export function normalizeGoogleHours(input: unknown): Hours {
  const out = emptyHours()
  if (!input || typeof input !== "object") return out
  const obj = input as Record<string, unknown>

  for (const [longKey, shortKey] of Object.entries(LONG_TO_SHORT)) {
    const v = obj[longKey]
    if (typeof v === "string") {
      out[shortKey] = parseDayString(v)
    }
  }

  // If nothing populated, leave the empty hours object (caller decides what to do).
  void DAY_KEYS
  return out
}
```

- [ ] **Step 2: Create the smoke test**

Create `db/test-hours-normalizer.ts`:

```ts
import assert from "node:assert/strict"
import { parseDayString, normalizeGoogleHours } from "../lib/hours-normalizer"

let passed = 0
let failed = 0

function check(label: string, actual: unknown, expected: unknown) {
  try {
    assert.deepEqual(actual, expected)
    console.log(`  ok  ${label}`)
    passed++
  } catch (e) {
    console.log(`  FAIL ${label}`)
    console.log(`       expected: ${JSON.stringify(expected)}`)
    console.log(`       actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

console.log("parseDayString:")
check("10 AM to 9:30 PM", parseDayString("10 AM to 9:30 PM"), { open: "10:00", close: "21:30" })
check("9 to 11 AM",        parseDayString("9 to 11 AM"),        { open: "09:00", close: "11:00" })
check("11 AM to 10 PM",    parseDayString("11 AM to 10 PM"),    { open: "11:00", close: "22:00" })
check("5 PM to 2 AM",      parseDayString("5 PM to 2 AM"),      { open: "17:00", close: "02:00" })
check("Closed",            parseDayString("Closed"),            null)
check("closed",            parseDayString("closed"),            null)
check("Open 24 hours",     parseDayString("Open 24 hours"),     { open: "00:00", close: "23:59" })
check("multi-range comma", parseDayString("9 to 10:30 AM, 5 to 8 PM"), { raw: "9 to 10:30 AM, 5 to 8 PM" })
check("empty string",      parseDayString(""),                  null)
check("nonsense",          parseDayString("ask staff"),         { raw: "ask staff" })
check("midnight close",    parseDayString("12 PM to 12 AM"),    { open: "12:00", close: "00:00" })

console.log("\nnormalizeGoogleHours:")
const habit = normalizeGoogleHours({
  monday: "10 AM to 9:30 PM",
  tuesday: "10 AM to 9:30 PM",
  wednesday: "10 AM to 9:30 PM",
  thursday: "10 AM to 9:30 PM",
  friday: "10 AM to 10 PM",
  saturday: "10 AM to 10 PM",
  sunday: "10 AM to 9:30 PM",
})
check("Habit Burger Mon",  habit.mon, { open: "10:00", close: "21:30" })
check("Habit Burger Fri",  habit.fri, { open: "10:00", close: "22:00" })

const pnf = normalizeGoogleHours({
  monday: "9 to 10:30 AM, 5 to 8 PM",
  tuesday: "5:30 to 8 PM",
  friday: "Closed",
})
check("PNF Fitness Mon",   pnf.mon, { raw: "9 to 10:30 AM, 5 to 8 PM" })
check("PNF Fitness Tue",   pnf.tue, { open: "17:30", close: "20:00" })
check("PNF Fitness Fri",   pnf.fri, null)

const explanada = normalizeGoogleHours({ sunday: "Open 24 hours", monday: "Closed" })
check("Explanada Sun",     explanada.sun, { open: "00:00", close: "23:59" })

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
```

- [ ] **Step 3: Add test script to package.json**

Open `package.json`. In the `"scripts"` block, add:

```json
    "test:hours-normalizer": "node --env-file=.env.local node_modules/.bin/tsx db/test-hours-normalizer.ts",
```

(No `--env-file` is strictly needed since the test doesn't touch the DB, but keep the pattern consistent with the other scripts.)

- [ ] **Step 4: Run the smoke test**

```bash
npm run test:hours-normalizer
```

Expected output: all 16 checks pass, exit code 0, last line `16 passed, 0 failed`.

If any fail, fix the normalizer until all pass.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean exit.

- [ ] **Step 6: Commit**

```bash
git add lib/hours-normalizer.ts db/test-hours-normalizer.ts package.json
git commit -m "feat(hours): add Google text → canonical normalizer with smoke tests"
```

---

## Task 4: Write the one-time migration script and run it

**Files:**
- Create: `db/normalize-hours.ts`
- Modify: `package.json` (add `db:normalize-hours` script)

- [ ] **Step 1: Create the migration script**

Create `db/normalize-hours.ts`:

```ts
import { db } from "./client"
import { businesses } from "./schema"
import { eq, isNotNull, ne, or, isNull, and } from "drizzle-orm"
import { normalizeGoogleHours } from "../lib/hours-normalizer"
import type { Hours } from "../lib/hours"

const DRY_RUN = process.argv.includes("--dry-run")

function isAlreadyCanonical(hoursJson: unknown): boolean {
  if (!hoursJson || typeof hoursJson !== "object") return false
  const obj = hoursJson as Record<string, unknown>
  return typeof obj.mon === "object" || typeof obj.tue === "object" || typeof obj.wed === "object"
}

function isLongKeyString(hoursJson: unknown): boolean {
  if (!hoursJson || typeof hoursJson !== "object") return false
  const obj = hoursJson as Record<string, unknown>
  return typeof obj.monday === "string" || typeof obj.tuesday === "string" || typeof obj.sunday === "string"
}

async function main() {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      hoursJson: businesses.hoursJson,
      hoursSource: businesses.hoursSource,
    })
    .from(businesses)
    .where(
      and(
        isNotNull(businesses.hoursJson),
        or(isNull(businesses.hoursSource), ne(businesses.hoursSource, "owner"))
      )
    )

  console.log(`Found ${rows.length} candidate rows${DRY_RUN ? " (dry run)" : ""}`)

  let converted = 0
  let alreadyCanonical = 0
  let skipped = 0
  const now = new Date()

  for (const row of rows) {
    if (isAlreadyCanonical(row.hoursJson)) {
      if (!DRY_RUN) {
        await db
          .update(businesses)
          .set({ hoursSource: "google", hoursSyncedAt: now })
          .where(eq(businesses.id, row.id))
      }
      alreadyCanonical++
      continue
    }

    if (isLongKeyString(row.hoursJson)) {
      const normalized: Hours = normalizeGoogleHours(row.hoursJson)
      console.log(`  #${row.id} ${row.name}`)
      if (!DRY_RUN) {
        await db
          .update(businesses)
          .set({ hoursJson: normalized, hoursSource: "google", hoursSyncedAt: now })
          .where(eq(businesses.id, row.id))
      }
      converted++
      continue
    }

    console.log(`  SKIP #${row.id} ${row.name} — unrecognized shape`)
    skipped++
  }

  console.log("")
  console.log(`Converted:        ${converted}`)
  console.log(`Already canonical: ${alreadyCanonical}`)
  console.log(`Skipped:          ${skipped}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Add npm script**

Open `package.json`. In `"scripts"` add:

```json
    "db:normalize-hours": "node --env-file=.env.local node_modules/.bin/tsx db/normalize-hours.ts",
```

- [ ] **Step 3: Dry-run first**

```bash
npm run db:normalize-hours -- --dry-run
```

Expected: prints `Found ~271 candidate rows (dry run)`, lists ~261 businesses being converted, ~10 already canonical, ~0 skipped. No DB writes happen.

If "Skipped" is more than ~5, inspect those rows manually before continuing — there may be an unrecognized shape that needs normalizer coverage.

- [ ] **Step 4: Apply for real**

```bash
npm run db:normalize-hours
```

Expected counts match the dry-run.

- [ ] **Step 5: Verify with SQL**

Run via Neon MCP (`projectId: twilight-boat-62678930`):

```sql
SELECT
  COUNT(*) FILTER (WHERE hours_source = 'google') AS google_sourced,
  COUNT(*) FILTER (WHERE hours_source = 'owner')  AS owner_sourced,
  COUNT(*) FILTER (WHERE hours_source IS NULL AND hours_json IS NOT NULL) AS unsourced_with_data,
  COUNT(*) FILTER (WHERE jsonb_typeof(hours_json->'mon') = 'object') AS canonical_shape,
  COUNT(*) FILTER (WHERE jsonb_typeof(hours_json->'monday') = 'string') AS still_long_string
FROM businesses
WHERE status = 'approved';
```

Expected: `google_sourced ≈ 271`, `still_long_string = 0`, `canonical_shape ≈ 271 minus a small unparseable tail`.

- [ ] **Step 6: Spot-check a few rows**

```sql
SELECT id, name, hours_json, hours_source, hours_synced_at
FROM businesses
WHERE name IN ('Habit Burger & Grill', 'PNF Fitness', 'Explanada Lompoc', 'Pali Wine Co.');
```

Expected:
- Habit Burger: hours like `{ mon: { open: "10:00", close: "21:30" }, ... }`, `hours_source = 'google'`
- PNF Fitness: Monday `{ raw: "9 to 10:30 AM, 5 to 8 PM" }`, Tuesday canonical `{ open: "17:30", close: "20:00" }`
- Explanada Lompoc: Sunday `{ open: "00:00", close: "23:59" }`
- Pali Wine Co.: untouched canonical shape, but now has `hours_source = 'google'`

- [ ] **Step 7: Commit**

```bash
git add db/normalize-hours.ts package.json
git commit -m "chore(hours): one-time migration script — Google text → canonical shape"
```

---

## Task 5: Mark dashboard saves as owner-sourced

**Files:**
- Modify: `lib/biz-actions.ts` (around lines 162 and 181)

- [ ] **Step 1: Update both write paths**

Open `lib/biz-actions.ts`. Find the `db.update(businesses).set({ ... hoursJson: hoursPayload, ... })` block (around line 162). Add `hoursSource: 'owner'` and `hoursSyncedAt: null` to the set object:

```ts
        hoursJson: hoursPayload,
        hoursSource: "owner",
        hoursSyncedAt: null,
```

Find the `db.insert(businesses).values({ ... hoursJson: hoursPayload, ... })` block (around line 181). Add the same two fields:

```ts
        hoursJson: hoursPayload,
        hoursSource: "owner",
        hoursSyncedAt: null,
```

Setting `hoursSyncedAt: null` is intentional — the owner's data isn't from a Google sync, so we clear the timestamp.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Manual smoke** (this requires running the dev server)

```bash
npm run dev
```

In another shell, log in as a business owner (or use the seeded admin), navigate to `/en/dashboard/profile`, edit any hours field, save. Then in the DB:

```sql
SELECT id, name, hours_source, hours_synced_at FROM businesses WHERE id = <the id you edited>;
```

Expected: `hours_source = 'owner'`, `hours_synced_at = NULL`.

Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add lib/biz-actions.ts
git commit -m "feat(hours): flip hours_source to 'owner' on dashboard save"
```

---

## Task 6: Patch the scraper to normalize + capture place_id

**Files:**
- Modify: `db/scrape-google-places.ts`

- [ ] **Step 1: Read what the scraper currently does with hours**

```bash
grep -n "openingHours\|hours\|placeId" db/scrape-google-places.ts | head -30
```

Note the line numbers where Google's `openingHours` field is read and where the `db.insert(businesses).values(...)` call happens. The exact lines vary, so adapt the next step's edit context accordingly.

- [ ] **Step 2: Import the normalizer**

At the top of `db/scrape-google-places.ts`, add the import alongside the existing imports:

```ts
import { normalizeGoogleHours } from "../lib/hours-normalizer"
```

- [ ] **Step 3: Convert the hours payload before insert**

Find the section that maps a Google Maps result into a `businesses` row. Wherever it currently builds the `hoursJson` value from `openingHours`, replace that logic so it runs through the normalizer. The pattern should look like:

```ts
// Before — depends on current implementation, something like:
//   hoursJson: result.openingHours ?? null,
// After:
const hoursLongKeyShape: Record<string, string> = {}
for (const day of result.openingHours ?? []) {
  // The Apify Google Maps actor returns openingHours as an array of
  // { day: "Monday", hours: "10 AM to 9:30 PM" } objects. Convert to the
  // long-key string shape the normalizer expects.
  if (day && typeof day.day === "string" && typeof day.hours === "string") {
    hoursLongKeyShape[day.day.toLowerCase()] = day.hours
  }
}
const normalizedHours = Object.keys(hoursLongKeyShape).length > 0
  ? normalizeGoogleHours(hoursLongKeyShape)
  : null

// In the insert values:
hoursJson: normalizedHours,
hoursSource: normalizedHours ? "google" : null,
hoursSyncedAt: normalizedHours ? new Date() : null,
googlePlaceId: result.placeId ?? null,
```

If the actor's response shape is different from `{ day, hours }`, adjust accordingly. Inspect any cached run output in the repo or run a small test fetch to confirm. If `placeId` isn't on `result` either, look for `place_id`, `id`, or `cid`.

- [ ] **Step 4: Guard against overwriting owner-edited rows**

Find the conditional that decides whether to insert vs skip (the existing dedup by slug). Ensure that when a slug already exists, the code path does NOT update `hoursJson`, `hoursSource`, or `hoursSyncedAt`. If the existing code already only inserts (never updates), nothing to do. If it updates other fields, exclude the hours fields from the update.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Do not re-run the scraper now**

This task only patches the code path for future runs. Re-running now would attempt fresh Apify scrapes (costs credits, may shift slug matches). The one-time migration in Task 4 already cleaned the existing rows.

- [ ] **Step 7: Commit**

```bash
git add db/scrape-google-places.ts
git commit -m "feat(scraper): normalize hours + capture place_id; respect owner edits"
```

---

## Task 7: Render `raw` lines and add the "Hours from Google" caption

**Files:**
- Modify: `components/business-hours.tsx`
- Modify: `messages/en.json`
- Modify: `messages/es.json`
- Modify: `app/[locale]/(public)/biz/[slug]/page.tsx` (pass new props)

- [ ] **Step 1: Verify the page passes source + synced_at**

Open `app/[locale]/(public)/biz/[slug]/page.tsx`. Find where `<BusinessHours ... />` is rendered. Currently it should only pass `hoursJson`. We need it to also pass `hoursSource` and `hoursSyncedAt`. Find the surrounding query that fetches the business — confirm the returned object includes these fields. Drizzle's full-row select will include them automatically since they're now columns; if the query uses a `select({ ... })` projection, add `hoursSource: businesses.hoursSource, hoursSyncedAt: businesses.hoursSyncedAt` to it.

Then update the JSX:

```tsx
<BusinessHours
  hoursJson={biz.hoursJson}
  hoursSource={biz.hoursSource}
  hoursSyncedAt={biz.hoursSyncedAt}
/>
```

If the data is fetched through `lib/queries.ts → getBusinessBySlug`, check that file too and ensure the projection includes the two new fields.

- [ ] **Step 2: Update `BusinessHours` props and rendering**

Open `components/business-hours.tsx`. Replace the file with:

```tsx
import { Clock } from "lucide-react"
import {
  DAY_KEYS,
  DAY_LABELS,
  formatHoursLine,
  isOpenNow,
  isRaw,
  parseHours,
} from "@/lib/hours"
import { getTranslations, getFormatter } from "next-intl/server"

interface Props {
  hoursJson: unknown
  hoursSource?: string | null
  hoursSyncedAt?: Date | string | null
}

export async function BusinessHours({ hoursJson, hoursSource, hoursSyncedAt }: Props) {
  const hours = parseHours(hoursJson)
  const open = isOpenNow(hours)
  const t = await getTranslations("businesses.profile")
  const format = await getFormatter()

  const anyDay = DAY_KEYS.some((k) => hours[k] !== null)
  if (!anyDay) return null

  const showGoogleCaption = hoursSource === "google" && hoursSyncedAt
  const syncedDate = showGoogleCaption
    ? typeof hoursSyncedAt === "string"
      ? new Date(hoursSyncedAt)
      : hoursSyncedAt!
    : null

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {t("hours")}
        </h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            open
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-muted-foreground/20 bg-muted text-muted-foreground"
          }`}
        >
          {open ? t("openNow") : t("closedNow")}
        </span>
      </div>
      <ul className="space-y-1 text-sm">
        {DAY_KEYS.map((k) => (
          <li key={k} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{DAY_LABELS[k]}</span>
            <span
              className={
                hours[k]
                  ? isRaw(hours[k]!)
                    ? "text-foreground text-right text-[13px] italic"
                    : "text-foreground"
                  : "text-muted-foreground/60"
              }
            >
              {formatHoursLine(hours[k])}
            </span>
          </li>
        ))}
      </ul>
      {showGoogleCaption && syncedDate && (
        <p className="mt-3 border-t pt-2 text-[11px] leading-snug text-muted-foreground">
          {t("hoursFromGoogle", { date: format.relativeTime(syncedDate) })}{" "}
          <span className="text-muted-foreground/80">· {t("hoursClaimCta")}</span>
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add the EN translation keys**

Open `messages/en.json`. Find `"businesses": { "profile": { ... } }` (search for `"openNow"`). Inside that `"profile"` block, add:

```json
    "hoursFromGoogle": "Hours from Google · updated {date}",
    "hoursClaimCta": "Business owner? Claim & confirm",
```

- [ ] **Step 4: Add the ES translation keys**

Open `messages/es.json`. Inside `businesses.profile`, add:

```json
    "hoursFromGoogle": "Horarios de Google · actualizado {date}",
    "hoursClaimCta": "¿Eres el propietario? Reclama y confirma",
```

- [ ] **Step 5: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Both expected clean.

- [ ] **Step 6: Build to catch RSC/translation issues**

```bash
npm run build
```

Expected: build succeeds. Watch for missing-translation warnings in the output — fix any that reference the new keys.

- [ ] **Step 7: Commit**

```bash
git add components/business-hours.tsx messages/en.json messages/es.json app/[locale]/\(public\)/biz/\[slug\]/page.tsx
git commit -m "feat(hours): render raw multi-range days + Google source caption"
```

If `lib/queries.ts` was also edited in Step 1, include it in the `git add`.

---

## Task 8: End-to-end verification on preview deploy

**Files:** none (verification only)

- [ ] **Step 1: Push to a branch and trigger preview**

```bash
git push origin HEAD:feat/hours-accuracy
```

Wait for Vercel to build (~1–2 min). Find the preview URL:

```bash
vercel ls --yes | head -3
```

- [ ] **Step 2: Verify Pali Wine Co.**

Visit `<preview-url>/en/biz/pali-wine-co`. Check at current Pacific time:
- If before 11 AM Pacific or after 9 PM: badge shows "Closed now" (gray pill).
- Otherwise: "Open now" (green pill).
- Caption: "Hours from Google · updated …" (this row got a fresh timestamp in Task 4).

- [ ] **Step 3: Verify Habit Burger & Grill**

Visit `<preview-url>/en/biz/<habit-burger-slug>` (slug from DB if unsure). Expect:
- Hours card now renders (previously did not).
- Mon–Thu 10 AM – 9:30 PM, Fri/Sat 10 AM – 10 PM, Sun 10 AM – 9:30 PM.
- "Hours from Google · updated …" caption visible.

- [ ] **Step 4: Verify PNF Fitness (multi-range)**

Visit `<preview-url>/en/biz/<pnf-fitness-slug>`. Expect:
- Monday row shows the raw string italicized: "9 to 10:30 AM, 5 to 8 PM".
- Tuesday row shows canonical "5:30 PM – 8:00 PM".
- Badge state depends on the other days for current time.

- [ ] **Step 5: Verify a null-hours business**

Find one: `SELECT slug FROM businesses WHERE hours_json IS NULL AND status='approved' LIMIT 1;`. Visit its public page. Expect: no hours card rendered (entire `BusinessHours` returns null).

- [ ] **Step 6: Verify dashboard override flips source**

Log in as a business owner with `hours_source = 'google'`. Open `/en/dashboard/profile`, change any single open time by 1 minute, save. Reload the public page for that business. Expect: caption disappears (because source is now `'owner'`).

- [ ] **Step 7: Verify Spanish locale**

Visit `<preview-url>/es/biz/pali-wine-co`. Expect: "Horarios de Google · actualizado …" caption in Spanish.

- [ ] **Step 8: Merge to main**

If all checks pass:

```bash
git checkout main
git pull --ff-only
git merge --ff-only feat/hours-accuracy
git push origin main
```

Wait for the production deploy. Re-verify Pali Wine Co. on `https://lompoc-deals.vercel.app`.

- [ ] **Step 9: Clean up the branch**

```bash
git branch -d feat/hours-accuracy
git push origin --delete feat/hours-accuracy
```
