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

## Welcome Emails + Business Follows + Deal Notifications + Password Reset — shipped 2026-04-15 (commits d7d3ea3 + d3f1c73 + 2243854)

**What shipped:**

**`d7d3ea3` — Welcome email on signup (REQ-002 COMPLETE):**
- Bilingual EN/ES welcome email sent to both local users and business signups after account creation
- Uses Resend, fire-and-forget (won't block signup)
- **REQ-002 from CMO_REQUESTS.md is now done.** The Day 0 email in the merchant onboarding drip is now live automatically.

**`d3f1c73` — Business follows + deal notifications:**
- `business_follows` table (migration 0012)
- Follow/unfollow button on every `/biz/[slug]` page for logged-in local users
- Notification prefs toggle on account page (`/account`)
- Email notification sent when a **favorited deal is updated**
- Email notification sent when a **followed business posts a new deal**
- One-click unsubscribe at `/api/notifications/unsubscribe`

**`2243854` — Forgot-password / account recovery:**
- `/forgot-password` → sends reset link via Resend (1-hour expiry)
- `/reset-password` → validates token, updates password
- Login form now has "Forgot password?" link

**How to test it:**
1. Sign up as a local user → check inbox for welcome email
2. Go to `/biz/[any-business-slug]` while logged in → Follow button should appear
3. Follow a business → business posts a new deal → check email for notification
4. Go to `/account` → notification preferences toggle
5. Log out → go to `/login` → click "Forgot password?" → enter email → check inbox for reset link

**Marketing surfaces this unlocks:**

- **REQ-002 done.** Day 0 welcome email fires automatically for all new signups. Both the consumer welcome and merchant welcome sequences from `marketing/email/` are now auto-triggered. The drip sequences I wrote can be loaded into Resend as follow-on automations.

- **Business follows = the notification moat.** Every local user who follows a business will receive an email the moment that business posts a new deal. This creates a direct email channel between merchants and their most engaged customers — no Mailchimp required, no extra cost. For merchants: "When you post a deal, everyone who follows your business gets an email." This is the most compelling merchant value prop the platform has had.

- **Viral loop:** Locals follow businesses → businesses get motivated to post deals → followers get notified → followers claim deals → merchants see ROI → merchants upgrade. This is the engine that drives organic MRR growth.

- **Follow button on `/biz/[slug]`** — every business profile page now has a Follow button. This is a new acquisition surface: "Follow this business for deal alerts" is a softer CTA than "Sign up" — converts browsers into registered accounts.

- **Notification prefs on /account** — transparent opt-out. Good for email deliverability and CAN-SPAM compliance.

- **Forgot password** — reduces churn from account lockouts. Affects both consumers and merchants.

**CMO actions taken:**
- Updated merchant onboarding drip: Day 0 email is now live (automatic via Resend)
- Updated for-businesses pitch copy to highlight the follows/notifications feature
- Updated social copy to encourage locals to follow businesses

---

## Consumer Landing Page /locals + Auth Fix — shipped 2026-04-15 (commits 2e9f3fa + 60e74dc + 63657b7 + 016628e)

**What shipped:**

**`2e9f3fa` + `60e74dc` + `63657b7` — `/locals` consumer conversion page:**
- Full landing page at `/locals` targeting Lompoc residents: hero with live stats, 3-step how-it-works, 6-benefit grid, "free forever" feature checklist, category teaser, final CTA → `/signup/user`
- SEO metadata: "For Locals — Discover Deals & Support Lompoc Businesses | Lompoc Deals"
- Keywords: `lompoc locals`, `lompoc deals for residents`, `lompoc local discounts`, `things to do lompoc`, `support local lompoc`
- Already uses "470+" live stats
- Added to: mobile nav, desktop nav, footer "For Locals" column
- Bilingual EN/ES translations included

**`016628e` — Auth middleware fix:** Uses NextAuth v5 `auth()` instead of deprecated `getToken()`. Internal stability fix.

**How to test it:**
1. Go to lompoc-deals.vercel.app/locals — full consumer landing page with live stats
2. Mobile nav → "For Locals" link
3. Footer → "For Locals" column link
4. CTA → `/signup/user` local user signup

**Marketing surfaces it unlocks:**

- **Canonical consumer CTA URL is now `/locals`** (not homepage). Use `lompoc-deals.vercel.app/locals` as the "link in bio" on Instagram/TikTok and in all consumer-facing posts. It's purpose-built to convert browsers → signups.

- **Nextdoor + Facebook posts**: Replace `lompoc-deals.vercel.app` with `lompoc-deals.vercel.app/locals` in all consumer community posts. The `/locals` page directly answers "what's in it for me as a resident" before asking them to sign up.

- **SEO**: `/locals` is a new indexable page targeting `lompoc locals` and `support local lompoc` — low competition, high community intent keywords.

- **Bilingual out of the box**: `/es/locals` is live for Spanish-speaking residents — use this URL in Spanish-language community posts (Nextdoor Spanish speakers, Spanish Facebook groups).

**CMO action taken:** Updated TikTok scripts (stale "150 businesses" → "470+"). Updated `marketing/pr/launch-playbook.md` to use `/locals` as consumer CTA.

---

## Properties Module + Plan Features Grid on Dashboard — shipped 2026-04-14 (commit 26cf470)

**What shipped:**
- **`/dashboard/properties`** — Premium-gated property listings CRUD (add, edit, remove). Standard/Free users see an upgrade gate with billing CTA.
- **Dashboard nav** — "Properties" link appears only for Premium users (`canListRealEstate = true`)
- **Plan features grid on Overview** — All 5 features (analytics, social links, properties, priority ranking, featured on homepage) shown with enabled/locked states and per-feature upgrade CTAs
- **"Manage properties" quick action** on Overview — Premium CTA for non-premium users

**How to test it:**
1. As Premium: go to `/dashboard/properties` — full property list with Add/Edit/Delete
2. As Free/Standard: go to `/dashboard/properties` — upgrade gate with billing link
3. Dashboard Overview → features grid shows all features with lock/unlock state

**Marketing surfaces it unlocks:**

- **New Premium acquisition vertical: Lompoc real estate.** Property listings are now a fully functional Premium-only feature. Target: Lompoc real estate agents, property managers, rental agencies — military families relocating to/from Vandenberg SFB drive a large, recurring rental and purchase market. Premium at $39.99/mo is cheap vs. Zillow/Realtor.com listing fees.

- **In-dashboard upsell grid:** The features grid on the Overview page is the best upsell surface in the app. Every free and standard merchant now sees all 5 premium features listed with lock icons, each with a direct "Upgrade" CTA. This creates persistent upsell exposure at every login.

- **Properties as differentiation:** "List your rental properties and homes for sale directly on Lompoc's local business directory" is a unique offer. No other local platform in Lompoc has this. Add to competitive differentiation matrix.

**CMO action:** Create targeted pitch content for Lompoc real estate businesses. New file: `marketing/sales/realestate-pitch.md`.

---

## Business Dashboard Overview + Upgrade Upsell System — shipped 2026-04-14 (commit 0fac879 + e2aa310)

**What shipped:**

**`0fac879` — Business dashboard overview page:**
- Dashboard root (`/dashboard`) now shows a full Overview page instead of redirecting to Profile
- **Plan status card:** current tier, subscription status, renewal date
- **Deal usage bar:** active deals / tier limit with color coding. Warning at 75% usage ("running out"), blocked state at limit
- **Metrics strip:** active deal count, total views, total clicks (all-time)
- **Quick actions:** Add Deal, Edit Profile, Manage Billing
- **Upgrade nudge CTA for Free tier:** persistent banner when at or near deal limit
- **Stats page gated:** Free merchants see an upgrade prompt on `/dashboard/stats` instead of data

**`e2aa310` — Admin dashboard resilience:** Prevent crash when DB data is unavailable (internal fix).

**How to test it:**
1. Sign up as a business → go to `/dashboard` — should see Overview (not redirect to profile)
2. As Free tier: create 3 deals → Usage bar should show 100%, upgrade CTA appears
3. Go to `/dashboard/stats` on Free tier → should see upgrade prompt, not data
4. On Standard+: go to `/dashboard/stats` → should see views/clicks data

**Marketing surfaces it unlocks:**

- **Built-in upgrade funnel is now live:** Free merchants who use the dashboard will organically see upgrade prompts as they approach their 3-deal limit. This is the highest-leverage upsell mechanism to date — no outbound needed. The platform upsells itself.

- **Stats page as Standard upsell:** Free merchants visiting `/dashboard/stats` see a locked screen prompting upgrade to Standard ($19.99). This is a "pain point at the right moment" upsell — the merchant wants their data, the unlock is one click away.

- **Merchant activation reinforcement:** The views/clicks metrics strip on the Overview makes merchants feel the platform is working for them. "You got 47 views this week" → emotional investment → less churn.

- **Onboarding email opportunity:** Day 3 onboarding email (currently in backlog) should say: "Check your dashboard → see how many people viewed your listing this week." This drives dashboard visits and exposes the upgrade prompt.

- **Retention hook:** "Welcome back, [Business Name]" + metrics → reason to log in weekly. Higher DAU/MAU = higher upsell conversion rate.

**CMO action:** Update merchant onboarding email sequence Day 3 to reference the dashboard metrics and nudge to `/dashboard/stats` for Standard upsell.

---

## Business Count Correction + Mobile Scroll Nav — shipped 2026-04-14 (commit 9cf9b96 + 613b3c0)

**What shipped:**

**`9cf9b96` — 35 non-Lompoc businesses removed:**
- 35 seed businesses with addresses outside Lompoc Valley (CO, SF, KY, TN, OH, TX, etc.) rejected
- Approved business count: **471** (was 506 including bad data; was previously reported as ~155 due to stale count)
- Hardcoded "155+" removed from `/businesses` page SEO metadata — count is now dynamic

**`613b3c0` — Bottom nav hides on scroll down, reveals on scroll up:**
- Standard mobile UX pattern (Instagram-style). Nav hidden while reading content, reappears when scrolling back up.
- Smooth 300ms transition. Triggers at >4px scroll down, reveals within 60px of page top.

**How to test it:**
1. `/businesses` — confirm title no longer says "155+ Local Businesses"
2. Mobile: scroll down the deals feed — bottom nav bar should slide away. Scroll up — it reappears.

**Marketing impact:**

- **471 is the real number** — and a dramatically stronger social proof point than 155. All marketing copy updated from "155+" → "470+" (commit below). Use "470+ Lompoc businesses" in all outreach, social posts, and sales pitches going forward.
- **Data integrity:** All 471 listed businesses are real Lompoc-area businesses — confirmed clean for outreach campaigns and social proof claims.
- **Mobile UX:** Scroll-away nav = more screen space for deal browsing = better content consumption experience on phones = higher engagement and return visits.

**CMO action taken:** Updated all active marketing files (google-ads-brief, launch-announcement, tiktok-script-templates, HOMEPAGE_COPY, THIS_CYCLE, MARKETING_BACKLOG) from "155+" to "470+". KPIS.md updated with new baseline.

---

## Admin Dashboard Expanded + DB Migrations Applied to Production — shipped 2026-04-14 (commit 4feb620 + 0bfb574)

**What shipped:**

**`4feb620` — Admin dashboard expansion:**
- New `/admin/users` page — full user table with role badges, per-row role change form
- New `/admin/deals` page — deal table with type/status badges, pause/remove actions
- Admin nav: Overview / Users / Deals / Events
- Expanded KPI strip: approvedBusinesses, activeDeals, events count, totalDealEvents
- Activity feed: 20 most recent cross-platform events
- `seed-admin` script to promote andres@kreatipdesign.com to admin role

**`0bfb574` — Stripe error handling + production DB migrations applied:**
- Premium/Standard signup no longer crashes on Stripe errors — shows user-facing error instead
- Validates checkout session URL before redirect
- **PRODUCTION DB UPDATED VIA NEON MCP:** Migration 0010 (`name`, `city`, `zip`, `interests_json` on users; `owner_full_name`, `plan_override`, `grace_period_ends_at` on businesses) is now live in production. Migration 0008 events table fix (`source`, `external_id`) also applied.

**How to test it:**
1. Sign in as admin at lompoc-deals.vercel.app/admin — confirm expanded nav (Overview / Users / Deals / Events)
2. `/admin/users` — verify user table with role badges and role change form
3. `/admin/deals` — verify deal table with pause/remove actions
4. Try Premium signup — confirm graceful error message if Stripe env vars not yet set

**Events it fires:** `totalDealEvents` now tracked in admin stats

**Marketing surfaces it unlocks:**

- **Trial fulfillment is now self-service for admin:** With `plan_override` live in production and the admin `/users` page, the admin can find any business account and grant Premium trial status. The "30-day free trial" offer in winery pitch emails is fully operational — no CTO involvement needed after signup. Process: winery signs up → admin finds their account → sets `plan_override = premium` + `grace_period_ends_at = +30 days`.

- **Real-time platform health:** Admin can monitor the activity feed and see deals being posted, users signing up, and events firing. CMO can check this to gauge momentum from outreach campaigns.

- **Deal moderation:** Admin can pause or remove deals — gives confidence to merchants that the platform is actively managed (not abandoned). Use in sales pitch: "We actively moderate the platform to keep quality high."

- **KPI visibility:** `approvedBusinesses` + `activeDeals` counts are now queryable. CMO can pull live numbers for social proof in outreach ("Join 150+ Lompoc businesses already listed").

**Known limitations:** `plan_override` in admin panel requires direct action — no automated trial-expiry email yet (add to lifecycle email backlog).

---

## Mobile Nav + Business Signup Wizard + Plan Features — shipped 2026-04-14 (commit 5d82081 + 0eb81da + 7d217ce)

**What shipped (this is a multi-feature release):**

1. **Mobile hamburger menu** — Slide-out drawer on mobile (`<sm`). All major nav sections included: Home, Deals, Search, Directory, Map, Subscribe, For Businesses, Account, Sign In/Sign Up. Active-link highlighting, body-scroll lock.

2. **Business signup wizard** — Multi-step form replacing the single-page signup. Includes a step progress bar. Collects: business name, category, owner name, phone, address, plan selection, and immediately prompts the first deal post during signup (`/signup/business/first-deal`).

3. **User signup form** — Separate local user signup collects: name, email, city, zip, interests (JSONB). Enables segmented email campaigns by location and interest.

4. **Plan features codified** (`lib/plan-features.ts` + `lib/stripe.ts`):
   - Free: analytics ✗, social links ✗, real estate ✗, priority ranking ✗, featured on homepage ✗
   - Standard ($19.99): analytics ✅, social links ✅, real estate ✗, priority ranking ✗, featured on homepage ✗
   - Premium ($39.99): all features ✅

5. **Billing page** — Now shows active deal count with usage progress bar (deals used / tier limit), feature checklist per tier.

6. **DB migration** (`0010_add_signup_fields.sql`):
   - Users: `name`, `email_verified`, `city`, `zip`, `interests_json`
   - Businesses: `owner_full_name`, `plan_override` (admin override of tier), `grace_period_ends_at`

**How to test it:**
1. On mobile: go to lompoc-deals.vercel.app — confirm hamburger icon in header. Tap → slide-out drawer with all nav links.
2. Go to `/signup` → select "I own a business" → multi-step wizard should start
3. Complete wizard steps → step 3 should show "Post your first deal" form
4. Complete first deal → land in dashboard
5. Go to `/dashboard/billing` — should show current plan, deal usage bar, feature checklist

**Events it fires:** None new (standard auth flow)

**Marketing surfaces it unlocks:**

- **Mobile conversion:** Local Lompoc users are primarily on phones. The hamburger menu unblocks mobile navigation — "Subscribe", "For Businesses", and "Sign Up" are now reachable without desktop. Direct impact on signup conversion rate.

- **First-deal activation at signup:** This is the single biggest activation improvement in the platform's history. Merchants now post their first deal *before* they finish signing up. Activation rate (merchants who post ≥1 deal) should jump from unknown → near 100%. Update all onboarding and sales copy to reflect this.

- **Plan override for trials:** The `plan_override` field on businesses means admin can manually set any business to Premium without going through Stripe. **This directly enables the "30-day free trial of Premium" offer in the winery pitch emails.** No Stripe coupon needed — just set `plan_override = 'premium'` with a `grace_period_ends_at` date. CMO can now confidently offer trials in outreach.

- **User interests/location data:** Local user signup now collects city, zip, and interests. This enables segmented email digest campaigns — e.g., send wine deals only to users who listed "wine" as an interest, or send deals only to users in zip 93436. Upgrade digest strategy when email is wired.

- **Billing page upsell:** The feature checklist on `/dashboard/billing` is now a built-in upsell tool — Free users see exactly what they're missing, with visual lock/unlock indicators.

**Known limitations:**
- Mobile menu: hidden above `sm` breakpoint (desktop uses existing horizontal nav)
- `plan_override` requires direct DB access or admin UI (no admin panel yet) — coordinate with CTO for trial fulfillment
- User interests not yet used in deal feed personalization (future CTO backlog item)

**CMO actions:**
- Update merchant onboarding email (Day 1) to mention "post your first deal at signup — it takes 2 minutes"
- Update winery pitch emails to offer "30-day Premium trial" confidently (CTO can set plan_override)
- Add merchant pitch line: "Your first deal goes live the moment you finish signing up"

---

## Premium "Go Premium" Option Added to Signup Flow — shipped 2026-04-13 (commit 7edba9c)

**What shipped:** A third "Go Premium" option ($39.99/mo, Crown icon) added to the signup role selector. The role selector is now a 3-column grid: "I'm a local" / "I own a business" (Free) / "Go Premium". Selecting "Go Premium" creates a business account and immediately redirects to a Stripe checkout session for the Premium subscription. Cancel URL (`/signup?plan=premium&canceled=1`) returns to signup with Premium pre-selected and a cancellation notice. Falls back to `/dashboard/billing?setup_required=1` if `STRIPE_PRICE_PREMIUM` env var is not set.

**How to test it:**
1. Go to lompoc-deals.vercel.app/signup — confirm 3-column role selector (Local / Business / Go Premium)
2. Select "Go Premium" → fill in name/email/password → submit
3. Should redirect to Stripe checkout for $39.99/mo
4. Click "cancel" in Stripe → should return to `/signup?plan=premium&canceled=1` with amber cancellation notice and Premium pre-selected
5. Complete checkout → should land in dashboard as a Premium business

**Events it fires:** None new (same auth flow events)

**Marketing surfaces it unlocks:**
- **Direct Premium acquisition funnel:** High-intent visitors can now go from homepage → `/signup` → Premium in under 2 minutes. Link to `/signup` (not `/for-businesses`) for Premium-specific outreach.
- **Winery pitch CTA simplification:** Emails to Brewer-Clifton, Stolpman, etc. can now say: "Go to lompoc-deals.vercel.app/signup, select 'Go Premium', and you're live in 2 minutes." No separate billing step.
- **Pre-selected Premium landing:** `/signup?plan=premium` pre-selects the Premium option — use this URL in Premium-targeted social posts, DMs, and email CTAs for high-value merchant acquisition.
- **Reduced drop-off:** Previous flow required signing up as a business (Free) then upgrading later. Now Premium buyers go straight to checkout without a second step.
- **Urgency hook:** The cancel/return flow with amber notice is a soft re-engagement — "Your Premium spot is still available."

**⚠️ Still needs:** `STRIPE_PRICE_PREMIUM=price_1TK86YJ5L7dJU4p33KnRIb9a` env var in Vercel (B-001). Until set, Premium signup falls back to `/dashboard/billing?setup_required=1`.

**CMO action:** Update winery-pitch-named.md Premium CTA URLs and simplify the signup instructions. Add `/signup?plan=premium` as the canonical CTA URL for all Premium-tier outreach.

---

## Digest Cron coverUrl Fix — shipped 2026-04-13 (commit a8885eb)

**What shipped:** TypeScript build fix — `bizCoverUrl` added to the digest cron query to match the updated `DealCardData` type from commit `df9777f`. No behavioral change.

**Marketing surfaces it unlocks:** Digest emails now send correctly (build was failing). The email digest cron is unblocked — deal cards in digest emails will also use cover photo fallback when no deal image exists.

**Known limitations:** None new.

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

## Landing Page Search — Typewriter Animation + Autocomplete — shipped 2026-04-15 (commit 6f43cad)

**What shipped:** The homepage search bar now has two UX enhancements:
1. **Typewriter placeholder** — when the bar is empty and unfocused, it cycles through example queries ("pizza near downtown…", "wine tasting deals…", "hair salon specials…", "auto repair coupons…", "coffee shops…", "yoga classes…", "fresh flowers…", "local restaurants…").
2. **Autocomplete dropdown** — as users type (250ms debounce), a dropdown shows grouped results: businesses (with logo + category) and active deals (with discount badge). Full keyboard navigation (arrows, enter, escape). Clicking a business goes to its profile; clicking a deal goes to search results.

New endpoint: `GET /api/search/autocomplete?q=<query>`

**How to test it:**
1. Go to lompoc-deals.vercel.app — watch the search bar cycle through example queries
2. Click the search bar and type "pizza" — autocomplete dropdown should appear with matching businesses and deals
3. Use arrow keys to navigate, Enter to select, Escape to close

**Events it fires:** No new analytics events (click/navigation events via existing router)

**Marketing surfaces it unlocks:**
- **First impression at the fold:** Every visitor sees the typewriter cycling through local categories before they even type. This acts as ambient advertising — visitors learn what Lompoc Deals covers without reading any copy. "wine tasting deals" tells a story instantly.
- **Discovery engine for deals:** Autocomplete surfaces active deals with discount badges right in the search box — turning passive browsing into active deal discovery.
- **Merchant logo visibility:** Businesses appear in autocomplete results with their logo. Merchants with a logo uploaded get a visual advantage every time a user searches for anything near their name or category. New merchant upsell hook: "Upload your logo — it appears in search results."
- **Reduces bounce from "where do I start?"** New visitors no longer face a blank search bar. The typewriter demonstrates the breadth of available deals, increasing the chance they engage.
- **Ad creative asset:** Screen-record the typewriter animation cycling through categories → 3-second social video that sells the concept without a single word of voiceover.

**Known limitations:**
- Autocomplete only searches businesses and active deals (not categories or locations)
- No analytics on autocomplete click-through rate yet

**CMO action:**
- Update HOMEPAGE_COPY.md to reflect the search bar now being an animated experience — this is a visual hook for social posts
- Add "Upload your logo — it appears in search results and autocomplete" to merchant onboarding Day 1 email
- Create a screen-record TikTok/Reel: typewriter animation → user types → autocomplete appears → clicks a deal. Zero voiceover needed.

---

## Telegram Bot — Board Communication — shipped 2026-04-15 (commits 4a8feaa + 8cf84c0)

**What shipped:** A Telegram bot that gives the board real-time visibility into the platform and two-way messaging with the CEO agent.

- `4a8feaa` — Webhook at `/api/telegram/webhook`. Commands: `/start`, `/help`, `/status` (returns live deal count + approved business count from the DB). Setup endpoint at `/api/telegram/setup`.
- `8cf84c0` — Two-way messaging: DB tables `telegram_settings` + `telegram_messages` (migration 0013). `/start` registers the board's Telegram chat ID. Free-text messages and `/ask <question>` are queued for the CEO. `GET /api/telegram/inbox` returns unread messages. `POST /api/telegram/send` lets the CEO reply.

**Required env vars:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (see `.env.example`)

**How to test it:**
1. Add `TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET` to Vercel env
2. Call `POST /api/telegram/setup` to register the webhook with Telegram
3. Open the bot in Telegram → `/status` → should return live deal and business counts

**Events it fires:** None (not wired to analytics)

**Marketing surfaces it unlocks:**
- **Operational monitoring:** Board can check `/status` in Telegram to see live deal count and business count at any time — a real-time pulse on platform health.
- **Future: deal alert channel.** The Telegram infrastructure is now live. A next step (CMO request) would be a public Telegram channel where new deals are broadcast automatically — giving consumers a "subscribe to Lompoc Deals alerts" option on Telegram. High-intent audience, zero cost.
- **Future: merchant alert.** Could send merchants a Telegram message when someone claims their deal or when their deal is expiring soon.

**Known limitations:**
- Currently internal-only (board ↔ CEO). No public Telegram channel or consumer-facing bot yet.
- `/status` is a raw command — not a polished consumer experience.

**CMO action:** File CMO request for a public Telegram deals channel (broadcast new deals automatically). This is a zero-CAC consumer acquisition channel.

---

## Nav Label Fix — "Locals" / "Businesses" — shipped 2026-04-15 (commit 3c91da3)

**What shipped:** Two navigation label corrections:
1. `nav.forLocals` translation key was missing — rendered as a raw key string in the header. Now correctly shows "Locals" (EN) / "Locales" (ES).
2. `forBusinesses` renamed from "For businesses" → "Businesses" (EN) and "Para negocios" → "Negocios" (ES). Mobile menu hardcoded labels updated to match.

**Marketing surfaces it unlocks:**
- `/locals` consumer page is now properly labeled in the nav — the CTA we use across Nextdoor, Facebook, and social posts ("visit lompoc-deals.vercel.app/locals") now leads to a page that is correctly linked in the header. Before this fix, the nav link was showing a broken key.
- Cleaner, shorter nav labels ("Locals" / "Businesses") scan better on mobile — reduces friction for first-time visitors choosing where to go.

**No CMO action needed.** Nav copy now matches all existing marketing materials.

---

## Brand Tagline Live + Category Count Fix — shipped 2026-04-15 (commits d8ca2ec + 66f4a21)

**`d8ca2ec` — "Live Local. Love Lompoc." homepage heading (board-requested):**

The category section heading on the homepage changed from "Explore by category" → **"Live Local. Love Lompoc."** This is now the primary brand tagline visible above the fold for every visitor.

**Marketing impact:**
- "Live Local. Love Lompoc." is a brand-level statement, not just section copy. It should propagate to: social bio, email footers, ad creative taglines, launch announcement, and printed collateral.
- Updated `docs/HOMEPAGE_COPY.md` section 3 to reflect this as the live, board-approved heading with Spanish equivalent "Vive Local. Ama Lompoc."
- This replaces the functional "Explore by category" label — it's a brand identity signal, not a navigation instruction.

**`66f4a21` — Category grid + stat bar now show only real categories:**

`getAllCategories()` and `getSiteStats()` now INNER JOIN on approved businesses — empty categories no longer appear in the grid or chip filters. Stat bar category count is consistent with what's shown in the grid.

**Marketing impact:**
- Homepage category grid shows only categories with live businesses. No more empty grid slots.
- Stat bar accuracy: "X categories" now matches what visitors can actually browse. Credibility up.
- No copy updates needed.

**CMO actions:**
- Propagate "Live Local. Love Lompoc." tagline across social bios, email footers, and ad creative.
- Add Spanish variant "Vive Local. Ama Lompoc." to all bilingual assets.

---

## Richer Deal Cards + "Things to Do in Lompoc" Section — shipped 2026-04-16 (commit cbc312a)

**What shipped:**

1. **Deal card enrichment:** Cards now show the business address (MapPin icon), phone number (clickable `tel:` link), and a terms hint. Description expanded from 2-line to 3-line clamp. Applied to all card variants.

2. **"Things to Do in Lompoc" section on `/deals`:** A new section below the category strip shows up to 6 featured activities (from the activities table). Each card shows: image/icon, description, tips, address, seasonality badge, and a "Learn More" link. Section only renders when activities exist.

**How to test it:**
1. Go to lompoc-deals.vercel.app/deals — confirm deal cards show address + phone
2. Tap the phone number on mobile — should open dialer
3. Scroll below the category strip — confirm "Things to Do in Lompoc / Local Attractions & Activities" section renders if activities are loaded

**Events it fires:** No new analytics events (existing card click tracking)

**Marketing surfaces it unlocks:**

- **Deal cards → direct calls:** Address + phone on the card means customers can call directly without visiting the business page. For restaurants, salons, and services, this eliminates a friction step between "seeing the deal" and "showing up." Claim rates should improve.
- **"Things to Do in Lompoc" — SEO gold:** This section is the exact content that ranks for high-intent local tourism queries: "things to do in Lompoc CA", "Lompoc attractions", "Lompoc activities". This is a programmatic SEO opportunity. The copy "Discover what makes Lompoc special — from wineries to wildflowers" is emotionally resonant and local-specific. **File CMO request: dedicated `/lompoc/things-to-do` SEO landing page.**
- **Vandenberg relocation angle:** Military families researching Lompoc will hit the "Things to Do" section. This is a passive acquisition touchpoint for a high-value segment (incoming permanent-change-of-station families who need to discover the community fast).
- **Tourism + visitor acquisition:** The `/deals` page now serves two audiences: deal-hunters AND first-time visitors to Lompoc. Stronger reason to share the URL externally (tourism groups, Facebook travel posts, Nextdoor "what to do this weekend" threads).
- **Screenshot asset:** The activities section has a distinctive visual card grid with destination-style imagery. Great for Instagram and Nextdoor "here's what Lompoc Deals looks like" posts.

**Known limitations:**
- Activities section only renders if `getFeaturedActivities()` returns > 0 results — requires the activities table to be populated.
- No analytics on "Things to Do" section engagement yet.

**CMO actions:**
- Update merchant pitch: "Your address and phone are now on every deal card — customers can call you directly without leaving the deals page."
- File REQ for a dedicated `/lompoc/things-to-do` SEO landing page (see CMO_REQUESTS.md).

---

## /locals Hero Background Image — shipped 2026-04-16 (commit ce91501)

**What shipped:** The `/locals` consumer landing page hero section now uses `lompoc-hero.jpg` as a full-bleed background image, with gradient overlays (horizontal + vertical) to maintain text readability. Replaces the previous gradient-only background.

**How to test it:**
1. Go to lompoc-deals.vercel.app/locals — hero should show the Lompoc landscape photo with text overlaid

**Marketing surfaces it unlocks:**

- **Visual credibility at the fold:** Every consumer-facing marketing post and email links to `/locals`. The hero is the first thing visitors see. A real Lompoc photo is dramatically more compelling than a gradient — it signals "this is a real place, built for your community."
- **Screenshot opportunity:** The `/locals` hero now makes a strong social post screenshot: authentic Lompoc photo, brand copy overlay. Ideal for "Lompoc has its own deals app" posts on Instagram, TikTok, and Nextdoor.
- **Ad creative asset:** The hero visual can be screen-captured and used directly in Meta/Google ad creative — no Canva needed for a quick social ad.

**Known limitations:**
- Uses the same `lompoc-hero.jpg` as other pages — brand team may want a unique hero per section eventually.

**CMO action:** Schedule a social post using a screenshot of the updated `/locals` hero. First polished visual we have for the consumer product.

---

*CTO team: add new entries above this line when you ship something.*
