# M-015 • Facebook & Instagram Ads — Merchant Acquisition (Hyper-Local)
*Status: Brief complete — execution blocked on REQ-001 (conversion tracking)*  
*Owner: Growth Marketer | Budget: $50/month | Updated: 2026-04-08*

---

## Campaign Goal

Acquire new merchant signups via hyper-local Facebook/Instagram ads targeting small business owners and managers in the Lompoc area.

**Primary KPI:** ≥3 merchant signups per month at ≤$15 CPL  
**Secondary KPI:** 30+ "business profile started" events/month

---

## Audience Strategy

### Core Audience — Lompoc Business Owners

**Location:** Lompoc, CA + 5-mile radius  
**Age:** 25–65  
**Language:** English + Spanish  
**Interests/Behaviors:**
- Small business owners
- Entrepreneurs
- Local business page admins
- Restaurant owners (job title)
- Retail store owners (job title)

### Lookalike (Phase 2 — once we have 50+ merchant signups)
- LAL 1% from merchant signup conversion event
- LAL 1% from merchant profile completions
- Same geographic radius

---

## Ad Creative Brief

### Creative Set A — Problem/Solution (English)

**Format:** Single image or short video (15s)  
**Visual direction:** Split screen — busy merchant at counter (left) / merchant dashboard showing "142 views this week" (right)

**Headline options (test all 3):**
1. "Where do Lompoc shoppers look for deals? Here."
2. "Your Lompoc neighbors are looking for your deals."
3. "Give Lompoc locals a reason to walk through your door."

**Primary text (option A):**
> You work hard running your business. Let Lompoc Deals put your specials in front of hundreds of local shoppers — automatically.
> 
> ✅ Free to start  
> ✅ No commission on sales  
> ✅ Bilingual audience (EN + ES)  
> ✅ 5 minutes to set up
> 
> Post your first deal today →

**Primary text (option B — shorter):**
> Local shoppers in Lompoc are already looking for deals from businesses like yours.
> 
> Join Lompoc Deals free. Post your specials. Get more foot traffic.

**CTA button:** Learn More → lompoc-deals.vercel.app/en/sign-up  

---

### Creative Set B — Social Proof (English)

**Format:** Carousel (3 cards)

**Card 1:**
- Headline: "142 people viewed this deal last week"
- Body: [Screenshot/mockup of merchant dashboard view count widget]
- Note: Use real data once REQ-003 ships

**Card 2:**
- Headline: "Reach Lompoc shoppers for free"
- Body: [Map of Lompoc with deal pins]

**Card 3:**
- Headline: "Start posting deals in 5 minutes"
- Body: [Screenshot of simple merchant signup flow]
- CTA: "Get Started Free"

---

### Creative Set C — Spanish Version

**Headline options:**
1. "¿Dónde buscan ofertas los vecinos de Lompoc? Aquí."
2. "Tus vecinos de Lompoc están buscando tus ofertas."
3. "Dale a los locales una razón para entrar a tu negocio."

**Primary text:**
> Trabajas duro para manejar tu negocio. Deja que Lompoc Deals ponga tus especiales frente a cientos de compradores locales — automáticamente.
> 
> ✅ Gratis para empezar  
> ✅ Sin comisión en ventas  
> ✅ Audiencia bilingüe (EN + ES)  
> ✅ 5 minutos para configurar
> 
> Publica tu primera oferta hoy →

---

## Campaign Structure

```
Campaign: Lompoc Deals — Merchant Acquisition
├── Ad Set A: Business Owner (EN) — $25/month
│   ├── Ad 1A: Problem/Solution (Image)
│   ├── Ad 1B: Problem/Solution (Short video)
│   └── Ad 1C: Social Proof (Carousel)
└── Ad Set B: Business Owner (ES) — $25/month
    ├── Ad 2A: Spanish Image
    └── Ad 2B: Spanish Carousel
```

**Optimization:** Conversion (merchant signup)  
**Attribution:** 7-day click, 1-day view  
**Budget:** $50/month hard cap  
**Bid strategy:** Lowest cost (auto) until 10+ conversions, then target cost

---

## Launch Sequence

1. **Week 1–2:** Run Ad Set A only (EN), A/B test headlines. Budget: $12/week
2. **Week 3:** Add Ad Set B (ES) based on Week 1 learnings. Budget: $12/week
3. **Week 4:** Kill bottom 50% of ads, double down on winners
4. **Month 2:** If CAC < $15, scale to $100/month

---

## Launch Checklist

- [ ] REQ-001 conversion tracking confirmed working (Facebook Pixel + server event)
- [ ] Facebook Business Manager account set up
- [ ] Pixel installed on merchant signup confirmation page
- [ ] Custom conversion: "merchant_signup" event fires on profile creation
- [ ] Creative assets: 2 images + 1 video minimum before launch
- [ ] Legal: Ad account not in restricted category
- [ ] Test ad in Ad Preview before going live

---

## Success Metrics

| Metric | Month 1 Target |
|--------|---------------|
| Merchant signups | 3+ |
| CPL (cost per lead) | ≤$15 |
| CTR | ≥1.5% |
| Reach | 3,000+ unique Lompoc users |
| Ad spend | ≤$50 |
