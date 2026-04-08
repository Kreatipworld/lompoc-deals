# Merchant Onboarding Email Drip — M-006
*Owner: CMO | Status: Ready for dev implementation | Trigger: User signs up as "business"*
*Sequence: 5 emails — Day 0, Day 1, Day 3, Day 7, Day 14*

---

## Implementation Notes for CTO (REQ-002)

- **Trigger event:** `user.signup` where `role = "business"`
- **Send times:** Immediately (Day 0), Day 1 at 10am, Day 3 at 10am, Day 7 at 10am, Day 14 at 10am (local time)
- **From address:** `hello@lompoc-deals.com`
- **From name:** `Lompoc Deals — Merchant Support`
- **Reply-to:** Human support inbox (or forward to board user's email)
- **Unsubscribe:** Required, but with copy that says "you'll miss deal performance updates"
- **Language:** Default English; Spanish version sent if user's `locale = "es"`
- **Template format:** Plain-text-friendly HTML. Business tone, friendly, not pushy.

---

## Email 1 — Day 0: Welcome + First Deal CTA

**Subject (EN):** Welcome to Lompoc Deals — let's get your first deal live  
**Subject (ES):** Bienvenido a Lompoc Deals — publiquemos tu primera oferta

**Preview text (EN):** Your merchant profile is ready. Here's how to set up your first deal in 5 minutes.  
**Preview text (ES):** Tu perfil de negocio está listo. Así se configura tu primera oferta en 5 minutos.

---

### Body (English)

Hi [business_name],

You're now on **Lompoc Deals** — the platform that puts your business in front of Lompoc locals who are actively looking for deals.

**Your next step: create your first deal.**

It takes less than 5 minutes:

1. Go to your **[Merchant Dashboard →](https://lompoc-deals.vercel.app/dashboard)**
2. Click **"Add a Deal"**
3. Set the deal title, discount, and expiration date
4. Publish

Your deal will go live immediately and start appearing to local consumers.

---

**Tips for a strong first deal:**

- **Be specific** — "20% off any haircut" outperforms "Great deals!"
- **Set an expiration** — deals with deadlines get 2x the claims
- **Add a photo** — deals with images get 3x more views

---

Questions? Reply to this email — we read every message.

— The Lompoc Deals Team

*[Manage preferences] · [Unsubscribe]*

---

### Body (Spanish)

Hola [business_name],

Ya estás en **Lompoc Deals** — la plataforma que pone tu negocio frente a los locales de Lompoc que buscan activamente ofertas.

**Tu próximo paso: crea tu primera oferta.**

Toma menos de 5 minutos:

1. Ve a tu **[Panel de negocios →](https://lompoc-deals.vercel.app/dashboard)**
2. Haz clic en **"Agregar oferta"**
3. Establece el título, el descuento y la fecha de vencimiento
4. Publica

Tu oferta se publicará de inmediato y comenzará a aparecer para los consumidores locales.

---

**Consejos para una primera oferta sólida:**

- **Sé específico/a** — "20% de descuento en cualquier corte" supera a "¡Grandes ofertas!"
- **Establece una fecha de vencimiento** — las ofertas con plazos reciben 2x más reclamaciones
- **Agrega una foto** — las ofertas con imágenes reciben 3x más vistas

---

¿Preguntas? Responde a este correo — leemos cada mensaje.

— El equipo de Lompoc Deals

*[Gestionar preferencias] · [Cancelar suscripción]*

---

## Email 2 — Day 1: Deal Performance Peek (or Nudge if no deal created)

**Subject (EN — has deal):** Your deal is live — here's how it's doing  
**Subject (EN — no deal):** Your Lompoc Deals profile is waiting for its first deal  
**Subject (ES — has deal):** Tu oferta está activa — así va  
**Subject (ES — no deal):** Tu perfil de Lompoc Deals espera su primera oferta

**Preview text (EN — has deal):** View counts, claims, and a quick performance tip.  
**Preview text (EN — no deal):** Lompoc locals are browsing right now. Take 5 minutes to add your first deal.

---

### Body A (English — merchant HAS an active deal)

Hi [business_name],

Your deal **"[deal_title]"** has been live for about 24 hours. Here's a quick look:

| Metric | Count |
|--------|-------|
| Views | [deal_view_count] |
| Claims | [deal_claim_count] |
| Saves (favorited) | [deal_save_count] |

---

**Quick tip to increase claims:**

The merchants with the highest claim rates on Lompoc Deals share three traits:

1. A clear, specific discount (e.g., "Buy 1 get 1 free on boba teas")
2. A short, friendly deal description (2–3 sentences)
3. A real photo of the product or storefront

You can update your deal anytime from the [Merchant Dashboard →](https://lompoc-deals.vercel.app/dashboard).

--- 

Keep it up — we'll check back in a couple of days.

— The Lompoc Deals Team

*[Unsubscribe]*

---

### Body B (English — merchant has NO active deal)

Hi [business_name],

Your Lompoc Deals profile is live — but you haven't added a deal yet.

Lompoc locals are browsing the platform right now. Every day without a deal is visibility you're leaving on the table.

**It takes 5 minutes: [Add your first deal →](https://lompoc-deals.vercel.app/dashboard)**

Here's what local merchants are offering that's getting the most views right now:

> [DYNAMIC: 3 top-performing deals by view_count — category, deal type, discount range]

You don't have to beat those numbers — just get started. The algorithm surfaces new deals to active browsers.

— The Lompoc Deals Team

*[Unsubscribe]*

---

## Email 3 — Day 3: Redemption How-To + Social Proof

**Subject (EN):** How deal redemptions work (and how to handle them)  
**Subject (ES):** Cómo funcionan los canjes de ofertas (y cómo manejarlos)

**Preview text (EN):** When a customer claims a deal, here's exactly what happens next.  
**Preview text (ES):** Cuando un cliente reclama una oferta, esto es exactamente lo que sucede.

---

### Body (English)

Hi [business_name],

One question we hear a lot from new merchants: **"What happens when someone claims my deal?"**

Here's the full flow:

1. **Customer claims your deal** — they tap "Claim" on the deal page
2. **You get a notification** — email or dashboard alert (depending on your settings)
3. **Customer shows up** — they'll show the deal on their phone or say "I claimed a deal on Lompoc Deals"
4. **You honor the deal** — apply the discount, they leave happy
5. **Mark it redeemed** — optional, helps your stats; tap "Mark Redeemed" in your dashboard

That's it. No scanning, no codes, no hardware required.

---

**Managing volume:**

If a deal gets more claims than you can handle, you can:
- **Pause the deal** from your dashboard (temporarily stop new claims)
- **Set a claim limit** when creating a deal (e.g., "max 50 claims")
- **Update the terms** (e.g., "first 20 customers this Saturday only")

---

You're in control. The platform works for you.

[Visit your dashboard →](https://lompoc-deals.vercel.app/dashboard)

— The Lompoc Deals Team

*[Unsubscribe]*

---

### Body (Spanish)

Hola [business_name],

Una pregunta que escuchamos mucho de los nuevos negocios: **"¿Qué pasa cuando alguien reclama mi oferta?"**

Así funciona:

1. **El cliente reclama tu oferta** — toca "Reclamar" en la página de la oferta
2. **Recibes una notificación** — por correo o alerta en el panel (según tu configuración)
3. **El cliente se presenta** — mostrará la oferta en su teléfono o dirá "Reclamé una oferta en Lompoc Deals"
4. **Tú honras la oferta** — aplicas el descuento, el cliente se va contento
5. **Marca como canjeada** — opcional, mejora tus estadísticas; toca "Marcar como canjeada" en tu panel

Eso es todo. Sin escanear, sin códigos, sin hardware.

---

**Manejando el volumen:**

Si una oferta recibe más reclamaciones de las que puedes manejar, puedes:
- **Pausar la oferta** desde tu panel (detener temporalmente nuevas reclamaciones)
- **Establecer un límite de reclamaciones** al crear la oferta (p.ej. "máximo 50 reclamaciones")
- **Actualizar los términos** (p.ej. "solo los primeros 20 clientes este sábado")

---

Tú tienes el control. La plataforma trabaja para ti.

[Visita tu panel →](https://lompoc-deals.vercel.app/dashboard)

— El equipo de Lompoc Deals

*[Cancelar suscripción]*

---

## Email 4 — Day 7: Performance Stats + Upsell to Featured Placement

**Subject (EN):** Your 7-day Lompoc Deals report  
**Subject (ES):** Tu informe de 7 días en Lompoc Deals

**Preview text (EN):** See how your deal performed — and a way to get 5x more visibility.  
**Preview text (ES):** Mira cómo funcionó tu oferta — y una forma de obtener 5x más visibilidad.

---

### Body (English)

Hi [business_name],

It's been one week on Lompoc Deals. Here's your snapshot:

**[business_name] — Week 1 Report**

| Metric | Your Numbers |
|--------|-------------|
| Deal views | [total_views] |
| Deal claims | [total_claims] |
| Claim rate | [claim_rate]% |
| Platform average claim rate | ~[platform_avg]% |

---

**[IF claim_rate < platform_avg]**

Your claim rate is a bit below the platform average. The fastest fix is usually the deal headline — try being more specific. Instead of "Discount on services," try "15% off your first manicure, this week only."

Update your deal: [Dashboard →](https://lompoc-deals.vercel.app/dashboard)

---

**[IF claim_rate >= platform_avg]**

Nice — you're above platform average on claim rate. The next lever is *reach*: more consumers seeing your deal.

---

**Want more visibility?**

Lompoc Deals offers **featured placement** — your deal appears at the top of the browse feed and in the weekly digest sent to all [subscriber_count] subscribers.

This is our paid tier. It's $[price]/month per featured slot.

Interested? [Learn more →](https://lompoc-deals.vercel.app/merchant/upgrade) or reply to this email.

— The Lompoc Deals Team

*[Unsubscribe]*

---

## Email 5 — Day 14: Win-Back / Engagement Check

**Subject (EN — has recent activity):** Quick update from Lompoc Deals  
**Subject (EN — no recent activity):** We miss you at Lompoc Deals — is everything OK?  
**Subject (ES — has recent activity):** Actualización rápida de Lompoc Deals  
**Subject (ES — no recent activity):** Te echamos de menos en Lompoc Deals — ¿todo bien?

---

### Body A (English — merchant IS active, has claims in last 7 days)

Hi [business_name],

Two weeks in and you've already had **[total_claims] claims** from Lompoc locals. That's [total_claims] customers who walked through your door (or called, or visited) because of your deal.

A few things worth knowing:

**What's working on the platform right now:**
- Deals with photos get 3x more views
- Adding a second deal doubles your profile's search visibility
- Deals mentioning "this week only" or "limited to X" get 40% higher claim rates

**Ready to add a second deal?**  
[Add a deal →](https://lompoc-deals.vercel.app/dashboard)

---

We're rooting for you.

— The Lompoc Deals Team

*[Unsubscribe]*

---

### Body B (English — merchant has NO claims or hasn't logged in)

Hi [business_name],

It's been two weeks since you joined Lompoc Deals, and we noticed you haven't had any deal claims yet.

That's uncommon — most new merchants see their first claim within 3 days. We want to make sure you're set up for success.

**A few things to check:**

- [ ] Is your deal live? ([Check dashboard →](https://lompoc-deals.vercel.app/dashboard))
- [ ] Does your deal have a clear discount amount?
- [ ] Does your deal have an expiration date set?
- [ ] Does your deal have a photo?

If your deal is live and none of that has helped, **reply to this email** — we'll take a look and give you personal feedback.

We want Lompoc Deals to work for you.

— The Lompoc Deals Team

*[Unsubscribe]*

---

## Sequence Logic Summary (for CTO)

```
user.signup (role = "business")
  → Day 0:  Email 1 (welcome + first deal CTA)
  → Day 1:  IF has_active_deal → Email 2A (performance peek)
            ELSE → Email 2B (nudge to create deal)
  → Day 3:  Email 3 (redemption how-to)
  → Day 7:  Email 4 (week 1 report + featured placement upsell)
  → Day 14: IF claims_last_7 > 0 → Email 5A (encouragement + tips)
            ELSE → Email 5B (win-back / check-in)
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Email 1 open rate | >60% |
| Emails 2–4 open rate | >35% |
| Email 5 open rate | >25% |
| Merchant creates first deal within 3 days | >60% of new signups |
| Merchant 30-day retention (has active deal at day 30) | >80% |
| Featured upgrade conversion (from Email 4) | >3% of recipients |
| Win-back response rate (Email 5B) | >10% |
