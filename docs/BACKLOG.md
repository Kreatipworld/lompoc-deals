# Lompoc Deals — Engineering Backlog
*Last updated: 2026-04-08 | Sorted by: revenue impact ÷ effort*

---

## How to Read This

Each ticket:
```
ID • Title • Owner • Why (metric) • Acceptance Criteria • Files • Effort (S/M/L) • Deps • Risk
```

**Effort:** S = ½–1 day, M = 1–3 days, L = 3–7 days  
**Owner roles:** FS = Lead Full-Stack, PAY = Payments Eng, DATA = Data & Analytics, SEC = Security/DevOps/QA, AI = AI/Automation

---

## 🔴 CRITICAL — Ship Now

### B-001 • Activate Stripe Billing
**Owner:** PAY  
**Why:** Zero subscription revenue until keys are set. Every day delayed = lost MRR.  
**Acceptance Criteria:**
- [ ] Stripe account created with 2 paid products (Standard $19.99/mo, Premium $39.99/mo)
- [ ] Price IDs added to `.env.local` and Vercel environment
- [ ] Stripe webhook configured and `STRIPE_WEBHOOK_SECRET` set
- [ ] End-to-end test: sign up as business → upgrade to Standard → deal limit enforced  
**Files:** `.env.local`, Vercel env vars, `lib/stripe.ts` (verify price IDs match)  
**Effort:** S  
**Deps:** None — code is ready  
**Risk:** Low — code is already written and tested

---

### B-002 • Test Coverage for Revenue-Critical Paths
**Owner:** SEC (QA)  
**Why:** Zero test coverage is the top operational risk. One silent regression on deal publishing or billing = lost revenue + angry merchants.  
**Acceptance Criteria:**
- [ ] Integration tests: signup → create business → post deal → view deal
- [ ] Integration tests: signup → billing checkout → webhook → tier enforced
- [ ] Integration tests: email digest sends to confirmed subscribers only
- [ ] Unit tests: tier limits, deal expiry queries, auth guards
- [ ] CI configured: `npm test` runs on every PR  
**Files:** `__tests__/`, `vitest.config.ts` (or jest), `.github/workflows/ci.yml`  
**Effort:** L  
**Deps:** None  
**Risk:** Medium — requires test DB setup or mocking strategy

---

## 🟠 HIGH — Next Sprint

### B-003 • Rate Limiting on Public APIs
**Owner:** SEC  
**Why:** Unprotected endpoints risk scrapers, brute-force, and spam deal creation — all of which degrade user experience and inflate costs.  
**Acceptance Criteria:**
- [ ] Rate limit on `/api/track/click` (10 req/min per IP)
- [ ] Rate limit on `/api/auth/[...nextauth]` login (5 attempts/min per IP)
- [ ] Rate limit on subscribe form submission (3/min per IP)
- [ ] 429 response with `Retry-After` header  
**Files:** `middleware.ts`, or new `lib/rate-limit.ts`; ADR entry in `docs/DECISIONS.md`  
**Effort:** S  
**Deps:** Decision on Upstash vs in-memory (see PD-001)  
**Risk:** Low

---

### B-004 • QR Code Redemption Flow
**Owner:** FS + PAY  
**Why:** Enables in-store redemption tracking → proof of value for merchants → unlocks premium tier upgrade conversations and potential % commission model.  
**Acceptance Criteria:**
- [ ] Each deal gets a unique redemption code (UUID, stored in DB)
- [ ] QR code generated client-side from redemption URL
- [ ] Consumer: view deal → claim → see QR code + redemption code
- [ ] Merchant dashboard: scan page shows deal title + marks as redeemed
- [ ] `redemptions` table tracks: dealId, claimedAt, redeemedAt, code
- [ ] Redemption endpoint validates code and marks redeemed (idempotent)  
**Files:** `db/schema.ts` (new `redemptions` table), `app/[locale]/deals/[id]/claim/`, `app/[locale]/dashboard/redeem/`, `app/api/redeem/route.ts`  
**Effort:** M  
**Deps:** B-001 (billing must work first), B-002 (tests expected on this)  
**Risk:** Medium — security-sensitive (replay attack prevention)

---

### B-005 • Error Monitoring (Sentry)
**Owner:** SEC  
**Why:** Currently all errors are console.error only. Production errors are invisible. One undetected billing webhook failure = lost subscription.  
**Acceptance Criteria:**
- [ ] Sentry SDK installed and configured for Next.js
- [ ] Source maps uploaded on deploy
- [ ] Errors in server actions, route handlers, and cron jobs captured
- [ ] Stripe webhook errors trigger Sentry alert  
**Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.mjs`, ADR in `docs/DECISIONS.md`  
**Effort:** S  
**Deps:** None  
**Risk:** Low

---

### B-006 • Conversion Funnel Analytics
**Owner:** DATA  
**Why:** Without funnel data we're flying blind. Can't optimize what we can't measure.  
**Acceptance Criteria:**
- [ ] PostHog or GA4 installed (decision made and ADR logged)
- [ ] Events tracked: page_view, deal_view, deal_click, deal_claim, signup, business_signup, subscription_start
- [ ] Merchant dashboard shows: views → clicks → claims funnel per deal  
**Files:** `lib/analytics.ts`, all page/action files that need events, `app/[locale]/dashboard/stats/page.tsx`  
**Effort:** M  
**Deps:** B-005 (error monitoring first)  
**Risk:** Low — additive change

---

## 🟡 MEDIUM — Q2 2026

### B-007 • Featured/Promoted Deal Placement
**Owner:** FS + PAY  
**Why:** Incremental revenue stream. Merchants pay to pin their deals to the top of category pages or homepage.  
**Acceptance Criteria:**
- [ ] `featuredUntil` timestamp column on `deals`
- [ ] Stripe add-on price for featured placement ($19/week)
- [ ] Featured deals sorted before standard deals in feed queries
- [ ] Visual "Featured" badge on deal cards
- [ ] Merchant can purchase featured placement from dashboard  
**Files:** `db/schema.ts`, `lib/queries.ts`, `lib/stripe.ts`, `app/[locale]/dashboard/deals/`, ADR entry  
**Effort:** M  
**Deps:** B-001 (Stripe keys), B-002 (tests)  
**Risk:** Medium — new Stripe price + checkout flow

---

### B-008 • Programmatic SEO Pages
**Owner:** FS + AI  
**Why:** Organic search traffic from long-tail Lompoc queries (e.g., "lompoc restaurants deals", "lompoc food specials") → free acquisition.  
**Acceptance Criteria:**
- [ ] `/lompoc/restaurants` — all approved restaurant businesses
- [ ] `/lompoc/deals-today` — active deals expiring today or this week
- [ ] `/lompoc/[category]` — alias for `/category/[slug]` with SEO-optimized metadata
- [ ] Each page has unique `<title>`, `<meta description>`, OpenGraph, structured data (JSON-LD)
- [ ] Pages included in `sitemap.ts`  
**Files:** `app/[locale]/(public)/lompoc/`, `app/sitemap.ts`  
**Effort:** M  
**Deps:** None  
**Risk:** Low

---

### B-009 • Merchant Analytics Dashboard V2
**Owner:** DATA  
**Why:** Better analytics = higher merchant retention. Merchants who see value renew subscriptions.  
**Acceptance Criteria:**
- [ ] Deal performance chart (views + clicks over 30 days)
- [ ] Top performing deals ranked by engagement
- [ ] Subscriber growth widget (total confirmed subscribers)
- [ ] Comparison: this month vs last month  
**Files:** `app/[locale]/dashboard/stats/page.tsx`, `lib/queries.ts`  
**Effort:** M  
**Deps:** B-006 (funnel analytics)  
**Risk:** Low

---

### B-010 • AI Deal Copywriting Assistant
**Owner:** AI  
**Why:** Lowers friction for merchants who don't know what to write → more deals published → more traffic.  
**Acceptance Criteria:**
- [ ] "Generate deal copy" button in deal creation form
- [ ] Sends business name, category, and optional keywords to Claude API
- [ ] Returns 3 title + description suggestions, merchant picks one
- [ ] Rate-limited (1 generation per 30 seconds per business)  
**Files:** `app/[locale]/dashboard/deals/new/page.tsx`, `app/api/ai/copywrite/route.ts`, `lib/ai.ts`, ADR entry  
**Effort:** M  
**Deps:** B-003 (rate limiting should be in place first)  
**Risk:** Low — purely additive

---

## 🟢 LOW — Q3 2026+

### B-011 • Multi-City Expansion Scaffold
**Owner:** FS  
**Why:** Santa Maria, Santa Barbara, Vandenberg are natural adjacent markets.  
**Acceptance Criteria:**
- [ ] `city` field added to `businesses` table
- [ ] All queries scoped by city
- [ ] City-specific routes: `/santa-maria`, `/santa-barbara`
- [ ] City switcher in header  
**Files:** `db/schema.ts`, `lib/queries.ts`, routing refactor  
**Effort:** L  
**Deps:** B-001, B-002, solid test coverage  
**Risk:** High — touches almost every query

---

### B-012 • Push Notifications (OneSignal)
**Owner:** FS  
**Why:** Re-engagement when favorite businesses post new deals.  
**Acceptance Criteria:**
- [ ] OneSignal integration
- [ ] "Enable notifications" prompt for logged-in local users
- [ ] Notification sent when approved business posts new deal  
**Files:** `app/[locale]/layout.tsx`, `lib/notifications.ts`, `app/api/notify/`  
**Effort:** M  
**Deps:** B-002 (tests)  
**Risk:** Low (additive)

---

### B-013 • Spanish Email Templates
**Owner:** FS  
**Why:** ~35% of Lompoc population is Hispanic/Latino. Spanish digest emails = higher engagement for this segment.  
**Acceptance Criteria:**
- [ ] Digest email detects subscriber language preference (or defaults to en)
- [ ] Spanish translations for all transactional emails  
**Files:** `lib/email.ts`, `messages/` (email templates), `db/schema.ts` (language preference on subscribers)  
**Effort:** S  
**Deps:** None  
**Risk:** Low

---

## Backlog Summary

| Priority | Tickets | Combined Effort |
|----------|---------|----------------|
| Critical | B-001, B-002 | S + L |
| High | B-003, B-004, B-005, B-006 | S + M + S + M |
| Medium | B-007, B-008, B-009, B-010 | M + M + M + M |
| Low | B-011, B-012, B-013 | L + M + S |
