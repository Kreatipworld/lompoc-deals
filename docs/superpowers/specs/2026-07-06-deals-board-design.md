# /deals "Deal Board" Reinvention — Design Spec

*Date: 2026-07-06 · Approved*

## Goal

Turn the sparse category-grouped deals page into the site's strongest page: a vibrant deal board that flatters a small inventory and converts every visitor (claim / subscribe / become a merchant).

## Sections

1. **Hero** — dark purple brand band (gold/green radial glows, homepage family), compact: badge, "heading" + animated live-deal counter, search bar. CategoryStrip directly below.
2. **Deal of the Week** — first featured deal (`getFeaturedDeals({limit:1})`), else newest active. Full-width spotlight card: huge discount text, gold ribbon, business, expiry, claim CTA (form → trackClaimAction → `/deals/[id]/claim`, the standard flow).
3. **Ends soon rail** — active deals with `expiresAt` within 7 days (excluding the spotlight), horizontal scroll-snap, countdown chip ("Ends today" / "{n} days left"). Hidden when empty.
4. **Deal wall** — all remaining active deals, flat grid, staggered entrance (`animate-fade-up` + delay), standard DealCard (tripadvisor variant). No category grouping.
5. **Digest band** — "The top 10, every Saturday" + `InlineSubscribeForm`.
6. **Storyboard** — CouponDemo (labels from `locals` namespace, like the homepage) under a "First time? Here's how it works" heading.
7. **Merchant band** — "Your deal could be on this board" → `/for-businesses`.
8. **Empty state** — zero active deals: skip spotlight/rail/wall; lead with digest band + storyboard + merchant band.

## Constraints

EN/ES parity (`deals.page` namespace additions; demo labels reused from `locals`); brand tokens; existing queries only; tsc+lint clean; prod smoke EN+ES.
