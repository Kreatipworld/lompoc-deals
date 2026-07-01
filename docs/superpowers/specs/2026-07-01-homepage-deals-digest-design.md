# Homepage Deals Digest — Design

**Date:** 2026-07-01
**Branch:** `feat/homepage-deals-digest`
**Goal:** Make the homepage a deals-first experience that sells **business membership**. Replace the "Live Local. Love Lompoc." category grid with a weekly **deals digest** modeled on the Lompoc Locals flyer, populated with seeded demo deals.

## Decisions (from brainstorm)
- **Membership focus:** business membership — feature your deal + buy sponsor ad spots. Section CTAs push `/for-businesses`.
- **Scope:** full flyer layout — featured deal hero + deal grid + side sponsor rails ("Your Ad Here → Claim this spot") + top/footer sponsor banners.
- **Fake data:** seeded into the **production** DB (removable), so the whole platform (homepage, `/deals`, business pages, counts) lights up.
- **Category grid:** kept but moved **below** the digest.

## Components
### `components/deals-digest.tsx` (server component)
Flyer-faithful, brand-themed (purple `#650C75` / green / gold). Structure:
- Eyebrow + heading ("This week in Lompoc · Weekly Deals") + subcopy
- **Top sponsor banner** — "Feature your business here" CTA (or sample sponsor) → `/for-businesses`
- **Featured deal hero** — first digest deal, gold "Featured this week" ribbon
- **Deal grid** — ~6 deals: photo, title, business + category, big offer hook (`discountText`), "With Lompoc Locals" badge, terms
- **Side sponsor rails** — one sample sponsor card + one dashed **"Your Ad Here / Claim this spot"** slot → `/for-businesses`
- **Footer banner** — "Feature your deal this week" CTA → `/for-businesses`
- Responsive: rails collapse under the grid on narrow screens.

Props: `deals: DealCardData[]` (already the app's deal shape). Picks `deals[0]` as hero, `deals.slice(1,7)` as grid.

### Data
- Reuse `getActiveDeals()` (already filters approved businesses, newest-first). Add nothing to schema.
- Homepage passes the fetched deals into `<DealsDigest>`.

## Seed — `db/seed-demo-deals.ts`
- Creates ~8 **tagged demo businesses** (slug prefix `demo-`, `status: "approved"`, matched `categoryId`, brand-ish `logoUrl` optional) mirroring the flyer: Babcock Winery, Pink Pig BBQ, Rebel Floral, Mariposa Nails, Kaizen Collision, Valley Embroidery, South Side Coffee, Floriano's Pizzeria.
- Each gets one active deal (`type` coupon/special, `discountText` = the hook e.g. "2-FOR-1", `expiresAt` = +30d, `imageUrl` a stock photo, `terms`).
- **Removable:** `tsx db/seed-demo-deals.ts --remove` deletes all businesses with slug `like 'demo-%'` (deals cascade). Idempotent insert (skip if slug exists).
- Runs against `DATABASE_URL` (production Neon) — demo deals appear live until removed.

## Homepage change (`app/[locale]/(public)/page.tsx`)
- Replace the category-grid `<section>` (≈ lines 141–186) position with `<DealsDigest deals={activeDeals} />`.
- Move the category grid `<section>` to **below** "Popular in Lompoc" (keeps browsing).
- Fetch `getActiveDeals(12)` in the page's `Promise.all`.

## Verification
- `tsc --noEmit` + `next lint` clean.
- Run dev server, screenshot homepage — digest renders with seeded deals, CTAs point to `/for-businesses`, grid moved down.
- Confirm `--remove` cleans up.

## Out of scope / follow-ups
- Real advertiser checkout / membership billing (Stripe) — CTAs link to `/for-businesses` for now.
- Replacing stock demo photos with real business photography.
- The seed is demo data; remove before real launch or replace with real business deals.
