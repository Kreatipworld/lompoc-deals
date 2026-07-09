# Lompoc Locals — Owner SEO Playbook

Everything in this document is something **you** do outside the codebase — accounts, profiles, emails, and weekly habits. The on-site work (sitemap, canonicals, landing pages, structured data) already shipped. Work top to bottom; each section tells you exactly where to click and what to paste.

Site: **https://www.lompoclocals.com** · Everything below uses this exact URL. Never mix in the old `lompoc-deals.vercel.app` address anywhere.

---

## 1. Day 1 — Google Search Console (~20 minutes)

This is the single highest-leverage step. Do it before anything else.

### 1a. Create the property

1. Go to **https://search.google.com/search-console** and sign in with the Google account you want to own the site data (use your business Google account, not a personal one you might lose).
2. Click **Add property** → choose the left option, **Domain** → enter `lompoclocals.com` (no `www`, no `https`) → **Continue**.
3. Google shows a **TXT record** like `google-site-verification=AbC123...`. Click **Copy**.

### 1b. Add the TXT record in GoDaddy

1. Go to **godaddy.com** → sign in → **My Products** → find **lompoclocals.com** → click **DNS** (or "Manage DNS").
2. Click **Add** (new record):
   - **Type:** TXT
   - **Name:** `@`
   - **Value:** paste the `google-site-verification=...` string
   - **TTL:** leave the default
3. Save. Wait about 10 minutes, then return to Search Console and click **Verify**. If it fails, wait another 15 minutes and try again — DNS is just slow sometimes.

### 1c. Submit the sitemap

1. In Search Console, left menu → **Sitemaps**.
2. Enter `https://www.lompoclocals.com/sitemap.xml` → **Submit**.
3. Status should show "Success" within a day. It lists ~560 URLs.

### 1d. Request indexing for the money pages

Left menu → **URL Inspection** → paste each URL below, press Enter, then click **Request Indexing**. Google allows a limited number per day; these five, one at a time (~2 minutes each), fit fine:

1. `https://www.lompoclocals.com/`
2. `https://www.lompoclocals.com/garage-sales`
3. `https://www.lompoclocals.com/feed`
4. `https://www.lompoclocals.com/businesses`
5. `https://www.lompoclocals.com/blog`

### 1e. Bing Webmaster Tools (5 minutes)

1. Go to **https://www.bing.com/webmasters** → sign in with a Microsoft account.
2. Choose **Import from Google Search Console** — it copies the verified property and sitemap automatically. Done.

---

## 2. Week 1 — Profiles & citations (~2 hours total)

**The NAP rule (read once, apply everywhere):** every profile must use the exact same name and URL — **Lompoc Locals** and **https://www.lompoclocals.com**. Consistent name + URL across platforms is a local-ranking signal; inconsistency actively hurts.

### 2a. Google Business Profile (~45 min)

1. Go to **https://business.google.com** → **Add business**.
2. **Name:** `Lompoc Locals`
3. **Primary category:** `Media company`. **Secondary:** `Advertising agency`.
4. Choose **service-area business** (no storefront address shown). Service area: **Lompoc, Vandenberg Village, Mission Hills** — ZIPs **93436, 93437, 93438**. Nothing outside those.
5. **Website:** `https://www.lompoclocals.com`
6. Verify however Google offers (phone, video, or postcard).
7. **Weekly habit:** every week's email digest doubles as a GBP Post. Open the profile → **Add update** → paste the digest's top 3 deals + link to `https://www.lompoclocals.com/feed`. Takes 5 minutes and keeps the profile "active," which Google rewards.

### 2b. Bing Places (~10 min)

Go to **https://www.bingplaces.com** → sign in → choose **Import from Google Business Profile**. Everything copies over. Set and forget.

### 2c. Yelp business page (~20 min)

1. Go to **https://biz.yelp.com** → **Add your business** → `Lompoc Locals`, category "Web Design" or "Marketing" (closest fits Yelp offers), website `https://www.lompoclocals.com`.
2. Free listing only — do not buy Yelp ads.

### 2d. Facebook Page (~10 min)

On the existing Lompoc Locals Facebook Page: **Edit page info** → set **Website** to `https://www.lompoclocals.com`. If there's no page yet, create one (Page type: Media/News Company) with the same name and URL.

### 2e. Nextdoor business page (~15 min)

Go to **https://business.nextdoor.com** → claim a free business page → `Lompoc Locals`, website `https://www.lompoclocals.com`. Nextdoor's audience is exactly the garage-sale demographic.

---

## 3. Weeks 2–6 — The Lompoc link circuit (one action per week)

Local backlinks are the hardest and most valuable part. One per week is sustainable; each comes with copy-paste text.

### Week 2 — Lompoc Valley Chamber of Commerce

Join at **https://lompoc.com** (membership has a fee — treat it as marketing budget). Membership includes a **member directory listing with a link**. When filling out the profile, use the exact name and URL from the NAP rule.

### Week 3 — City of Lompoc + Explore Lompoc resource pages

Both maintain "community resources / local links" pages. Email template (send to the City's PIO/webmaster contact on cityoflompoc.com, and to info@explorelompoc.com):

> **Subject: Free community resource for Lompoc residents — link request**
>
> Hi — I'm Andres, a Lompoc local. I built **Lompoc Locals** (https://www.lompoclocals.com), a free bilingual (English/Spanish) website where residents find local deals, garage sales, events, and a directory of 470+ Lompoc businesses. No paywall, no account required to browse.
>
> Would you consider adding it to your community resources page? Happy to provide a logo, description, or anything else you need.
>
> Thanks for everything you do for the city,
> Andres · andres@kreatipdesign.com

### Week 4 — Local press (Lompoc Record, Noozhawk, KEYT)

Press pitch template — email the newsroom/tips address of each outlet:

> **Subject: Lompoc local builds free bilingual platform for garage sales, deals & events**
>
> Hi — story idea from a Lompoc resident:
>
> **Lompoc Locals** (https://www.lompoclocals.com) is a free community platform built by a Lompoc local — garage sales, business deals, and events in one place, in English and Spanish. It already lists 470+ Lompoc businesses and maps garage sales by neighborhood every weekend.
>
> Angle: local tech built for a town that big platforms ignore — and it's bilingual, which matters here.
>
> I'm available for an interview anytime, and can share screenshots or a demo.
>
> Andres Amador · andres@kreatipdesign.com

One published article = the strongest local backlink you can get.

### Week 5 — Facebook groups + Nextdoor share

The Thursday before a busy weekend, share the garage-sales page in Lompoc community Facebook groups and on Nextdoor. Utility first, zero spam — post template:

> 🏷️ If you're hitting garage sales this weekend: all of Lompoc's sales are mapped in one place, sorted by neighborhood — https://www.lompoclocals.com/garage-sales
>
> Free, no account needed. If you're *having* a sale, you can post it there free too.

Post it once per group, don't repost the same week, and reply to comments.

### Week 6 — Business badge links

Ask 3 businesses already listed on the site (start with the ones you know personally) to add a "Find us on Lompoc Locals" link from their website to their own profile page. Email template:

> **Subject: Free link for your website — your Lompoc Locals profile**
>
> Hi [name] — your business has a profile on Lompoc Locals: https://www.lompoclocals.com/biz/[their-slug]
>
> If you add a small "Find us on Lompoc Locals" link on your site pointing to that page, it helps customers find your current deals — and helps both our sites in Google. Want me to send you a ready-made badge image and the HTML snippet?
>
> Andres · Lompoc Locals

---

## 4. Ongoing — content cadence

**One blog post per week.** Each post must link internally to at least one category page or to `/garage-sales`. Seed list of 12 titles tied to real searches:

1. Lompoc Flower Festival 2026: dates, parade route, and parking
2. Where to watch Vandenberg rocket launches (best public viewing spots)
3. Lompoc Farmers Market guide: hours, vendors, what's in season
4. Best breakfast in Lompoc: 8 local spots ranked by locals
5. Dog-friendly Lompoc: parks, patios, and trails
6. Quinceañera venues in and around Lompoc
7. This weekend in Lompoc (recurring weekend-guide format — reuse monthly)
8. Garage sale pricing guide: what things actually sell for
9. Lompoc wine tasting without a car: the walkable Wine Ghetto
10. Free things to do in Lompoc with kids
11. Moving to Vandenberg SFB: a local's guide to Lompoc neighborhoods
12. Lompoc murals walking tour: every mural, mapped

---

## 5. Measurement — 10 minutes every Monday

In Search Console: **Performance** → **+ New** → **Query** → *Queries containing* → `lompoc`.

Track five query families weekly in this table (keep it in a spreadsheet or at the bottom of this file):

| Week | Brand ("lompoc locals") impr. / pos. | Garage sales impr. / pos. | Deals impr. / pos. | Restaurants impr. / pos. | Things to do impr. / pos. |
|------|------|------|------|------|------|
| e.g. Jul 13 | 120 / 2.1 | 85 / 38 | 40 / 45 | 12 / 60 | 30 / 52 |

**Gate for the next SEO phase** (programmatic neighborhood × category pages): build it only when **both** are true:

- ≥ **500 weekly impressions** total on "lompoc" queries, AND
- `/garage-sales` appears at **position ≤ 50** for any garage-sale query.

Until then, more pages would just be more thin pages — the weekly link circuit and content cadence above are the work.
