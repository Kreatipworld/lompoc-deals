# Lompoc Deals — Tech Audit
*Generated: 2026-04-07 | Auditor: CTO Agent*

---

## Stack

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Framework | Next.js (App Router) | 14.2.35 | ✅ |
| Language | TypeScript | 5 | ✅ |
| Styling | Tailwind CSS + shadcn/ui | 3.4.1 | ✅ |
| ORM | Drizzle ORM | 0.45.2 | ✅ |
| Auth | Auth.js (NextAuth) v5 | 5.0.0-beta.30 | ✅ |
| Database | Neon Serverless Postgres | 1.0.2 | ✅ |
| Payments | Stripe | 22.0.0 | ⚠️ Keys missing |
| Email | Resend | 6.10.0 | ✅ |
| Images | Vercel Blob | 2.3.3 | ✅ |
| Maps | Leaflet + react-leaflet | 1.9.4 | ✅ |
| i18n | next-intl | 4.9.0 | ✅ (en/es) |
| Validation | Zod | 4.3.6 | ✅ |
| Real estate | Apify (Zillow scraper) | - | ✅ |
| Hosting | Vercel | - | ✅ |

---

## Database Schema (9 tables)

```
users → businesses → deals → favorites
                           → property_listings
                  → business_claims
users → subscriptions
      → favorites
subscribers (standalone)
categories (referenced by businesses)
```

All tables use Drizzle schema in `db/schema.ts`. Migrations in `db/migrations/`.

---

## What's Shipped

### Core Platform ✅
- Email/password auth with bcrypt (3 roles: local, business, admin)
- Business profile CRUD + image upload (Vercel Blob)
- Deal CRUD (coupon, special, announcement) with image upload
- Public feed, search, category pages, business pages
- Map (Leaflet, OpenStreetMap)
- Favorites (local users)
- Admin approval queue

### Monetization ✅ (partially)
- Stripe subscription billing (3 tiers: Basic $49, Pro $99, Premium $199)
- Deal limits enforced by tier (5/20/unlimited)
- Billing dashboard + Stripe Customer Portal
- Webhook handler for subscription lifecycle events

### Growth/Engagement ✅
- Email digest (weekly, Saturdays 9am UTC) via Resend
- Double opt-in subscription with token-based unsubscribe
- Deal view + click tracking
- Basic merchant stats dashboard

### Infra ✅
- i18n (en/es) via next-intl
- Vercel cron jobs (digest + Zillow sync)
- SEO metadata + sitemap + robots.txt
- Real estate module (Zillow via Apify, daily sync)

---

## What's Missing / Broken

| # | Gap | Severity | Revenue Impact |
|---|-----|----------|---------------|
| 1 | Stripe API keys not set → billing non-functional | **CRITICAL** | Direct ($$$) |
| 2 | Zero test coverage | **HIGH** | Risk (ship fast, break rev paths) |
| 3 | QR code redemption flow | HIGH | Direct (unlock upsell) |
| 4 | Rate limiting on public APIs | HIGH | Security/fraud risk |
| 5 | No conversion funnel analytics | MEDIUM | Indirect (optimize rev) |
| 6 | Featured/promoted deal placement | MEDIUM | Direct (add-on revenue) |
| 7 | Programmatic SEO pages | MEDIUM | Organic traffic |
| 8 | No error monitoring (Sentry/etc) | MEDIUM | Ops reliability |
| 9 | AI deal copywriting assistant | LOW | Merchant retention |
| 10 | Multi-city scaffolding | LOW | Future growth |

---

## Monetization Hooks Inventory

| Hook | Location | Status |
|------|----------|--------|
| Merchant signup → billing | `lib/auth-actions.ts` → `/dashboard/billing` | ⚠️ UI ready, Stripe keys missing |
| Deal publish gate | `lib/biz-actions.ts:createDeal()` | ✅ Enforces tier limits |
| Checkout session | `app/api/stripe/checkout/route.ts` | ⚠️ Code ready, keys missing |
| Subscription webhook | `app/api/stripe/webhook/route.ts` | ⚠️ Code ready, secret missing |
| Featured placement | — | ❌ Not built |
| QR redemption | — | ❌ Not built |

---

## Security Baseline

| Area | Status | Notes |
|------|--------|-------|
| CSRF | ✅ | NextAuth handles |
| Password hashing | ✅ | bcrypt 10 rounds |
| Route auth gates | ✅ | Middleware guards /dashboard, /admin |
| Input validation | ✅ | Zod on server actions |
| Stripe webhook validation | ✅ | Stripe-signature header checked |
| Rate limiting | ❌ | No rate limiting on any endpoint |
| Error logging | ❌ | console.error only |
| SQL injection | ✅ | Drizzle parameterized queries |

---

## Performance Baseline

| Area | Status |
|------|--------|
| SSR | ✅ Server-side rendering on all public pages |
| DB indexes | ✅ indexes on slug, businessId, status |
| Image optimization | ✅ Next.js Image component + Vercel Blob |
| Bundle splitting | ✅ Next.js default code splitting |
| Caching | ❌ No explicit cache-control or ISR configured |

---

## Build Quality Scores

| Aspect | Score |
|--------|-------|
| Code organization | 9/10 |
| Type safety | 9/10 |
| Error handling | 7/10 |
| **Test coverage** | **0/10** |
| Documentation | 8/10 |
| Performance | 8/10 |
| Security | 7/10 |
| Completeness | 8/10 |

**Overall: 7.0/10** — Strong MVP, zero test coverage is the biggest risk.
