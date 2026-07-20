# Coupon Redemption & Control System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every customer their own single-use coupon code, let staff verify and redeem it at the counter, and make the redemption number a business sees mean "actually honored at the register."

**Architecture:** A new `coupon_claims` table holds one row per customer-per-coupon with a unique random code, guarded by two database-level constraints (unique code, unique `(dealId, userId)`). Pure helpers (code generation, cap evaluation) are unit-tested without a DB. Server actions wrap them for the claim flow and the staff redeem console. Reporting switches from self-reported events to verified rows.

**Tech Stack:** TypeScript, Next.js 14 App Router, Drizzle ORM + Neon Postgres, Auth.js v5 (`auth()` from `@/auth`), next-intl, `node:assert` tests via `tsx`.

## Global Constraints

- **No revenue capture of any kind.** No sale amounts, no average-ticket inputs, no estimated revenue, no ROI figures — not in the schema, the UI, or the reporting. Counts and rates only. This is a firm spec boundary (see `docs/superpowers/specs/2026-07-20-coupon-redemption-design.md`).
- **Discovery stays public.** Deal title, photo, description, business, and the discount value (`discountText`) remain visible to logged-out visitors. **Only the code requires sign-in.** Never gate a deal page behind auth.
- Code alphabet is exactly `23456789ABCDEFGHJKMNPQRSTVWXYZ` (30 chars — no `O`/`0`, no `I`/`1`, no `L`, no `U`), length **6**.
- **Ownership check on every lookup and redemption**: a business may only see/redeem codes belonging to its own deals. A code from another business must return "not found" — never reveal that it exists elsewhere.
- All caps are enforced at **claim** time, not redemption time. Expiry is additionally re-checked at the counter.
- Day boundaries for the per-day cap use timezone `America/Los_Angeles`.
- Redemption is **idempotent** — re-submitting an already-redeemed code reports "already used" and never double-counts.
- Tests: `node --env-file=.env.local node_modules/.bin/tsx <file>` (repo convention, plain `node:assert`).
- Bilingual: every user-facing string goes in `messages/en.json` **and** `messages/es.json` with identical keys.

---

## File Structure

- **Create** `lib/coupon-code.ts` — pure code generator + format helper.
- **Create** `lib/coupon-code.test.ts`
- **Modify** `db/schema.ts` — `couponClaimStatus` enum, `couponClaims` table, two new `deals` columns.
- **Create** `lib/coupon-limits.ts` — pure cap evaluation (no DB).
- **Create** `lib/coupon-limits.test.ts`
- **Create** `lib/coupon-actions.ts` — `claimCouponAction` (customer side).
- **Create** `lib/coupon-redeem-actions.ts` — `lookupCouponAction`, `redeemCouponAction` (staff side).
- **Modify** `app/[locale]/(public)/deals/[id]/claim/page.tsx` — sign-in gate on the code only.
- **Create** `app/[locale]/dashboard/coupons/page.tsx` — staff redeem console.
- **Create** `components/redeem-console.tsx` — client form for code entry.
- **Modify** `app/[locale]/dashboard/layout.tsx` — nav link.
- **Modify** `lib/funnel-queries.ts` — redeems come from verified claims.
- **Modify** `messages/en.json`, `messages/es.json`.

**Phases (each independently shippable):**
- **Phase 1 — Tasks 1–5:** customers get real, unique, single-use codes.
- **Phase 2 — Tasks 6–7:** staff can verify and redeem at the counter.
- **Phase 3 — Tasks 8–9:** caps configurable by the business + verified measurement.

---

### Task 1: Coupon code generator

**Files:**
- Create: `lib/coupon-code.ts`
- Test: `lib/coupon-code.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const COUPON_ALPHABET: string
  export const COUPON_CODE_LENGTH: number
  export function generateCouponCode(): string
  export function normalizeCouponCode(input: string): string
  ```
  `normalizeCouponCode` upper-cases, strips whitespace/dashes, and maps commonly-confused characters typed by staff (`O`→`0`? **no** — see below) so a human transcription still matches.

- [ ] **Step 1: Write the failing test**

Create `lib/coupon-code.test.ts`:

```ts
import assert from "node:assert/strict"
import {
  COUPON_ALPHABET,
  COUPON_CODE_LENGTH,
  generateCouponCode,
  normalizeCouponCode,
} from "./coupon-code"

// alphabet excludes visually ambiguous characters
for (const bad of ["O", "0", "I", "1", "L", "U"]) {
  assert.ok(!COUPON_ALPHABET.includes(bad), `alphabet must not contain ambiguous "${bad}"`)
}
assert.equal(COUPON_ALPHABET.length, 30, "alphabet is 30 unambiguous characters")
assert.equal(COUPON_CODE_LENGTH, 6)

// generated codes are well-formed and drawn only from the alphabet
for (let i = 0; i < 200; i++) {
  const code = generateCouponCode()
  assert.equal(code.length, COUPON_CODE_LENGTH, "correct length")
  for (const ch of code) {
    assert.ok(COUPON_ALPHABET.includes(ch), `"${ch}" must come from the alphabet`)
  }
}

// codes vary (collision-resistant enough to be worth a unique index)
const many = new Set(Array.from({ length: 500 }, () => generateCouponCode()))
assert.ok(many.size > 490, `codes should rarely repeat (got ${many.size}/500 distinct)`)

// normalization: staff may type lowercase, with spaces or dashes
assert.equal(normalizeCouponCode(" 7k2f9p "), "7K2F9P")
assert.equal(normalizeCouponCode("7k2-f9p"), "7K2F9P")
assert.equal(normalizeCouponCode("7K2 F9P"), "7K2F9P")

// Excluded lookalikes fold to their alphabet twin, so a correct code is never
// rejected because of handwriting or eyesight. Mapping: O/0 -> Q, I/1/L -> J, U -> V.
assert.equal(normalizeCouponCode("O23456"), "Q23456")
assert.equal(normalizeCouponCode("023456"), "Q23456")
assert.equal(normalizeCouponCode("I23456"), "J23456")
assert.equal(normalizeCouponCode("123456"), "J23456")
assert.equal(normalizeCouponCode("L23456"), "J23456")
assert.equal(normalizeCouponCode("U23456"), "V23456")

// every folded result is itself composed only of alphabet characters
for (const ch of normalizeCouponCode("O0I1LU")) {
  assert.ok(COUPON_ALPHABET.includes(ch), `folded "${ch}" must be in the alphabet`)
}

// normalizing an already-clean code is a no-op (idempotent)
const fresh = generateCouponCode()
assert.equal(normalizeCouponCode(fresh), fresh, "clean codes pass through unchanged")

console.log("coupon-code: all assertions passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/coupon-code.test.ts`
Expected: FAIL — module not found / `generateCouponCode` is not a function.

- [ ] **Step 3: Write the implementation**

Create `lib/coupon-code.ts`:

```ts
import { randomInt } from "node:crypto"

/**
 * Unambiguous code alphabet: no O/0, I/1, L or U. A code gets read aloud across a
 * noisy counter and typed by a stranger — every character that can be confused for
 * another is a redemption that fails for no good reason.
 */
export const COUPON_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ"
export const COUPON_CODE_LENGTH = 6

/** Characters a human might type for a character we deliberately excluded. */
const FOLD: Record<string, string> = {
  O: "Q", "0": "Q",  // round shapes -> Q
  I: "J", "1": "J", L: "J", // vertical strokes -> J
  U: "V",
}

/** A fresh random code. Uniqueness is guaranteed by the DB index, not by this. */
export function generateCouponCode(): string {
  let out = ""
  for (let i = 0; i < COUPON_CODE_LENGTH; i++) {
    out += COUPON_ALPHABET[randomInt(COUPON_ALPHABET.length)]
  }
  return out
}

/** Normalise staff-typed input: upper-case, strip separators, fold lookalikes. */
export function normalizeCouponCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "")
  let out = ""
  for (const ch of cleaned) out += FOLD[ch] ?? ch
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/coupon-code.test.ts`
Expected: PASS — prints `coupon-code: all assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/coupon-code.ts lib/coupon-code.test.ts
git commit -m "feat: unambiguous coupon code generator"
```

---

### Task 2: Schema — `coupon_claims` + deal caps

**Files:**
- Modify: `db/schema.ts`
- Migration: generated by drizzle-kit

**Interfaces:**
- Consumes: existing `deals`, `users` tables.
- Produces:
  ```ts
  export const couponClaimStatus: pgEnum // "claimed" | "redeemed" | "void"
  export const couponClaims: pgTable
  // deals gains: maxRedemptions: integer | null, maxPerDay: integer | null
  ```

- [ ] **Step 1: Add the enum and table**

In `db/schema.ts`, add near the other enums:

```ts
export const couponClaimStatus = pgEnum("coupon_claim_status", [
  "claimed",
  "redeemed",
  "void",
])
```

Add the table after `deals` (it references both `deals` and `users`):

```ts
/**
 * One row per customer per coupon. This is the source of truth for redemption —
 * unlike the old self-reported deal_events, a row only reaches "redeemed" when a
 * staff member confirms it at the counter.
 */
export const couponClaims = pgTable(
  "coupon_claims",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 12 }).notNull(),
    status: couponClaimStatus("status").notNull().default("claimed"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    // which staff account confirmed it — the audit trail that makes counts trustworthy
    redeemedBy: integer("redeemed_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => ({
    // Guarantees enforced by the database, not by application logic, so they
    // cannot be raced or bypassed by a double-submit.
    codeUnique: uniqueIndex("coupon_claims_code_unique").on(t.code),
    onePerCustomer: uniqueIndex("coupon_claims_deal_user_unique").on(t.dealId, t.userId),
  })
)
```

Add the two cap columns inside the existing `deals` table definition, after `paused`:

```ts
  // Caps are evaluated at CLAIM time so a code in a customer's hand always works.
  maxRedemptions: integer("max_redemptions"),
  maxPerDay: integer("max_per_day"),
```

Ensure `uniqueIndex` is imported from `drizzle-orm/pg-core` at the top of the file (add it to the existing import list if absent).

- [ ] **Step 2: Generate and apply the migration**

```bash
npm run db:generate
npm run db:push
```
Expected: a new migration file under `db/migrations/`, and push reports the new table + columns applied.

- [ ] **Step 3: Verify the constraints actually exist in the database**

```bash
node --env-file=.env.local node_modules/.bin/tsx -e "
import { db } from './db/client'
import { sql } from 'drizzle-orm'
async function main() {
  const idx = await db.execute(sql\`select indexname from pg_indexes where tablename = 'coupon_claims'\`)
  console.log(idx.rows.map(r => r.indexname))
  const cols = await db.execute(sql\`select column_name from information_schema.columns where table_name='deals' and column_name in ('max_redemptions','max_per_day')\`)
  console.log(cols.rows.map(r => r.column_name))
}
main()
"
```
Expected: index list includes `coupon_claims_code_unique` and `coupon_claims_deal_user_unique`; columns list shows both new deal columns.

- [ ] **Step 4: Commit**

```bash
git add db/schema.ts db/migrations
git commit -m "feat: coupon_claims table with DB-level uniqueness + deal caps"
```

---

### Task 3: Cap evaluation (pure)

**Files:**
- Create: `lib/coupon-limits.ts`
- Test: `lib/coupon-limits.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ClaimBlock = "expired" | "paused" | "sold_out" | "daily_limit" | null
  export function evaluateClaim(input: {
    paused: boolean
    expiresAt: Date
    maxRedemptions: number | null
    maxPerDay: number | null
    totalClaims: number
    claimsToday: number
    now: Date
  }): ClaimBlock
  ```
  Returns `null` when the claim is allowed, otherwise the reason it is blocked. Checked in priority order: paused → expired → sold_out → daily_limit.

- [ ] **Step 1: Write the failing test**

Create `lib/coupon-limits.test.ts`:

```ts
import assert from "node:assert/strict"
import { evaluateClaim } from "./coupon-limits"

const NOW = new Date("2026-07-20T18:00:00Z")
const base = {
  paused: false,
  expiresAt: new Date("2026-08-01T00:00:00Z"),
  maxRedemptions: null as number | null,
  maxPerDay: null as number | null,
  totalClaims: 0,
  claimsToday: 0,
  now: NOW,
}

// happy path
assert.equal(evaluateClaim(base), null, "unlimited live deal is claimable")

// paused wins over everything
assert.equal(evaluateClaim({ ...base, paused: true }), "paused")

// expired
assert.equal(
  evaluateClaim({ ...base, expiresAt: new Date("2026-07-19T00:00:00Z") }),
  "expired"
)
// expiring exactly now counts as expired (no grace)
assert.equal(evaluateClaim({ ...base, expiresAt: NOW }), "expired")

// total cap
assert.equal(evaluateClaim({ ...base, maxRedemptions: 50, totalClaims: 49 }), null, "under cap")
assert.equal(evaluateClaim({ ...base, maxRedemptions: 50, totalClaims: 50 }), "sold_out", "at cap")
assert.equal(evaluateClaim({ ...base, maxRedemptions: 50, totalClaims: 51 }), "sold_out", "over cap")

// per-day cap
assert.equal(evaluateClaim({ ...base, maxPerDay: 10, claimsToday: 9 }), null)
assert.equal(evaluateClaim({ ...base, maxPerDay: 10, claimsToday: 10 }), "daily_limit")

// null caps mean unlimited even with high counts
assert.equal(evaluateClaim({ ...base, totalClaims: 9999, claimsToday: 9999 }), null)

// zero cap blocks immediately (a deliberate "no claims" setting)
assert.equal(evaluateClaim({ ...base, maxRedemptions: 0 }), "sold_out")

// priority: expired beats sold_out
assert.equal(
  evaluateClaim({ ...base, expiresAt: new Date("2026-01-01T00:00:00Z"), maxRedemptions: 1, totalClaims: 5 }),
  "expired"
)
// priority: sold_out beats daily_limit
assert.equal(
  evaluateClaim({ ...base, maxRedemptions: 1, totalClaims: 5, maxPerDay: 1, claimsToday: 5 }),
  "sold_out"
)

console.log("coupon-limits: all assertions passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/coupon-limits.test.ts`
Expected: FAIL — `evaluateClaim` is not exported.

- [ ] **Step 3: Write the implementation**

Create `lib/coupon-limits.ts`:

```ts
/** Why a coupon cannot be claimed right now; null means it can. */
export type ClaimBlock = "expired" | "paused" | "sold_out" | "daily_limit" | null

/**
 * Decide whether a customer may claim a coupon. Pure so the rules are testable
 * without a database.
 *
 * Caps are evaluated at CLAIM time, never at redemption: a code already in a
 * customer's hand must always work at the counter. The trade-off — some claimants
 * never show up, so a 50-claim cap yields fewer than 50 actual redemptions — is
 * deliberate and documented in the spec.
 */
export function evaluateClaim(input: {
  paused: boolean
  expiresAt: Date
  maxRedemptions: number | null
  maxPerDay: number | null
  totalClaims: number
  claimsToday: number
  now: Date
}): ClaimBlock {
  if (input.paused) return "paused"
  if (input.expiresAt.getTime() <= input.now.getTime()) return "expired"
  if (input.maxRedemptions !== null && input.totalClaims >= input.maxRedemptions) return "sold_out"
  if (input.maxPerDay !== null && input.claimsToday >= input.maxPerDay) return "daily_limit"
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/coupon-limits.test.ts`
Expected: PASS — prints `coupon-limits: all assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/coupon-limits.ts lib/coupon-limits.test.ts
git commit -m "feat: pure coupon cap evaluation"
```

---

### Task 4: Claim server action

**Files:**
- Create: `lib/coupon-actions.ts`

**Interfaces:**
- Consumes: `generateCouponCode` (Task 1), `couponClaims` + `deals` (Task 2), `evaluateClaim` (Task 3), `auth` from `@/auth`, `db` from `@/db/client`.
- Produces:
  ```ts
  export type ClaimResult =
    | { ok: true; code: string; alreadyHad: boolean }
    | { ok: false; reason: "auth" | "not_found" | "expired" | "paused" | "sold_out" | "daily_limit" | "error" }
  export async function claimCoupon(dealId: number): Promise<ClaimResult>
  ```

- [ ] **Step 1: Write the implementation**

Create `lib/coupon-actions.ts`:

```ts
"use server"

import { and, eq, sql } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { couponClaims, deals } from "@/db/schema"
import { generateCouponCode } from "@/lib/coupon-code"
import { evaluateClaim } from "@/lib/coupon-limits"

export type ClaimResult =
  | { ok: true; code: string; alreadyHad: boolean }
  | {
      ok: false
      reason: "auth" | "not_found" | "expired" | "paused" | "sold_out" | "daily_limit" | "error"
    }

/**
 * Issue this customer their own single-use code for a coupon.
 *
 * Idempotent by design: a customer who already claimed gets the SAME code back
 * rather than an error, so re-opening the page is never a dead end. The unique
 * (deal_id, user_id) index makes that safe even if two taps race.
 */
export async function claimCoupon(dealId: number): Promise<ClaimResult> {
  const session = await auth()
  const userId = session?.user?.id ? Number(session.user.id) : null
  if (!userId || !Number.isFinite(userId)) return { ok: false, reason: "auth" }

  const deal = await db.query.deals.findFirst({ where: eq(deals.id, dealId) })
  if (!deal) return { ok: false, reason: "not_found" }

  // Already claimed? Hand back the existing code.
  const existing = await db.query.couponClaims.findFirst({
    where: and(eq(couponClaims.dealId, dealId), eq(couponClaims.userId, userId)),
  })
  if (existing) return { ok: true, code: existing.code, alreadyHad: true }

  // Caps are counted at claim time. Day boundary is Lompoc's, not UTC.
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      today: sql<number>`count(*) filter (
        where (${couponClaims.claimedAt} at time zone 'America/Los_Angeles')::date
            = (now() at time zone 'America/Los_Angeles')::date
      )::int`,
    })
    .from(couponClaims)
    .where(eq(couponClaims.dealId, dealId))

  const block = evaluateClaim({
    paused: deal.paused,
    expiresAt: deal.expiresAt,
    maxRedemptions: deal.maxRedemptions,
    maxPerDay: deal.maxPerDay,
    totalClaims: counts?.total ?? 0,
    claimsToday: counts?.today ?? 0,
    now: new Date(),
  })
  if (block) return { ok: false, reason: block }

  // Retry on the astronomically-unlikely code collision; the unique index is the
  // real guarantee, this loop just turns a collision into a retry instead of a 500.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await db
        .insert(couponClaims)
        .values({ dealId, userId, code: generateCouponCode() })
        .returning({ code: couponClaims.code })
      if (row) return { ok: true, code: row.code, alreadyHad: false }
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      // Lost a race on (deal_id, user_id) — the other insert won, return its code.
      if (msg.includes("coupon_claims_deal_user_unique")) {
        const raced = await db.query.couponClaims.findFirst({
          where: and(eq(couponClaims.dealId, dealId), eq(couponClaims.userId, userId)),
        })
        if (raced) return { ok: true, code: raced.code, alreadyHad: true }
      }
      if (!msg.includes("coupon_claims_code_unique")) return { ok: false, reason: "error" }
      // else: code collision, loop and generate another
    }
  }
  return { ok: false, reason: "error" }
}
```

- [ ] **Step 2: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: no errors. If `db.query.couponClaims` is not available, confirm `couponClaims` is exported from `db/schema.ts` and that `db/client.ts` passes the full schema to `drizzle()` — follow whatever pattern the existing `db.query.deals` usage relies on.

- [ ] **Step 3: Manual smoke against the real DB**

Pick a live deal id and a real user id, then:

```bash
node --env-file=.env.local node_modules/.bin/tsx -e "
import { db } from './db/client'
import { couponClaims } from './db/schema'
import { generateCouponCode } from './lib/coupon-code'
async function main() {
  const [row] = await db.insert(couponClaims)
    .values({ dealId: <REAL_DEAL_ID>, userId: <REAL_USER_ID>, code: generateCouponCode() })
    .returning()
  console.log('inserted', row)
  try {
    await db.insert(couponClaims).values({ dealId: <REAL_DEAL_ID>, userId: <REAL_USER_ID>, code: generateCouponCode() })
    console.log('BUG: duplicate claim was allowed')
  } catch (e) { console.log('OK: second claim rejected by unique index') }
  await db.delete(couponClaims).where(/* eq(couponClaims.id, row.id) */)
}
main()
"
```
Expected: first insert succeeds; the second is rejected by `coupon_claims_deal_user_unique`. **Clean up the test row afterwards.**

- [ ] **Step 4: Commit**

```bash
git add lib/coupon-actions.ts
git commit -m "feat: idempotent coupon claim action with cap enforcement"
```

---

### Task 5: Claim page — public deal, gated code

**Files:**
- Modify: `app/[locale]/(public)/deals/[id]/claim/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (namespace `claim`)

**Interfaces:**
- Consumes: `claimCoupon` (Task 4), `auth` from `@/auth`, existing `getDealById`.
- Produces: no new exports.

**Behavior:** the whole deal — business, title, description, and **`discountText`** — stays visible to everyone. Only the code block changes:
- **Logged out:** show a "Sign in to get your code" button linking to `/login?from=/deals/<id>/claim`. Do **not** hide or blur the discount.
- **Signed in, no claim yet:** show a "Get my code" button that calls `claimCoupon`.
- **Signed in, has claim:** show their unique code.
- **Blocked** (expired/paused/sold out/daily limit): show the matching message instead of the button.

The existing deterministic `claimCodeFor(deal.id)` display is **removed** — it is the shared-code defect this whole system replaces. Also remove the customer-side "I used it" button and its `redeemFromClaimAction` form: redemption is now confirmed by staff, and leaving a self-serve button would keep polluting the numbers.

- [ ] **Step 1: Add translation keys**

Add to the `claim` namespace in **both** `messages/en.json` and `messages/es.json` (identical key sets):

EN:
```json
"signInToGetCode": "Sign in to get your code",
"signInWhy": "Free account — so your coupon is yours alone and can only be used once.",
"getMyCode": "Get my code",
"yourCode": "Your code",
"codeIsYours": "This code is yours alone. Show it at the register.",
"blockedExpired": "This coupon has ended.",
"blockedPaused": "This coupon is paused right now.",
"blockedSoldOut": "All the coupons for this offer have been claimed.",
"blockedDailyLimit": "Today's coupons are all claimed. Try again tomorrow.",
"claimError": "Something went wrong. Please try again."
```

ES:
```json
"signInToGetCode": "Inicia sesión para obtener tu código",
"signInWhy": "Cuenta gratis — así tu cupón es solo tuyo y se usa una sola vez.",
"getMyCode": "Obtener mi código",
"yourCode": "Tu código",
"codeIsYours": "Este código es solo tuyo. Muéstralo en la caja.",
"blockedExpired": "Este cupón ya terminó.",
"blockedPaused": "Este cupón está pausado por ahora.",
"blockedSoldOut": "Ya se reclamaron todos los cupones de esta oferta.",
"blockedDailyLimit": "Los cupones de hoy ya se acabaron. Intenta mañana.",
"claimError": "Algo salió mal. Inténtalo de nuevo."
```

- [ ] **Step 2: Replace the code block in the claim page**

In `app/[locale]/(public)/deals/[id]/claim/page.tsx`:

Remove the import of `claimCodeFor` and of `redeemFromClaimAction`. Add:

```ts
import { auth } from "@/auth"
import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { couponClaims } from "@/db/schema"
import { CouponCodeBlock } from "@/components/coupon-code-block"
```

Inside the component, after `deal` is resolved and the expiry branch, add:

```ts
  const session = await auth()
  const userId = session?.user?.id ? Number(session.user.id) : null
  const myClaim = userId
    ? await db.query.couponClaims.findFirst({
        where: and(eq(couponClaims.dealId, deal.id), eq(couponClaims.userId, userId)),
      })
    : null
```

Replace the entire `{/* The code */}` div (the dashed box rendering `claimCodeFor(deal.id)`) and the `{/* Redeem confirmation */}` block with:

```tsx
          <CouponCodeBlock
            dealId={deal.id}
            isSignedIn={Boolean(userId)}
            existingCode={myClaim?.code ?? null}
            labels={{
              signIn: t("signInToGetCode"),
              signInWhy: t("signInWhy"),
              getCode: t("getMyCode"),
              yourCode: t("yourCode"),
              codeIsYours: t("codeIsYours"),
              showAtRegister: t("showAtRegister"),
              expired: t("blockedExpired"),
              paused: t("blockedPaused"),
              soldOut: t("blockedSoldOut"),
              dailyLimit: t("blockedDailyLimit"),
              error: t("claimError"),
            }}
          />
```

- [ ] **Step 3: Create the code block component**

Create `components/coupon-code-block.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { Link } from "@/i18n/navigation"
import { Ticket, LogIn } from "lucide-react"
import { claimCoupon } from "@/lib/coupon-actions"

type Labels = {
  signIn: string; signInWhy: string; getCode: string; yourCode: string
  codeIsYours: string; showAtRegister: string
  expired: string; paused: string; soldOut: string; dailyLimit: string; error: string
}

/**
 * The only part of a deal that requires an account. Everything else about the
 * offer — including the discount — stays public, so discovery and SEO are
 * untouched and the sign-in ask lands at the moment of real intent.
 */
export function CouponCodeBlock({
  dealId, isSignedIn, existingCode, labels,
}: { dealId: number; isSignedIn: boolean; existingCode: string | null; labels: Labels }) {
  const [code, setCode] = useState(existingCode)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const reasonLabel = (r: string) =>
    r === "expired" ? labels.expired
    : r === "paused" ? labels.paused
    : r === "sold_out" ? labels.soldOut
    : r === "daily_limit" ? labels.dailyLimit
    : labels.error

  if (code) {
    return (
      <div className="mt-6">
        <div className="mx-auto w-fit rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-8 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {labels.yourCode}
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-foreground">{code}</p>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
          <Ticket className="h-4 w-4 text-primary" /> {labels.showAtRegister}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{labels.codeIsYours}</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="mt-6">
        <Link
          href={`/login?from=/deals/${dealId}/claim`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <LogIn className="h-4 w-4" /> {labels.signIn}
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">{labels.signInWhy}</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null)
            const res = await claimCoupon(dealId)
            if (res.ok) setCode(res.code)
            else setError(reasonLabel(res.reason))
          })
        }
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        <Ticket className="h-4 w-4" /> {labels.getCode}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Verify**

Run: `node_modules/.bin/tsc --noEmit` → no errors.
Run: `npm run lint` → no new errors.
Run the dev server and open a deal's claim page **logged out**: the discount value and all deal details must still be visible, with a sign-in button where the code was. Confirm the page does not redirect to login.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/\(public\)/deals/\[id\]/claim/page.tsx components/coupon-code-block.tsx messages/en.json messages/es.json
git commit -m "feat: per-customer coupon codes behind sign-in, deal stays public"
```

---

### Task 6: Staff lookup + redeem actions

**Files:**
- Create: `lib/coupon-redeem-actions.ts`

**Interfaces:**
- Consumes: `normalizeCouponCode` (Task 1), `couponClaims`/`deals`/`users` (Task 2), `getMyBusiness` from `@/lib/biz-actions`, `auth` from `@/auth`.
- Produces:
  ```ts
  export type CouponLookup =
    | { ok: true; claimId: number; code: string; dealTitle: string; discountText: string | null
        customerName: string | null; claimedAt: Date; status: "claimed" | "redeemed" | "void"
        redeemedAt: Date | null; expired: boolean }
    | { ok: false; reason: "auth" | "not_found" }
  export async function lookupCoupon(rawCode: string): Promise<CouponLookup>
  export async function redeemCoupon(claimId: number): Promise<
    { ok: true; alreadyRedeemed: boolean } | { ok: false; reason: "auth" | "not_found" | "expired" | "error" }
  >
  ```

**The security rule for this task:** both functions resolve the caller's business via `getMyBusiness()` and join `coupon_claims → deals` filtered to `deals.businessId = myBusiness.id`. A code belonging to another business returns `not_found` — identical to a code that does not exist. Never return a different message for "exists but not yours", or the console becomes an oracle for enumerating other businesses' codes.

- [ ] **Step 1: Write the implementation**

Create `lib/coupon-redeem-actions.ts`:

```ts
"use server"

import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { couponClaims, deals, users } from "@/db/schema"
import { getMyBusiness } from "@/lib/biz-actions"
import { normalizeCouponCode } from "@/lib/coupon-code"

export type CouponLookup =
  | {
      ok: true
      claimId: number
      code: string
      dealTitle: string
      discountText: string | null
      customerName: string | null
      claimedAt: Date
      status: "claimed" | "redeemed" | "void"
      redeemedAt: Date | null
      expired: boolean
    }
  | { ok: false; reason: "auth" | "not_found" }

/** Look up a code, scoped strictly to the signed-in business's own deals. */
export async function lookupCoupon(rawCode: string): Promise<CouponLookup> {
  const biz = await getMyBusiness()
  if (!biz) return { ok: false, reason: "auth" }

  const code = normalizeCouponCode(rawCode)
  if (!code) return { ok: false, reason: "not_found" }

  const [row] = await db
    .select({
      claimId: couponClaims.id,
      code: couponClaims.code,
      status: couponClaims.status,
      claimedAt: couponClaims.claimedAt,
      redeemedAt: couponClaims.redeemedAt,
      dealTitle: deals.title,
      discountText: deals.discountText,
      expiresAt: deals.expiresAt,
      customerName: users.name,
    })
    .from(couponClaims)
    .innerJoin(deals, eq(deals.id, couponClaims.dealId))
    .leftJoin(users, eq(users.id, couponClaims.userId))
    // Ownership scope: a code from another business is indistinguishable from
    // one that does not exist. Do not leak its existence.
    .where(and(eq(couponClaims.code, code), eq(deals.businessId, biz.id)))
    .limit(1)

  if (!row) return { ok: false, reason: "not_found" }

  return {
    ok: true,
    claimId: row.claimId,
    code: row.code,
    dealTitle: row.dealTitle,
    discountText: row.discountText,
    customerName: row.customerName ?? null,
    claimedAt: row.claimedAt,
    status: row.status,
    redeemedAt: row.redeemedAt,
    expired: row.expiresAt.getTime() <= Date.now(),
  }
}

/**
 * Confirm a coupon at the counter. Idempotent: redeeming an already-redeemed
 * claim reports it rather than counting a second redemption.
 */
export async function redeemCoupon(
  claimId: number
): Promise<{ ok: true; alreadyRedeemed: boolean } | { ok: false; reason: "auth" | "not_found" | "expired" | "error" }> {
  const session = await auth()
  const staffId = session?.user?.id ? Number(session.user.id) : null
  const biz = await getMyBusiness()
  if (!biz || !staffId) return { ok: false, reason: "auth" }

  const [row] = await db
    .select({
      id: couponClaims.id,
      status: couponClaims.status,
      expiresAt: deals.expiresAt,
    })
    .from(couponClaims)
    .innerJoin(deals, eq(deals.id, couponClaims.dealId))
    .where(and(eq(couponClaims.id, claimId), eq(deals.businessId, biz.id)))
    .limit(1)

  if (!row) return { ok: false, reason: "not_found" }
  if (row.status === "redeemed") return { ok: true, alreadyRedeemed: true }
  // Time passes between claim and counter, so expiry is re-checked here too.
  if (row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" }

  try {
    // Conditional update: only a still-"claimed" row flips, so two staff
    // submitting at once cannot both count a redemption.
    const updated = await db
      .update(couponClaims)
      .set({ status: "redeemed", redeemedAt: new Date(), redeemedBy: staffId })
      .where(and(eq(couponClaims.id, claimId), eq(couponClaims.status, "claimed")))
      .returning({ id: couponClaims.id })
    return { ok: true, alreadyRedeemed: updated.length === 0 }
  } catch {
    return { ok: false, reason: "error" }
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `node_modules/.bin/tsc --noEmit`
Expected: no errors. If `users.name` does not exist, check `db/schema.ts` for the actual display-name column and use it (fall back to `users.email` only if there is no name column).

- [ ] **Step 3: Commit**

```bash
git add lib/coupon-redeem-actions.ts
git commit -m "feat: staff coupon lookup + idempotent redemption, scoped to own business"
```

---

### Task 7: Redeem console UI

**Files:**
- Create: `components/redeem-console.tsx`
- Create: `app/[locale]/dashboard/coupons/page.tsx`
- Modify: `app/[locale]/dashboard/layout.tsx`
- Modify: `messages/en.json`, `messages/es.json` (new namespace `redeem`, plus `dashboardNav.coupons`)

**Interfaces:**
- Consumes: `lookupCoupon`, `redeemCoupon` (Task 6).
- Produces: no new exports.

**Availability:** this page is available to **every tier that can post a deal** — it is not gated behind `canViewAnalytics`. A business that can publish a coupon must be able to honor it; gating the counter tool would break the core loop.

- [ ] **Step 1: Add translations**

Add a `redeem` namespace to both message files (identical keys).

EN:
```json
"redeem": {
  "title": "Redeem a coupon",
  "subtitle": "Type the code the customer shows you.",
  "codeLabel": "Coupon code",
  "check": "Check code",
  "checking": "Checking…",
  "markRedeemed": "Mark redeemed",
  "redeeming": "Redeeming…",
  "valid": "Valid coupon",
  "notFound": "No such code for your business.",
  "alreadyRedeemed": "Already redeemed",
  "expiredCoupon": "This coupon has expired.",
  "voided": "This coupon was voided.",
  "claimedBy": "Claimed by",
  "claimedOn": "Claimed",
  "redeemedOn": "Redeemed",
  "done": "Redeemed — thank you!",
  "another": "Redeem another",
  "error": "Something went wrong. Try again.",
  "metaTitle": "Redeem a coupon"
}
```

ES:
```json
"redeem": {
  "title": "Canjear un cupón",
  "subtitle": "Escribe el código que te muestra el cliente.",
  "codeLabel": "Código del cupón",
  "check": "Verificar código",
  "checking": "Verificando…",
  "markRedeemed": "Marcar como canjeado",
  "redeeming": "Canjeando…",
  "valid": "Cupón válido",
  "notFound": "No existe ese código para tu negocio.",
  "alreadyRedeemed": "Ya fue canjeado",
  "expiredCoupon": "Este cupón ya venció.",
  "voided": "Este cupón fue anulado.",
  "claimedBy": "Reclamado por",
  "claimedOn": "Reclamado",
  "redeemedOn": "Canjeado",
  "done": "¡Canjeado, gracias!",
  "another": "Canjear otro",
  "error": "Algo salió mal. Inténtalo de nuevo.",
  "metaTitle": "Canjear un cupón"
}
```

Also add to `dashboardNav`: EN `"coupons": "Redeem"`, ES `"coupons": "Canjear"`.

- [ ] **Step 2: Create the console component**

Create `components/redeem-console.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Ticket } from "lucide-react"
import { lookupCoupon, redeemCoupon, type CouponLookup } from "@/lib/coupon-redeem-actions"

type Labels = Record<
  | "codeLabel" | "check" | "checking" | "markRedeemed" | "redeeming" | "valid" | "notFound"
  | "alreadyRedeemed" | "expiredCoupon" | "voided" | "claimedBy" | "claimedOn" | "redeemedOn"
  | "done" | "another" | "error",
  string
>

export function RedeemConsole({ labels, locale }: { labels: Labels; locale: string }) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<CouponLookup | null>(null)
  const [redeemed, setRedeemed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const fmt = (d: Date) =>
    new Date(d).toLocaleString(locale === "es" ? "es-US" : "en-US", {
      dateStyle: "medium", timeStyle: "short", timeZone: "America/Los_Angeles",
    })

  const reset = () => { setInput(""); setResult(null); setRedeemed(false); setError(null) }

  if (redeemed) {
    return (
      <div className="rounded-2xl border-2 border-success/40 bg-success/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <p className="mt-3 text-xl font-semibold">{labels.done}</p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground"
        >
          {labels.another}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          start(async () => {
            setError(null); setResult(null)
            try { setResult(await lookupCoupon(input)) } catch { setError(labels.error) }
          })
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label className="sr-only" htmlFor="coupon-code">{labels.codeLabel}</label>
        <input
          id="coupon-code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="7K2F9P"
          className="h-14 flex-1 rounded-xl border-2 bg-background px-4 text-center font-mono text-2xl font-bold uppercase tracking-[0.25em] focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="h-14 rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? labels.checking : labels.check}
        </button>
      </form>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {result && !result.ok && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5">
          <XCircle className="h-7 w-7 shrink-0 text-destructive" />
          <p className="font-semibold">{labels.notFound}</p>
        </div>
      )}

      {result?.ok && (
        <div className="rounded-2xl border-2 p-5">
          {result.status === "redeemed" ? (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-amber-600">
              <AlertTriangle className="h-5 w-5" /> {labels.alreadyRedeemed}
              {result.redeemedAt ? ` · ${fmt(result.redeemedAt)}` : ""}
            </p>
          ) : result.status === "void" ? (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-destructive">
              <XCircle className="h-5 w-5" /> {labels.voided}
            </p>
          ) : result.expired ? (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-destructive">
              <XCircle className="h-5 w-5" /> {labels.expiredCoupon}
            </p>
          ) : (
            <p className="mb-3 inline-flex items-center gap-2 font-semibold text-success">
              <CheckCircle2 className="h-5 w-5" /> {labels.valid}
            </p>
          )}

          <p className="text-lg font-bold">
            {result.discountText ? `${result.discountText} · ` : ""}{result.dealTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.customerName ? `${labels.claimedBy} ${result.customerName} · ` : ""}
            {labels.claimedOn} {fmt(result.claimedAt)}
          </p>

          {result.status === "claimed" && !result.expired && (
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await redeemCoupon(result.claimId)
                  if (res.ok) setRedeemed(true)
                  else setError(res.reason === "expired" ? labels.expiredCoupon : labels.error)
                })
              }
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Ticket className="h-5 w-5" /> {pending ? labels.redeeming : labels.markRedeemed}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create the page**

Create `app/[locale]/dashboard/coupons/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server"
import { RedeemConsole } from "@/components/redeem-console"

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "redeem" })
  return { title: t("metaTitle") }
}

export default async function CouponsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "redeem" })
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6">
        <RedeemConsole
          locale={params.locale}
          labels={{
            codeLabel: t("codeLabel"), check: t("check"), checking: t("checking"),
            markRedeemed: t("markRedeemed"), redeeming: t("redeeming"), valid: t("valid"),
            notFound: t("notFound"), alreadyRedeemed: t("alreadyRedeemed"),
            expiredCoupon: t("expiredCoupon"), voided: t("voided"), claimedBy: t("claimedBy"),
            claimedOn: t("claimedOn"), redeemedOn: t("redeemedOn"), done: t("done"),
            another: t("another"), error: t("error"),
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add the nav link**

In `app/[locale]/dashboard/layout.tsx`, add to the `links` array immediately after the `deals` entry:

```ts
    { href: "/dashboard/coupons", icon: <Ticket className="h-4 w-4" />, label: t("coupons") },
```

Import `Ticket` from `lucide-react` alongside the existing icon imports.

- [ ] **Step 5: Verify**

Run: `node_modules/.bin/tsc --noEmit` → no errors.
Run: `npm run lint` → no new errors.
Start the dev server, sign in as a business owner, open `/en/dashboard/coupons`, and confirm the form renders and an unknown code reports "No such code for your business."

- [ ] **Step 6: Commit**

```bash
git add components/redeem-console.tsx app/[locale]/dashboard/coupons app/[locale]/dashboard/layout.tsx messages/en.json messages/es.json
git commit -m "feat: staff redeem console"
```

---

### Task 8: Business-configurable caps on the deal form

**Files:**
- Modify: `app/[locale]/dashboard/deals/new/page.tsx` and `app/[locale]/dashboard/deals/edit/[id]/page.tsx` (whichever hold the form fields — read them first)
- Modify: `lib/biz-actions.ts` (the deal create/update schema + insert/update)
- Modify: `messages/en.json`, `messages/es.json` (namespace `dashboardDealForm`)

**Interfaces:**
- Consumes: `deals.maxRedemptions`, `deals.maxPerDay` (Task 2).
- Produces: no new exports; the deal create/update path now persists both caps.

- [ ] **Step 1: Read the existing deal form and action**

Run: `grep -n "discountText\|expiresAt\|z.object\|formData.get" lib/biz-actions.ts | head -40`
Identify the deal zod schema and the insert/update calls. Follow their exact style for the two new optional numeric fields.

- [ ] **Step 2: Extend the schema and persistence**

In the deal schema in `lib/biz-actions.ts`, add:

```ts
  maxRedemptions: z.coerce.number().int().min(1).optional().nullable(),
  maxPerDay: z.coerce.number().int().min(1).optional().nullable(),
```

Parse them from the form the same way sibling fields are parsed, converting empty string to `null`:

```ts
  maxRedemptions: formData.get("maxRedemptions") ? Number(formData.get("maxRedemptions")) : null,
  maxPerDay: formData.get("maxPerDay") ? Number(formData.get("maxPerDay")) : null,
```

Include both in the `.values({...})` insert and the `.set({...})` update.

- [ ] **Step 3: Add the form fields + copy**

Add to the deal form, in a "Limits (optional)" group, two number inputs named `maxRedemptions` and `maxPerDay`, each with `min="1"` and an empty default, following the existing field markup.

Translation keys (both locales, identical keys) under `dashboardDealForm`:

EN:
```json
"limitsTitle": "Limits (optional)",
"limitsHelp": "Leave blank for no limit. Limits apply when a customer claims the coupon, so a code someone already has always works at your register.",
"maxRedemptionsLabel": "Total coupons",
"maxRedemptionsHelp": "e.g. 50 — first 50 customers only",
"maxPerDayLabel": "Per day",
"maxPerDayHelp": "e.g. 10 per day",
"onePerCustomerNote": "Each customer can claim this coupon once."
```

ES:
```json
"limitsTitle": "Límites (opcional)",
"limitsHelp": "Déjalo en blanco para no poner límite. Los límites aplican cuando el cliente reclama el cupón, así que un código que ya tiene siempre funciona en tu caja.",
"maxRedemptionsLabel": "Cupones en total",
"maxRedemptionsHelp": "ej. 50 — solo los primeros 50 clientes",
"maxPerDayLabel": "Por día",
"maxPerDayHelp": "ej. 10 por día",
"onePerCustomerNote": "Cada cliente puede reclamar este cupón una vez."
```

- [ ] **Step 4: Verify**

Run: `node_modules/.bin/tsc --noEmit` → no errors. `npm run lint` → clean.
Create a deal with a total cap of 1 in the dashboard, claim it from a customer account, then attempt to claim from a second account — the second must be refused with the "all claimed" message.

- [ ] **Step 5: Commit**

```bash
git add lib/biz-actions.ts app/[locale]/dashboard/deals messages/en.json messages/es.json
git commit -m "feat: businesses can cap total and per-day coupon claims"
```

---

### Task 9: Verified measurement

**Files:**
- Modify: `lib/funnel-queries.ts`
- Create: `lib/coupon-stats.ts`
- Create: `lib/coupon-stats.test.ts`

**Interfaces:**
- Consumes: `couponClaims`, `deals`.
- Produces:
  ```ts
  export type CouponStatsRow = {
    dealId: number; dealTitle: string
    claims: number; redemptions: number; redeemRate: number
    newCustomers: number; repeatCustomers: number
    medianHoursToRedeem: number | null
  }
  export async function getCouponStats(businessId: number, window: "7d" | "30d" | "all"): Promise<CouponStatsRow[]>
  // pure helper, unit-tested:
  export function summarizeClaims(rows: Array<{
    dealId: number; userId: number; status: string; claimedAt: Date; redeemedAt: Date | null
  }>, priorCustomerIds: Set<number>): Map<number, Omit<CouponStatsRow, "dealTitle">>
  ```

**Absolutely no dollar figures.** Counts and rates only — this is a hard spec boundary.

- [ ] **Step 1: Write the failing test**

Create `lib/coupon-stats.test.ts`:

```ts
import assert from "node:assert/strict"
import { summarizeClaims } from "./coupon-stats"

const H = (h: number) => new Date(Date.UTC(2026, 6, 20, h, 0, 0))
const rows = [
  // deal 1: 3 claims, 2 redeemed
  { dealId: 1, userId: 10, status: "redeemed", claimedAt: H(1), redeemedAt: H(3) }, // 2h
  { dealId: 1, userId: 11, status: "redeemed", claimedAt: H(1), redeemedAt: H(7) }, // 6h
  { dealId: 1, userId: 12, status: "claimed", claimedAt: H(2), redeemedAt: null },
  // deal 2: 1 claim, unredeemed
  { dealId: 2, userId: 10, status: "claimed", claimedAt: H(4), redeemedAt: null },
]
// user 10 has bought here before; 11 and 12 are new to the business
const prior = new Set([10])

const out = summarizeClaims(rows, prior)
const d1 = out.get(1)!
assert.equal(d1.claims, 3, "counts every claim")
assert.equal(d1.redemptions, 2, "counts only verified redemptions")
assert.equal(Math.round(d1.redeemRate * 100), 67, "redeem rate = redeemed / claimed")
assert.equal(d1.repeatCustomers, 1, "user 10 is a repeat customer")
assert.equal(d1.newCustomers, 2, "users 11 and 12 are new")
assert.equal(d1.medianHoursToRedeem, 4, "median of 2h and 6h")

const d2 = out.get(2)!
assert.equal(d2.redemptions, 0)
assert.equal(d2.redeemRate, 0, "no redemptions is a 0 rate, never NaN")
assert.equal(d2.medianHoursToRedeem, null, "no redemptions means no median")

// empty input is safe
assert.equal(summarizeClaims([], new Set()).size, 0)

console.log("coupon-stats: all assertions passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/coupon-stats.test.ts`
Expected: FAIL — `summarizeClaims` not exported.

- [ ] **Step 3: Write the implementation**

Create `lib/coupon-stats.ts` containing `summarizeClaims` (pure) and `getCouponStats` (queries `couponClaims` joined to `deals` filtered by `businessId` and the window, then calls `summarizeClaims`). `medianHoursToRedeem` is the median of `(redeemedAt - claimedAt)` in hours over redeemed rows only, rounded to the nearest whole hour; `null` when there are none. `redeemRate` is `redemptions / claims`, or `0` when `claims === 0` (never `NaN`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --env-file=.env.local node_modules/.bin/tsx lib/coupon-stats.test.ts`
Expected: PASS.

- [ ] **Step 5: Switch the funnel's redeem number to verified data**

In `lib/funnel-queries.ts`, replace the `deal_redeem` analytics-event count with a count of `coupon_claims` rows where `status = 'redeemed'` for that deal within the window. Leave views, clicks, and claims sourced as they are. Add a short comment stating that redemptions are now counter-verified and that historical `deal_events` are retained for continuity but are no longer the source of truth.

- [ ] **Step 6: Verify**

Run: `node_modules/.bin/tsc --noEmit` and `npm run lint` → clean.
Run: `node --env-file=.env.local node_modules/.bin/tsx lib/coupon-stats.test.ts` → PASS.
Confirm no dollar sign, price, or revenue wording was introduced: `grep -rniE "revenue|\\$|dollar|ticket" lib/coupon-stats.ts` should return nothing meaningful.

- [ ] **Step 7: Commit**

```bash
git add lib/coupon-stats.ts lib/coupon-stats.test.ts lib/funnel-queries.ts
git commit -m "feat: verified redemption measurement (counts only)"
```

---

## Self-Review

**Spec coverage:**
- Unique per-customer codes → Tasks 1, 2, 4. ✅
- Only the code gated; deal + discount stay public → Task 5 (explicit). ✅
- Counter verification with ownership scoping → Tasks 6, 7. ✅
- Idempotent redemption → Task 6 (conditional update). ✅
- One-per-customer, expiry, total cap, per-day cap, all at claim time → Tasks 2 (DB constraint), 3, 4, 8. ✅
- Audit trail (`redeemedBy`) → Task 2, written in Task 6. ✅
- Counts-only measurement, no revenue → Task 9 + Global Constraints. ✅
- Console available to all deal-posting tiers → Task 7 (explicit). ✅
- Retire deterministic `claimCodeFor` + self-reported redeem button → Task 5. ✅
- Rate limiting on code entry — **noted in the spec's security section but NOT implemented in this plan.** Deliberate: the ownership scope already prevents cross-business enumeration, and a burned code is griefing rather than theft. Flag to the human as a follow-up rather than silently dropping it.

**Placeholder scan:** clean — no TBDs, no "similar to Task N", and every code step contains the full code to write. (An earlier draft of Task 1 contained a malformed assertion with corrective notes layered on top; it has been rewritten so the test is correct as first written.)

**Type consistency:** `ClaimResult`, `CouponLookup`, `ClaimBlock`, and `CouponStatsRow` are each defined once and consumed with matching shapes. `claimCoupon(dealId)`, `lookupCoupon(rawCode)`, `redeemCoupon(claimId)` signatures match between definition and every call site.

## Follow-ups for the human

- **Rate limiting** on the redeem console (see above).
- **Existing claim/redeem history** in `deal_events` stays untouched; the two systems will show different redeem numbers for overlapping periods. Worth a note in the dashboard if that confuses anyone.
