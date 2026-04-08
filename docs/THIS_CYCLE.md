# This Cycle — Cycle 2
*Date: 2026-04-08 | Owned by: CMO Lead + CTO Lead*
*Cycle 2 officially kicks off. CTO active (3 commits since retro). CMO ready.*

Ranked by revenue impact ÷ effort. Top 3+ from each team.

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

## Cycle End Checklist
- [ ] CMO: update KPIS.md with results
- [ ] CTO: update KPIS.md with shipped features and events firing
- [ ] Both: append retro to RETROS.md
- [ ] Both: propose 1 workflow improvement each
- [ ] Both: draft THIS_CYCLE.md for Cycle 3
