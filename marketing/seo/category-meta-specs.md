# Category Page SEO Copy Specs
*Owner: CMO | Created: 2026-04-09 | Target: CTO — override generic meta in `/category/[slug]/page.tsx`*

The current `generateMetadata` function in `app/[locale]/(public)/category/[slug]/page.tsx` generates generic meta:
```
title: `Lompoc ${cat.name} Deals & Coupons — Local Discounts | Lompoc Deals`
description: `Browse current ${catLower} deals and coupons from Lompoc, CA businesses...`
```

This is functional but not competitive. Replace with category-specific copy for the top categories below.
KPI: Category pages ranking for `lompoc [category] deals` queries in Google.

---

## Implementation Note for CTO

Add a `CATEGORY_META` lookup map in `generateMetadata`. If the slug has a custom entry, use it; otherwise fall back to the existing generic template.

```ts
const CATEGORY_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  "food-drink": { ... },
  "services": { ... },
  // etc.
}
```

---

## Slug: `food-drink`

**Title:**
`Lompoc Restaurant Deals & Food Coupons — Save at Local Restaurants | Lompoc Deals`

**Meta Description (155 chars):**
`Find restaurant deals, food coupons, and dining specials from Lompoc, CA restaurants and cafés. Free to claim — no app, no printing. Updated daily.`

**Keywords:**
- `lompoc restaurant deals`
- `lompoc food coupons`
- `restaurants in lompoc ca`
- `lompoc dining specials`
- `where to eat in lompoc`
- `ofertas de restaurantes en lompoc`

**OG Title:** `Lompoc Restaurant Deals — Eat Local, Save Local`
**OG Description:** `Browse today's food and dining deals from Lompoc, CA restaurants. Free to claim.`

**H1 hero copy (to replace generic `{cat.name}` heading):**
`Food & Drink Deals in Lompoc`

**Hero subtitle (to replace generic count line):**
`{count} active deals from Lompoc restaurants, cafés, and food trucks — updated daily.`

---

## Slug: `services`

**Title:**
`Lompoc Service Business Deals — Local Discounts on Services | Lompoc Deals`

**Meta Description:**
`Save on plumbing, cleaning, tutoring, pet care, and more. Deals from local Lompoc service businesses. Free to claim, no credit card.`

**Keywords:**
- `lompoc service deals`
- `lompoc local services discount`
- `lompoc plumbing deals`
- `lompoc cleaning services coupon`
- `servicios en lompoc ca`

**OG Title:** `Lompoc Service Deals — Save on the Things You Need`
**OG Description:** `Plumbing, cleaning, tutoring, and more — current deals from Lompoc service businesses.`

**H1 hero copy:**
`Services Deals in Lompoc`

**Hero subtitle:**
`{count} active deals from Lompoc service businesses — save on the things you need most.`

---

## Slug: `dispensaries`

**Title:**
`Lompoc Dispensary Deals & Cannabis Specials — Licensed CA Dispensaries | Lompoc Deals`

**Meta Description:**
`Browse current deals and specials from licensed cannabis dispensaries in Lompoc, CA. Age 21+. Free to browse — no account needed.`

**Keywords:**
- `lompoc dispensary deals`
- `lompoc cannabis specials`
- `dispensary near lompoc`
- `lompoc weed deals`
- `cannabis deals lompoc ca`

**OG Title:** `Lompoc Dispensary Deals — Current Cannabis Specials`
**OG Description:** `Licensed cannabis dispensary deals in Lompoc, CA. Browse current specials. 21+ only.`

**H1 hero copy:**
`Dispensary Deals in Lompoc`

**Hero subtitle:**
`{count} active deals from licensed Lompoc dispensaries. 21+ · California-licensed businesses only.`

**Special note for CTO:** Add a 21+ disclaimer badge on this category page hero. Example: a small amber badge reading "21+ only · Licensed CA dispensaries." This is a compliance requirement for cannabis advertising in California.

---

## Slug: `wineries`

**Title:**
`Lompoc Winery Deals & Wine Tasting Specials — Santa Rita Hills | Lompoc Deals`

**Meta Description:**
`Discover wine tasting deals and winery specials in Lompoc's Wine Ghetto and Santa Rita Hills AVA. Book your tasting, save on your visit.`

**Keywords:**
- `lompoc winery deals`
- `wine tasting lompoc`
- `santa rita hills wine deals`
- `lompoc wine ghetto`
- `lompoc wine country specials`
- `wine tasting deals santa barbara county`

**OG Title:** `Lompoc Wine Country Deals — Santa Rita Hills Tasting Specials`
**OG Description:** `Winery deals and tasting specials in Lompoc's Wine Ghetto and Santa Rita Hills. Save on your wine country visit.`

**H1 hero copy:**
`Winery Deals in Lompoc Wine Country`

**Hero subtitle:**
`{count} active winery deals and tasting specials — Santa Rita Hills AVA and Lompoc Wine Ghetto.`

**SEO note:** "Santa Rita Hills" + "Wine Ghetto" are established tourist search terms with national volume. These keywords outperform generic "lompoc wineries" by 5–10x estimated search volume. Use them prominently.

---

## Slug: `health-beauty`

**Title:**
`Lompoc Health & Beauty Deals — Salons, Spas & Wellness Coupons | Lompoc Deals`

**Meta Description:**
`Save on haircuts, nails, massage, facials, and wellness services in Lompoc, CA. Current deals from local salons and spas. Free to claim.`

**Keywords:**
- `lompoc salon deals`
- `lompoc beauty coupons`
- `lompoc spa specials`
- `hair salon lompoc ca`
- `nail salon deals lompoc`
- `ofertas de salud y belleza lompoc`

**OG Title:** `Lompoc Beauty & Wellness Deals — Local Salons & Spas`
**OG Description:** `Hair, nails, massage, and more — current deals from Lompoc salons and wellness businesses.`

**H1 hero copy:**
`Health & Beauty Deals in Lompoc`

**Hero subtitle:**
`{count} active deals from Lompoc salons, spas, and wellness businesses.`

---

## Slug: `real-estate`

**Title:**
`Lompoc Real Estate Listings — Homes For Sale & For Rent | Lompoc Deals`

**Meta Description:**
`Browse homes for sale and apartments for rent in Lompoc, CA. Local listings from Lompoc real estate businesses — updated regularly.`

**Keywords:**
- `lompoc homes for sale`
- `lompoc apartments for rent`
- `lompoc real estate listings`
- `houses for rent in lompoc ca`
- `lompoc ca real estate`

**OG Title:** `Lompoc Real Estate — Homes For Sale & Rent`
**OG Description:** `Local homes for sale and apartments for rent in Lompoc, CA. Browse current listings.`

**H1 hero copy:**
`Real Estate in Lompoc`

**Hero subtitle:**
`{count} active listings — homes for sale and apartments for rent in Lompoc, CA.`

---

## Slug: `retail`

**Title:**
`Lompoc Retail Deals & Shopping Coupons — Local Stores | Lompoc Deals`

**Meta Description:**
`Find deals and coupons from local Lompoc retail shops — clothing, home goods, gifts, and more. Shop local and save.`

**Keywords:**
- `lompoc retail deals`
- `lompoc shopping coupons`
- `local stores lompoc ca`
- `lompoc boutique deals`

**OG Title:** `Lompoc Retail Deals — Shop Local and Save`
**OG Description:** `Deals from Lompoc's local shops and boutiques. Browse current coupons and in-store specials.`

**H1 hero copy:**
`Retail & Shopping Deals in Lompoc`

**Hero subtitle:**
`{count} active deals from local Lompoc shops and retailers.`

---

## Slug: `automotive`

**Title:**
`Lompoc Auto Deals — Car Service Coupons & Auto Shop Specials | Lompoc Deals`

**Meta Description:**
`Oil changes, tires, detailing, and auto repair deals in Lompoc, CA. Save on your car at local shops.`

**Keywords:**
- `lompoc auto repair deals`
- `lompoc oil change coupon`
- `car service lompoc ca`
- `lompoc tire deals`

**OG Title:** `Lompoc Auto Deals — Car Service Coupons`
**OG Description:** `Oil changes, tires, and auto repair specials from Lompoc shops. Save on your car maintenance.`

**H1 hero copy:**
`Automotive Deals in Lompoc`

**Hero subtitle:**
`{count} active deals from Lompoc auto shops — oil changes, tires, detailing, and more.`

---

## Fallback (keep for uncovered slugs)

```ts
title: `Lompoc ${cat.name} Deals & Coupons — Local Discounts | Lompoc Deals`
description: `Browse current ${catLower} deals and coupons from Lompoc, CA businesses. Free to claim, updated daily — no credit card needed.`
```

---

## Priority Order for CTO Implementation

| Priority | Slug | Reason |
|----------|------|--------|
| P0 | `food-drink` | Highest search volume, most businesses |
| P0 | `wineries` | High-intent tourist traffic, Santa Rita Hills keywords |
| P0 | `dispensaries` | Compliance note needed (21+ badge) |
| P1 | `health-beauty` | High deal count, repeat usage |
| P1 | `services` | Broad category, long-tail value |
| P2 | `real-estate` | Module exists, moderate volume |
| P2 | `retail` | Growing category |
| P3 | `automotive` | Smaller category, still useful |
