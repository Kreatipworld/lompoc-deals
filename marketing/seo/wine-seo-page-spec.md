# Wine Tourism SEO Pages — Lompoc Deals
*Owner: CMO / Content & SEO Strategist*
*Created: 2026-04-08 | M-017 | Blocking ticket: CTO to build /lompoc/wine-deals and /lompoc/wineries routes*
*KPI: 100 organic sessions/week from wine content by day 90*

---

## Overview

Two new SEO-optimized pages targeting wine tourism search traffic. Content is production-ready.
CTO needs to build the routes and inject the deal data server-side.

**High-value keyword opportunity:** "Santa Rita Hills wine" gets significant search volume; "Lompoc winery deals" has near-zero competition. We can rank #1 for the latter within weeks of indexing.

---

## Page 1: `/lompoc/wine-deals`

### Meta
```
<title>Lompoc Wine Deals — Tasting Discounts & Winery Specials in Santa Rita Hills | Lompoc Deals</title>
<meta name="description" content="Browse current wine deals and tasting discounts from Lompoc wineries in the Santa Rita Hills AVA. Claim deals free — no credit card needed. Updated by local wineries." />
<link rel="canonical" href="https://lompoc-deals.vercel.app/lompoc/wine-deals" />
```

### OpenGraph
```
og:title = "Lompoc Wine Deals — Tasting Specials in Santa Rita Hills"
og:description = "Current tasting discounts and wine deals from Lompoc-area wineries. Free to claim."
og:image = [winery deal card or vineyard photo]
```

### H1
`Lompoc Wine Deals & Tasting Discounts`

### Intro (EN)
> Looking for wine deals in Lompoc? Browse current tasting discounts, bottle specials, and winery offers from Santa Rita Hills and the Lompoc Wine Ghetto — all in one place. Deals are posted directly by local wineries and are free to claim. No credit card, no subscription.

### Intro (ES)
> ¿Buscas ofertas de vino en Lompoc? Explora descuentos actuales de cata, promociones de botellas y ofertas de bodegas de Santa Rita Hills y el Wine Ghetto de Lompoc — todo en un solo lugar. Las ofertas son publicadas directamente por las bodegas locales y son gratis para reclamar. Sin tarjeta de crédito, sin suscripción.

### Body Sections
1. **[Dynamic] Active Wine Deals** — server-rendered from `category = 'winery'` or `category = 'wine'`
2. **About Lompoc Wine Country** — brief 2-paragraph editorial (see below)
3. **Are You a Lompoc Winery?** — merchant CTA: "List your tasting deals free"

### Editorial Copy: "About Lompoc Wine Country"
> The Santa Rita Hills AVA, located just west of Lompoc, is one of California's premier cool-climate wine regions. Known for world-class Pinot Noir and Chardonnay, the area attracts wine enthusiasts from across California and beyond. The nearby Lompoc Wine Ghetto — a cluster of urban tasting rooms in a former industrial district — offers a unique and accessible wine tasting experience without the crowds of Napa or Sonoma.
>
> Lompoc Deals partners with local wineries to bring you exclusive tasting deals, bottle discounts, and special offers. Browse current deals above and plan your Santa Rita Hills wine country visit.

### Target Keywords
- `lompoc wine deals` (primary — near-zero competition)
- `lompoc winery tasting deals`
- `santa rita hills wine deals`
- `lompoc wine ghetto deals`
- `lompoc ca winery discounts`
- `santa barbara wine deals`

### JSON-LD
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Lompoc Wine Deals",
  "description": "Current wine deals and tasting discounts from Lompoc wineries",
  "url": "https://lompoc-deals.vercel.app/lompoc/wine-deals",
  "itemListElement": [
    // server-rendered: one ListItem per active wine deal
  ]
}
```

### Internal Links
- Breadcrumb: Home > Lompoc > Wine Deals
- Link to `/lompoc/wineries` ("Browse all Lompoc wineries")
- Link to `/lompoc/food-deals` ("Also see: Lompoc restaurant deals")

---

## Page 2: `/lompoc/wineries`

### Meta
```
<title>Lompoc Wineries — Santa Rita Hills & Wine Ghetto Directory | Lompoc Deals</title>
<meta name="description" content="Discover Lompoc-area wineries in the Santa Rita Hills AVA and Lompoc Wine Ghetto. Browse winery profiles, current deals, and tasting hours. Free to browse." />
<link rel="canonical" href="https://lompoc-deals.vercel.app/lompoc/wineries" />
```

### H1
`Lompoc Wineries — Santa Rita Hills & Wine Ghetto`

### Intro (EN)
> Explore wineries in Lompoc, California — from the renowned Santa Rita Hills AVA to the unique urban tasting rooms of the Lompoc Wine Ghetto. Browse profiles, discover current deals, and plan your visit. All winery listings are free to browse; deals are free to claim.

### Intro (ES)
> Explora bodegas en Lompoc, California — desde la reconocida AVA Santa Rita Hills hasta las únicas salas de cata urbanas del Wine Ghetto de Lompoc. Navega perfiles, descubre ofertas actuales y planifica tu visita. Todos los perfiles de bodegas son gratis para explorar; las ofertas son gratis para reclamar.

### Body Sections
1. **[Dynamic] Featured Wineries** — Standard/Premium tier wineries first (with deal badge)
2. **[Dynamic] All Lompoc Wineries** — full directory sorted by name or neighborhood
3. **Lompoc Wine Country Map** — static embed or link to Google Maps search "wineries near Lompoc CA"
4. **Plan Your Visit** — brief guide (see below)
5. **Winery Owner CTA** — "Is your winery listed? Claim your free profile and post deals."

### Editorial Copy: "Plan Your Wine Country Visit"
> **Getting there:** Lompoc is located on California's Central Coast, approximately 60 miles north of Santa Barbara and 200 miles south of San Francisco. Take US-101 to CA-246 west.
>
> **Where to start:** The Lompoc Wine Ghetto (Industrial Way, Lompoc) is an easy first stop — multiple tasting rooms within walking distance. Open most weekends; call ahead for weekday hours.
>
> **Santa Rita Hills:** Drive west on CA-246 toward Buellton to find vineyard estate wineries. More rural setting, reservations often recommended.
>
> **Save on tastings:** Many Lompoc wineries post tasting deals on Lompoc Deals. Browse the deals tab on each winery's profile before you visit.

### Target Keywords
- `lompoc wineries` (primary — moderate volume, low competition)
- `santa rita hills wineries`
- `lompoc wine ghetto`
- `wineries near lompoc ca`
- `lompoc wine tasting`
- `lompoc ca wine country`

### JSON-LD
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Lompoc Wineries Directory",
  "description": "Wineries in Lompoc CA — Santa Rita Hills AVA and Lompoc Wine Ghetto",
  "url": "https://lompoc-deals.vercel.app/lompoc/wineries",
  "itemListElement": [
    // server-rendered: one ListItem per listed winery with name, url, address
  ]
}
```

---

## Sitemap Additions (for CTO)

Add to `app/sitemap.ts`:
```
/lompoc/wine-deals   — priority 0.8, changefreq daily
/lompoc/wineries     — priority 0.9, changefreq weekly
```

---

## Implementation Notes for CTO

1. `/lompoc/wine-deals` — filter businesses by `categorySlug = 'winery'` or similar; show only active deals
2. `/lompoc/wineries` — show ALL winery-category businesses regardless of deal status; include deal count badge
3. Standard/Premium tier wineries should sort first on the `/lompoc/wineries` page (once B-001 Stripe ships)
4. Both pages need breadcrumb: Home > Lompoc > [page name]
5. The "Plan Your Visit" and editorial sections are static copy — hardcode in component
6. `/lompoc/wineries` can link to existing individual winery profile pages if those exist

---

## Cross-Promotion

Once live, add links to wine pages from:
- Homepage hero or "Explore by category" section → Wineries tab (already exists)
- `/lompoc` hub page → add Wine Deals and Wineries to category nav
- `seo-page-copy-spec.md` hub page (`/lompoc`) → add wine links to category navigation
- Social bio links (Instagram, TikTok) → rotate between homepage and `/lompoc/wineries`
