# SEO Foundation + Local Authority — Design

**Date:** 2026-07-08
**Status:** Approved by Andres
**Context:** www.lompoclocals.com went live 2026-07-08 (day-old domain, zero
Google presence: no Search Console, no Business Profile, no backlinks).
Goal: rank site-wide for Lompoc searches — "garage sales lompoc",
"lompoc deals", "restaurants in lompoc", "things to do in lompoc",
business names. Feed Phase 3 (comments/reactions) is intentionally paused
behind this work.

## Strategy summary

A new domain's first 90 days are about being known and trusted, not page
volume. Two tracks:

1. **Code track** — complete the crawlable/index surface, remove crawl
   waste, add structured data, and build exactly ONE query-matched landing
   page ("Garage Sales in Lompoc").
2. **Playbook track** — a step-ordered document for actions only the owner
   can take (Search Console, Google Business Profile, citations, local
   backlinks).

Programmatic neighborhood × category pages (Approach B) are explicitly
deferred until the measurement gate below is met.

## Non-goals

- No programmatic page generation in this iteration (thin-content risk on a
  zero-authority domain).
- No paid search/ads work.
- No new dependencies.
- No geography outside Lompoc + Vandenberg (ZIPs 93436/37/38).

## Current state (audited 2026-07-08)

Already good: `metadataBase` + OG/Twitter tags in `app/layout.tsx`; 30 public
pages with `generateMetadata`; JSON-LD on `/biz/[slug]` (LocalBusiness via
`lib/business-jsonld.ts`) and `/blog/[slug]`; sitemap (businesses,
categories, blog, 7 statics) and robots.txt derived from `AUTH_URL`; hreflang
link headers from next-intl middleware; legacy `lompoc-deals.vercel.app`
308-redirects to the new domain; 51 published blog posts.

Gaps this spec closes:
- Sitemap omits `/hotels`, `/hotels/[slug]` (18 pages), `/activities`,
  `/activities/[slug]`, `/feed`, `/locals`, `/contact`.
- No per-page `alternates` metadata (canonical + hreflang) — middleware
  headers exist, but page-level canonicals remove `/` vs legacy-`/en` vs
  `/es` ambiguity.
- `/events/{id}` hrefs in the feed point at a route that does not exist
  (404 the moment an event is approved — confirmed live).
- Two seeded blog posts name `lompoc-deals.vercel.app` in their prose
  (`content/blog/posts-26-50.json` + the corresponding DB rows).
- The single most winnable recurring query ("garage sales lompoc") has no
  dedicated page; `/garage-sales` is currently a bare 308 to
  `/feed?type=for_sale`.

## Section 1 — Index surface completion (code)

### 1a. Sitemap additions (`app/sitemap.ts`)

Add:
- `/hotels` (static, weekly, 0.7) and `/hotels/[slug]` for each hotel in
  `lib/hotels-data.ts` (weekly, 0.6)
- `/activities` (weekly, 0.7) and `/activities/[slug]` from the activities
  table (weekly, 0.6)
- `/feed` (daily, 0.8), `/locals` (weekly, 0.6), `/contact` (monthly, 0.4)
- `/garage-sales` (daily, 0.8) — the new landing page (Section 2)

Explicitly excluded and why: `/deals/[id]`, `/feed/[id]`, `/listings/[id]`
(short-lived/expiring content — sitemap churn without ranking value),
`/search`, auth/dashboard/admin (noindex surface).

### 1b. Per-page canonical + hreflang (`lib/seo.ts`, new)

One helper consumed by page `generateMetadata` functions:

```ts
pageAlternates(path: string): Metadata["alternates"]
// → { canonical: path, languages: { en: path, es: `/es${path}` } }
```

Relative URLs resolve against the existing `metadataBase` (AUTH_URL). Apply
to the ~10 highest-value templates: home, `/feed`, `/businesses`,
`/category/[slug]`, `/biz/[slug]`, `/blog` + `/blog/[slug]`, `/hotels` +
`/hotels/[slug]`, `/activities` + `/activities/[slug]`, `/map`,
`/garage-sales`. Dynamic pages pass their concrete path (e.g.
`/biz/${slug}`).

### 1c. Public event detail page (`app/[locale]/(public)/events/[id]/page.tsx`, new)

Fixes the live 404. Minimal server component: event title, date/time,
location, description, image if present, link back to `/feed?type=event`.
`generateMetadata` (title, description, alternates) + **Event JSON-LD**
(`@type: Event`, name, startDate/endDate, location as Place with Lompoc
address, image, description). 404 via `notFound()` for missing/unapproved
events. Events are NOT added to the sitemap (short-lived), but the page
being real makes feed links crawlable and eligible for Google's event
surfaces.

### 1d. Old-domain prose cleanup

- Edit the two post bodies in `content/blog/posts-26-50.json` to say
  `www.lompoclocals.com` (and "Lompoc Locals" where the sentence reads
  "Lompoc Deals hotels page" / "Lompoc Deals (lompoc-deals.vercel.app)").
- One-shot script `db/fix-blog-domain-mentions.ts` (pattern:
  `db/migrate-garage-sales-to-feed.ts` — dry-run flag, then update) that
  applies the same replacement to the published rows in `blog_posts`.

## Section 2 — "Garage Sales in Lompoc" landing page (code)

Repurpose `app/[locale]/(public)/garage-sales/page.tsx` from a 308 redirect
into a real indexable page. Target queries: "garage sales lompoc",
"yard sales lompoc", "garage sales lompoc this weekend" (+ Spanish
equivalents).

Content, server-rendered so it's all crawlable:
- H1 + intro copy (EN/ES via next-intl, new `garageSales` namespace):
  what's on this weekend in Lompoc, updated continuously by neighbors.
- Live garage-sale cards: `getFeedItems()` filtered to `type ===
  "garage_sale"`, rendered with the existing `FeedCard` (server-side list —
  no client island needed here). Empty state: "No garage sales posted yet
  this week" + CTA.
- "This weekend" section ordering: sales matching `isThisWeekend` first.
- Map: reuse `FeedMap` behind the same dynamic-import pattern, garage-sale
  pins only.
- CTA block: "Having a sale? Post it free" → `/feed/post`.
- FAQ section (3 Q&As, EN/ES) + **FAQPage JSON-LD**: when are garage sales
  in Lompoc, how to find them by neighborhood, how to post one.
- Internal links: to `/feed?type=garage_sale` (browse all), `/map`,
  neighborhood chips linking to `/feed?type=garage_sale&hood=<slug>`.

Routing note: the old `?type=for_sale` deep link behavior is preserved by
the feed page itself; nothing else changes. `/garage-sales` moves from
"redirect" to "page" in the sitemap.

SEO title pattern: `Garage Sales in Lompoc, CA — This Weekend's Yard Sales |
Lompoc Locals` (ES: `Ventas de garaje en Lompoc, CA | Lompoc Locals`).

## Section 3 — Off-page playbook (document)

Deliverable: `docs/marketing/seo-playbook.md` — owner-executable steps,
ordered by impact, each with exact instructions and expected effort.

1. **Day 1 — Google Search Console:** add DOMAIN property
   `lompoclocals.com`, verify via DNS TXT record at GoDaddy (exact GoDaddy
   UI steps), submit `https://www.lompoclocals.com/sitemap.xml`, use URL
   Inspection → Request Indexing on: `/`, `/garage-sales`, `/feed`,
   `/businesses`, `/blog`. Also verify Bing Webmaster Tools (imports from
   GSC).
2. **Week 1 — Google Business Profile** for Lompoc Locals (category:
   "Internet marketing service" or "Media company"; service-area business
   covering Lompoc; website = new domain; posts weekly). Plus **Bing
   Places**, **Yelp**, **Facebook Page** URL updates, **Nextdoor** business
   page — consistent name/address/phone + the new domain everywhere.
3. **Weeks 2–6 — Lompoc link circuit** (one per week, scripts provided in
   the playbook):
   - Lompoc Valley Chamber of Commerce member listing (paid member link —
     highest-value local link available)
   - City of Lompoc / Explore Lompoc resource pages (email pitch template)
   - Lompoc Record + Noozhawk press pitch: "local duo launches free
     community deals platform" (template included)
   - Vandenberg Village / Mission Hills / Lompoc community Facebook groups:
     share the garage-sales page (genuine utility, not spam — post
     template)
   - Every digest email footer + business welcome email already links the
     domain (verify after AUTH_URL change — links now point to the new
     domain automatically)
4. **Ongoing cadence:** 1 blog post/week minimum (content calendar seed
   list included: launch-window topics tied to searches — flower festival,
   VSFB launch viewing, weekend guides), each internally linking to a
   category or the garage-sales page.

## Section 4 — Measurement

- **Weekly check (playbook includes how):** GSC impressions + clicks for
  five query families: brand ("lompoc locals", "lompoc deals"), garage
  sales, deals/coupons, restaurants, things-to-do. Existing analytics
  already buckets Google referrers ("Google" source in
  `lib/referrer.ts`) for the click-through view.
- **Gate to unlock Approach B (programmatic neighborhood × category
  pages):** ≥500 weekly GSC impressions AND `/garage-sales` indexed and
  appearing (any position ≤50) for a garage-sale query. Revisit then.

## Error handling

- Sitemap DB queries: wrap hotel/activity additions so a query failure
  degrades to the current sitemap rather than 500ing (same safeStream
  philosophy as the feed).
- Event page: `notFound()` for unknown/unapproved/cancelled events; date
  formatting locale-pinned like feed cards.
- Garage-sales page renders its empty state (not an error) when no active
  sales exist; JSON-LD emitted regardless.

## Testing

- `lib/seo.ts` unit test (tsx assert script): alternates shape for static
  and dynamic paths.
- Sitemap smoke: fetch `/sitemap.xml` locally, assert new URL families
  present, no expired-content families, all URLs on AUTH_URL origin.
- Event page: seed/dev check — approved event renders + Event JSON-LD
  validates (schema.org validator step in plan); unapproved → 404.
- Garage-sales page: renders cards when garage sales exist; FAQPage JSON-LD
  present; EN/ES parity check passes.
- Post-deploy: Rich Results Test on `/garage-sales` and one event URL;
  `curl` sitemap on prod.

## Phases (each shippable)

1. **Index surface** — sitemap additions, `lib/seo.ts` + alternates on the
   10 templates, event detail page, blog prose cleanup (Sections 1a–1d).
2. **Garage-sales landing page** (Section 2).
3. **Playbook document** (Sections 3–4) — no code; written, committed, and
   walked through with the owner.
