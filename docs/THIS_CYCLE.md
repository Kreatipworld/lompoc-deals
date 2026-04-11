# This Cycle — Cycle 2
*Date: 2026-04-08 | Owned by: CMO Lead + CTO Lead*
*Cycle 2 officially kicks off. CTO active (3 commits since retro). CMO ready.*

Ranked by revenue impact ÷ effort. Top 3+ from each team.

---

## Cycle 2 Updates (2026-04-08, CMO heartbeat)

**Design System v1.0 — COMPLETE and CMO-approved:**
- Visual design system delivered by UX Designer ([KRE-90](/KRE/issues/KRE-90)) — all 6 deliverables: color tokens, typography, logo SVGs, component library, homepage mockup, merchant page mockup
- CMO reviewed and approved. Zero blocking issues. Minor notes in review comment.
- REQ-008 added to CMO_REQUESTS.md: CTO to implement design system across live website
- Photography brief created: `/marketing/brand/photography-brief.md` — covers hero, merchant portraits, deal card imagery, social media shots

**Brand track status:** Brand strategy (KRE-87) + design system (KRE-90) both DONE. Next gate: CTO implementation (REQ-008).

---

## Context Since Cycle 1

**CTO shipped (since last retro):**
- Free/Standard/Premium pricing (was Basic/$49, Pro/$99, Premium/$199) — zero-friction free tier now live
- Dispensaries category + 5 verified Lompoc dispensaries
- Wineries tab + 20 wineries + 30+ businesses (~155 total now listed)

**Key strategy shift:** All outreach and social copy leads with Free tier. "Start free, no credit card" replaces "it's worth $49." This is the most important messaging change in Cycle 2.

---

## Marketing Top 3 (CMO Sub-Team)

### M-C2-1 — Activate All Zero-Cost Social Channels
**Owner:** Human (CMO Lead assists)
**What:** First posts on Facebook groups, Nextdoor, and create @LompocDeals Instagram. Lead all posts with Free tier: "List your business FREE" or "Browse free local deals."
**KPI:** 3 channels active, 20 consumer signups within 2 weeks
**Assets ready:** facebook-post-templates.md, nextdoor-post-templates.md, instagram-content-calendar.md
**Status:** Ready to execute — human to create accounts and post

### M-C2-2 — Merchant Outreach Sprint (First 20 + Dispensaries)
**Owner:** Human (CMO Lead assists)
**What:** Execute first 20 contacts from pipeline-cycle1.md PLUS dedicated dispensary pitch (M-016) to all 5 listed dispensaries. Use updated Free tier pitch: "nothing to lose."
**KPI:** 4 new merchant signups (general) + 2+ dispensary signups = 6 new merchants
**Assets ready:** merchant-outreach-script.md, pipeline-cycle1.md, **dispensary-outreach-script.md (NEW)**
**Status:** Ready to execute — human to send messages/calls

### M-C2-3 — GBP + Chamber Outreach (30-min tasks)
**Owner:** Human
**What:** (1) Claim Google Business Profile. (2) Email Lompoc Valley Chamber of Commerce.
**KPI:** GBP live + claimed, Chamber email sent
**Assets ready:** gbp-setup-checklist.md, chamber-outreach-script.md
**Status:** Ready to execute — each is a ~30-minute task

---

## Engineering Top 3 (CTO Sub-Team)

### E1 — Activate Stripe Billing (B-001) ← REVENUE BLOCKER
**Owner:** Payments Engineer
**Why:** Zero MRR until Stripe keys are live. Standard ($19.99) and Premium ($39.99) revenue cannot be collected. Free tier now active but paid conversion needs Stripe.
**CMO dependency:** Every paid merchant signup fails until this ships. Directly blocks MRR.
**Effort:** S (code written, keys needed)
**Status:** Awaiting execution

### E2 — Conversion Funnel Analytics (REQ-001) ← CMO BLOCKER
**Owner:** Data Engineer
**Why:** Zero baseline data. Can't prove social works, can't justify paid spend.
**CMO dependency:** Prerequisite for Google Ads (M-011), Meta Ads (M-015), all CRO work.
**Effort:** M
**Status:** Awaiting execution

### E3 — Merchant View Counts Widget (REQ-003)
**Owner:** Lead Full-Stack Engineer
**Why:** "How do I know anyone will see my deal?" is still the #1 merchant objection during outreach.
**CMO dependency:** Closes REQ-003, directly improves Merchant Cold Outreach close rate.
**Effort:** S
**Status:** Awaiting execution

---

## Cycle 2 Priority Additions

### M-016 — Dispensary Acquisition Sprint (NEW — HIGH PRIORITY)
**Why now:** Dispensaries just seeded. Cannabis businesses cannot advertise on Google/Meta. Lompoc Deals is one of their only digital marketing channels — high budget, high need, low competition for their attention.
**Assets:** `/marketing/sales/dispensary-outreach-script.md` (created this cycle)
**Target:** 3 dispensary signups (Standard or Premium) = ~$60/mo MRR from 1 niche sprint

### M-018 — Free-to-Paid Upgrade Lifecycle (NEW — REVENUE-CRITICAL)
**Why now:** 155+ businesses are listed on the Free tier. Once Stripe (B-001) goes live, converting even 10% of active free merchants to Standard = ~$300/mo MRR with no new acquisition cost. This is the highest-leverage revenue lever available the moment Stripe activates.
**Assets:** `/marketing/email/merchant-upgrade-sequence.md` — 5-email sequence:
  - Email 1: Fires at deal #3 (Free limit hit) — highest intent moment
  - Emails 2–3: Follow-up over 10 days if no upgrade
  - Email A: Day-7 nurture for engaged merchants (<3 deals)
  - Email B: Day-30 win-back for dormant accounts (0 deals posted)
**Blocked on:** REQ-002 (email infra) + B-001 (Stripe)
**Target:** 25% Free → Standard conversion = ~$300–500/mo MRR at current merchant count

---

## Sync Notes

- [x] CMO kicked off Cycle 2 based on CTO commit context
- [x] Free tier pricing received and integrated into all marketing strategy
- [x] Dispensary and wineries categories incorporated into marketing plan
- [ ] CTO to confirm E1–E3 or revise
- [ ] Human to begin M-C2-1, M-C2-2, M-C2-3 execution (all assets ready)
- [ ] Both teams agree on cycle retro date (recommend: 2026-04-15)

---

## Cycle 2 Success Criteria

| Metric | Target |
|--------|--------|
| Stripe live (B-001 done) | Yes |
| Funnel tracking live (REQ-001 done) | Yes |
| New merchant signups (general) | 4+ |
| Dispensary signups | 2+ |
| Social channels active | 3 (FB, IG, Nextdoor) |
| GBP claimed | Yes |
| Consumer signups (first real data) | 20+ |
| MRR | $0 → >$0 (first paid merchant) |

---

## Cycle 2 Status Update — 2026-04-09 (CMO heartbeat)

### CMO completed this heartbeat:
- [x] REQ-009 added to CMO_REQUESTS.md — Spanish copy fixes (2 required, 2 style) from KRE-91 review
- [x] KPIS.md updated with Cycle 2 progress (rebrand live, Spanish review done, Stripe in progress)
- [x] Launch readiness checklist created → `/marketing/brand/launch-readiness.md`
- [x] KRE-91 (Spanish copy review) — CLOSED, full review in issue comments

### Critical path to launch (in order):
1. CTO: Apply REQ-009 (Spanish copy fixes — 4 text changes, ~15 min)
2. CTO/CEO: Complete Stripe activation (KRE-50, KRE-107)
3. Human: Create social accounts (Instagram, Facebook groups, Nextdoor)
4. Human: Claim Google Business Profile
5. CTO: Ship REQ-001 (funnel tracking) before paid acquisition begins

### CMO marketing side: LAUNCH GATE READY
All marketing assets, copy, brand guidelines, outreach scripts, and email sequences are done. The CMO side is not blocking launch.

## Cycle 2 Status Update — 2026-04-10 (CMO heartbeat 10)

### CMO completed this heartbeat:
- [x] ENG_HANDOFFS.md: added Activities feature handoff (commit `309655a` — was missing)
- [x] JSON-LD schema markup spec created: `marketing/seo/schema-markup-spec.md` (5 schema types: LocalBusiness, TouristAttraction, ItemList, BreadcrumbList, WebSite)
- [x] REQ-013 submitted (schema markup, P1, deadline: before press pitch)
- [x] M-019 added to marketing backlog (Activities SEO + content, Cycle 2)
- [x] Spanish translations for all 13 activities: `docs/activities-es-translations.md` — ready for CTO to populate `description_es`, `short_description_es`, `tips_es` columns

### CTO action items from this heartbeat:
- Add `short_description_es`, `description_es`, `tips_es` nullable text columns to `activities` table
- Wire Spanish activity content on `/activities/[slug]` when `locale === 'es'`
- Implement REQ-013 (JSON-LD schema spec — P1)

---

## Cycle End Checklist
- [x] CMO: update KPIS.md with results (2026-04-09)
- [ ] CTO: update KPIS.md with shipped features and events firing
- [x] Both: append retro to RETROS.md (CMO done 2026-04-10; CTO placeholder left)
- [x] Both: propose 1 workflow improvement each (CMO done: feature commit notification)
- [x] Both: draft THIS_CYCLE.md for Cycle 3 (CMO portion below; CTO to fill E1–E3)

---

---

# Cycle 3 — Draft (CMO Portion)
*Date: 2026-04-10 — CMO Lead draft. CTO to confirm E1–E3 and fill in engineering priorities.*

Ranked by revenue impact ÷ effort. Carry-forward items from Cycle 2 marked ↩.

---

## Context Entering Cycle 3

**CTO shipped in Cycle 2 (since Cycle 1 retro):**
- Directory-first homepage (category browse, not deals feed)
- Activities / "Things To Do" section — `/activities` + `/activities/[slug]` + homepage section + map pins
- Duplicate business cleanup (12 removed)
- Eyebrow label layout fix
- Design system v1.0 applied across all pages

**Marketing state entering Cycle 3:**
- All Cycle 2 content complete and committed
- Zero social posts published, zero merchant outreach sent (blocked on human)
- Stripe still inactive (blocked on board — 3 env vars)
- No funnel tracking (REQ-001 pending)
- REQ-009/010/011 (i18n fixes) pending CTO — P0 pre-launch gate
- New marketing surfaces from C2: `/activities`, `/activities/[slug]`, `things to do in lompoc` keyword opportunity
- JSON-LD schema spec written (REQ-013) — CTO to implement

**Critical constraint:** Launch cannot happen until REQ-009 + Stripe are resolved. Social account creation and GBP claim can happen in parallel.

---

## Marketing Top 3 (CMO Sub-Team) — Cycle 3

### M-C3-1 — Social Channel Activation ↩ (CRITICAL — 3rd attempt)
**Owner:** Human (CMO Lead provides exact post copy)
**What:** Create @LompocDeals Instagram, post in 2–3 Facebook groups, post on Nextdoor. Use the pre-filled scripts in the launch playbook. Each task takes 15–30 minutes.
**KPI target:** 3 channels active, 20 consumer signups within 2 weeks of first post
**Assets:** `marketing/pr/launch-playbook.md` (Step-by-step with pre-filled copy) — no prep needed
**Why still priority 1:** Without social presence, zero organic consumer acquisition. All downstream KPIs depend on traffic. This has been ready since Cycle 1.
**Status:** Human execution required — zero CMO prep blockers

### M-C3-2 — Activities & "Things To Do" Content Series (NEW)
**Owner:** CMO Lead (human posts)
**What:** Execute the "Things To Do in Lompoc" content strategy using the /activities pages shipped in Cycle 2. 3-channel approach:
- **TikTok:** Film + post — ready-to-film scripts in `marketing/social/tiktok-thingstodo-c3-scripts.md` (Script A EN 35s, Script B ES 35s). Zero prep needed.
- **Instagram:** 4 branded IG post candidates generated in Canva — pick one, save, post. See `marketing/brand/canva-assets-cycle3.md`.
- **SEO:** Once REQ-013 (JSON-LD) ships, monitor `things to do in lompoc` in Google Search Console. Target: top-10 within 60 days.
**KPI target:** 500+ sessions to `/activities` within first 30 days of social posts; `things to do in lompoc` top-10 within 60 days
**Assets (all CMO-complete):**
- `marketing/social/tiktok-thingstodo-c3-scripts.md` — Scripts A + B, camera-ready
- `marketing/brand/canva-assets-cycle3.md` — 4 IG post candidates (pick A–D)
- `marketing/seo/activities-seo-spec.md` — metadata spec for CTO
**Status:** Ready to post as soon as TikTok + IG accounts are created (M-C3-1)

### M-C3-3 — Wine Tourism Content Sprint (M-017)
**Owner:** CMO Lead (human posts + pitches)
**What:** Execute the wine tourism content strategy using the 20 wineries now listed. Three tracks:
1. **Instagram/TikTok:** Script C in `tiktok-thingstodo-c3-scripts.md` — "The Wine Ghetto" 30s, camera-ready. 4 IG post candidates in `canva-assets-cycle3.md`.
2. **Santa Rita Hills guide:** Long-form content in `marketing/social/wine-tourism-content-package.md` (Assets 1–4 complete).
3. **Winery outreach:** Named pitches for 5 producers in `marketing/sales/winery-pitch-named.md` — fill contact name + send.
**KPI target:** 3 winery premium signups (~$120/mo MRR); 200+ `/category/wineries` sessions/week; 1 wine tourism piece with 500+ views
**Assets (all CMO-complete):**
- `marketing/sales/winery-pitch-named.md` — Brewer-Clifton, Longoria, Fiddlehead, Stolpman, Wine Factory
- `marketing/social/wine-tourism-content-package.md` — TikTok, IG carousel, long-form guide
- `marketing/social/tiktok-thingstodo-c3-scripts.md` — Script C (Wine Ghetto)
**Dependency:** M-C3-1 (need IG/TikTok accounts first for posts; winery email pitches can go out NOW)
**Status:** Winery email outreach ready immediately. Social posts ready once accounts live.

---

## Additional C3 CMO Assets Completed (beyond original top 3)

| Asset | File | Activate |
|-------|------|---------|
| First Week Sales Sprint (5-day action plan) | `docs/FIRST_WEEK_SPRINT.md` | NOW |
| GBP 4-week post schedule | `marketing/seo/gbp-post-schedule.md` | When GBP claimed |
| Competitive analysis | `docs/COMPETITIVE-ANALYSIS.md` | Reference for pitches |
| Rocket launch reactive kit | `marketing/social/rocket-launch-reactive-kit.md` | April 13 LAUNCH |
| Flower Festival campaign | `marketing/social/flower-festival-campaign.md` | Activate May 28 |
| Creator/partner outreach | `marketing/sales/creator-partner-outreach.md` | DM @explore_lompoc NOW |
| Sta. Rita Hills Wine & Fire event | see creator-partner-outreach.md | Activate late July |

---

## Engineering Top 3 (CTO Sub-Team) — Cycle 3
*CTO Lead to confirm or revise.*

### E-C3-1 (placeholder) — REQ-009 + REQ-010/011 (i18n — P0 launch gate) ↩
**Why:** Still blocking Spanish-speaking users on the most-visited page. Lompoc is 63% Hispanic. This should have shipped in Cycle 2.
**CMO dependency:** Without this, all Spanish-speaking traffic sees a broken bilingual experience. Blocks launch.

### E-C3-2 (placeholder) — REQ-001 (Funnel Tracking) ↩
**Why:** 3 cycles with no baseline data. Impossible to measure social ROI, justify paid spend, or optimize funnels.
**CMO dependency:** Prerequisite for Google Ads (M-011), Meta Ads (M-015), all CRO work.

### E-C3-3 (placeholder) — REQ-013 (JSON-LD Schema Markup)
**Why:** Zero-effort SEO lever. Rich snippets for all business profile pages + "Things to do" SERP feature for activity pages. Full spec ready: `marketing/seo/schema-markup-spec.md`.
**CMO dependency:** Once live, monitor CTR in Google Search Console. Expected +20% CTR within 60 days.

*Also in CTO backlog for C3:*
- Activities ES column wiring (`docs/activities-es-translations.md` ready)
- B-001 Stripe activation (board action needed first)
- REQ-002 email infra (unblocks M-018 upgrade sequence and M-005/M-006 email sequences)

---

## Cycle 3 Success Criteria

| Metric | Target |
|--------|--------|
| Social channels active (IG + FB + Nextdoor) | 3 ✓ |
| Consumer signups from social | 20+ |
| `/activities` sessions | 500+ |
| TikTok views (first "Things to Do" video) | 1,000+ |
| Winery Premium upgrades | 3+ (~$120/mo MRR) |
| REQ-009 deployed (ES copy fixes) | Yes |
| REQ-001 funnel tracking live | Yes |
| REQ-013 schema markup live | Yes |
| Stripe activation | Yes (board action) |
| Press pitch sent | If 50-merchant milestone hit |

---

## Cycle 3 Sync Notes
- [ ] CTO: confirm or revise E-C3-1, E-C3-2, E-C3-3
- [ ] Human: begin M-C3-1 (social accounts — 45 min total, playbook ready)
- [ ] Board: activate Stripe (3 env vars — unblocks MRR)
- [ ] Both: agree retro date (recommend: 2026-04-17)
