# Lompoc Deals — Marketing Backlog
*Last updated: 2026-04-08 (Cycle 1, heartbeat 4) | Owner: CMO | Sorted by: revenue impact ÷ effort*

---

## How to Read This

Each experiment/campaign:
```
ID • Title • Channel • Hypothesis • Target KPI • Effort (S/M/L) • Status
```
**Effort:** S = <4 hrs, M = 1–2 days, L = 3–5 days  
**Status:** backlog | this_cycle | in_progress | done | cancelled

---

## 🔴 CRITICAL — Cycle 1

### M-001 • Facebook Community Group Seeding
**Channel:** Social (Facebook)  
**Hypothesis:** Posting deal highlights in Lompoc Facebook groups (Lompoc Happenings, SYV Deals, etc.) 2–3x/week will drive 50+ signups/month at $0 CAC.  
**Target KPI:** +50 signups/month, 10% MoM group follower growth  
**Effort:** S  
**Status:** this_cycle  
**Template:** "Deal of the week: [Business] is offering [deal] — free to claim at lompoc-deals.vercel.app"  
**Notes:** Post in both EN and ES. Pin top comment with signup link.

---

### M-002 • Google Business Profile (GBP) Claim + Optimize
**Channel:** SEO / Local Search  
**Hypothesis:** Claiming and fully completing the Google Business Profile for Lompoc Deals will generate 20+ organic clicks/week within 30 days.  
**Target KPI:** 20+ GBP clicks/week by day 30, top-3 for "Lompoc deals" search  
**Effort:** S  
**Status:** this_cycle  
**Notes:** Add categories (Deal/Coupon Website), photos of UI, weekly posts with featured deals, link to site.

---

### M-003 • Merchant Cold Outreach Sprint (First 50)
**Channel:** Sales / Direct  
**Hypothesis:** A personalized email + phone outreach to 20 Lompoc businesses/week (restaurants, salons, retail) will yield a 20% conversion rate = 4 new active merchants/week.  
**Target KPI:** 4 new merchant signups/week for 6 weeks = 24 new merchants  
**Effort:** M  
**Status:** this_cycle  
**Script:** See `/marketing/sales/merchant-outreach-script.md`  
**Notes:** Lead with zero-cost free tier, show traffic proof once REQ-003 (view counts dashboard) ships.

---

## 🟠 HIGH — Next Sprint (Cycle 2)

### M-004 • Bilingual Instagram Presence Setup
**Channel:** Social (Instagram)  
**Hypothesis:** A bilingual (EN/ES) Instagram account posting 3x/week (1 deal highlight, 1 merchant story, 1 community post) will reach 500 followers in 60 days and drive 100 profile-link clicks/month.  
**Target KPI:** 500 followers by day 60, 100 link clicks/month  
**Effort:** M  
**Status:** copy_done — calendar + templates ready, human to create account and post  
**Assets:** `/marketing/social/instagram-content-calendar.md` — 3 post templates (EN/ES), 4-week content calendar, account setup checklist, engagement tactics, weekly metrics tracker  
**Notes:** 63% of Lompoc is Hispanic — post in both languages, tag local businesses.

---

### M-005 • Email Welcome + Nurture Sequence (Consumers)
**Channel:** Email  
**Hypothesis:** A 3-email welcome sequence for new consumer signups (deal highlights + how to save favorites + how to get weekly digest) will lift 30-day retention by 20%.  
**Target KPI:** 30-day retention rate (visits 2+ times in 30 days) from 15% → 18%  
**Effort:** M  
**Status:** copy_done — awaiting REQ-002 (email infra)  
**Blocker:** Needs REQ-002 (email sequence infra) from CTO — see CMO_REQUESTS.md  
**Copy:** `/marketing/email/consumer-welcome-sequence.md` (3 emails, bilingual EN/ES, A/B variants included)

---

### M-006 • Merchant Onboarding Email Drip (5-part)
**Channel:** Email  
**Hypothesis:** A guided 5-email onboarding sequence for new merchants (profile tips, first deal walkthrough, redemption how-to, performance stats, upgrade CTA) will reduce 30-day churn from ~40% to ~20%.  
**Target KPI:** Merchant 30-day retention 60% → 80%  
**Effort:** M  
**Status:** copy_done — awaiting REQ-002 (email infra)  
**Blocker:** Needs REQ-002 (email sequence infra)  
**Copy:** `/marketing/email/merchant-onboarding-drip.md` (5 emails, bilingual EN/ES, conditional branching + upsell logic included)

---

### M-007 • Nextdoor Neighborhood Presence
**Channel:** Social (Nextdoor)  
**Hypothesis:** Weekly "deals near you" posts on Nextdoor targeted to Lompoc neighborhoods will add 30+ signups/month (skews older, higher intent local audience).  
**Target KPI:** 30 signups/month attributable to Nextdoor  
**Effort:** S  
**Status:** copy_done — templates ready, human to post  
**Templates:** `/marketing/social/nextdoor-post-templates.md` (3 templates EN/ES + posting schedule + neighborhood list)  
**Notes:** Nextdoor has high trust, lower noise. Post as a local business.

---

### M-008 • SEO Landing Pages — Category + City Hub Pages
**Channel:** SEO  
**Hypothesis:** Creating optimized landing pages for `/lompoc/food-deals`, `/lompoc/salon-deals`, `/lompoc/services-deals` will capture mid-funnel search traffic and generate 200 organic sessions/month within 90 days.  
**Target KPI:** 200 organic sessions/month from these pages by day 90  
**Effort:** L  
**Status:** copy_done — awaiting REQ-005 (CTO to build routes)  
**Blocker:** CTO must implement dynamic routes `/lompoc/[category]` with schema markup (REQ-005)  
**Copy:** `/marketing/seo/seo-page-copy-spec.md` — 5 pages: /lompoc, /lompoc/food-deals, /lompoc/salon-deals, /lompoc/services-deals, /lompoc/deals-today. Includes H1s, intro copy (EN+ES), meta tags, JSON-LD schemas, sitemap specs, and implementation notes for CTO.  
**Notes:** See keyword map in `/marketing/seo/keyword-map.md`

---

## 🟡 MEDIUM — Cycle 3+

### M-009 • TikTok "Best Deal of the Week" Series
**Channel:** Social (TikTok)  
**Hypothesis:** A weekly 15-second TikTok showing the best local deal (with merchant interview clip) will reach 1,000+ views/video within 60 days and drive 25 signups/week.  
**Target KPI:** 1,000 avg views/video, 25 signups/week from TikTok  
**Effort:** M  
**Status:** copy_done — scripts + format guide ready, human to film and post  
**Assets:** `/marketing/social/tiktok-script-templates.md` — 4 script templates (EN/ES), 15-sec and 30-sec formats, 4-week content calendar, creator partnership brief + outreach message  
**Notes:** EN/ES captions. Partner with 1 Lompoc creator with 2k+ followers for amplification.

---

### M-010 • Merchant Referral Program ("Refer a Neighbor")
**Channel:** Referral  
**Hypothesis:** A "refer a business neighbor" program offering 1 free month Pro to both referrer and referee will generate 5 new merchant signups/month at near-zero CAC.  
**Target KPI:** 5 new merchant referrals/month  
**Effort:** M  
**Status:** backlog  
**Blocker:** Needs referral code system from CTO (new ticket — add to BACKLOG.md)

---

### M-011 • Google Ads — "Lompoc Deals" Brand Campaign ($50/month)
**Channel:** Paid (Google)  
**Hypothesis:** A small brand protection campaign on exact-match "Lompoc deals" and "Lompoc coupons" will capture high-intent searchers for $1–2 CPC = 25–50 signups at $50/month spend.  
**Target KPI:** 25 new signups/month at <$2 CPL  
**Effort:** S  
**Status:** backlog  
**Blocker:** Needs REQ-001 (signup funnel tracking) first — do not spend on paid without conversion data.  
**Notes:** Escalate to CEO if spend exceeds $500/month.

---

### M-012 • Press Outreach — Lompoc Record + SYV News
**Channel:** PR  
**Hypothesis:** A story pitch to The Lompoc Record ("free tool for local businesses to share deals") will generate a feature article that drives 200 one-time signups and ongoing brand awareness.  
**Target KPI:** 1 press mention, 200 attributed signups  
**Effort:** S  
**Status:** copy_done — pitch templates ready, hold until 50-merchant milestone  
**Assets:** `/marketing/sales/press-pitch-lompoc-record.md` — pitches for Lompoc Record, SYV News, 805 Living, KSBY; founder talking points; post-coverage playbook  
**Notes:** Angle: "Lompoc-built tech helping local businesses compete with big-box." Send after M-003 sprint delivers 50 merchants milestone.

---

### M-013 • Chamber of Commerce Partnership
**Channel:** Partnerships  
**Hypothesis:** A formal partnership with the Lompoc Valley Chamber of Commerce (cross-promotion to all members) will add 15+ new merchant signups and instant credibility for outreach.  
**Target KPI:** 15 new merchants from Chamber referral  
**Effort:** M  
**Status:** copy_done — outreach materials ready, human to send email  
**Assets:** `/marketing/sales/chamber-outreach-script.md` — email sequence (initial + follow-up), talking points, partnership agreement template, co-branded newsletter announcement (EN/ES), social post templates for Chamber channels  
**Notes:** Offer Chamber members a free 3-month Pro trial. Budget: $0 cash.

---

### M-014 • Weekly Deal Digest Email (Consumer)
**Channel:** Email  
**Hypothesis:** A curated weekly digest of top 5 deals, sent every Tuesday 9am PT, will keep subscribers engaged (40%+ open rate) and drive 200 site visits/week per send.  
**Target KPI:** 40% open rate, 200 weekly visits from email  
**Effort:** S (template), M (automation)  
**Status:** backlog  
**Blocker:** Resend email API integrated but digest cron needs QA (REQ-004 from CTO)

---

### M-015 • Facebook Ads — Merchant Acquisition (Hyper-Local)
**Channel:** Paid (Facebook/Meta)  
**Hypothesis:** A $150/month Meta campaign targeting business owners in Lompoc (job title: owner/manager, radius 10mi) will generate 5 merchant signups/month at $30 CAC.  
**Target KPI:** 5 merchant signups/month at <$30 CAC  
**Effort:** M  
**Status:** backlog  
**Blocker:** Needs REQ-001 (funnel tracking) first. Escalate to CEO if budget > $500/month.  
**Notes:** Lead ad format → merchant signup landing page.

---

---

## 🔴 NEW — Cycle 2 Additions (from CTO commits 2026-04-08)

### M-016 • Dispensary Merchant Acquisition Campaign
**Channel:** Sales / Direct  
**Hypothesis:** Cannabis businesses CANNOT advertise on Google Ads or Meta/Instagram. Lompoc Deals is one of their only legal digital marketing channels. A targeted outreach to all 5 Lompoc dispensaries (+ any unlisted ones) with this unique angle will close 3–5 dispensary merchants at Standard/Premium tier.  
**Target KPI:** 3 dispensary merchants signed up (Standard or Premium tier), within Cycle 2  
**Effort:** S  
**Status:** this_cycle (Cycle 2)  
**Assets needed:** Dispensary-specific outreach script (see `/marketing/sales/dispensary-outreach-script.md` — to be created)  
**Notes:**
- Lead with "we're one of very few platforms where you can actually advertise deals legally"
- Dispensaries often have $$$ marketing budgets stuck with no good options — high willingness to pay
- Compliance note: no health claims, ensure site has age-gate or disclaimer before running paid ads in this category
- Targets: Leaf Dispensary, Elevate, Oceans, TRD, One Plant (all now listed)

---

### M-017 • Wine Tourism Content Series
**Channel:** Social (Instagram/TikTok) + SEO  
**Hypothesis:** A "Lompoc Wine Country Deals" content series (winery tasting deals, Santa Rita Hills guides, seasonal posts) will reach wine-tourism audiences who share high-value shareable content, driving 100+ site visits/week and positioning Lompoc Deals as the guide to Lompoc Wine Country.  
**Target KPI:** 100 site visits/week from wine content, 5 winery merchants upgraded to Standard/Premium  
**Effort:** M  
**Status:** copy_done — all assets ready, pending human execution + CTO SEO routes
**Assets:**
- `/marketing/social/wine-content-calendar.md` — 3 post templates (EN/ES), seasonal calendar (spring through harvest), Pinterest strategy, metrics tracker
- `/marketing/sales/winery-partnership-pitch.md` — outreach email sequence, talking points, objection handling, deal type ideas, 5 target winery targeting guide
- `/marketing/seo/wine-seo-page-spec.md` — full copy spec for `/lompoc/wine-deals` and `/lompoc/wineries` (H1s, intros EN/ES, meta, JSON-LD, CTO implementation notes)
**Notes:**
- Wineries tab now live on homepage — content can drive to it directly
- Santa Rita Hills + Wine Ghetto are established tourist draws — align with that identity
- Best timing: harvest season (Aug–Oct), Valentine's Day, Mother's Day — plan ahead
- Seasonal tasting deals are visually excellent for Instagram/TikTok

---

## Backlog Health
*Last updated: 2026-04-08 (Cycle 2 kickoff — 17 items total)*
- **Total experiments:** 17
- **This cycle (Cycle 2):** M-001, M-002, M-003, M-C2-1, M-C2-2, M-C2-3, **M-016**
- **Copy done — human execution pending:** 7 (M-001, M-002, M-003, M-004, M-007, M-009, M-013)
- **Copy done — blocked on CTO infra:** 4 (M-005, M-006, M-008, M-012)
- **Brief done — blocked on CTO (REQ-001 tracking):** 2 (M-011, M-015)
- **Template done — blocked on CTO (REQ-004 digest cron):** 1 (M-014)
- **Design doc done — REQ-006 needed:** 1 (M-010)
- **New Cycle 2 additions:** M-016 (dispensary outreach), M-017 (wine tourism content)
- **Key strategy shift (Cycle 2):** All outreach/social copy updated to lead with Free/$0 tier — removes merchant price objection entirely. Previous pitch: "worth $49." New pitch: "nothing to lose."
- **New engineering requests added this cycle:** None yet — existing REQ-001 through REQ-006 cover current gaps
