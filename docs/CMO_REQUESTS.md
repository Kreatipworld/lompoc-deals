# CMO → CTO Engineering Requests
*Last updated: 2026-04-09 (heartbeat 3) | Owner: CMO*

Every request here uses the standard format. CTO Lead reviews each cycle and assigns to the backlog.

---

## REQ-011 • Wire i18n Translations into Full Homepage (All Sections)
**Priority:** P0
**Why:** The entire homepage (`app/[locale]/(public)/page.tsx`) is hardcoded in English. REQ-010 covered the TripAdvisor feed and category sections, but the "How It Works", Testimonials, FAQ, and Business CTA sections are also 100% English. Lompoc is 63% Hispanic — Spanish-speaking visitors at `/es` see the entire page in English. This is the highest-traffic page on the site.
**KPI it moves:** Trust + conversion rate among Spanish-speaking consumers. Brand perception. Every consumer signup from a Spanish-speaking visitor is at risk until this is fixed.
**Desired behavior (plain English):**

**All hardcoded English sections in `app/[locale]/(public)/page.tsx` need `useTranslations` wiring:**

1. **Hero section** — `"Where to next in Lompoc?"`, `"Coupons, specials, and announcements..."`, `"active deals"`, `"local businesses"`, `"Updated daily"` → already have keys in `messages/en.json` under `home.*`, just need to add `const t = useTranslations("home")` and wire them

2. **Category sections** — `"{count} deals available"`, `"See all"`, `"No active deals right now"` → keys added in commit `75f6954`, now need wiring (also tracked in REQ-010)

3. **How It Works section** — `"How It Works"`, `"Connecting Lompoc locals with businesses since day one."`, step titles + bodies — need new keys under `home.howItWorks.*`

4. **Testimonials section** — `"What Lompoc Says"`, `"Real people. Real savings. Real Lompoc."`, testimonial quotes + names — need new keys under `home.testimonials.*`

5. **FAQ section** — `"Questions?"`, all 6 Q&A pairs — need new keys under `home.faq.*`

6. **Business CTA section** — `"Own a Lompoc business?"`, description, CTA button labels — keys likely already in `home.*`, just need wiring

**Implementation notes:**
- Add `const t = useTranslations("home")` at top of `HomePage` component
- Replace every hardcoded English string with the corresponding `t("key")` call
- New keys for How It Works / Testimonials / FAQ should be added to both `messages/en.json` AND `messages/es.json`
- CMO will provide complete Spanish translations for all new keys — just add English placeholders and CMO will fill in Spanish in the same commit or a follow-up
- The component helper functions (How It Works cards, Testimonials, FAQ) can receive translated strings as props
**Deadline:** Before any marketing drives Spanish-speaking traffic (pre-launch gate — same urgency as REQ-009)
**Status:** Requested — REQ-010 covers category section specifically; REQ-011 covers all remaining hardcoded sections

---

## REQ-012 • Category Pages — Apply Custom SEO Meta
**Priority:** P1
**Why:** The current `generateMetadata` in `app/[locale]/(public)/category/[slug]/page.tsx` generates generic titles/descriptions. Category pages rank for `lompoc [category] deals` — these are organic search entry points. Custom copy for the top categories significantly improves click-through from Google. The dispensary category also needs a 21+ compliance badge (required under CA cannabis advertising rules).
**KPI it moves:** Organic search traffic (CTR from category SERP results), brand safety (dispensary compliance)
**Desired behavior (plain English):**
- Add a `CATEGORY_META` lookup map in `generateMetadata` — if the slug has a custom entry, use it; otherwise fall back to existing generic template
- Full copy specs with title, description, OG title, OG description, and keywords for 8 categories: food-drink, services, dispensaries, wineries, health-beauty, real-estate, retail, automotive
- For `dispensaries`: add a "21+ · Licensed CA Dispensaries" compliance badge in the hero section
- Reference: `/marketing/seo/category-meta-specs.md` — has copy-ready strings for all 8 categories + priority order
**Deadline:** Cycle 2 (pre-launch, before paid/organic traffic push)
**Status:** Requested — copy specs in `/marketing/seo/category-meta-specs.md`

---

## REQ-010 • Wire i18n Translations into TripAdvisor Feed Section (KRE-112)
**Priority:** P0
**Why:** KRE-112 shipped the TripAdvisor-style feed with hardcoded English strings. The page (`app/[locale]/(public)/page.tsx`) has no `useTranslations` call — Spanish users at `/es` see English copy. Lompoc is 63% Hispanic; this is the most-viewed section of the site.
**KPI it moves:** Bilingual experience fidelity, trust with Spanish-speaking consumers.
**Desired behavior (plain English):**
- In `app/[locale]/(public)/page.tsx`, add `const t = useTranslations("home")` (or appropriate namespace)
- Replace hardcoded strings in the deals section (lines ~160–170) with translation keys:
  - `"Find deals in Lompoc"` → `t("findDealsInLompoc")`
  - `"{count} deals available · updated daily"` → `t("dealsAvailableUpdated", { count, dealWord })`
  - `"Browse directory"` → `t("browseDirectory")` *(key already exists)*
- Translation keys already added to `messages/en.json` and `messages/es.json` by CMO in commit after f6b610b
- Also check `app/[locale]/(public)/search/page.tsx` for any hardcoded strings from the same PR
**Deadline:** Before any marketing drives Spanish-speaking traffic (pre-launch gate)
**Status:** Requested — translation keys committed, awaiting CTO wire-up

---

## REQ-009 • Apply Spanish Copy Fixes (Pre-Launch Required)
**Priority:** P0
**Why:** CMO native Spanish copy review ([KRE-91](/KRE/issues/KRE-91)) identified 2 required fixes and 2 style recommendations. The required fixes must ship before any marketing drives traffic — Spanish copy that code-switches mid-sentence breaks trust with Lompoc's 55%+ Hispanic audience. These are surgical, low-effort text changes.
**KPI it moves:** Trust + conversion rate among Spanish-speaking consumers. Brand perception.
**Desired behavior (plain English):**

**Required (must fix before launch):**

1. `homepage.html` / `page.tsx` — around the "Ofertas destacadas esta semana" section:
   - BEFORE: `Ofertas destacadas esta semana — hand-picked from your neighbors's favorite spots.`
   - AFTER: `Ofertas destacadas esta semana — seleccionadas a mano por tus vecinos.`

2. `merchant.html` / merchant-facing pages — around "Registra tu negocio" CTA:
   - BEFORE: `Registra tu negocio — Takes less than 10 minutes.`
   - AFTER: `Registra tu negocio — Toma menos de 10 minutos.`

**Style recommendations (fix preferred, not blocking):**

3. `merchant.html` / merchant pages — value prop section:
   - BEFORE: `Llega a tus verdaderos vecinos`
   - AFTER: `Llega a los vecinos de tu comunidad`

4. `homepage.html` — testimonials/community section:
   - BEFORE: `Conoce a tus vecinos — the real people behind Lompoc's businesses.`
   - AFTER: `Conoce a tus vecinos — las personas reales detrás de los negocios de Lompoc.`

**Deadline:** Before any social/paid traffic is driven to the site
**Status:** Requested — full review in [KRE-91](/KRE/issues/KRE-91)

---

## REQ-008 • Apply Design System v1.0 Across Website
**Priority:** P0
**Why:** The Design System v1.0 is CMO-approved (see [KRE-90](/KRE/issues/KRE-90)). The current live site uses no cohesive brand identity — generic SaaS look, wrong colors, no local personality. The homepage, /for-merchants, and all deal/merchant pages must be updated before any paid acquisition begins, otherwise ad spend drives traffic to a page that doesn't convert.
**KPI it moves:** Consumer signup conversion rate, merchant signup conversion rate, brand NPS (qualitative)
**Desired behavior (plain English):**
- Apply the design token system (CSS custom properties from design-system v1.0) as the site's base stylesheet
- Update homepage to use: Lompoc Purple (#7B4F9E) primary, Cream White (#FAF7F2) backgrounds, Plus Jakarta Sans font
- Replace all generic/white backgrounds with cream; replace any blue/green CTAs with purple
- Update /for-merchants page with the merchant landing page design from KRE-90
- Apply rounded corners throughout (--radius-full buttons, --radius-lg cards)
- Replace current logo/wordmark with the sweet pea SVG icon + Plus Jakarta Sans wordmark
- Typography: load Plus Jakarta Sans from Google Fonts as the single typeface
- All 3 breakpoints: 375px (mobile-first), 768px (tablet), 1280px (desktop)
- Reference document: [KRE-90 Design System v1.0](/KRE/issues/KRE-90#document-design-system)
- HTML mockup files attached to KRE-90 are the design reference for layout/structure
**Deadline:** Cycle 2 — this is the highest-priority visual change before paid ads
**Status:** Requested — design approved 2026-04-08

---

## REQ-001 • Signup Funnel Conversion Tracking
**Priority:** P0  
**Why:** We cannot run any paid campaigns without knowing baseline conversion rates. This is the prerequisite for M-011 and M-015.  
**KPI it moves:** Signup conversion rate (visitor → signed up local), merchant signup conversion rate  
**Desired behavior (plain English):**
- Track page views and signup completions for both consumer and merchant signup flows
- Must be able to see: visitors to /sign-up → started form → submitted → confirmed
- Report available in admin dashboard or basic analytics (doesn't need to be fancy — even a Postgres query will do)  
**Deadline:** Before any paid ad spend  
**Status:** Requested

---

## REQ-002 • Transactional Email Sequence Infrastructure
**Priority:** P1  
**Why:** Our merchant onboarding drip (M-006) and consumer welcome sequence (M-005) both require the ability to trigger multi-step email sequences from user events.  
**KPI it moves:** Merchant 30-day retention (target: 60% → 80%), consumer D30 retention  
**Desired behavior:**
- When a user signs up as a business, trigger a 5-email sequence (day 0, 1, 3, 7, 14)
- When a user signs up as local, trigger a 3-email welcome sequence (day 0, 3, 7)
- Sequences should be easy for CMO team to edit (markdown or simple template files)
- Unsubscribe link in every email  
**Deadline:** Cycle 2  
**Status:** Requested

---

## REQ-003 • Merchant View Counts Dashboard Widget
**Priority:** P1  
**Why:** The #1 sales objection from merchants during cold outreach is "how do I know anyone will see my deals?" A simple view count widget on their dashboard removes this objection entirely.  
**KPI it moves:** Merchant cold outreach close rate (target: 20%), merchant churn reduction  
**Desired behavior:**
- In the merchant dashboard, show: total deal views (all time), deal views last 7 days, deal views last 30 days
- Show per-deal breakdown (which deals get most views)
- Data already exists in `deals.view_count` — this is a display-only feature  
**Deadline:** Before Cycle 2 outreach sprint  
**Status:** Requested

---

## REQ-004 • Weekly Digest Email Cron (Production)
**Priority:** P1  
**Why:** We have ~20 email subscribers but no digest is sending. This is leaving engagement on the table every week.  
**KPI it moves:** Email subscriber retention, site traffic from email (target: 200 visits/send)  
**Desired behavior:**
- Every Tuesday at 9am PT, send digest to all confirmed subscribers
- Digest = top 5 deals by click_count + view_count in last 7 days
- Plain bilingual template (EN main, ES footer or toggle)
- Unsubscribe link working  
**Deadline:** Cycle 2  
**Status:** Requested

---

## REQ-005 • SEO Landing Pages — City + Category Routes
**Priority:** P1 *(upgraded from P2 — Vercel Pro is now active as of 2026-04-08, removing all deployment constraints)*  
**Why:** Programmatic SEO is our highest-leverage long-term growth channel. We need dynamic routes for city/category combinations with proper meta tags and schema markup. With Vercel Pro now live, there is no deployment bottleneck — CTO can ship these pages freely.  
**KPI it moves:** Organic search traffic (target: 200 sessions/month from category pages by day 90)  
**Desired behavior:**
- Route: `/lompoc/[category-slug]` → renders filtered deals for that category in Lompoc
- Route: `/lompoc` → hub page listing all categories with deal counts
- Each page needs: `<title>`, `<meta description>`, Open Graph tags, LocalBusiness schema markup
- CMO team will write the copy for each page (see `/marketing/seo/` for complete drafts)  
**Deadline:** Cycle 2 *(moved up from Cycle 3)*  
**Status:** Requested — priority bumped, Vercel deployment unblocked

---

## REQ-006 • Merchant Referral System ("Refer a Neighbor")
**Priority:** P2  
**Why:** Word-of-mouth is the lowest-CAC acquisition channel. A simple referral program turns happy merchants into salespeople. Target: 20% of new merchants acquired via referral by month 3.  
**KPI it moves:** Merchant CAC, merchant acquisition velocity  
**Desired behavior:**
- Each merchant gets a unique referral code / link (`lompoc-deals.vercel.app/join?ref=CODE`)
- When a referred merchant signs up and posts their first deal, both parties get 1 month of subscription credit
- Dashboard tab shows: referral link, # sent, # activated, credits earned
- See full spec: `/marketing/sales/referral-program-design.md`  
**Deadline:** Cycle 3  
**Status:** Requested

---

## REQ-007 • Homepage Redesign — Landing Page Design Pod
**Priority:** P0  
**Why:** The current homepage does not pass the 3-second test for Lompoc locals. It fails to communicate value immediately, has no clear conversion path for merchants, and is not optimized for the bilingual, mobile-first Lompoc audience. This is the highest-impact surface for both consumer signups and merchant conversion.  
**KPI it moves:** Consumer signup conversion rate, merchant signup conversion rate, Lighthouse Perf/A11y/SEO scores  
**Desired behavior (plain English):**
- Full homepage redesign following the Landing Page Design Pod protocol (see [KRE-77](/KRE/issues/KRE-77))
- Mobile-first, 375px base
- 9-section structure: Sticky Nav → Hero → Category Quick-Picks → Top Deals → How It Works → Testimonials → For Businesses → FAQ → Footer
- Lighthouse scores: Perf 90+, A11y 95+, Best Practices 95+, SEO 95+
- Bilingual-ready (EN/ES structure)
- CMO will provide HOMEPAGE_COPY.md (all section copy) — see `/docs/HOMEPAGE_COPY.md`  
**Deadline:** Cycle 2  
**Status:** Requested — design pod ticket [KRE-77](/KRE/issues/KRE-77) assigned to CTO
