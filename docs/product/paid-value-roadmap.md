# Paid Plan Appeal — Value Roadmap for Showcase Businesses

**Date:** 2026-06-23
**Question:** Why does a local business pay to put themselves + a deal on Lompoc Deals?
**Answer framework:** A business pays when the platform makes them **(1) more seen, (2) look
better, (3) bring repeat customers, (4) able to prove it worked.** Analytics covers #4. This
roadmap covers #1–#3 — and corrects a gap where we already *charge* for value we don't deliver.

---

## What already exists (verified in code)

| Capability | Status | Note |
|---|---|---|
| Paid-gated deal analytics | ✅ Live | Standard+; see analytics-upsell spec |
| Rich showcase profile (logo, cover, photo gallery, social links) | ✅ Live | Rendered on `biz/[slug]`; social links gated Standard+ |
| Follow a business + email on new deal | ✅ Live | `businessFollows` table + notification email — the repeat-customer engine **already works** |
| Weekly email digest to locals | ✅ Live | Saturdays 9am UTC; **neutral — paid deals get no priority** |
| Featured homepage / priority ranking | ⚠️ **Sold but not built** | Flags in `TIERS` (`featuredOnHomepage`, `priorityRanking`) advertised on billing page; **no query implements them** — everything sorts by date |
| Recurring / scheduled deals | ❌ Missing | One-shot expiry only |
| Verified / Featured badge | ❌ Missing | No badge concept |

**Key takeaway:** the expensive infrastructure (follows, notifications, rich profiles,
digest) is *done*. The highest-value paid levers are small additions on top of it.

---

## The roadmap (prioritized by impact ÷ effort)

### P0 — Activate tier-based ranking + "Featured" badge  ⭐ build first
**Value to business:** "Pay and your deal sits at the top of the feed / homepage, with a
Featured badge." The most direct, most understood reason to upgrade for a business that wants
to be *seen*.
**Why first:** The billing page **already promises this** (`featuredOnHomepage`,
`priorityRanking`) — today it's vaporware. This is both an integrity fix and the strongest
acquisition lever. Infra is half-built; it's a query + badge change, ~1–2 days.
**Tier:** priority ranking → Premium; a lighter "above free listings" bump → Standard.
**Touches:** `lib/queries.ts` (feed/homepage ORDER BY + subscription join), a `<FeaturedBadge>`,
`lib/stripe.ts` (already has flags).

### P1 — Paid featuring in the weekly digest
**Value to business:** Their deal gets the **top / "Featured Local Deal" slot** in the email
that lands in every subscriber's inbox. Direct distribution to the locals audience — exactly
what a showcase business wants.
**Why:** Digest already ships weekly; today it's neutral. Add a tier weighting so Premium deals
surface first / get a dedicated featured block. Small change, compounding value as the
subscriber list grows (Phase 2 of the acquisition plan).
**Tier:** Premium (1 featured slot), Standard (eligible, no priority).
**Touches:** `app/api/cron/digest/route.ts`, `lib/email.ts` digest template.

### P2 — Recurring / scheduled deals
**Value to business:** Set "Happy hour every Friday" or "Taco Tuesday" once and it runs —
removes the #1 friction (remembering to post). A retention + convenience perk.
**Tier:** Premium.
**Touches:** schema migration (recurrence fields), deal form, the cron that activates/expires
deals.

### P3 — Verified / "Founding Business" badge
**Value to business:** Trust signal on their profile + visible marker that they're an
established/paid local. Pairs naturally with the Featured badge and your founding-business
outreach pitch.
**Tier:** Standard+ ("Local Verified"); a one-time "Founding Business" badge for the
Beachhead 25 regardless of tier (rewards early adopters).
**Touches:** `businesses` boolean field, badge component.

### Operational (no code) — Guaranteed social spotlight
**Value to business:** A paid business gets a **guaranteed spotlight post** on Lompoc Deals'
Instagram/Facebook. This ties the [content plan](../marketing/content-month-1.md) directly to
the paid offer: "Upgrade and we feature you to our followers." Pure operations — fold it into
the Premium pitch now, zero engineering.

---

## How this maps to the pitch (founding-business outreach)

When you walk into a business (per the [acquisition plan](../superpowers/specs/2026-06-23-business-acquisition-plan-design.md)),
the free tier gets them listed. The paid upgrade story becomes concrete:

> "Free gets you on the map. **Premium puts your deal at the top of the feed, in the top slot
> of our weekly email to locals, and we spotlight you on our Instagram — then show you exactly
> how many people viewed you and where they came from.**"

That's four tangible "be seen + prove it" benefits, all built on infrastructure that mostly
already exists.

---

## Recommended build sequence

1. **Analytics upsell** (already specced — the proof layer; reduces churn).
2. **P0 tier-based ranking + Featured badge** (acquisition lever + integrity fix).
3. **P1 digest featuring** (distribution; compounds with locals growth).
4. **P2 recurring deals**, **P3 badges** as polish.

> Suggested: build P0 *with* or immediately after analytics, since "pay to be seen" + "see
> that it worked" together form the complete upgrade story.

## Out of scope (for now)

- Paid ad-spend / promoted-deal auctions (too heavy for this market size).
- Self-serve "boost this deal for $X" one-off purchases (revisit once subscriptions prove out).
- Multi-location / franchise tooling (not the target customer).
