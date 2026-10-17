# Meta campaign: Lompoc business owners → Growth (Oct 2026)

Owner brief (Oct 17 2026): Meta (FB + IG), businesses → Growth $39.99/mo, $150–300/mo.
Rules that apply to every ad: no "free"/"trial", $39.99/month cancel anytime, no person's name
(we are "the Lompoc Locals team"), no member names/logos without their OK, no alcohol, only
numbers we can verify the day the ad goes live, Lompoc + Vandenberg only (93436/37/38).

## Why now (verified Oct 16–17)
- 22 paying members (21 Growth + 1 Plus). **0 new paid members so far in October** (Aug 15, Sep 10).
- 450 live listings, **374 still unclaimed** — food & drink 86, retail 71, services 58, auto 29,
  health & beauty 26, wineries 24, construction 13. The owner's page already exists: that's the hook.
- The business funnel gets almost no traffic: /partners 29 sessions in 30 days; organic search for
  "advertise / list my business" doesn't exist yet. Paid is the fastest way to put the offer in front of owners.
- ~2,250 site sessions in the last 30 days; Facebook (971) and Instagram (673) are where our audience already is.

## Structure ($200/mo default; $150 floor, $300 ceiling)

| Campaign | Objective | Budget | Audience |
|---|---|---|---|
| META_Leads_Owners-Lompoc_Claim+Growth_2026-10 | Leads (website) → optimize for Landing Page Views until the pixel has ~15 Lead events, then switch to Lead | ~$5/day | Broad: Lompoc + 15 mi radius (covers 93436/37/38 + Vandenberg Village/Mission Hills), 25–65+, no interests. Creative does the targeting. |
| META_Retarget_Partners-Visitors_Growth_2026-10 | Leads | ~$1.50/day | Website visitors 30d to /for-businesses, /partners, /signup, /dashboard (no paid_upgrade). Excludes current members. |

One CBO for prospecting with 8 ads (4 angles × EN/ES). Spanish ads run in the same ad set: Lompoc's owner base is
heavily bilingual (El Culichi, Taquería Don Tacho converted with Spanish kits).

Exclude: a customer list of current member emails (22), and anyone who fired paid_upgrade.

## Angles (creative = targeting)

1. **A1 · Your page is already live** — "Lompoc business owners: your page is already on Lompoc Locals. Claim it in 3 minutes."
   Identity-trigger variants once A1 has data: "Lompoc **restaurant** owners…", "…**auto shop**…", "…**salon**…", "…**contractor**…" (the categories with the most unclaimed pages).
2. **A2 · Join 22 local members** — "22 Lompoc businesses are already members. Show up first when neighbors search."
   Naming members (Eddie's Grill, Hangar 7, In&Out Tires…) would be stronger — only with each member's OK.
3. **A3 · Post a special, reach town** — "Post this week's special. Lompoc sees it." Deals feed + Monday email.
4. **A4 · A video for your business** — "Week one: we make a spotlight video for your business." Plus run the best
   existing Member Spotlight reel as a video ad (owned media, proven organically) — after that member says yes.

Statics first (cheap, Andromeda favors volume); one fresh static per week for the winning angle.

## Landing
- A1 → `/for-businesses?utm_source=meta&utm_medium=paid&utm_campaign=growth-claim&utm_content=<ad>` with the
  search box "Find your business" above the fold (claim path). A2–A4 → `/for-businesses` (pricing + proof).
- Mirror the winning headline in the /for-businesses H1 after 2 weeks of data (headline-mirror test).

## Tracking (needed before launch)
- Our analytics already stores UTM (lib/analytics/campaign.ts) and `paid_upgrade` → we can count signups per ad.
- **Meta Pixel: BUILT Oct 17 (components/analytics/meta-pixel.tsx), business-funnel pages only; set NEXT_PUBLIC_META_PIXEL_ID in Vercel production to turn it on.** Spec was: pixel script site-wide (client, no cookies read server-side), events
  `ViewContent` on /for-businesses + /partners, `Lead` on business signup/claim submitted, `Subscribe`
  (value 39.99) on paid_upgrade; Conversions API from the Stripe webhook later. Needs the Pixel ID from the
  owner's Meta Events Manager.

## Numbers that decide (check every Monday)
- Break-even: a Growth member ≈ $39.99 × ~6 months ≈ $240 → **max $80 per paid member** for now.
- Kill an ad after ~$15 spend with CTR < 0.8% or zero landing-page views; kill an angle after $60 with no claim/signup.
- Expect at $200/mo: ~20–30K impressions, ~8–12K people reached (frequency ~2–3), ~150–300 landing views.
  Target: 3–6 claims and 1–3 paid members in month one. Below 1 paid member after $300 → rethink offer, not just ads.
- Scale only in +20% steps, 3–5 days apart.

## Owner to-dos (accounts — can't be done for you)
1. Meta Business Manager → ad account for Lompoc Locals, connected to the Lompoc Locals Facebook Page + Instagram, payment method.
2. Events Manager → create a Pixel, send the Pixel ID.
3. OK (or not) on naming members in A2 and running a Member Spotlight reel as an ad.

## Creative files
Rendered statics: scratchpad/meta-ads/ (A1–A4, EN + ES, 4:5 feed + 9:16 stories) — approved set gets copied to
docs/marketing/assets/meta-ads/ before upload.
