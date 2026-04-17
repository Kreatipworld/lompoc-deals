# Blog Content Strategy — Lompoc Deals
*Owner: CMO | Created: 2026-04-17 | Platform: /blog (live as of commit affda73)*

Blog infrastructure is live. This doc defines content pillars, the first 10 posts to publish, and the ongoing publishing cadence.

---

## Content Pillars

| Pillar | Goal | Target Audience |
|--------|------|-----------------|
| **Local Guides** | Rank for "things to do / eat / drink in Lompoc" | Tourists, newcomers, Vandenberg families |
| **Deals & Savings** | Drive repeat visits, highlight merchant deals | Local consumers |
| **Merchant Spotlights** | Merchant acquisition + retention | Business owners |
| **Lompoc Life** | Community brand, shareable content | All Lompoc residents |
| **Vandenberg / Military** | Capture PCS relocation search traffic | Incoming military families |
| **Santa Rita Hills Wine** | Capture wine tourism traffic | Wine tourists, weekend visitors |

---

## First 10 Posts (ranked by SEO value × ease)

### Priority 1 — Publish immediately (evergreen, high search volume)

**Post 1: "Best Restaurants in Lompoc, CA — Local Picks for 2026"**
- Slug: `/blog/best-restaurants-lompoc-ca`
- Category: Local Guides
- Keywords: "best restaurants Lompoc CA", "where to eat in Lompoc", "Lompoc restaurants"
- Hook: Pull top-rated Food & Dining businesses from the platform. Each mention links to their Lompoc Deals profile.
- Internal links: `/businesses?category=food-dining`, `/deals`
- Schema: BlogPosting + ItemList (for restaurant list)

**Post 2: "Best Wineries Near Lompoc, CA — Santa Rita Hills Wine Trail Guide"**
- Slug: `/blog/best-wineries-lompoc-santa-rita-hills`
- Category: Santa Rita Hills Wine
- Keywords: "wineries near Lompoc CA", "Santa Rita Hills wine trail", "Lompoc wineries"
- Hook: The Santa Rita Hills AVA is world-class Pinot Noir country. Curate the top wineries, link each to their Lompoc Deals profile or deal page.
- Internal links: `/businesses?category=wine-wineries`, `/deals?category=wine-wineries`

**Post 3: "New to Vandenberg? Your Lompoc, CA Relocation Guide"**
- Slug: `/blog/vandenberg-sfb-lompoc-relocation-guide`
- Category: Vandenberg / Military
- Keywords: "Vandenberg AFB relocation guide", "living in Lompoc CA", "Lompoc CA military housing"
- Hook: PCS families search obsessively for relocation content. Cover: housing, schools, dining, things to do, local services, wineries, how to save money with Lompoc Deals.
- Internal links: `/locals`, `/hotels`, `/businesses`
- High strategic value: captures military families at the moment of peak need.

**Post 4: "Things to Do in Lompoc, CA — A Local's Weekend Guide"**
- Slug: `/blog/things-to-do-lompoc-ca`
- Category: Local Guides
- Keywords: "things to do in Lompoc CA", "Lompoc weekend", "Lompoc attractions"
- Hook: Tie into the "Things to Do" section on the deals page. Activities, wineries, flower fields, murals, outdoors.
- Internal links: `/deals` (Things to Do section), `/activities`

**Post 5: "How to Save Money Shopping Local in Lompoc"**
- Slug: `/blog/save-money-shopping-local-lompoc`
- Category: Deals & Savings
- Keywords: "Lompoc deals", "local discounts Lompoc", "save money Lompoc"
- Hook: Explain how Lompoc Deals works from a consumer perspective. Showcase real deals, how to claim, why it's free. CTA: sign up at `/locals`.
- Internal links: `/locals`, `/deals`

---

### Priority 2 — Publish in week 2

**Post 6: "Best Coffee Shops in Lompoc, CA"**
- Slug: `/blog/best-coffee-shops-lompoc`
- Category: Local Guides
- Keywords: "coffee shops Lompoc CA", "cafes Lompoc"
- Pull Coffee & Cafés businesses from the platform.

**Post 7: "Lompoc Flower Festival — Everything You Need to Know"**
- Slug: `/blog/lompoc-flower-festival-guide`
- Category: Lompoc Life
- Keywords: "Lompoc Flower Festival", "Lompoc CA events"
- Seasonal content with perennial search traffic. Tie in local business deals.

**Post 8: "Best Hair Salons & Beauty Services in Lompoc, CA"**
- Slug: `/blog/best-hair-salons-lompoc`
- Category: Local Guides
- Keywords: "hair salons Lompoc CA", "beauty Lompoc"
- High local search intent. Pull Beauty & Wellness businesses.

**Post 9: "List Your Lompoc Business for Free — Here's Why It's Worth It"**
- Slug: `/blog/list-lompoc-business-free`
- Category: Merchant Spotlights
- Keywords: "list business Lompoc", "free business directory Lompoc"
- Merchant acquisition via SEO. CTA: `/signup`

**Post 10: "Where to Stay in Lompoc, CA — Hotels & Lodging Guide"**
- Slug: `/blog/where-to-stay-lompoc-ca`
- Category: Local Guides
- Keywords: "hotels in Lompoc CA", "where to stay Lompoc", "Lompoc lodging"
- Tie into the new `/hotels` section. Links to all 4 hotel pages.
- Internal links: `/hotels`

---

## Publishing Cadence

- **Week 1:** Posts 1–5 (Priority 1 — the traffic drivers)
- **Week 2:** Posts 6–10
- **Ongoing:** 2 posts/week — mix of evergreen guides and timely content (launches, events, seasonal)

## Copy Production Process

1. CMO writes post in this format:
   - Title, slug, metaDescription, category, tags, excerpt
   - Full content in Markdown (stored in `content` field)
   - imageUrl (use Unsplash or Lompoc-specific photo)
2. Insert into `blog_posts` table via admin or Neon MCP with `status: "published"` and `publishedAt: now()`
3. Verify at `/blog/[slug]` and in sitemap
4. Share on social: Nextdoor, Facebook, Instagram

## Internal Linking Rules

- Every post about a business category must link to the relevant `/businesses?category=X` filter
- Every post about deals must link to `/deals`
- Every post about local activities must link to `/deals` (Things to Do section) or `/activities`
- Consumer-facing posts end with CTA: "Browse all local deals at lompoc-deals.vercel.app/locals"
- Merchant-facing posts end with CTA: "List your business free at lompoc-deals.vercel.app/signup"

## RSS Feed

Live at: `lompoc-deals.vercel.app/api/blog/rss`  
Submit to: Google News (when 10+ posts published), Feedly, local blog aggregators.
