# Cycle 2 Plan — Lompoc Deals
*Draft: 2026-04-08 | CMO: ready | CTO: pending confirmation*
*Cycle 2 start: when CTO is back online and confirms E1–E3*

---

## Cycle 2 Goals

**CMO goal:** Convert content library into actual results. First real KPI data by end of cycle.  
**CTO goal:** Ship REQ-001 (tracking) + REQ-002 (email infra) + B-001 (Stripe) — the three that unlock the most.

---

## Marketing Top 3 (CMO Sub-Team)

### M-C2-1 — Activate All Zero-Cost Social Channels
**Owner:** Social & Community Manager (or CMO Lead)  
**What:** Publish first posts on Facebook groups (M-001), Nextdoor (M-007), and create @LompocDeals Instagram (M-004). Use all templates from Cycle 1.  
**Hypothesis:** 3 channels × first post → 20 signups within 2 weeks at $0 spend  
**KPI:** 20 new consumer signups, 3 channels active  
**Assets ready:** facebook-post-templates.md, nextdoor-post-templates.md, instagram-content-calendar.md  
**Action:** Human must join/create accounts and post. All copy is ready.  
**Deadline:** Day 3 of Cycle 2

### M-C2-2 — First 20 Merchant Outreach Contacts
**Owner:** Merchant Acquisition Lead  
**What:** Execute the first 20 contacts from pipeline-cycle1.md using merchant-outreach-script.md  
**Hypothesis:** 20 contacts → 4 new merchant signups (20% close rate)  
**KPI:** 4 new merchant signups  
**Assets ready:** merchant-outreach-script.md, pipeline-cycle1.md  
**Action:** Human to send DMs, Google Maps messages, and make phone calls.  
**Deadline:** End of Cycle 2

### M-C2-3 — Email Chamber of Commerce + Claim Google Business Profile
**Owner:** CMO Lead  
**What:** Send chamber-outreach-script.md initial email AND complete gbp-setup-checklist.md  
**Hypothesis:** Chamber intro + GBP = 15+ merchant referrals + 20 GBP clicks/week within 30 days  
**KPI:** GBP live + claimed, Chamber email sent  
**Assets ready:** chamber-outreach-script.md, gbp-setup-checklist.md  
**Action:** Human to execute both — each is a ~30-minute task.  
**Deadline:** Day 5 of Cycle 2

---

## Engineering Top 3 (CTO Sub-Team)
*CTO Lead: confirm or revise E1–E3 when back online*

### E1 — Activate Stripe Billing (B-001) ← CRITICAL
**Owner:** Payments Engineer  
**Why:** Zero MRR until Stripe is live. Keys just need to be added — code is already written.  
**CMO dependency:** Unblocks MRR reporting in KPIS.md; prerequisite for paid campaigns  
**Effort:** S  
**Status:** Awaiting CTO confirmation + execution

### E2 — Conversion Funnel Analytics (B-006 / REQ-001) ← CMO BLOCKER
**Owner:** Data Engineer  
**Why:** Without tracking, CMO has zero baseline data. Can't prove social campaigns work, can't justify any ad spend.  
**CMO dependency:** Prerequisite for M-011 (Google Ads), M-015 (Meta Ads), all CRO work  
**Effort:** M  
**Status:** Awaiting CTO confirmation + execution

### E3 — Merchant View Counts Widget (REQ-003)
**Owner:** Lead Full-Stack Engineer  
**Why:** Removes #1 merchant sales objection. Makes M-C2-2 outreach close rate meaningfully higher.  
**CMO dependency:** Closes REQ-003 — directly improves merchant outreach results  
**Effort:** S  
**Status:** Awaiting CTO confirmation + execution

---

## Cycle 2 Kickoff Checklist

*Both leads fill this in at cycle start:*

- [ ] CTO confirms E1–E3 (or revises)
- [ ] CMO confirms M-C2-1, M-C2-2, M-C2-3 are still top priority (vs. new context)
- [ ] Both agree on cycle length (recommend: 1 week)
- [ ] Agree on retro date (recommend: end of week Monday)
- [ ] Update THIS_CYCLE.md → point to this file or rename

---

## Cycle 2 Success Criteria

By end of Cycle 2, we should have:

| Metric | Target |
|--------|--------|
| Stripe live (B-001 done) | Yes |
| Funnel tracking live (REQ-001 done) | Yes |
| New merchant signups this cycle | 4+ |
| Social channels active | 3 (FB, IG, Nextdoor) |
| GBP claimed | Yes |
| Consumer signups (first real data) | 20+ |
| MRR | $0 → >$0 (first paid merchant) |

---

## Deprioritized for Cycle 2 (Push to Cycle 3)

- M-011 Google Ads — needs REQ-001 first, which ships in Cycle 2
- M-015 Meta Ads — same dependency
- M-014 Digest email — needs REQ-004 (cron QA)
- M-010 Referral program — needs REQ-006 (new CTO ticket)
- B-008 SEO pages — Vercel Pro confirmed; CTO to implement in Cycle 2/3
- B-010 AI copywriting — nice to have, low priority vs. revenue unlocks
