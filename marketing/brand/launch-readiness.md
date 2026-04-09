# Lompoc Deals — Launch Readiness Checklist
*Owner: CMO | Last updated: 2026-04-09 | For: Pre-launch go/no-go decision*

This is the single source of truth for whether the site is ready to drive traffic. Every item must be checked before paid acquisition or press outreach begins.

**Legend:** ✅ Done | 🔄 In progress | ❌ Blocked / Not started | 🔒 Pending human

---

## TIER 1 — MUST DO BEFORE ANY TRAFFIC (Hard blocks)

### Brand & Copy
- [x] ✅ Visual design system v1.0 live (KRE-90, KRE-89, KRE-95) — Purple, Cream, Plus Jakarta Sans, sweet pea logo
- [x] ✅ Homepage redesign live — all 9 sections, bilingual, mobile-first (KRE-77)
- [x] ✅ Spanish copy reviewed by native speaker (KRE-91)
- [ ] ❌ Spanish copy fixes applied — 2 required corrections (REQ-009 submitted to CTO)
  - `Ofertas destacadas esta semana — hand-picked...` → full Spanish
  - `Registra tu negocio — Takes less than 10 minutes.` → full Spanish

### Product
- [x] ✅ Consumer deal feed working
- [x] ✅ Merchant dashboard (deal CRUD, stats)
- [x] ✅ 155+ businesses listed with real Lompoc data
- [x] ✅ Bilingual EN/ES support
- [x] ✅ Free / Standard ($19.99) / Premium ($39.99) pricing tiers defined
- [ ] 🔄 Stripe billing active for paid tiers (KRE-50, KRE-107)
- [ ] ❌ Funnel analytics tracking (REQ-001) — sessions, signups, claims

### SEO minimum
- [ ] 🔒 Google Business Profile claimed and optimized
- [x] ✅ Meta tags on homepage (`<title>`, `<meta description>`, Open Graph)
- [ ] ❌ LocalBusiness schema markup (REQ-005)

---

## TIER 2 — DO BEFORE PAID ACQUISITION (Soft blocks)

### Analytics
- [ ] ❌ Funnel tracking live (REQ-001) — visit → claim → redeem
- [ ] ❌ Google Analytics or Plausible connected
- [ ] ❌ Merchant view count widget (REQ-003) — needed for sales close rate

### Email infrastructure
- [ ] ❌ Consumer welcome sequence deployed (REQ-002 + M-005)
- [ ] ❌ Merchant onboarding drip deployed (REQ-002 + M-006)
- [ ] ❌ Upgrade trigger at deal #3 (REQ-002 + M-018)
- [ ] ❌ Weekly digest cron live (REQ-004)

### Social presence
- [ ] 🔒 @LompocDeals Instagram created and first post live
- [ ] 🔒 Facebook community groups joined and seeding posts published
- [ ] 🔒 Nextdoor profile set up and first post published

---

## TIER 3 — LAUNCH AMPLIFIERS (Do after initial traffic)

### Paid acquisition
- [ ] ❌ Google Ads — search campaign for "Lompoc deals" + category keywords (requires REQ-001 first)
- [ ] ❌ Meta/Instagram — "Start free, no credit card" campaign (requires REQ-001 first)
- [ ] ❌ TikTok — local content series (requires filming + human execution)

### PR & partnerships
- [ ] ❌ Press pitch sent to Lompoc Record + SYV News (hold until 50-merchant milestone)
- [ ] ❌ Chamber of Commerce intro email sent
- [ ] ❌ Merchant referral program live (REQ-006 — Cycle 3)

### Content
- [ ] ❌ SEO landing pages live — `/lompoc/[category]` routes (REQ-005)
- [ ] ❌ Real testimonials collected from Lompoc residents (currently placeholders)
- [ ] ❌ Blog/editorial content — wine country guide, deal of the day (post-launch)

---

## Launch Gate Summary

| Area | Status | Blocker |
|------|--------|---------|
| Brand + visual identity | ✅ DONE | — |
| Homepage design | ✅ DONE | — |
| Spanish copy review | ✅ DONE | — |
| Spanish copy fixes applied | ❌ NOT DONE | REQ-009 pending CTO |
| Stripe billing active | 🔄 IN PROGRESS | KRE-50, KRE-107 |
| Funnel analytics | ❌ NOT DONE | REQ-001 pending CTO |
| Social accounts | 🔒 NOT DONE | Human must create accounts |
| GBP claimed | 🔒 NOT DONE | Human must verify |
| Email sequences | ❌ NOT DONE | REQ-002 pending CTO |

**Current verdict: NOT READY for paid acquisition**
**Near-ready for: organic social seeding, GBP claim, merchant outreach**

**Gate to organic launch:** REQ-009 (Spanish fixes) + social accounts + GBP = ~3 items, 2 human tasks
**Gate to paid launch:** All of the above + REQ-001 (funnel tracking) + Stripe active

---

## Notes

- Do NOT run paid ads before REQ-001 (funnel tracking) is live — there is no way to measure ROI
- Do NOT promise features in ads that aren't shipped (i.e., don't promote "premium analytics" until REQ-003 is live)
- Testimonials on homepage are currently placeholder — replace with real Lompoc resident quotes before press outreach
- GBP must be claimed BEFORE any PR, so the business shows correctly on Google Maps

---

*CMO to update this file after each cycle. CTO: update the status column as engineering tickets close.*
