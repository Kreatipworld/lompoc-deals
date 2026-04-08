# M-014 • Weekly Deal Digest Email — Template
*Status: Template complete — execution blocked on REQ-004 (digest cron infrastructure)*  
*Owner: Lifecycle & Email Marketer | Updated: 2026-04-08*

---

## Overview

**Frequency:** Every Tuesday at 9am PT  
**Audience:** Confirmed consumer subscribers  
**Goal:** Drive weekly return visits + claim events  
**KPI:** 35%+ open rate, 8%+ click rate, 200+ site visits per send

---

## Email Template (English — Primary)

### Subject Lines (A/B rotate weekly)

**Week A:** 🔥 Top 5 Lompoc deals this week (free)  
**Week B:** Your weekly Lompoc deals digest is here  
**Week C:** 5 deals your neighbors are loving right now  
**Week D:** Don't miss these Lompoc deals — expires soon

*Note: Emoji subject lines typically outperform plain-text in local/lifestyle segments. Test emoji vs. no-emoji at send #5.*

### Preheader Text
"This week's top deals from local Lompoc businesses — updated fresh every Tuesday."

---

### Email Body

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         LOMPOC DEALS
         Your weekly local deals digest
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi [First Name],

Here are the top 5 deals from Lompoc local businesses 
this week. Support local and save!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥇 DEAL #1
[Deal Title] — [Business Name]
[One-line deal description, e.g. "20% off any entree"]
📍 [Address or neighborhood]
⏰ Valid through [expiry date or "while supplies last"]
[VIEW DEAL →] (CTA button — links to deal page)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥈 DEAL #2
[same format]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥉 DEAL #3
[same format]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ DEAL #4
[same format]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ DEAL #5
[same format]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         [SEE ALL LOMPOC DEALS →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Is your local business not on Lompoc Deals yet?
List your business free → [lompoc-deals.vercel.app]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're receiving this because you subscribed at 
lompoc-deals.vercel.app. 
[Unsubscribe] | [View in browser]

Lompoc Deals · Lompoc, CA 93436
```

---

## Email Template (Spanish — Footer/Toggle)

*For the bilingual approach: English first, brief Spanish section at bottom. Full Spanish send eventually once audience segments by language preference.*

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     🇲🇽 VERSIÓN EN ESPAÑOL

Hola [First Name],

Aquí están las mejores 5 ofertas de negocios locales 
en Lompoc esta semana. ¡Apoya lo local y ahorra!

[Same deal list in Spanish translation]

¿Tu negocio local todavía no está en Lompoc Deals?
Lista tu negocio gratis → [lompoc-deals.vercel.app]

[Cancelar suscripción] | [Ver en el navegador]
```

---

## Deal Selection Logic (for CTO/REQ-004)

**Algorithm:** Top 5 deals ranked by:
```
score = (click_count * 3) + (view_count * 1)
WHERE deals.expires_at > NOW() OR deals.expires_at IS NULL
AND deals.status = 'active'
AND deals.created_at > NOW() - INTERVAL '14 days'
ORDER BY score DESC
LIMIT 5
```

**Fallback if <5 deals exist:** Fill with most recent active deals, oldest last.

**Edge cases:**
- If a business has 2 deals in the top 5, include both (don't dedupe by merchant)
- If a deal was in last week's top 5, deprioritize it (add a -30% score penalty)
- If 0 deals exist: skip the send that week, do not send empty digest

---

## Rendering Spec

**From name:** Lompoc Deals  
**From email:** digest@lompoc-deals.com (or reply-to@resend.dev during MVP)  
**Max width:** 600px  
**Font:** System font stack (no Google Fonts dependency)  
**Color:** #1a1a1a text, #f97316 CTA buttons (brand orange), #f9fafb background  
**Mobile:** Single column, 16px body text minimum  
**Images:** Logo only — no deal images in digest (reduces load time, spam score)  
**Plain text version:** Required — Resend generates automatically

---

## Compliance Checklist

- [ ] CAN-SPAM compliant: physical address in footer
- [ ] GDPR-ish: explicit opt-in at signup (checkbox)
- [ ] Unsubscribe link: one-click, instant, no login required
- [ ] List-Unsubscribe header set by Resend automatically
- [ ] No purchased lists — subscribers only

---

## Send Calendar (First 8 Weeks)

| Send # | Date | Subject Line Version | Notes |
|--------|------|---------------------|-------|
| 1 | First Tuesday after REQ-004 ships | A (emoji) | Baseline |
| 2 | +1 week | B (plain) | A/B subject test |
| 3 | +2 weeks | A (emoji) | Compare open rates |
| 4 | +3 weeks | C ("neighbors") | New hook test |
| 5 | +4 weeks | Winner from 1–3 | Emoji vs no-emoji final decision |
| 6–8 | +5–7 weeks | Winning subject template | Stable operations |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Open rate | ≥35% |
| Click rate | ≥8% |
| Unsubscribe rate | ≤0.5% |
| Site visits from email | 200+ per send |
| Deal clicks per send | 50+ |
