# Consumer Welcome Email Sequence — M-005
*Owner: CMO | Status: Ready for dev implementation | Trigger: User signs up as "local"*
*Sequence: 3 emails — Day 0 (immediate), Day 3, Day 7*

---

## Implementation Notes for CTO (REQ-002)

- **Trigger event:** `user.signup` where `role = "local"`
- **Send times:** Immediately (Day 0), Day 3 at 9am local time, Day 7 at 9am local time
- **From address:** `deals@lompoc-deals.com` (or Resend sender)
- **From name:** `Lompoc Deals`
- **Unsubscribe:** Required in footer of every email
- **Language:** Default English; if user locale is `es` or user is flagged as Spanish-preferred, send Spanish version
- **Template format:** These are plain-text-friendly HTML emails. Keep styling minimal.

---

## Email 1 — Day 0: Welcome / Immediate Confirmation

**Subject (EN):** You're in — here's your first deal 🎉  
**Subject (ES):** Ya estás dentro — aquí está tu primera oferta

**Preview text (EN):** Exclusive local deals from Lompoc's best businesses, right now.  
**Preview text (ES):** Ofertas locales exclusivas de los mejores negocios de Lompoc, ahora mismo.

---

### Body (English)

Hi [first_name],

Welcome to **Lompoc Deals** — Lompoc's free local business directory. Restaurants, shops, salons, services, wineries, and more — all in one place, built for this community.

You now have access to **[merchant_count] local businesses** and **[active_deal_count] active deals** — everything free to browse.

**Explore Lompoc by category:**

> [DYNAMIC: 3 category links — food-drink, health-beauty, services — with business counts]

**Deals we think you'll love this week:**

> [DYNAMIC: top 3 deals by view_count — deal title, merchant name, discount %, link]

---

**How it works:**

1. Browse the directory at [lompoc-deals.vercel.app](https://lompoc-deals.vercel.app)
2. Find a business or deal you want
3. Tap **"Claim Deal"** — show your phone at the register
4. Support local. Keep your dollars in Lompoc.

No coupons, no codes, no printing.

---

Know a local Lompoc business that should be listed?  
**[Nominate them → contact link]**

Welcome to the community,  
— The Lompoc Deals Team

*You're receiving this because you signed up at lompoc-deals.vercel.app. [Unsubscribe]*

---

### Body (Spanish)

Hola [first_name],

Bienvenido/a a **Lompoc Deals** — el único lugar para encontrar descuentos exclusivos de los restaurantes, tiendas y servicios aquí en Lompoc.

Acabas de obtener acceso a **[active_deal_count] ofertas activas** en [merchant_count] negocios locales.

**Aquí hay algunas ofertas que creemos que te encantarán:**

> [DINÁMICO: top 3 ofertas por view_count — título, nombre del negocio, % descuento, enlace]

---

**Cómo funciona:**

1. Navega las ofertas en [lompoc-deals.vercel.app](https://lompoc-deals.vercel.app)
2. Encuentra una oferta que quieras
3. Toca **"Reclamar oferta"** — el negocio recibe una notificación
4. Preséntate y ahorra

Eso es todo. Sin cupones, sin códigos, sin imprimir nada.

---

¿Tienes un lugar local favorito que te gustaría ver en Lompoc Deals?  
**[Cuéntanos → enlace de contacto]**

Hasta pronto,  
— El equipo de Lompoc Deals

*Recibes esto porque te registraste en lompoc-deals.vercel.app. [Cancelar suscripción]*

---

## Email 2 — Day 3: Save Your Favorites

**Subject (EN):** 3 deals expiring soon near you  
**Subject (ES):** 3 ofertas por vencer cerca de ti

**Preview text (EN):** Don't miss these — grab them before they're gone.  
**Preview text (ES):** No te los pierdas — agárralos antes de que se acaben.

---

### Body (English)

Hi [first_name],

A quick heads-up from Lompoc Deals.

**These deals are expiring soon:**

> [DYNAMIC: 3 deals with nearest expiration date — deal title, merchant name, expires_at date, link]

---

**New this week:**

> [DYNAMIC: 3 most recently added deals — deal title, merchant name, discount %, link]

---

**Pro tip:** Tap the ⭐ on any deal to save it to your list. We'll remind you before it expires.

See the full deal board → [lompoc-deals.vercel.app](https://lompoc-deals.vercel.app)

— The Lompoc Deals Team

*[Unsubscribe]*

---

### Body (Spanish)

Hola [first_name],

Un aviso rápido de Lompoc Deals.

**Estas ofertas vencen pronto:**

> [DINÁMICO: 3 ofertas con fecha de vencimiento más próxima — título, negocio, fecha, enlace]

---

**Nuevo esta semana:**

> [DINÁMICO: 3 ofertas añadidas más recientemente — título, negocio, % descuento, enlace]

---

**Consejo:** Toca el ⭐ en cualquier oferta para guardarla en tu lista. Te avisaremos antes de que venza.

Ver todas las ofertas → [lompoc-deals.vercel.app](https://lompoc-deals.vercel.app)

— El equipo de Lompoc Deals

*[Cancelar suscripción]*

---

## Email 3 — Day 7: Weekly Digest Teaser + Engagement Hook

**Subject (EN):** Your Lompoc Deals weekly digest is here  
**Subject (ES):** Tu resumen semanal de Lompoc Deals está aquí

**Preview text (EN):** Top 5 deals this week — handpicked for Lompoc locals.  
**Preview text (ES):** Las 5 mejores ofertas esta semana — elegidas para los locales de Lompoc.

---

### Body (English)

Hi [first_name],

Here are the **top 5 deals in Lompoc this week**, ranked by what locals are claiming most:

> [DYNAMIC: top 5 deals by claim_count in last 7 days — rank, deal title, merchant name, discount %, link]

---

**Did you claim your first deal yet?**

If you haven't used Lompoc Deals yet, here's a 30-second walkthrough:
→ Browse → Pick a deal → Tap Claim → Show up and save. Done.

**[Claim your first deal →](https://lompoc-deals.vercel.app)**

---

*Every Tuesday we send this digest to Lompoc locals. You can [manage your preferences] or [unsubscribe] anytime.*

— The Lompoc Deals Team

---

### Body (Spanish)

Hola [first_name],

Aquí están las **5 mejores ofertas en Lompoc esta semana**, clasificadas por lo que más están reclamando los locales:

> [DINÁMICO: top 5 ofertas por claim_count en los últimos 7 días — puesto, título, negocio, % descuento, enlace]

---

**¿Ya reclamaste tu primera oferta?**

Si aún no has usado Lompoc Deals, aquí hay un tutorial de 30 segundos:
→ Navega → Elige una oferta → Toca Reclamar → Preséntate y ahorra. Listo.

**[Reclamar mi primera oferta →](https://lompoc-deals.vercel.app)**

---

*Cada martes enviamos este resumen a los locales de Lompoc. Puedes [gestionar tus preferencias] o [cancelar tu suscripción] en cualquier momento.*

— El equipo de Lompoc Deals

---

## A/B Test Queue

These subject lines should be A/B tested once volume allows (>200 sends/day):

| Email | Variant A (current) | Variant B | Hypothesis |
|-------|---------------------|-----------|------------|
| Email 1 | "You're in — here's your first deal 🎉" | "Welcome to Lompoc's best local deals" | Emoji vs. no emoji open rates |
| Email 2 | "3 deals expiring soon near you" | "Don't miss these Lompoc deals" | Urgency vs. FOMO framing |
| Email 3 | "Your Lompoc Deals weekly digest is here" | "Top 5 deals in Lompoc this week" | Personalized vs. content-forward |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Email 1 open rate | >50% |
| Email 2 open rate | >35% |
| Email 3 open rate | >40% |
| Click-through rate (any email) | >8% |
| First claim within 7 days | >15% of new signups |
| D30 retention lift | +20% vs. no email group |
