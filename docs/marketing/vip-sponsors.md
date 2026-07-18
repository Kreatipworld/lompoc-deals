# Plus-Tier Sponsor Roster ($99.99/mo)

Founding sponsor clients on the **Plus (premium)** tier. Each gets the sponsor
placements shipped 2026-07-17: a **category landing spotlight** (top of their
category page) + inclusion in the **search ad row** ("From our local sponsors").

Set via `businesses.plan_override = 'premium'` (admin override; no Stripe sub
required). To add/remove a sponsor:
`UPDATE businesses SET plan_override = 'premium' WHERE id = <id>;`  (NULL to remove)

Placements: `lib/sponsors.ts` + `components/sponsor-spotlight.tsx` (category) +
`components/sponsor-row.tsx` (search). Daily rotation gives fair top billing when
a category has more than one sponsor.

## Current sponsors (6)

| Business | Category | Owns spotlight on | Profile |
|---|---|---|---|
| One Plant Lompoc | Dispensaries | /category/dispensaries | /biz/one-plant-lompoc |
| Vargas Jewelers | Retail | /category/retail | /biz/vargas-jewelers-trophies-awards |
| Oliveira's Fashion Floors & Restoration | Services | /category/services (rotates) | /biz/oliveiras-fashion-floors-restoration |
| Valley Embroidery | Services | /category/services (rotates) | /biz/valley-embroidery |
| Eddie's Grill | Food & Drink | /category/food-drink (rotates) | /biz/eddies-grill |
| Jasper's | Food & Drink | /category/food-drink (rotates) | /biz/jasper-s |

**Note on shared categories:** Services (Oliveira's + Valley Embroidery) and
Food & Drink (Eddie's + Jasper's) each have two sponsors, so the spotlight
rotates daily between them. If you sell an *exclusive* category spotlight later,
that's a product decision — the current code shows one sponsor per day per
category, cycling through all of them.

## Curation status
All six profiles are fully curated (real logo where available, hand-picked
Google/website photos, factual about text, verified contacts). One Plant's photo
set is thin — their Google gallery is mostly customer product shots; worth asking
them for brand/interior photos to strengthen the spotlight banner.

## Billing follow-ups (not in code)
- No Stripe subscriptions attached — these are comped/manual founding sponsors
  via plan_override. When ready to bill, wire them to real premium subscriptions
  so `effectiveTier()` resolves without the override.
- `scripts/seed-stripe.ts` still has the OLD price structure (Free/Standard $19.99/
  Premium $39.99) vs. the intended Free / Growth $39.99 / Plus $99.99 — fix before
  seeding Stripe products.
