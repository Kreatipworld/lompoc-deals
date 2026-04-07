# CMO → CTO Engineering Requests
*Last updated: 2026-04-07 | Owner: CMO*

Every request here uses the standard format. CTO Lead reviews each cycle and assigns to the backlog.

---

## REQ-001 • Signup Funnel Conversion Tracking
**Priority:** P0  
**Why:** We cannot run any paid campaigns without knowing baseline conversion rates. This is the prerequisite for M-011 and M-015.  
**KPI it moves:** Signup conversion rate (visitor → signed up local), merchant signup conversion rate  
**Desired behavior (plain English):**
- Track page views and signup completions for both consumer and merchant signup flows
- Must be able to see: visitors to /sign-up → started form → submitted → confirmed
- Report available in admin dashboard or basic analytics (doesn't need to be fancy — even a Postgres query will do)  
**Deadline:** Before any paid ad spend  
**Status:** Requested

---

## REQ-002 • Transactional Email Sequence Infrastructure
**Priority:** P1  
**Why:** Our merchant onboarding drip (M-006) and consumer welcome sequence (M-005) both require the ability to trigger multi-step email sequences from user events.  
**KPI it moves:** Merchant 30-day retention (target: 60% → 80%), consumer D30 retention  
**Desired behavior:**
- When a user signs up as a business, trigger a 5-email sequence (day 0, 1, 3, 7, 14)
- When a user signs up as local, trigger a 3-email welcome sequence (day 0, 3, 7)
- Sequences should be easy for CMO team to edit (markdown or simple template files)
- Unsubscribe link in every email  
**Deadline:** Cycle 2  
**Status:** Requested

---

## REQ-003 • Merchant View Counts Dashboard Widget
**Priority:** P1  
**Why:** The #1 sales objection from merchants during cold outreach is "how do I know anyone will see my deals?" A simple view count widget on their dashboard removes this objection entirely.  
**KPI it moves:** Merchant cold outreach close rate (target: 20%), merchant churn reduction  
**Desired behavior:**
- In the merchant dashboard, show: total deal views (all time), deal views last 7 days, deal views last 30 days
- Show per-deal breakdown (which deals get most views)
- Data already exists in `deals.view_count` — this is a display-only feature  
**Deadline:** Before Cycle 2 outreach sprint  
**Status:** Requested

---

## REQ-004 • Weekly Digest Email Cron (Production)
**Priority:** P1  
**Why:** We have ~20 email subscribers but no digest is sending. This is leaving engagement on the table every week.  
**KPI it moves:** Email subscriber retention, site traffic from email (target: 200 visits/send)  
**Desired behavior:**
- Every Tuesday at 9am PT, send digest to all confirmed subscribers
- Digest = top 5 deals by click_count + view_count in last 7 days
- Plain bilingual template (EN main, ES footer or toggle)
- Unsubscribe link working  
**Deadline:** Cycle 2  
**Status:** Requested

---

## REQ-005 • SEO Landing Pages — City + Category Routes
**Priority:** P2  
**Why:** Programmatic SEO is our highest-leverage long-term growth channel. We need dynamic routes for city/category combinations with proper meta tags and schema markup.  
**KPI it moves:** Organic search traffic (target: 200 sessions/month from category pages by day 90)  
**Desired behavior:**
- Route: `/lompoc/[category-slug]` → renders filtered deals for that category in Lompoc
- Route: `/lompoc` → hub page listing all categories with deal counts
- Each page needs: `<title>`, `<meta description>`, Open Graph tags, LocalBusiness schema markup
- CMO team will write the copy for each page (see `/marketing/seo/` for drafts)  
**Deadline:** Cycle 3  
**Status:** Requested
