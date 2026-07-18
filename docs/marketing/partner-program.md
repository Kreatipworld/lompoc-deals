# The Lompoc Locals Partner Program

## Naming — why "Partner"

We call paying businesses **Official Partners**, not "advertisers," "sponsors," or
"premium members." The word matters:

- **"Advertiser / sponsor"** reads as *paid ad* — the thing locals scroll past and
  the thing that made the homepage feel "salesy" earlier. It puts the business on
  the sell side and the reader on guard.
- **"Partner"** reads as *endorsement + belonging*. To a local it says "Lompoc
  Locals vouches for this business." To the business owner it says "we're in this
  together," which is exactly the neighborly, word-of-mouth posture Lompoc runs on.
- It also sells itself by contrast: a badged **Official Partner** at the top of a
  category makes the un-badged businesses below look like they're missing out —
  FOMO that recruits the next partner without a single "buy an ad" line.

**Consumer-facing language (what visitors see):**
- Plus & Exclusive businesses → **"Official Partner"** badge
- Category-Exclusive owner → **"Official [Category] Partner"** (e.g. "Official
  Dispensaries Partner")
- The join CTA → **"Become a Partner"** / "List your business"

**Internal language (billing tiers, in `lib/stripe.ts`):**
Free · Growth ($39.99) · Plus ($99.99) · Category Exclusive ($249). "Official
Partner" is the outward name for Plus and above.

## The methodology — we sell attention, partners fill it

Lompoc Locals is the town's information hub. Every page has **placements** (spaces).
A Partner's presence — their curated profile, their coupon, their badge — fills
those placements to buy them attention. One membership lights up the whole site.

## What an Official Partner gets (the value stack)

Shown as the "why pay" — every item is live in the product:

1. **Official Partner badge** — on their profile header, the homepage members row,
   and the search sponsor row. A trust mark locals recognize.
2. **Priority in their category** — Partners rank *first* in their category
   directory listing (exclusive owner, then Plus partners, then everyone else).
3. **Homepage Featured Members** — in the auto-drifting members marquee.
4. **Category slide** — featured at the top of their category page.
5. **Search sponsor row** — "From our local sponsors" on every search.
6. **Site-wide Featured Deals** — their coupon appears at the bottom of profiles,
   blog posts, events, and garage-sales — awareness across the whole site.
7. **Category cover** — the top Partner in a category becomes that category's photo
   on the homepage (a bonus for being the best-represented business).
8. **Done-for-you curated profile** — real photos, written about, verified contacts,
   logo. We set it up; they approve.
9. **Tier features** — unlimited deals, full analytics, priority support.

### Category Exclusive adds ($249/mo)
- **Sole ownership** of the category — the *only* business featured there.
- **Always #1**, never rotated.
- The **"Official [Category] Partner"** badge — one per category, ever
  (DB-enforced; can't be oversold).

## The pitch

> "Become the Official [Category] Partner of Lompoc Locals. You get the badge
> locals trust, top placement in your category, your deal featured across the whole
> site, and a page we build for you. There's one Partner spot per category — want to
> lock yours in before a competitor does?"

## Current Official Partners (10)
One Plant ⭐ (Dispensaries) · Vargas Jewelers ⭐ (Retail) · In&Out Tires (Auto) ·
American Stages (Real Estate) · Eddie's Grill, Jasper's Saloon (Food & Drink) ·
LAUNCHpad, Oliveira's, Valley Embroidery (Services). ⭐ = Category Exclusive.

## Operator reference
- Make a Partner: `UPDATE businesses SET plan_override='premium' WHERE id=<id>;`
- Make Category Exclusive: also `sponsor_exclusive=true` (one per category, enforced).
- Remove: set the field back to null/false.
- Always **curate the profile** when adding a Partner (see the `enrich-business` skill).
- See also: `sponsor-sales-playbook.md` (placement inventory), `vip-sponsors.md` (roster).
