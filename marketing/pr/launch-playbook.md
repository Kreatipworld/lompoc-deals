# Launch Day Execution Playbook — Lompoc Deals
*Owner: CMO | Created: 2026-04-09*
*For: The human who presses "go" on launch day*
*Estimated total time: 3–4 hours (can be split across 2 days)*

---

## Pre-Launch Gate Check

Do NOT start this playbook until all items below are green:

- [ ] Stripe env vars set in Vercel (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_STANDARD`, `STRIPE_PRICE_PREMIUM`)
- [ ] REQ-009 Spanish copy fixes deployed (2 required text changes)
- [ ] Site loads at lompoc-deals.vercel.app in both EN and ES
- [ ] Sign-up flow works (create a test account)
- [ ] Merchant dashboard accessible after login
- [ ] At least 10 businesses listed in the directory

Once all are green: proceed.

---

## STEP 1 — Create Social Accounts (60 min)

### 1A — Instagram: @LompocDeals

1. Go to instagram.com → Create account
2. Username: `lompoc.deals` (try `lompocdeals` if taken)
3. Switch to **Business Account**: Settings → Account → Switch to Professional → Business → Local Business
4. **Bio (copy-paste):**
   ```
   🏙️ Lompoc's local business directory
   🍽️ Restaurants · shops · services & more
   🎟️ Deals from local businesses — free to browse
   👇 Explore Lompoc
   ```
5. **Link in bio:** https://lompoc-deals.vercel.app
6. **Profile photo:** Upload the Lompoc Deals logo (purple/cream brand)
7. **Add location:** Lompoc, CA
8. Connect to Facebook page (do Facebook first if possible)

### 1B — Facebook Page: Lompoc Deals

1. Go to facebook.com/pages/create
2. **Page name:** Lompoc Deals
3. **Category:** Local Business → Internet Company (or "Website")
4. **Bio (copy-paste):**
   ```
   Lompoc's free local business directory — restaurants, shops, salons, services, wineries, and more. All in one place, built for the Flower Capital. Bilingual EN/ES.
   ```
5. **Website:** https://lompoc-deals.vercel.app
6. **Location:** Lompoc, CA 93436
7. **Profile photo + cover:** Upload brand assets
8. Connect to Instagram (in Instagram → Settings → Account → Linked Accounts)

### 1C — Nextdoor Business Page

1. Go to nextdoor.com/business
2. Create a free business page for "Lompoc Deals"
3. **Category:** Website / Internet Company
4. **Description (copy-paste):**
   ```
   Lompoc's free local business directory. Discover restaurants, shops, salons, wineries, and services in Lompoc, CA. Browse by category, find hours and contact info, and claim deals — free. Bilingual EN/ES.
   ```
5. **Website:** lompoc-deals.vercel.app
6. **Service area:** Lompoc, CA

---

## STEP 2 — Claim Google Business Profile (30 min)

Full instructions: `/marketing/seo/gbp-setup-checklist.md`

Quick version:
1. Go to business.google.com
2. Search "Lompoc Deals" → create new if not found
3. **Category:** Internet company (primary) + Local business directory (secondary)
4. **Description (copy-paste):**
   ```
   Lompoc Deals is Lompoc's free local business directory — discover local restaurants, shops, salons, wineries, services, and more, all in one place. Businesses list for free; residents browse and claim deals at no cost. Bilingual (English / Spanish). Built for the Flower Capital. lompoc-deals.vercel.app
   ```
5. Verify (email fastest; postcard takes 5–14 days)
6. Upload: logo, homepage screenshot, category browse screenshot, deal card screenshot
7. Post first "What's New" post immediately after verification (copy in checklist)

---

## STEP 3 — Post Launch Announcement (45 min)

### 3A — Facebook Groups (highest priority)

Join these groups first (request membership a few days before launch):
- **Lompoc Happenings** (~3,000–5,000 members)
- **Lompoc CA - Community Board** (~4,000–7,000 members)
- **Lompoc & Santa Barbara County Deals** (~2,000 members)
- Any Spanish-language Lompoc community groups

**Post copy (EN) — copy from `/marketing/pr/launch-announcement.md`:**

> Hey Lompoc! 👋
>
> We just launched something I think you'll find useful.
>
> **Lompoc Deals** is a free local business directory for Lompoc — restaurants, shops, salons, services, wineries, dispensaries, and more. All in one place, all Lompoc.
>
> Think of it like a mini Yelp built specifically for the Flower Capital.
>
> ✅ Browse local businesses by category (free, no account needed)
> ✅ Find hours, photos, and contact info
> ✅ Claim deals and coupons directly on your phone
> ✅ Toggle between English and Spanish
>
> We're at **lompoc-deals.vercel.app** — would love your feedback!
>
> If you know a local business that should be listed, drop it below or go straight to the site.
>
> ¡Y si prefieres en español, el sitio también está en español! 🇲🇽
>
> #LompocDeals #Lompoc #ShopLocal #LompocCA

**Pin a comment with the direct signup link:**
> → Sign up free: lompoc-deals.vercel.app/sign-up

**Post the Spanish version** in any Spanish-language groups (full copy in `/marketing/pr/launch-announcement.md`).

### 3B — Nextdoor (after account created in Step 1C)

Use **Template 3** from `/marketing/social/nextdoor-post-templates.md`.

Post to: Central Lompoc, Hapgood, North Lompoc, La Purisima neighborhoods.

Post EN version → reply immediately with ES version in the same thread.

### 3C — Instagram (first post)

**Post type:** Reel or static card showing the homepage directory browse  
**Caption:**
> Lompoc finally has its own local business directory 🏙️
>
> Lompoc Deals is live — browse 150+ local restaurants, shops, salons, wineries, and more. Free. Bilingual EN/ES. No account needed to browse.
>
> Link in bio → lompoc-deals.vercel.app
>
> #LompocDeals #Lompoc #LompocCA #ShopLocal #LocalDirectory #ThingsToDoInLompoc

---

## STEP 4 — Email Your Subscriber List (15 min)

**If you have existing subscribers** (from beta signups or the waitlist):

Use the email in `/marketing/email/consumer-welcome-sequence.md` > "Launch Email Blast" section.

Subject: `We launched — Lompoc's local business directory is live`

Send via Resend dashboard or export to whatever email tool is configured.

---

## STEP 5 — Start Merchant Outreach Sprint (ongoing, 1–2 hrs/day)

Work through the 20 leads in `/marketing/sales/pipeline-cycle1.md`.

**Script:** `/marketing/sales/merchant-outreach-script.md`

**Priority order:**
1. Restaurants with Instagram presence (DM first — personal and fast)
2. Salons and beauty businesses (phone + DM)
3. Auto repair (phone call — they answer)

**Track every contact** in the pipeline-cycle1.md status column. Update status to: `contacted` → `responded` → `signed_up` / `declined` / `no_response_d3`.

Follow-up on Day 3 for non-responders. Final follow-up on Day 7.

---

## STEP 6 — Send Chamber Email (15 min)

Full email: `/marketing/sales/chamber-outreach-script.md`

**To:** Lompoc Valley Chamber of Commerce  
**Contact:** Find at lompocvalleychamber.com → Contact/Staff  
**Subject:** Partnership opportunity — Lompoc Deals + the Chamber

---

## STEP 7 — Press Pitch (when you hit 50 merchants)

**Hold this until:** 50 businesses in the directory  
**To:** Lompoc Record (reporter or editor), SYV News  
**Email:** Full pitch at `/marketing/sales/press-pitch-lompoc-record.md`  
**Subject:** Local story: Lompoc now has its own business directory — built here, bilingual, free

---

## Launch Day Dashboard

Track these in real time on launch day:

| Metric | Goal (Day 1) | Where to check |
|--------|-------------|----------------|
| Consumer signups | 20+ | Auth.js dashboard / DB |
| Merchant signups | 3+ | Merchant dashboard / DB |
| Total site visits | 100+ | Vercel Analytics |
| Facebook post reactions | 50+ | Facebook Page |
| Nextdoor post views | 200+ | Nextdoor Business dashboard |
| GBP status | Claimed + verified | business.google.com |

Update `/docs/KPIS.md` at end of launch day with actuals.

---

## If Things Go Wrong

| Problem | Fix |
|---------|-----|
| Stripe payments not working | Check env vars in Vercel; confirm webhook endpoint `/api/stripe/webhook` is registered |
| Sign-up form errors | Check Auth.js config + Resend email API key |
| Spanish text showing English | REQ-009 Spanish fixes not deployed — push CTO to deploy before marketing |
| Facebook post removed | Rephrase to avoid "deal" language; post as personal profile if page gets flagged |
| No one signs up Day 1 | Normal — focus on merchant outreach + Nextdoor; consumer signups follow merchants |

---

## Post-Launch Week 1 Rhythm

**Every day:** Check new signups + merchant sign-ups. Reply to any questions or reviews.  
**Tuesday:** Post weekly digest on social (top 3 deals this week). Send digest email to subscribers.  
**Thursday:** Business Spotlight post on Nextdoor + Facebook (use Templates T2/T4).  
**End of week:** Update KPIS.md with week 1 actuals. Identify best-performing channel.
