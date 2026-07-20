# Coupon Redemption & Control System — Design

**Date:** 2026-07-20
**Status:** Approved design, ready for implementation planning

## Goal

Give businesses a **trustworthy, controllable** coupon system: every coupon a customer holds
is unique to them, staff verify it at the counter, and the redemption numbers a business sees
mean "actually honored at the register" — not "someone tapped a button."

This is positioned as a **trust and control** feature. It is what makes the platform serious for
a business owner: real codes, a real audit trail, real limits.

## The problem with what exists today

The codebase already tracks view → click → claim → redeem in `deal_events` / `analytics_events`,
and the dashboard has a funnel (`getDealFunnel`). Two defects make it untrustworthy:

1. **`claimCodeFor(dealId)` (`lib/claim-code.ts`) is a deterministic hash of the deal ID.** Every
   customer claiming the same coupon sees the *identical* code. It can be screenshotted, shared,
   and reused without limit.
2. **Redemption is self-reported by the customer.** `redeemFromClaimAction`
   (`lib/tracking-actions.ts`) fires when the *shopper* taps a button on their own phone. The
   business never confirms anything.

Result: a business can see interest, but cannot verify a coupon or trust the redeem count.

## Access model (decided)

**Discovery stays completely public. Only the code is gated.**

| Surface | Logged out | Signed in |
|---|---|---|
| Feed, business pages, map, digest email | ✅ full | ✅ full |
| Deal title, photo, description, business | ✅ visible | ✅ visible |
| Discount value ("20% Off") | ✅ **visible** | ✅ visible |
| The redeemable **code** | ❌ "Sign in to get your code" | ✅ their unique code |

Rationale: no friction on discovery, deal pages stay fully indexable (protects the SEO work),
and the sign-in ask lands at the moment of clear intent — when someone actually wants to use the
coupon. Nothing about the offer is hidden.

## Data model

### New table `coupon_claims`

| column | type | notes |
|---|---|---|
| `id` | serial PK | |
| `dealId` | int → `deals.id` (cascade) | which coupon |
| `userId` | int → `users.id` | **not null** — claiming requires an account |
| `code` | varchar(12) | **unique**, random, e.g. `7K2F9P` |
| `status` | enum `claimed \| redeemed \| void` | default `claimed` |
| `claimedAt` | timestamptz not null default now | |
| `redeemedAt` | timestamptz nullable | set at counter confirmation |
| `redeemedBy` | int → `users.id` nullable | **which staff account confirmed it** (audit trail) |

Two guarantees enforced by the **database**, not just application logic:
- `UNIQUE (code)` — codes never collide.
- `UNIQUE (dealId, userId)` — "one per customer" cannot be raced or bypassed.

### New columns on `deals`
- `maxRedemptions` int nullable — total cap ("first 50 customers")
- `maxPerDay` int nullable — per-day cap
- (`expiresAt` already exists and is reused)

### Code format
6 characters from an unambiguous alphabet (Crockford-style: no `O`/`0`, no `I`/`1`) —
`23456789ABCDEFGHJKMNPQRSTVWXYZ`. ~729M combinations. Generated randomly, with retry on unique
violation. Displayed grouped for readability at a noisy counter.

The existing `claimCodeFor()` deterministic helper is **retired** for new claims (kept only if
still referenced by historical views).

## Flows

### 1. Claim (customer)
Signed-in customer taps *Get my code* on the deal/claim page:
1. Validate the deal is live (not paused, not expired) and caps are not exhausted.
2. If this user already claimed this deal → **return their existing code** (idempotent and
   friendly, not an error). The unique constraint makes this safe under concurrency.
3. Otherwise insert a `coupon_claims` row with a fresh unique code.

Logged-out visitors see the full deal plus a *Sign in to get your code* call to action.

### 2. Verify at the counter (staff)
New dashboard page. Staff types the short code and confirms:

```
✓ Valid · 20% off Tri-Tip · Ana M. · claimed 2h ago     [ Mark redeemed ]
✗ Already redeemed — today at 1:14pm
✗ Expired
✗ Not found
✗ Not your coupon
```

**Critical authorization rule:** a business may only look up and redeem codes belonging to
**its own** deals. Without this, one business could burn another's coupons. The lookup is scoped
by business ownership, and a code from another business returns "not found" (it must not leak
that the code exists elsewhere).

Confirming sets `status = redeemed`, `redeemedAt = now`, `redeemedBy = <staff user id>`.
Redemption is **idempotent** — re-submitting an already-redeemed code reports it as already used
rather than double-counting.

### 3. Measurement (counts only — no dollar amounts)
The redeem figure switches to counting verified rows in `coupon_claims`
(`status = redeemed`) instead of self-reported events. Existing `deal_events` history is
**preserved** for continuity — the new table is authoritative going forward; the past is not
rewritten.

**Deliberately no revenue capture.** Staff enter nothing but the code. No sale amounts, no
average-ticket estimates. This keeps the counter interaction to one step, leaves no field for
staff to skip (which would silently corrupt the numbers), and means every figure the business
sees is a hard count it can trust rather than an estimate it can dispute.

Because every claim carries a `userId` and every redemption carries a timestamp, counts alone
support a genuinely useful analysis:

| Metric | Meaning to the business |
|---|---|
| Verified redemptions | People who actually walked in and used the coupon |
| Claim → redeem rate | How well an offer converts intent into a visit |
| View/click → claim rate | Whether the offer is compelling enough to take |
| Per-coupon ranking | Which offers actually bring people in, which are ignored |
| New vs. repeat customers | Whether a coupon acquires customers or rewards regulars (`userId` across claims) |
| Time-to-redeem | How fast an offer drives a visit — urgency of the offer |
| Redemption by day/hour | When redeemers actually show up; helps staffing and offer timing |

These are the numbers that justify the subscription: a business can see, in hard counts,
how many people the platform put through its door.

## Limits (all four, enforced at **claim** time)

| Limit | Enforcement |
|---|---|
| One per customer | `UNIQUE (dealId, userId)` — DB level |
| Expiry | existing `deals.expiresAt` — code stops working at the counter too |
| Total cap | `deals.maxRedemptions` vs. count of claims |
| Per-day cap | `deals.maxPerDay` vs. count of claims today (America/Los_Angeles) |

**Decision — caps apply at claim time, not redemption time.** A code already in a customer's hand
always works. Capping at redemption would leave customers holding codes that silently stop
working while they stand at the counter. Trade-off, accepted: some claimants never show up, so
"first 50 claims" yields fewer than 50 actual redemptions.

Expiry is additionally re-checked at the counter, since time passes between claim and redemption.

## Who gets the redeem console

**Available to every tier that can post a deal — not an upsell.** If a business can publish a
coupon, it must be able to honor it; gating the counter tool would break the core loop and
undermine exactly the trust this feature exists to create. Advanced *analytics* stay gated as
they are today (`canViewAnalytics` = standard+). This is a deliberate monetization call worth
revisiting only if it proves wrong.

## Non-goals

- **No revenue projection, estimation, or dollar figures of any kind.** No sale amounts captured
  at the counter, no average-ticket inputs, no "estimated revenue influenced", no ROI multiples.
  The system reports verified counts and rates only. This is a firm boundary, not a phase-2
  deferral — the platform does not see actual sales, and inventing a dollar number would be a
  guess presented as a fact.
- No QR scanning (manual code entry only — works on any device, nothing to install).
- No per-customer identity beyond the existing account system.
- No rewriting of historical `deal_events` data.
- No changes to how deals are created, priced, or ranked.
- No offline/POS integration.

## Security notes

- Ownership check on every lookup and redemption (see above) — the highest-risk item.
- Codes are short and therefore guessable in bulk; the redeem endpoint needs basic rate limiting
  per business so codes cannot be enumerated. A burned code is griefing, not theft, so moderate
  protection is proportionate.
- Codes are references, not bearer tokens for money; they are not secrets after redemption.

## Build order (three shippable phases)

1. **Schema + unique codes** — `coupon_claims`, code generation, claim flow gated by sign-in,
   deal pages fully public with the code behind auth.
2. **The counter tool** — staff redeem console with ownership checks and idempotent redemption.
3. **Limits + measurement** — the four caps, the funnel switched to verified redemptions, and the
   count-based analysis above.

Each phase is independently useful and independently shippable.

## Success criteria

- Two different customers claiming the same coupon receive two different codes.
- A customer re-claiming the same coupon sees the same code, not an error or a duplicate row.
- Staff can type a code and see valid / already-redeemed / expired / not-found correctly.
- A business cannot look up or redeem another business's code.
- Redeeming twice does not double-count.
- Claims stop once a cap (total, per-day) is reached; expired codes fail at the counter.
- The dashboard redeem count matches the number of verified counter confirmations.
- Logged-out visitors still see the full deal and discount value; only the code requires sign-in.
- No dollar amount appears anywhere in the UI, the schema, or the reporting.
