# Lompoc Deals — Build & Launch Plan

A local promotions feed for Lompoc, CA. Businesses post their own coupons, specials, and announcements. Locals browse a feed, search by category, view a map, and optionally sign up for a weekly email digest.

---

## What you're building (v1 scope)

**Two types of users:**
- **Businesses** — sign up, create their business profile, post coupons / specials / announcements, edit and expire them
- **Locals** *(optional accounts)* — browse without signing in; sign up only if they want to save favorites or subscribe to the email digest

**Public pages:**
- **Home / Feed** — newest active deals across all businesses
- **Business profile** — `/biz/[slug]` with name, photo, description, hours, address, and that business's active deals
- **Category pages** — `/category/food`, `/category/services`, etc.
- **Search** — keyword search across deals + businesses
- **Map** — all businesses pinned on a Lompoc map; click a pin to see their deals
- **Subscribe** — email digest signup form

**Business dashboard (logged in):**
- Edit business profile (name, logo, description, address, hours, category, website, phone)
- Create / edit / delete coupons (title, description, image, discount, start date, expiration, terms)
- See basic stats (views, clicks)

**Admin (just you):**
- Approve new businesses before they go live
- Soft-delete spammy listings

---

## Data model

A clean Postgres schema to start with:

**users** — `id`, `email`, `password_hash`, `role` (`local` | `business` | `admin`), `created_at`

**businesses** — `id`, `owner_user_id`, `name`, `slug`, `description`, `category_id`, `address`, `lat`, `lng`, `phone`, `website`, `hours_json`, `logo_url`, `cover_url`, `status` (`pending` | `approved` | `rejected`), `created_at`

**categories** — `id`, `name`, `slug`, `icon`

**deals** — `id`, `business_id`, `type` (`coupon` | `special` | `announcement`), `title`, `description`, `image_url`, `discount_text`, `terms`, `starts_at`, `expires_at`, `view_count`, `click_count`, `created_at`

**favorites** — `user_id`, `deal_id`, `created_at` (composite key)

**subscribers** — `id`, `email`, `confirmed_at`, `unsubscribe_token`

---

## Tech stack

- **Next.js 14** (App Router, TypeScript) — frontend + API in one project
- **Postgres** via **Neon** (free tier, plays nicely with Vercel)
- **Drizzle ORM** for schema and migrations
- **Auth.js (NextAuth)** for email/password auth
- **Tailwind CSS + shadcn/ui** for clean UI without designing from scratch
- **Cloudinary** or **Vercel Blob** for image uploads (logos, deal photos)
- **Mapbox GL JS** or **Leaflet + OpenStreetMap** for the map (Leaflet is free, no API key)
- **Resend** for transactional email + the weekly digest (free tier: 3k emails/month)
- **Vercel** for hosting + CI/CD
- **GoDaddy** for the domain

---

## The Claude Code prompt

Open a terminal, create the folder, and start Claude Code:

```bash
mkdir lompoc-deals && cd lompoc-deals
claude
```

Then paste this prompt verbatim:

> Build a Next.js 14 app called "Lompoc Deals" — a local promotions feed for Lompoc, California where businesses post coupons, specials, and announcements that locals can browse.
>
> **Stack:** Next.js 14 with the App Router and TypeScript, Tailwind CSS, shadcn/ui components, Drizzle ORM with Postgres (use the `@neondatabase/serverless` driver), Auth.js (NextAuth) v5 for email/password auth with bcrypt, Leaflet + react-leaflet for the map (no API key needed), Resend for transactional and digest email, and Vercel Blob for image uploads.
>
> **Schema (Drizzle):** Create tables for `users` (id, email, passwordHash, role enum: local/business/admin, createdAt), `businesses` (id, ownerUserId, name, slug, description, categoryId, address, lat, lng, phone, website, hoursJson, logoUrl, coverUrl, status enum: pending/approved/rejected, createdAt), `categories` (id, name, slug, icon), `deals` (id, businessId, type enum: coupon/special/announcement, title, description, imageUrl, discountText, terms, startsAt, expiresAt, viewCount, clickCount, createdAt), `favorites` (userId, dealId, createdAt — composite PK), `subscribers` (id, email, confirmedAt, unsubscribeToken). Seed the categories table with: Food & Drink, Retail, Services, Health & Beauty, Auto, Entertainment, Other.
>
> **Public pages:**
> - `/` — homepage feed showing newest active deals (where `expires_at > now()` and business `status = approved`), with category filter chips and a search bar
> - `/biz/[slug]` — business profile page with logo, description, hours, address, and that business's active deals
> - `/category/[slug]` — deals filtered by category
> - `/search?q=` — keyword search across deal titles, descriptions, and business names
> - `/map` — full-screen Leaflet map centered on Lompoc, CA (lat 34.6391, lng -120.4579) with a marker for each approved business; clicking a marker opens a popup with their active deals
> - `/subscribe` — form to sign up for the weekly email digest (double opt-in via Resend)
>
> **Auth pages:** `/signup` (with a toggle for "I'm a local" vs "I own a business"), `/login`, `/logout`.
>
> **Business dashboard** at `/dashboard` (gated to role=business):
> - `/dashboard/profile` — edit business profile fields, upload logo and cover image
> - `/dashboard/deals` — list, create, edit, delete deals; image upload; date pickers for start and expiration
> - `/dashboard/stats` — simple table of views and clicks per deal
>
> **Admin pages** at `/admin` (gated to role=admin): list pending businesses, approve or reject them.
>
> **Local user features (optional accounts):** If logged in as `local`, show a heart icon on each deal card to save/unsave it, and a `/favorites` page listing saved deals.
>
> **Email digest:** A `/api/cron/digest` route protected by a CRON_SECRET header that grabs the top 10 active deals from the past 7 days and sends them via Resend to all confirmed subscribers. Add a `vercel.json` with a weekly cron schedule (Saturdays at 9am).
>
> **Other requirements:**
> - Mobile-first responsive design with Tailwind
> - SEO: per-page metadata, OpenGraph tags, sitemap.xml, robots.txt
> - A `.env.example` file listing: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`
> - A `README.md` with local setup steps
> - A seed script that inserts 5 sample Lompoc businesses (use real-sounding local names) and 10 sample deals so the homepage isn't empty in development
> - Initialize a git repo with a sensible `.gitignore`
>
> Build it step by step. After each major piece (schema, auth, public pages, dashboard, admin, email), pause and tell me what you did so I can test it.

---

## Setup checklist before deploying

You'll need accounts on these (all have free tiers):

- [ ] **Neon** (neon.tech) — create a project, copy the `DATABASE_URL`
- [ ] **Resend** (resend.com) — create an API key, verify a sender email
- [ ] **Vercel** (vercel.com) — sign up with your GitHub account
- [ ] **Vercel Blob** — enabled from your Vercel project's Storage tab; copies `BLOB_READ_WRITE_TOKEN` for you

Generate two random secrets locally:

```bash
openssl rand -base64 32   # use for AUTH_SECRET
openssl rand -base64 32   # use for CRON_SECRET
```

Put everything in `.env.local` while developing, and paste the same vars into Vercel's Environment Variables when you deploy.

---

## Launch steps (after the app builds locally)

1. **Test locally** — `npm run dev`, sign up a test business, post a deal, confirm it appears on the homepage and the map
2. **Push to GitHub** — `gh repo create lompoc-deals --private --source=. --push`
3. **Import to Vercel** — Add New → Project → pick the repo → paste env vars → Deploy
4. **Connect your GoDaddy domain** — In Vercel: Settings → Domains → add your domain. In GoDaddy DNS: add the A record (`@` → `76.76.21.21`) and CNAME (`www` → `cname.vercel-dns.com`) Vercel shows you. Wait a few minutes for SSL.
5. **Set `AUTH_URL`** in Vercel to `https://yourdomain.com` and redeploy
6. **Verify the cron** — Vercel → your project → Settings → Cron Jobs should show the weekly digest

---

## What to do *before* you write a line of code

A few things will save you weeks later:

1. **Reserve your social handles** — `@lompocdeals` on Instagram, Facebook, TikTok. Local deals sites live or die on social.
2. **Make a list of 10 Lompoc businesses you can call personally** — friends, regular spots, anyone who already knows you. They become your seed listings on day one. An empty deals site is dead on arrival.
3. **Pick a name and check the .com** — "Lompoc Deals" is descriptive; "LompocLocal", "LompocSaves", "VVDeals" (Vandenberg Valley) are alternatives.
4. **Decide on a single hero photo** — Lompoc flowers, downtown, the wine scene — something that signals "this is your town" the moment someone lands on the homepage.

---

## v2 ideas (don't build these yet)

- Push notifications via OneSignal when a favorite business posts
- "Claim this listing" flow so you can pre-seed businesses
- QR codes on coupons for in-store redemption tracking
- Stripe-powered featured listings ($10/mo to pin to top of category)
- Spanish-language toggle (sizable Spanish-speaking population in Lompoc)
- Local events calendar alongside deals

---

## Want me to keep going?

Tell me which of these you want next and I'll do it right now:

- Draft the **homepage copy** and tagline
- Sketch the **logo concept** and color palette
- Write the **outreach script** for calling local businesses
- Generate a **list of 50 Lompoc businesses** by category to seed from
- Walk you through **buying Neon + Resend + Vercel** accounts step-by-step
