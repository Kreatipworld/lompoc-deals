# Engineering → Marketing Handoff Notes
*Last updated: 2026-04-07 | Owner: CTO (writes) / CMO (reads)*

Every feature the CTO team ships that has marketing relevance gets a handoff note here. Format below.

---

## HANDOFF TEMPLATE

```
## [FEATURE NAME] — shipped [DATE]

**What shipped:** (1-2 sentences)
**How to test it:** (step-by-step, plain English)
**Events it fires:** (analytics event names + payload)
**Marketing surfaces it unlocks:** (which channels / campaigns this enables)
**Known limitations:** (what doesn't work yet, edge cases)
```

---

## Platform Baseline (as of 2026-04-07)

**What shipped:** Core platform v1 — consumer feed, business dashboard, deal CRUD, auth, map, email digest infra, Stripe billing code (keys not yet active).

**How to test it:**
1. Go to lompoc-deals.vercel.app
2. Browse the feed — deals visible without login ✅
3. Search by keyword ✅
4. Filter by category ✅
5. Click "Sign Up" as a local → favorites + digest subscribe ✅
6. Click "Sign Up" as a business → create profile + post deal ✅ (requires admin approval)
7. Map page → all businesses pinned ✅
8. EN/ES toggle in header ✅

**Events it fires:** view_count and click_count increment on deal pages (stored in DB, no external analytics yet)

**Marketing surfaces it unlocks:**
- Social media (shareable deal URLs)
- Email (subscriber list + digest infra ready)
- Merchant outreach (live product to demo)
- SEO (indexed pages for businesses + deals)

**Known limitations:**
- No Google Analytics / external tracking yet (REQ-001)
- Stripe billing not active (keys missing)
- Digest cron not tested in production (REQ-004)
- No merchant view count widget in dashboard (REQ-003)
- No welcome/onboarding email sequences (REQ-002)

---

*CTO team: add new entries above this line when you ship something.*
