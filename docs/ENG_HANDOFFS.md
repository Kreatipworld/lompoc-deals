# Engineering → Marketing Handoff Notes
*Last updated: 2026-04-09 (CMO added entry for 5046c43) | Owner: CTO (writes) / CMO (reads)*

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

## Homepage Category Sections + New Hero — shipped 2026-04-09 (commit 5046c43)

**What shipped:**
- Replaced flat TripAdvisor-style deals feed (single list) with per-category deal sections — homepage now shows one section per category (up to 6 deals each)
- New hero image: `lompoc-hero.jpg` replaces `lompoc-flowers-4.jpg`
- Removed tab strip (Events, Wineries tabs removed from homepage top navigation)
- Added `getDealsGroupedByCategory` query in `lib/queries.ts`

**How to test it:**
1. Go to lompoc-deals.vercel.app — homepage should show category sections (Restaurants, Services, etc.) each with up to 6 deal cards
2. Click "See all →" on any category section → should go to `/category/[slug]`
3. Confirm hero image is the Lompoc landscape photo (not flowers)
4. Confirm tab strip (Events/Wineries tabs) is no longer at top of page

**Events it fires:** Standard deal card click/view tracking (same as before — no new events)

**Marketing surfaces it unlocks:**
- **Category SEO boost:** Each category section = a distinct content block with category name as H2 — improves on-page SEO for `lompoc [category] deals` queries
- **"See all" link per category** → drives traffic to `/category/[slug]` pages — these are the pages CMO is building SEO copy specs for (see REQ-012)
- **Hero image:** New photo is more evocative of Lompoc landscape — better for OG image share on social (OG meta updated in commit `75f6954`)
- **Discovery structure change:** Events + Wineries are now accessed via category strip or `/category/[slug]` — not as top-level tabs. CMO wine/events strategy (M-017) must route to `/category/wineries` and `/category/events` instead of tabs. Update social copy accordingly.

**Known limitations:**
- All homepage sections (How It Works, FAQ, Testimonials, category section headings) are still hardcoded English — REQ-010 and REQ-011 cover i18n wiring
- `getDealsGroupedByCategory(6)` returns up to 6 deals per category — if a category has fewer than 6, shows all; if more, truncates. "See all" link handles overflow.
- **Events/Wineries removal from tabs:** This is a structural change. Marketing content (M-017 wine tourism) that referenced the "Wineries tab" should now link to `/category/wineries` instead. CMO noted, strategy updated.

**CMO action:** REQ-012 (category meta copy) submitted — CTO to apply category-specific SEO meta to `/category/[slug]` pages.

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

## Activities / "Things To Do in Lompoc" — shipped 2026-04-09 (commit 309655a)

**What shipped:**
- New `activities` table + 10 seeded Lompoc activities (La Purísima Mission, Jalama Beach, Wine Ghetto, flower fields, murals, rocket launches, etc.)
- `/activities` — browseable feed with category filter chips (outdoor, wine, history, adventure, family, dining, events, arts)
- `/activities/[slug]` — detail pages with Leaflet map pin, tips, quick-info sidebar
- Homepage: "Things to Do in Lompoc" section between Popular Businesses and How It Works
- Map page: activities now appear as green pins alongside purple business pins

**How to test it:**
1. Go to lompoc-deals.vercel.app — scroll past Popular Businesses to see "Things to Do" section
2. Click an activity card → should go to `/activities/[slug]` with map pin + tips
3. Go to lompoc-deals.vercel.app/activities → full feed with filter chips
4. Go to /map — green activity pins should appear alongside purple business pins
5. Test filter chips on /activities (outdoor, wine, etc.)

**Events it fires:** None yet (no analytics tracking on activity views — add activity_view event to REQ-001 backlog)

**Marketing surfaces it unlocks:**
- **SEO:** `/activities` and `/activities/[slug]` pages are indexable and target `things to do in lompoc` (500–1k/mo keyword). TouristAttraction JSON-LD schema needed on detail pages (see `marketing/seo/schema-markup-spec.md` — REQ-013).
- **TikTok:** Template 6 "Things to Do in Lompoc this weekend" now has a real URL to point to. Content calendar week 1 starts with this template.
- **Social:** Activity content is more shareable than deals — photos of missions, flower fields, wine ghetto → strong Instagram/Pinterest material.
- **Visitor/tourist audience:** Opens a new acquisition segment (visitors, new residents) beyond locals-seeking-deals. 
- **Internal linking:** Business profile pages for wineries/restaurants near an activity can cross-link to the activity — improves session depth.
- **Wine tourism:** `/activities/wine-ghetto` + `/activities/[winery-slug]` + M-017 wine content series now all connect.

**Known limitations:**
- Activities are static seed data — no admin UI to add/edit activities yet (CTO backlog)
- No analytics tracking on activity page views (add to REQ-001)
- Homepage "Things to Do" section is hardcoded English — needs i18n wiring (add to REQ-010/REQ-011)
- No Spanish descriptions on activity detail pages yet — CMO to provide ES copy for top 10 activities

**CMO action:** Added M-019 to marketing backlog (Activities SEO + social content strategy). Schema markup spec written: `marketing/seo/schema-markup-spec.md`.

---

## Deal Cards Show Business Cover Photo as Fallback — shipped 2026-04-13 (commit df9777f)

**What shipped:** Deal cards that have no deal-specific image now fall back to the business's cover photo. Both card variants (compact list card and featured/large card) updated. Alt text also corrected — uses business name when cover photo is shown.

**How to test it:**
1. Go to lompoc-deals.vercel.app — find a deal card that previously showed a grey placeholder
2. Confirm it now shows the business's cover photo instead
3. Hover the card — zoom animation should still work on the cover photo

**Events it fires:** None new (same click/view tracking as before)

**Marketing surfaces it unlocks:**
- **Feed looks richer immediately:** Any business with a cover photo uploaded now has visual presence in the deals feed — no more grey placeholder cards. The feed will look significantly more populated and alive.
- **Social screenshots:** Deal card screenshots for social posts (used in FIRST_WEEK_SPRINT.md Day 5 tactic) now look much better — no dead grey boxes.
- **Merchant value prop:** A cover photo now appears in two places — the `/biz/[slug]` profile page AND in deal cards across the feed. Stronger ROI argument for merchants to upload high-quality photos.
- **Outreach angle:** "Your cover photo appears everywhere your deals appear" — add this to merchant sales pitch and onboarding emails.
- **Reduces perceived emptiness:** New visitors browsing the feed see a visual-first experience instead of a text-with-grey-boxes experience — improves first impression for consumer acquisition.

**Known limitations:**
- Businesses without a cover photo still show the placeholder (unchanged behavior)
- No analytics on cover-photo-as-fallback impressions

**CMO action:** Update merchant onboarding email (Day 1) to emphasize cover photo upload — "Your cover photo appears in the deals feed across the whole site."

---

*CTO team: add new entries above this line when you ship something.*
