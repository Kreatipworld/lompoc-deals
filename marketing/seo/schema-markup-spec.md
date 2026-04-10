# Structured Data / JSON-LD Schema Spec — Lompoc Deals
*Owner: CMO / Content & SEO Strategist*
*Created: 2026-04-10 | Status: Ready for CTO implementation*
*Related: M-008 (SEO landing pages), M-002 (GBP), REQ-013 (new)*

---

## Why This Matters

Schema markup (JSON-LD) tells Google exactly what each page is about. For a local business directory, correct schema can unlock:

- **Rich snippets** in search results (star ratings, hours, address)
- **Local pack eligibility** for business profile pages
- **Knowledge panel** population
- **"Things to do"** results for activity pages (high-value tourist query)
- **Breadcrumb trails** in search results (increases CTR ~15–25%)

Zero engineering cost beyond adding `<script type="application/ld+json">` tags to page heads. High SEO leverage.

**KPI target:** 20%+ increase in organic CTR within 60 days of implementation (benchmark via Google Search Console).

---

## Implementation Notes for CTO

- All schemas go in `<head>` as `<script type="application/ld+json">...</script>`
- In Next.js, use the `metadata` object's `other` field or inject via a `JsonLd` component
- Use real data from the DB — no hardcoded placeholders in production
- Validate at: https://validator.schema.org and https://search.google.com/test/rich-results
- For pages with multiple schemas (e.g., business page has LocalBusiness + BreadcrumbList), output multiple `<script>` blocks, one per schema type

---

## Schema 1 — WebSite (Homepage Only)

**Page:** `/` (homepage)  
**Purpose:** Enables the Google sitelinks search box; establishes site identity.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Lompoc Deals",
  "url": "https://lompoc-deals.vercel.app",
  "description": "Lompoc's free local business directory — restaurants, shops, salons, wineries, services and more. Bilingual EN/ES.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://lompoc-deals.vercel.app/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": ["en", "es"]
}
```

**CTO note:** Only add `potentialAction` if the `/search?q=` route returns results. If search is not a URL param, adjust `urlTemplate` to match the actual search URL pattern.

---

## Schema 2 — LocalBusiness (Business Profile Pages)

**Page:** `/biz/[slug]`  
**Purpose:** Enables rich snippets (hours, rating, address, phone) in search results. Most impactful schema on the site.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{{business.name}}",
  "url": "https://lompoc-deals.vercel.app/biz/{{business.slug}}",
  "image": "{{business.coverImageUrl}}",
  "logo": "{{business.logoUrl}}",
  "description": "{{business.description}}",
  "telephone": "{{business.phone}}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{business.address}}",
    "addressLocality": "Lompoc",
    "addressRegion": "CA",
    "postalCode": "{{business.zipCode || '93436'}}",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{{business.lat}}",
    "longitude": "{{business.lng}}"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["{{day}}"],
      "opens": "{{openTime}}",
      "closes": "{{closeTime}}"
    }
  ],
  "priceRange": "{{business.priceRange || '$'}}",
  "servesCuisine": "{{business.cuisine || null}}",
  "hasMap": "https://lompoc-deals.vercel.app/map",
  "sameAs": [
    "{{business.facebookUrl || null}}",
    "{{business.instagramUrl || null}}"
  ]
}
```

**CTO implementation notes:**
- `@type` should match the business category. Use these mappings:
  - Restaurants → `Restaurant` (subtype of `FoodEstablishment`)
  - Salons/Beauty → `BeautySalon`
  - Auto → `AutoRepair`
  - Wineries → `Winery`
  - Dispensaries → `Store` (do NOT use `Pharmacy` — schema.org has no cannabis-specific type)
  - Services / General → `LocalBusiness`
- `openingHoursSpecification`: only include if hours data exists in DB. Omit the field entirely if `null`.
- `sameAs`: filter out null values before serializing — Google will flag empty strings.
- `priceRange`: use `$`, `$$`, `$$$`, or `$$$$`. Map from whatever DB stores.
- `servesCuisine`: only include for restaurant-type businesses.
- `image` and `logo`: use full absolute URLs.

**Omit fields that are empty/null** — Google penalizes schema with placeholder or empty values.

---

## Schema 3 — ItemList (Category Pages)

**Page:** `/category/[slug]`  
**Purpose:** Tells Google the page is a curated list of businesses. Improves category page ranking for `lompoc [category] deals` queries.

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "{{category.displayName}} in Lompoc, CA",
  "description": "Discover the best {{category.displayName}} in Lompoc — browse profiles, hours, deals, and contact info.",
  "url": "https://lompoc-deals.vercel.app/category/{{category.slug}}",
  "numberOfItems": {{businesses.length}},
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://lompoc-deals.vercel.app/biz/{{business.slug}}",
      "name": "{{business.name}}"
    }
  ]
}
```

**CTO note:** `itemListElement` should be generated from the actual businesses returned for this category. Limit to 10 items in the schema even if more exist on the page (Google doesn't need the full list; it needs enough to understand the page type).

---

## Schema 4 — TouristAttraction (Activity Detail Pages)

**Page:** `/activities/[slug]`  
**Purpose:** Enables Google's "Things to do" rich results — a dedicated SERP feature for tourist/visitor queries. High value for `things to do in lompoc` keyword.

```json
{
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "name": "{{activity.title}}",
  "url": "https://lompoc-deals.vercel.app/activities/{{activity.slug}}",
  "description": "{{activity.description}}",
  "image": "{{activity.imageUrl}}",
  "touristType": "{{activity.category}}",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{{activity.lat}}",
    "longitude": "{{activity.lng}}"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Lompoc",
    "addressRegion": "CA",
    "addressCountry": "US"
  },
  "isAccessibleForFree": {{activity.isFree}},
  "availableLanguage": ["en", "es"]
}
```

**CTO note:** The activity schema has `activities` seed data table — use those fields. `isAccessibleForFree` should be `true` for activities tagged `free`. `touristType` can be the activity's category slug (e.g., `"outdoor"`, `"wine"`, `"history"`).

---

## Schema 5 — BreadcrumbList (Category + Business + Activity Pages)

**Pages:** `/category/[slug]`, `/biz/[slug]`, `/activities/[slug]`, `/activities`  
**Purpose:** Shows breadcrumb trail in search results (e.g., "Lompoc Deals > Restaurants > El Rancho"). Increases CTR ~15–25%.

### Business page breadcrumb

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Lompoc Deals",
      "item": "https://lompoc-deals.vercel.app"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{{category.displayName}}",
      "item": "https://lompoc-deals.vercel.app/category/{{category.slug}}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{business.name}}",
      "item": "https://lompoc-deals.vercel.app/biz/{{business.slug}}"
    }
  ]
}
```

### Category page breadcrumb

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Lompoc Deals",
      "item": "https://lompoc-deals.vercel.app"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{{category.displayName}} in Lompoc",
      "item": "https://lompoc-deals.vercel.app/category/{{category.slug}}"
    }
  ]
}
```

### Activity page breadcrumb

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Lompoc Deals",
      "item": "https://lompoc-deals.vercel.app"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Things to Do in Lompoc",
      "item": "https://lompoc-deals.vercel.app/activities"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{activity.title}}",
      "item": "https://lompoc-deals.vercel.app/activities/{{activity.slug}}"
    }
  ]
}
```

---

## Implementation Priority Order

| Priority | Schema | Page | Reason |
|----------|--------|------|--------|
| P0 | LocalBusiness | `/biz/[slug]` | Highest SEO leverage — rich snippets for every business |
| P0 | BreadcrumbList | `/biz/[slug]`, `/category/[slug]` | Immediate CTR lift, easy to implement |
| P1 | TouristAttraction | `/activities/[slug]` | Unlocks "Things to do" SERP feature |
| P1 | ItemList | `/category/[slug]` | Category page SEO improvement |
| P2 | WebSite | Homepage | Sitelinks search box — nice to have |

---

## Validation Checklist (for CTO to run after implementation)

- [ ] Paste homepage URL into https://search.google.com/test/rich-results — confirm WebSite schema valid
- [ ] Paste one business profile URL — confirm LocalBusiness / Restaurant schema valid
- [ ] Paste one category URL — confirm BreadcrumbList schema valid
- [ ] Paste one activity URL — confirm TouristAttraction schema valid
- [ ] Check Google Search Console → Enhancements section within 1 week of deploy for any schema errors
- [ ] Zero "missing field" warnings for required fields (name, url, address for LocalBusiness)

---

## Engineering Request (REQ-013)

This spec is a new CTO request. Add to `docs/CMO_REQUESTS.md`:

- **Title:** JSON-LD schema markup — LocalBusiness, BreadcrumbList, TouristAttraction, ItemList, WebSite
- **Why:** Unlocks rich snippets (star ratings, hours, address) in Google results + "Things to do" SERP feature for activity pages. Zero-cost SEO lever.
- **KPI it moves:** Organic CTR +20% within 60 days; "things to do in lompoc" ranking top-5 within 90 days
- **Desired behavior:** Add `<script type="application/ld+json">` blocks to page heads as specified in this doc. Output is dynamic from DB — no hardcoded values.
- **Deadline:** Before press pitch (M-012) — want rich snippets live before journalists and reporters search for us
- **Priority:** P1
