# Lompoc Deals — KPI Board
*Last updated: 2026-04-07 | Updated weekly by: CMO + CTO*

---

## North Star Metric

**Active Merchants** — businesses with at least 1 active deal in the last 30 days.  
*Why:* More active merchants → more deals → more consumer return visits → more revenue.

---

## Current Baselines (2026-04-07)

| KPI | Baseline | Week-1 Target | Month-1 Target | Source |
|-----|----------|---------------|----------------|--------|
| Total businesses listed | 104 | 110 | 130 | DB |
| Active deals | 89 | 95 | 120 | DB |
| Consumer signups | ~0 (unknown) | 20 | 100 | DB / REQ-001 |
| Email subscribers | ~20 (estimate) | 30 | 100 | DB |
| Merchant signups (new, this week) | 0 | 4 | 20 | Outreach tracker |
| Weekly site sessions | unknown | 100 | 500 | REQ-001 |
| Signup conversion rate | unknown | baseline | >5% | REQ-001 |
| Merchant 30-day retention | unknown | baseline | >60% | DB |
| MRR (subscription revenue) | $0 | $0 | $200 | Stripe (blocked) |
| Digest open rate | N/A | N/A | >40% | Resend |
| Deal claim rate (click / view) | unknown | baseline | >3% | DB |
| GBP weekly clicks | 0 (not yet claimed) | — | 20 | Google Business Profile |
| GBP weekly impressions | 0 (not yet claimed) | — | 200 | Google Business Profile |

---

## Weekly Update Log

### Week of 2026-04-07 (Cycle 1 Start)
**CMO update:**
- M-001 (Facebook seeding): Content prepared — 3 posts (EN+ES) written and ready in `/marketing/social/facebook-campaign-log.md`. Top 3 groups identified. **Blocked on human to join groups + manually post** (no Facebook API access). Posting schedule: Tue 4/8, Thu 4/10, Sat 4/12.
- M-002 (Google Business Profile): Not yet started
- M-003 (Merchant outreach): Pipeline built — 20 targets identified across 5 categories (restaurants, salons, auto repair, body shops, café). Personalized scripts ready (EN + ES). CRM tracker live at `/marketing/sales/pipeline-cycle1.md`. Outreach pending human execution via Google Maps msg, Instagram DM, and phone calls.
- Blocker: Funnel tracking (REQ-001) not yet shipped — baseline for paid channels unknown

**Facebook Campaign Tracking (M-001) — fill in after each post:**

| Date | Group | Post Type | Reach | Reactions | Comments | Link Clicks | Signups |
|------|-------|-----------|-------|-----------|----------|-------------|---------|
| 2026-04-08 | Lompoc Happenings | Launch (EN+ES) | — | — | — | — | — |
| 2026-04-10 | Lompoc CA Community Board | Deal Spotlight (EN+ES) | — | — | — | — | — |
| 2026-04-12 | SBC Deals Group | Weekly Roundup (EN+ES) | — | — | — | — | — |

*Target: 50 consumer signups by end of Cycle 1.*

**CTO update:**
- B-001 (Stripe activation): Pending Stripe account creation
- B-002 (test coverage): In progress
- Blocker: Stripe keys missing from environment

**What moved:** Nothing yet — Cycle 1 just started.  
**What we're changing:** Prioritize REQ-001 (tracking) and REQ-003 (merchant dashboard) to unblock sales.

---

---

### Cycle 1 CMO Content Sprint — 2026-04-08 (End of Sprint)
**CMO update:**

**Content library status (9/15 backlog items at copy_done):**
- M-001 Facebook: 3 templates ready → `/marketing/social/facebook-post-templates.md`
- M-003 Merchant outreach: EN+ES scripts + objection handling → `/marketing/sales/merchant-outreach-script.md`
- M-004 Instagram: 4-week calendar + 3 templates → `/marketing/social/instagram-content-calendar.md`
- M-005 Consumer email sequence: 3-email bilingual series → `/marketing/email/consumer-welcome-sequence.md`
- M-006 Merchant onboarding drip: 5-email bilingual series → `/marketing/email/merchant-onboarding-drip.md`
- M-007 Nextdoor: 3 templates + neighborhood guide → `/marketing/social/nextdoor-post-templates.md`
- M-008 SEO pages: Copy spec for 5 pages (5 routes) → `/marketing/seo/seo-page-copy-spec.md`
- M-009 TikTok: 4 script templates + creator brief → `/marketing/social/tiktok-script-templates.md`
- M-012 Press pitch: Lompoc Record + SYV News + KSBY → `/marketing/sales/press-pitch-lompoc-record.md`
- M-013 Chamber: Outreach email + partnership materials → `/marketing/sales/chamber-outreach-script.md`

**Brand asset delivered:** `/marketing/brand/brand-guidelines.md` (v1.0)

**Blocked — awaiting human execution:**
- M-001 Facebook posting (human must join groups + post)
- M-002 GBP claim (human must verify Google Business account)
- M-003 Merchant outreach (human must send messages/calls)
- M-004 Instagram account creation
- M-007 Nextdoor posting
- M-009 TikTok filming + posting
- M-012 Press pitch (hold until 50-merchant milestone)
- M-013 Chamber outreach (human must email + follow up)

**Blocked — awaiting CTO:**
- M-005/M-006 Email deployment: needs REQ-002 (email sequence infra)
- M-008 SEO pages: needs REQ-005 (route build)
- M-011 Google Ads: needs REQ-001 (funnel tracking)
- M-014 Email digest: needs REQ-004 (cron QA)
- M-015 Meta ads: needs REQ-001

**KPI baselines — still unknown (need REQ-001):** sessions, signup conversion rate, claim rate.

### Cycle 2 Kickoff — 2026-04-08
**CMO update:**

**New engineering context received (3 CTO commits):**
- Free/Standard/Premium pricing live (was Basic/$49, Pro/$99, Premium/$199) — see ENG_HANDOFFS.md
- Dispensaries category + 5 verified Lompoc dispensaries
- Wineries tab + 20 wineries + 30+ other businesses

**Updated baselines (approximate, pending REQ-001 for exact data):**

| KPI | Previous Baseline | Cycle 2 Baseline | Notes |
|-----|-------------------|------------------|-------|
| Total businesses listed | 104 | ~155+ | Wineries + dispensaries + others seeded |
| Active deals | 89 | ~120+ | New category deals added |
| Pricing tiers | Basic/$49 / Pro/$99 / Premium/$199 | **Free/$0 / Standard/$19.99 / Premium/$39.99** | MAJOR CHANGE — see below |
| Consumer signups | ~0 unknown | ~0 unknown | Still needs REQ-001 |
| MRR | $0 | $0 | Stripe B-001 still needed |
| New merchants (this cycle) | 0 | 0 → target: 4+ | Outreach ready |

**Free tier impact on marketing strategy:**
The Free/$0 tier is the single biggest marketing lever shift since launch. Previous pitch: "it's worth $49." New pitch: "nothing to lose, start free." This changes:
- All outreach copy: lead with "free to get started, no credit card" instead of "low cost"
- Facebook/Nextdoor posts: "List your business FREE" as the hook
- Upsell sequence: trigger at deal #3 → Standard/$19.99
- Merchant close rate expected to increase materially (removing price objection entirely for first 3 deals)

**Dispensary niche opportunity:**
5 dispensaries now listed. Cannabis businesses cannot advertise on Google/Meta — Lompoc Deals is one of their only marketing channels. CMO adding dedicated dispensary outreach track (see MARKETING_BACKLOG.md M-016).

**Wine/tourism opportunity:**
20 wineries listed + dedicated Wineries tab. Shareable content potential. SEO: Santa Rita Hills wine deals long-tail. Adding M-017 (wine tourism content series) to backlog.

**CMO Cycle 2 blockers remain:**
- Funnel tracking (REQ-001) — zero baseline data on sessions/conversion
- Stripe activation (B-001) — zero MRR even if merchants upgrade
- All social/outreach execution blocked on human action

**CTO update:**
*(CTO to fill in)*

**What moved:** Pricing restructured, inventory expanded significantly.
**What we're changing:** Lead all outreach and social copy with Free tier messaging.

---

*Both teams: append a new weekly entry above this line every Monday.*
