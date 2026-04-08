# Engineering → Marketing Handoff Notes
*Last updated: 2026-04-07 | Owner: CTO (writes) / CMO (reads)*

Every feature the CTO team ships that has marketing relevance gets a handoff note here. Format below.

---

## HANDOFF TEMPLATE

```
## [FEATURE NAME] — shipped [DATE]

**What shipped:** (1-2 sentences)
**How to test it:** (step-by-step, plain English)
**Events it fires:** (analytics event names + payload)
**Marketing surfaces it unlocks:** (which channels / campaigns this enables)
**Known limitations:** (what doesn't work yet, edge cases)
```

---

## Platform Baseline (as of 2026-04-07)

**What shipped:** Core platform v1 — consumer feed, business dashboard, deal CRUD, auth, map, email digest infra, Stripe billing code (keys not yet active).

**How to test it:**
1. Go to lompoc-deals.vercel.app
2. Browse the feed — deals visible without login ✅
3. Search by keyword ✅
4. Filter by category ✅
5. Click "Sign Up" as a local → favorites + digest subscribe ✅
6. Click "Sign Up" as a business → create profile + post deal ✅ (requires admin approval)
7. Map page → all businesses pinned ✅
8. EN/ES toggle in header ✅

**Events it fires:** view_count and click_count increment on deal pages (stored in DB, no external analytics yet)

**Marketing surfaces it unlocks:**
- Social media (shareable deal URLs)
- Email (subscriber list + digest infra ready)
- Merchant outreach (live product to demo)
- SEO (indexed pages for businesses + deals)

**Known limitations:**
- No Google Analytics / external tracking yet (REQ-001)
- Stripe billing not active (keys missing)
- Digest cron not tested in production (REQ-004)
- No merchant view count widget in dashboard (REQ-003)
- No welcome/onboarding email sequences (REQ-002)

---

## Free / Standard / Premium Pricing — shipped 2026-04-08

**What shipped:** Payment plans restructured from Basic/$49, Pro/$99, Premium/$199 to Free/$0, Standard/$19.99, Premium/$39.99. Free tier allows 3 active deals with no Stripe required. Paid tiers require Stripe checkout.

**Plan comparison:**
- **Free ($0/mo):** 3 deals, profile, logo+cover, map pin, weekly digest
- **Standard ($19.99/mo):** 15 deals, everything in Free, view+click analytics, social links, hours + Google reviews
- **Premium ($39.99/mo):** Unlimited deals, everything in Standard, priority listing, featured homepage placement, real estate listings module

**How to test it:**
1. Go to lompoc-deals.vercel.app/for-businesses — verify the 3-tier pricing cards
2. Click "Get started free" — verify no Stripe prompt on Free signup
3. Click "Get started" on Standard — verify Stripe checkout triggers

**Events it fires:** None new (no analytics yet — REQ-001 still needed)

**Marketing surfaces it unlocks:**
- Merchant outreach: "Start free, no credit card" removes #1 objection — update all sales copy
- Landing page: Free tier headline should be the primary CTA above the fold
- Social: "List your business FREE" hook for all organic posts
- Upsell email: trigger at deal #3 ("You've hit your free limit — upgrade to Standard for $19.99/mo")
- Paid acquisition: now viable to run "free signup" funnel vs. asking for $49 upfront

**Known limitations:**
- Stripe keys still not active in production (B-001 still needed to collect Standard/Premium revenue)
- No analytics to measure conversion between tiers (REQ-001 still needed)

---

## Dispensaries Category — shipped 2026-04-07

**What shipped:** New "Dispensaries" category with Leaf icon. 5 verified Lompoc dispensaries seeded: Leaf, Elevate, Oceans, TRD, One Plant.

**How to test it:**
1. Go to lompoc-deals.vercel.app — look for "Dispensaries" in the category strip
2. Filter by Dispensaries — 5 businesses should appear

**Events it fires:** Standard click/view tracking (same as all categories)

**Marketing surfaces it unlocks:**
- **High-value niche:** Cannabis businesses CANNOT advertise on Google Ads or Meta/Instagram. Lompoc Deals is one of very few legitimate marketing channels for them. This is a premium value prop for dispensary merchant acquisition.
- Targeted outreach to all 5 (+ any unlisted) Lompoc dispensaries with this angle
- Potential "Cannabis Deals" editorial content (legal in CA, low competition)

**Known limitations:** Dispensary deal copy must comply with CA cannabis advertising regulations (no health claims, age-gate required — check compliance before paid ads in this category)

---

## Wineries Tab + 50+ New Businesses — shipped 2026-04-07

**What shipped:** New "Wineries" category with Wine icon. 20 Lompoc Wine Ghetto / Santa Rita Hills wineries + 30 other businesses (food, retail, services, health, entertainment, auto) seeded. Wineries tab added to homepage alongside Deals and Events.

**How to test it:**
1. Homepage — click "Wineries" tab — winery cards should appear
2. Category strip — "Wineries" filter
3. Total businesses: ~150+ now listed

**Events it fires:** Standard click/view tracking

**Marketing surfaces it unlocks:**
- Wine tourism content: wine tasting deals, Santa Rita Hills itinerary posts — highly shareable
- Instagram/TikTok: winery deals are visually compelling content
- Seasonal campaigns: harvest season (Aug–Oct), Valentine's tastings, Mother's Day
- Partnership pitches: Wine Ghetto association, Santa Barbara County Vintners
- SEO: `/lompoc/wine-deals`, `/lompoc/wineries`, Santa Rita Hills long-tail keywords

**Known limitations:** Winery deals may be seasonal — monitor deal expiration rates for this category

---

*CTO team: add new entries above this line when you ship something.*
