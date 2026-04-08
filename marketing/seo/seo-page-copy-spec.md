# SEO Landing Page Copy Spec — Lompoc Deals
*Owner: CMO / Content & SEO Strategist*
*Created: 2026-04-08 | Blocking ticket: REQ-005 (CTO to build /lompoc/[category] routes)*
*KPI: 200 organic sessions/month from these pages by day 90*

---

## Overview

Programmatic SEO pages targeting mid-funnel local search queries.
Content is ready to drop in once CTO ships the dynamic routes.

**Handoff to CTO:** This file provides all copy, meta tags, structured data, and internal linking specs.
See `CMO_REQUESTS.md` REQ-005 for the technical requirements.

---

## Page 1: `/lompoc/food-deals`

### Meta
```
<title>Lompoc Food & Restaurant Deals — Save at Local Restaurants | Lompoc Deals</title>
<meta name="description" content="Find the best food deals and restaurant discounts in Lompoc, CA. Browse current offers from local restaurants, cafes, and food businesses — free to claim, no credit card needed." />
<link rel="canonical" href="https://lompoc-deals.vercel.app/lompoc/food-deals" />
```

### OpenGraph
```
og:title = "Lompoc Food Deals — Local Restaurant Discounts"
og:description = "Current deals from Lompoc restaurants and food businesses. Free to claim."
og:image = [featured deal card screenshot]
```

### H1
`Lompoc Food & Restaurant Deals`

### Intro Paragraph (EN)
> Looking for the best food deals in Lompoc? Browse current discounts from local restaurants, cafes, bakeries, and food businesses — all in one place. Deals are free to claim and updated regularly by the businesses themselves. No subscription, no credit card.

### Intro Paragraph (ES)
> ¿Buscas las mejores ofertas de comida en Lompoc? Explora descuentos actuales de restaurantes locales, cafeterías, panaderías y negocios de comida — todo en un solo lugar. Las ofertas son gratis para reclamar y los propios negocios las actualizan regularmente. Sin suscripción, sin tarjeta de crédito.

### Body Sections
1. **[Dynamic] Active Food Deals** — server-rendered list of current deals from `food` and `restaurant` categories
2. **How to Claim** — 3-step explainer (Browse → Claim → Show merchant)
3. **Are You a Lompoc Food Business?** — CTA to merchant signup with free tier pitch

### Target Keywords
- `lompoc food deals` (primary)
- `lompoc restaurant discounts`
- `food deals lompoc ca`
- `lompoc ca restaurants specials`

### Internal Links
- Link to `/lompoc/salon-deals`, `/lompoc/services-deals` in footer
- Link to `/` (homepage) in breadcrumb: Home > Lompoc > Food Deals

### JSON-LD Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Lompoc Food Deals",
  "description": "Current food and restaurant deals in Lompoc, CA",
  "url": "https://lompoc-deals.vercel.app/lompoc/food-deals",
  "itemListElement": [
    // server-rendered: one ListItem per active deal with name, url, description
  ]
}
```

---

## Page 2: `/lompoc/salon-deals`

### Meta
```
<title>Lompoc Salon & Beauty Deals — Haircuts, Nails & Spa Discounts | Lompoc Deals</title>
<meta name="description" content="Find salon, beauty, and spa deals in Lompoc, CA. Discounts on haircuts, nail appointments, facials, and more from local Lompoc beauty businesses." />
```

### H1
`Lompoc Salon & Beauty Deals`

### Intro Paragraph (EN)
> Save on beauty services in Lompoc. Find current deals on haircuts, nail appointments, facials, waxing, and spa services from local salons. Browse, claim for free, and show the deal when you arrive. Updated by Lompoc beauty businesses directly.

### Intro Paragraph (ES)
> Ahorra en servicios de belleza en Lompoc. Encuentra ofertas actuales en cortes de cabello, citas de uñas, faciales, depilación y servicios de spa de salones locales. Explora, reclama gratis y muestra la oferta cuando llegues. Actualizado directamente por negocios de belleza de Lompoc.

### Target Keywords
- `lompoc salon deals` (primary)
- `lompoc hair salon discounts`
- `beauty deals lompoc ca`
- `lompoc nail salon specials`
- `lompoc spa deals`

### Body Sections
1. **[Dynamic] Active Salon & Beauty Deals**
2. **Popular Services** — curated list (haircut, nails, facial, waxing, massage)
3. **List Your Salon** — merchant CTA

---

## Page 3: `/lompoc/services-deals`

### Meta
```
<title>Lompoc Local Services Deals — Plumbers, Auto, Cleaning & More | Lompoc Deals</title>
<meta name="description" content="Deals and discounts on local services in Lompoc, CA — auto repair, home cleaning, plumbing, fitness, and more. Free to claim from local Lompoc service providers." />
```

### H1
`Lompoc Local Services Deals`

### Intro Paragraph (EN)
> Find deals on local services in Lompoc — auto repair, home cleaning, fitness memberships, tutoring, pet grooming, and more. Claim offers from local Lompoc service providers for free. No subscription required.

### Intro Paragraph (ES)
> Encuentra ofertas en servicios locales en Lompoc — reparación de autos, limpieza del hogar, membresías de gimnasio, tutorías, estética para mascotas y más. Reclama ofertas de proveedores de servicios locales de Lompoc gratis. No se requiere suscripción.

### Target Keywords
- `lompoc services deals` (primary)
- `lompoc auto repair discounts`
- `lompoc home services deals`
- `lompoc fitness deals`
- `local services lompoc ca`

---

## Page 4: `/lompoc/deals-today`

### Meta
```
<title>Lompoc Deals Today — Active Deals Expiring Soon | Lompoc Deals</title>
<meta name="description" content="Today's active deals in Lompoc, CA. Deals expiring today or this week from local Lompoc businesses. Free to claim — no credit card needed." />
```

### H1
`Lompoc Deals Today`

### Intro Paragraph (EN)
> Deals expiring soon in Lompoc. These offers from local businesses are active now — claim them before they're gone. Updated in real-time as Lompoc merchants post new deals.

### Intro Paragraph (ES)
> Ofertas que vencen pronto en Lompoc. Estas promociones de negocios locales están activas ahora — reclámalas antes de que terminen. Actualizadas en tiempo real cuando los comerciantes de Lompoc publican nuevas ofertas.

### Target Keywords
- `lompoc deals today`
- `deals expiring today lompoc`
- `lompoc current deals`
- `lompoc specials this week`

### Special Behavior (for CTO)
- Filter: `WHERE expiresAt <= NOW() + INTERVAL '7 days' AND expiresAt > NOW()`
- Sort: `ORDER BY expiresAt ASC` (soonest expiring first)
- Show countdown: "Expires in X days" badge on each deal card

---

## Hub Page: `/lompoc`

### Meta
```
<title>Lompoc Deals — Local Discounts & Specials in Lompoc, CA | Lompoc Deals</title>
<meta name="description" content="Browse local deals and discounts in Lompoc, CA. Food, salon, services, retail and more — free to claim from Lompoc businesses. Updated daily." />
```

### H1
`Lompoc Deals & Local Discounts`

### Intro Paragraph (EN)
> Your guide to the best deals in Lompoc, California. Browse current discounts from local restaurants, salons, retail shops, and service providers. All deals are free to claim — no credit card or subscription needed. Updated daily as Lompoc businesses post new offers.

### Intro Paragraph (ES)
> Tu guía de las mejores ofertas en Lompoc, California. Explora descuentos actuales de restaurantes, salones, tiendas minoristas y proveedores de servicios locales. Todas las ofertas son gratis para reclamar — sin tarjeta de crédito ni suscripción. Actualizado diariamente cuando los negocios de Lompoc publican nuevas ofertas.

### Category Navigation (links to sub-pages)
- Food & Restaurants → `/lompoc/food-deals`
- Salon & Beauty → `/lompoc/salon-deals`
- Local Services → `/lompoc/services-deals`
- Expiring Soon → `/lompoc/deals-today`

### JSON-LD for Hub
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Lompoc Deals",
  "description": "Local deals and discounts directory for Lompoc, CA",
  "url": "https://lompoc-deals.vercel.app",
  "areaServed": {
    "@type": "City",
    "name": "Lompoc",
    "addressRegion": "CA",
    "addressCountry": "US"
  }
}
```

---

## Sitemap Requirements (for CTO)

Add to `app/sitemap.ts`:
```
/lompoc                       — priority 0.9, changefreq daily
/lompoc/food-deals            — priority 0.8, changefreq daily
/lompoc/salon-deals           — priority 0.8, changefreq daily
/lompoc/services-deals        — priority 0.8, changefreq daily
/lompoc/deals-today           — priority 0.9, changefreq hourly
```

---

## Implementation Note for CTO

All copy in this file is production-ready. When building the routes:
1. Use the H1 and intro paragraphs exactly as written (or translate to JSX)
2. Inject the JSON-LD structured data in `<head>` via Next.js `generateMetadata`
3. The `[Dynamic] Active Deals` sections should pull from the DB filtered by `categorySlug`
4. For `/lompoc/deals-today`, use the expiry filter specified above
5. Each page needs a breadcrumb: `Home > Lompoc > [Category]`

See `CMO_REQUESTS.md` REQ-005 for full technical requirements.
