# Location-Less Businesses — Design

**Date:** 2026-07-20
**Status:** Approved design, ready for implementation planning

## Goal

Let Lompoc businesses **without a public street address** join, pay, and be listed. Today the
signup form hard-requires an address, which shuts out a real and growing segment of local
businesses.

Who this unlocks:
- **Mobile vendors** — food trucks and trailers (e.g. Bowl & Soul), pop-ups, market stalls
- **Home-based businesses** that don't want their home address published
- **PO-box-only** businesses
- **By-appointment / mobile services** — detailers, groomers, cleaners, contractors

These are paying-customer opportunities the platform currently turns away.

## What already works (verified in production, 2026-07-20)

Most of the stack already tolerates a null location. Confirmed live with **Bowl & Soul**
(id 645, created with `address`, `lat`, `lng` all NULL):

| Surface | Behavior | Status |
|---|---|---|
| `businesses` schema | `address`, `lat`, `lng` all nullable | ✅ |
| Business profile page | `{business.address && (…)}` — conditional render | ✅ 200 OK |
| Map (`lib/queries.ts:470`) | filters `lat is not null and lng is not null` — skipped, not broken | ✅ map 200 OK |
| Businesses directory | listed normally | ✅ appears |
| Profile editing (`lib/biz-actions.ts:56`) | `address: z.string().optional()` | ✅ |
| Geocoding (`business-signup-actions.ts:216`) | wrapped in try/catch, non-fatal | ✅ |
| Signup status | already `status: "pending"` for every signup (line 231) | ✅ |

**Nothing needs to be fixed in display, mapping, or data.** The gap is only at the front door.

## The gap

`lib/business-signup-actions.ts`:
- **line 29** — `address: z.string().min(5, "Enter a valid address")` (required)
- **line 78** — `address: z.string().min(5)` in the paid-plan schema
- **lines 57 / 112** — `localizedLompocAddressError(address)` rejects non-Lompoc addresses

A business with no address literally cannot complete signup.

## Design

### 1. Address becomes optional at signup
Both schemas accept an absent address. The Lompoc address validation runs **only when an address
is actually supplied** — a provided address must still be in Lompoc/Vandenberg, exactly as today.
Geocoding is already conditional and non-fatal.

The signup form gains an explicit **"I don't have a public address"** choice (mobile business,
home-based, or by appointment). This is a deliberate opt-in, not a blank field someone skipped.

### 2. Scope enforcement — unchanged, already sufficient
Today the Lompoc address check is doing double duty: validating the address *and* enforcing the
strict Lompoc/Vandenberg-only scope rule. Removing the address for some signups would remove that
guard — **except every signup already lands as `status: "pending"` and requires admin approval
before going public.**

So the scope rule stays enforced by the existing admin review: the admin confirms a no-address
business is genuinely Lompoc/Vandenberg before approving. No new machinery, and the platform's
scope discipline is preserved.

To make that review possible rather than guesswork, the admin queue must **visibly flag
no-address businesses** so they get the extra scrutiny they need — an admin should never have to
notice an absent field on their own.

### 3. Display — say what's true, don't leave a hole
Where the address block normally sits, a location-less business shows a **mobile/no-storefront
line plus a pointer to where customers can actually find them**:

```
📍 Mobile · Serving Lompoc
   Follow @bowl.and.soul.llc for today's location
```

- The social pointer only appears when the business actually has a social link; otherwise just the
  service-area line.
- Bilingual (en/es) like the rest of the site.
- This is honest and useful — a food truck's location genuinely changes daily, and their Instagram
  is the real answer. It also avoids the listing looking broken or incomplete.

### 4. Map treatment
Location-less businesses continue to be **omitted from the map** (already the behavior — they have
no coordinates to plot). They remain fully present in the feed, directory, search, category pages,
and digest email. No fake pins, no "approximate" coordinates — plotting a guess would mislead
customers into driving somewhere wrong.

## Non-goals

- No fabricated or approximate coordinates for location-less businesses.
- No map pin, no "near you" distance sorting for them (there is nothing to measure from).
- No new verification mechanism (phone/licence checks) — admin approval covers scope.
- No change to pricing or tiers; a location-less business pays the same as any other.
- No live "where is the truck right now" tracking.

## Success criteria

- A business can complete signup — free and paid — without entering an address.
- A business that *does* enter an address is still validated as Lompoc/Vandenberg, unchanged.
- No-address signups appear in the admin queue clearly flagged as such.
- Their public profile shows the mobile/service-area line (plus social pointer when available),
  in both locales — never an empty gap.
- They appear in the directory, feed, search, and digest; they do not appear on the map.
- Existing businesses with addresses are entirely unaffected.
