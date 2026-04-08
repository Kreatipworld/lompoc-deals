# M-010 • Merchant Referral Program — "Refer a Neighbor"
*Status: Design complete — CTO ticket required for implementation*  
*Owner: Merchant Acquisition Lead | Updated: 2026-04-08*

---

## Program Overview

**Name:** "Refer a Neighbor"  
**Spanish name:** "Recomienda a un Vecino"  
**Tagline:** "Know a local business? Send them our way — we'll make it worth it."

**Core mechanic:** Current merchants get a unique referral link. When a new merchant signs up via that link and activates their account, the referring merchant earns a reward.

**Goal:** Drive word-of-mouth merchant acquisition with $0 paid CAC. Target: 20% of all new merchants acquired via referral by month 3.

---

## Reward Structure

### Phase 1 — Soft Launch (first 50 merchants)
**Reward for referrer:** 1 free month of subscription (credited to account)  
**Reward for referred:** 1 free month of subscription (auto-applied at signup)  
**Trigger:** New merchant completes business profile + posts first deal

**Why this structure:**
- Zero cash outlay (both rewards are subscription credits)
- Incentivizes the referred merchant to actually use the product
- Referrer gets immediate value — easy to track, easy to explain

### Phase 2 — Scale (50+ merchants)
Evaluate upgrading to cash reward ($10 cash via Stripe payout) if referral volume is high enough to justify. Decision at 90-day review.

---

## User Flow

```
Existing merchant logs in
→ Dashboard → "Refer a Neighbor" tab
→ Gets unique URL: lompoc-deals.vercel.app/join?ref=MERCHANTCODE
→ Copies link / shares via text, social, or in person

New merchant visits referral URL
→ Signs up → account tagged with referrer ID
→ Completes profile + posts first deal
→ System credits: +1 month to new merchant, +1 month to referrer
→ Both get confirmation email
```

---

## Engineering Requirements (for CTO ticket)

**Priority:** P2  
**Estimated complexity:** Medium

**What needs to be built:**
1. `referral_code` field on `businesses` table (unique, 8-char alphanumeric)
2. `referrer_id` field on `businesses` table (nullable FK → businesses)
3. Referral link generation: `lompoc-deals.vercel.app/join?ref={code}`
4. Middleware: on signup, capture `ref` param and store referrer_id
5. Trigger: when new merchant posts first deal, fire reward logic
6. Reward logic: add `subscription_credits` (+1 month) to referrer and referee
7. Dashboard widget: "Your referrals" tab showing: link, # referrals sent, # activated, credits earned
8. Email: notify referrer when their referral activates

**Events to fire (for analytics):**
- `referral_link_copied`
- `referral_signup_started`
- `referral_signup_completed` (profile created)
- `referral_activated` (first deal posted)
- `referral_reward_issued`

---

## Marketing Materials

### Outreach Insert (add to merchant onboarding email, Day 14)

**Subject:** Know another Lompoc business? Get a free month.

> Hey [Merchant Name],
> 
> You've been on Lompoc Deals for 2 weeks — we hope you're seeing results!
> 
> Quick ask: do you know another Lompoc business that could benefit from posting deals? Send them your personal link and **both of you get a free month** when they post their first deal.
> 
> Your referral link: [REFERRAL_LINK]
> 
> Just share it by text, social, or in person. We'll take care of the rest.
> 
> — The Lompoc Deals Team

---

### Merchant Dashboard Copy

**Widget headline:** Refer a Neighbor, Get a Free Month  
**Subheadline:** Know a local business? Share your link. If they post their first deal, you both get 1 month free.  
**CTA button:** Copy My Referral Link  
**Stats shown:** Referrals sent · Referrals activated · Credits earned

---

### Social Share Templates

**Facebook (referrer shares):**
> Hey Lompoc business owners — I've been using Lompoc Deals to post my specials and get in front of local customers. If you want to try it, use my link and we BOTH get a free month: [REFERRAL_LINK] 🎉

**Text message (short):**
> Hey! Check out Lompoc Deals — free way to post your specials to local shoppers. Use my link and you get your first month free: [LINK]

**Spanish (Facebook):**
> ¡Dueños de negocios en Lompoc! Estoy usando Lompoc Deals para publicar mis ofertas y llegar a clientes locales. Si quieres probarlo, usa mi enlace y los dos obtenemos un mes gratis: [REFERRAL_LINK] 🎉

---

## Success Metrics

| Metric | Month 3 Target |
|--------|---------------|
| Merchants sharing referral link | 30% of active merchants |
| Referrals sent | 40+ |
| Referral activation rate | 25% (10 new merchants) |
| % of new merchants via referral | 20%+ |
| Referral CAC | $0 (subscription credit only) |

---

## CTO Ticket Request

File as: **REQ-006 • Merchant Referral System ("Refer a Neighbor")**  
Priority: P2 | Target: Cycle 3  
See engineering requirements section above for full spec.
