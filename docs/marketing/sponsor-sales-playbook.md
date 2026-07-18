# Lompoc Locals — Sponsor Sales Playbook

**What we sell:** visibility to every local who's already looking. Not "ads" —
**category ownership** in the town's local directory. The flagship product is
scarce by design: only one business can own each category.

---

## The product ladder

The three subscription tiers already exist (`lib/stripe.ts`). Sponsorship layers
on top of **Plus**. The new flagship is **Category Exclusive**.

| Tier | Price | The hook |
|---|---|---|
| **Free** | $0 | Claim your listing — get found on the map & in search |
| **Growth** | $39.99/mo | Post deals, weekly digest, analytics |
| **Plus** | $99.99/mo | Everything + **shared** sponsor placements (category spotlight rotation + search sponsor row) |
| **⭐ Category Exclusive** | **$249/mo** or **$2,490/yr** (2 months free) | **You are the ONLY business featured in your category.** Always the spotlight, always #1, "Official [Category] Partner" badge. Includes all of Plus. |

### Why Category Exclusive is the money product
- **Scarcity is real, not fake.** 10 categories = 10 slots that ever exist. The
  database physically prevents a second owner (partial unique index). When you
  tell a dispensary "there's one dispensary slot and it's open," that's true.
- **It's the digital Main Street billboard.** In a 44K-person town, "the Official
  Dispensary / Jeweler / Flooring Company of Lompoc Locals" is a status buy, not
  a click buy. Local pride + exclusivity closes deals that CPC never would.
- **Renewal is defensive.** Once a competitor could take the slot, the owner
  keeps paying to keep them out. Churn drops.
- **Annual pricing front-loads cash** and locks the slot for a year.

### À la carte add-ons (any tier)
| Add-on | Price | What it does |
|---|---|---|
| Homepage Spotlight | $79/mo | Rotate into the homepage featured row |
| Weekly Digest Ad | $49/wk · $149/mo | Banner in the Monday email to every subscriber |
| Deal Boost | $29/mo | Pin one deal to the top of the feed |
| Launch Sponsor (Vandenberg) | $99/event | Your name on the rocket-launch event page + reactive social post |

*(Digest ad rates: reconcile with the existing memo — memory notes $49/wk, $79/mo,
$99/mo. Pick one and make it consistent before quoting.)*

---

## The pitch (30-second version)

> "Lompoc Locals is where locals go to find what's in town — deals, events, every
> business. Right now the **[category] category has no owner.** For $249 a month
> you become the *only* [category] business featured to everyone who browses it —
> top of the page, top of search, an Official Partner badge, and your deals in the
> weekly email. There's exactly one of these per category. Want me to lock it in
> before someone else does?"

**Close on scarcity + do-it-for-them:** "I'll set the whole thing up today — your
page already looks great (show them the live profile). You just approve it."

## Who to sell Category Exclusive to first
High-margin, competitive categories where being "the one" matters most:
1. **Dispensaries** — high margins, heavy competition, love local status. *(One Plant — SOLD, live exclusive.)*
2. **Retail / specialty** — jewelers, boutiques. *(Vargas — SOLD, live exclusive.)*
3. **Auto** — dealers/shops with real ad budgets.
4. **Real Estate** — agents pay for visibility; big commissions justify it.
5. **Wineries** — tasting-room tourism dollars.
6. **Health & Beauty** — med-spas, salons with recurring clients.

## Live demo you can show a prospect right now
Two exclusive owners are live as reference examples:
- **One Plant** owns **/category/dispensaries** — "Official Dispensaries Partner"
- **Vargas Jewelers** owns **/category/retail** — "Official Retail Partner"
Open those on your phone in the pitch: "This is exactly what you get."

---

## How it works in the product (for whoever runs sales)

- **Grant exclusivity:** `UPDATE businesses SET plan_override='premium', sponsor_exclusive=true WHERE id=<id>;`
- **The guarantee:** a partial unique index (`businesses_exclusive_category_idx`)
  makes it *impossible* to have two exclusive owners in one category — the second
  UPDATE errors. So you can't accidentally oversell a slot.
- **Behavior:** exclusive owner always wins the category spotlight (no rotation)
  and is pinned first in the search sponsor row, with the Official Partner badge.
  Non-exclusive Plus sponsors still appear, below the exclusive owner.
- **Remove:** set `sponsor_exclusive=false` (or `plan_override=null` to drop Plus).

## Follow-ups before charging real money
- Wire Category Exclusive to a real Stripe price ($249/mo) — currently granted via
  `plan_override` (comped). See `docs/marketing/vip-sponsors.md`.
- Fix `scripts/seed-stripe.ts` stale pricing (Free/Standard $19.99/Premium $39.99)
  before seeding Stripe products.
- Add a self-serve "Own your category" CTA on the category page / dashboard so
  prospects can see the offer without a sales call (Phase 2).
