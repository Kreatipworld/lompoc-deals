# Lompoc Deals — Architecture Decision Records
*Last updated: 2026-04-07*

---

## ADR-001: Drizzle ORM over Prisma

**Status:** Accepted  
**Date:** ~2025-Q4

**Context:** Needed an ORM compatible with Neon serverless HTTP driver and Vercel Edge.

**Decision:** Use Drizzle ORM with `@neondatabase/serverless` HTTP driver.

**Reasons:**
- Drizzle works with Neon's HTTP driver (no persistent connections needed)
- Prisma requires a persistent connection or Data Proxy (added complexity + cost)
- Drizzle is lighter and generates standard SQL
- Type safety comparable to Prisma

**Consequences:** SQL migrations are manual (drizzle-kit generate → push). No Prisma Studio GUI.

---

## ADR-002: Auth.js v5 Credentials Provider

**Status:** Accepted  
**Date:** ~2025-Q4

**Context:** Need user authentication with email/password and role-based access.

**Decision:** Use Auth.js v5 (beta) with credentials provider and bcrypt.

**Reasons:**
- Established library, v5 supports App Router natively
- No need for social OAuth in v1
- JWT session strategy avoids extra DB reads on every request

**Consequences:** v5 is beta; may need upgrades as it stabilizes. No social login until explicitly added.

---

## ADR-003: Leaflet over Mapbox

**Status:** Accepted  
**Date:** ~2025-Q4

**Context:** Need an interactive map for business locations.

**Decision:** Use Leaflet + react-leaflet with OpenStreetMap tiles.

**Reasons:**
- Leaflet is free with no API key or billing
- OpenStreetMap tiles are free for low traffic
- Mapbox requires credit card + API key

**Consequences:** Map styling less polished than Mapbox. If traffic grows, may need to switch to hosted tile service.

---

## ADR-004: Vercel Blob over Cloudinary

**Status:** Accepted  
**Date:** ~2025-Q4

**Context:** Need image storage for business logos, covers, and deal photos.

**Decision:** Use Vercel Blob.

**Reasons:**
- Native Vercel integration (same dashboard)
- Simple SDK (`put()`, `del()`)
- CDN-backed automatically

**Consequences:** Vendor lock-in to Vercel. Transformation features (resize, crop) require additional work or a separate service.

---

## ADR-005: Stripe Subscription Billing (3 Tiers)

**Status:** Accepted  
**Date:** ~2025-Q4

**Context:** Need recurring revenue from merchant accounts.

**Decision:** Stripe recurring subscriptions — Basic ($49), Pro ($99), Premium ($199) per month.

**Reasons:**
- Predictable MRR over one-time fees
- Stripe webhook handles lifecycle (upgrades, failures, cancellations)
- Tier enforcement via deal limits creates natural upgrade pressure

**Trade-offs:** Free tier not offered (no revenue, harder to justify hosting).

**Next decision needed:** Stripe Connect for merchant payouts (if we add QR redemption with % commissions).

---

## ADR-006: Nominatim for Geocoding

**Status:** Accepted  
**Date:** ~2025-Q4

**Context:** Need to convert business addresses to lat/lng for the map.

**Decision:** Use Nominatim (OpenStreetMap geocoding API).

**Reasons:**
- Free, no API key required
- Sufficient accuracy for US addresses
- Google Geocoding API has billing complexity

**Consequences:** Nominatim has a 1 request/second rate limit and requires a User-Agent header. Not suitable for bulk geocoding. If we need bulk geocoding, switch to Geocodio or Google.

---

## ADR-007: next-intl for i18n

**Status:** Accepted  
**Date:** ~2026-Q1

**Context:** Lompoc has a large Spanish-speaking population; Spanish support requested.

**Decision:** Use next-intl with `[locale]` routing prefix (en/es).

**Reasons:**
- Native App Router support
- URL-based locale (better SEO than cookie-based)
- Translation files in `messages/` JSON

**Consequences:** All routes prefixed with locale. External links must account for locale prefix. Email templates still English-only (not covered by next-intl).

---

## ADR-008: Apify for Zillow Data

**Status:** Accepted  
**Date:** ~2026-Q1

**Context:** Want to add real estate listings to the platform for additional traffic.

**Decision:** Use Apify's Zillow scraper actor with daily sync via Vercel cron.

**Reasons:**
- Zillow has no public API for listing data
- Apify managed scraper handles anti-bot measures
- Pay-per-run pricing (low cost for small volume)

**Consequences:** Depends on third-party scraper; could break if Zillow changes structure. Not a core business feature — can be removed without affecting deals platform.

---

## Pending Decisions

| # | Question | Priority | Notes |
|---|----------|----------|-------|
| PD-001 | Rate limiting: Vercel Edge Middleware + Upstash vs Cloudflare WAF? | HIGH | Upstash KV adds dependency but is purpose-built |
| PD-002 | Analytics: PostHog vs GA4 vs custom? | MEDIUM | PostHog is self-hostable; GA4 is free but opaque |
| PD-003 | QR codes: client-side generated vs server-signed tokens? | MEDIUM | Server-signed needed for redemption security |
| PD-004 | Featured deals: Stripe add-on price vs one-time payment? | MEDIUM | Add-on price creates recurring revenue |
| PD-005 | Error monitoring: Sentry vs Axiom vs Vercel built-in? | MEDIUM | Vercel built-in is free but limited |
