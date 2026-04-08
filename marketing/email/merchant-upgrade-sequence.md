# Merchant Upgrade Email Sequence — Free → Standard / Premium
*Created: 2026-04-08 | Owner: CMO / Lifecycle & Email Marketer*
*Supports: M-018 (Free-to-Paid Upgrade Campaign)*
*Requires: REQ-002 (email infra) + B-001 (Stripe) before deployment*

---

## Overview

This sequence converts Free-tier merchants to Standard ($19.99/mo) or Premium ($39.99/mo).

**Triggers:**
- **Primary:** Merchant posts their 3rd deal (hits Free tier deal limit). Fire Email 1 immediately.
- **Secondary (day 7 after account creation):** Merchant has not posted 3 deals yet but is active. Fire Email A (nurture variant below).
- **Tertiary (day 30 inactive):** Merchant created account but never posted a deal. Fire Email B (win-back variant below).

**Sequence overview:**
| Email | Trigger | Subject | Goal |
|-------|---------|---------|------|
| 1 | Deal #3 posted (limit reached) | You've maxed out your free deals — here's your upgrade | Convert now, highest intent moment |
| 2 | +3 days after Email 1 (no upgrade) | Your deal slot is waiting | Re-engage with social proof |
| 3 | +7 days after Email 2 (no upgrade) | Last nudge: what you're leaving on the table | Final push with loss framing |
| A | Day 7 active, <3 deals | You're halfway there — free tip to get more views | Nurture / engagement warm-up |
| B | Day 30 no deals posted | Your Lompoc Deals profile is empty — 2-min fix | Win-back dormant merchants |

---

## Email 1 — Deal Limit Hit (Send Immediately at Deal #3)

**Subject (EN):** You've maxed out your free deals — here's what's next
**Subject (ES):** Llegaste al límite de tus publicaciones gratuitas — esto es lo que sigue

**Preview text (EN):** You posted 3 deals. Upgrade to keep the momentum going.
**Preview text (ES):** Publicaste 3 ofertas. Mejora tu plan para seguir creciendo.

---

**ENGLISH**

Hi [First Name],

You just posted your 3rd deal on Lompoc Deals — you've hit the free plan limit.

That means customers can see your business and your deals right now. But if you want to keep posting new offers, you'll need to upgrade.

**Here's what Standard ($19.99/month) gets you:**
- 15 active deals (vs. 3 on Free)
- View and click analytics — see exactly how many people are seeing your deals
- Social media links on your profile
- Hours, Google reviews widget, and more

**[Upgrade to Standard — $19.99/month →]**
*(Link: `lompoc-deals.vercel.app/dashboard/billing`)*

Not ready yet? Your 3 current deals stay live — you just can't post new ones until you upgrade.

Questions? Reply to this email and we'll help.

— The Lompoc Deals Team

---

**SPANISH**

Hola [Nombre],

Acaba de publicar su 3.ª oferta en Lompoc Deals — ha alcanzado el límite del plan gratuito.

Eso significa que los clientes pueden ver su negocio y sus ofertas ahora mismo. Pero para seguir publicando nuevas promociones, necesitará mejorar su plan.

**Esto es lo que incluye el plan Standard ($19.99/mes):**
- 15 ofertas activas (vs. 3 en el plan gratuito)
- Análisis de vistas y clics — vea exactamente cuántas personas ven sus ofertas
- Enlaces a redes sociales en su perfil
- Horarios, widget de reseñas de Google, y más

**[Mejorar al plan Standard — $19.99/mes →]**
*(Enlace: `lompoc-deals.vercel.app/dashboard/billing`)*

¿No está listo aún? Sus 3 ofertas actuales permanecen activas — solo que no podrá publicar nuevas hasta que mejore su plan.

¿Preguntas? Responda a este correo y lo ayudaremos.

— El equipo de Lompoc Deals

---

## Email 2 — 3-Day Follow-Up (No Upgrade)

**Subject (EN):** Your deal slot is still waiting, [First Name]
**Subject (ES):** Tu espacio de oferta sigue esperando, [Nombre]

**Preview text (EN):** Businesses with more deals get more views. Here's the data.
**Preview text (ES):** Los negocios con más ofertas obtienen más vistas. Aquí están los datos.

---

**ENGLISH**

Hi [First Name],

A few days ago you hit the free plan limit on Lompoc Deals. Your 3 deals are still live — but you can't post anything new.

A quick reminder of what you're missing:

**Businesses on Standard post an average of 8 deals/month.** More active deals = more chances for locals to discover you. Your competitors in [Business Category] may already be posting more often.

Standard is $19.99/month. That's less than a single Facebook boost — with zero ad spend risk.

**[Upgrade now →]**
*(Link: `lompoc-deals.vercel.app/dashboard/billing`)*

Still on the fence? Hit reply and tell us what's holding you back — we'll answer any question honestly.

— The Lompoc Deals Team

---

**SPANISH**

Hola [Nombre],

Hace unos días alcanzó el límite del plan gratuito en Lompoc Deals. Sus 3 ofertas aún están activas — pero no puede publicar nada nuevo.

Un recordatorio rápido de lo que se está perdiendo:

**Los negocios en Standard publican un promedio de 8 ofertas al mes.** Más ofertas activas = más oportunidades para que los residentes locales lo descubran. Sus competidores en [Categoría de Negocio] puede que ya estén publicando más seguido.

Standard cuesta $19.99/mes. Eso es menos que un único impulso de publicación en Facebook — sin riesgo de gasto en publicidad.

**[Mejorar ahora →]**
*(Enlace: `lompoc-deals.vercel.app/dashboard/billing`)*

¿Aún indeciso? Responda y cuéntenos qué lo detiene — responderemos cualquier pregunta con honestidad.

— El equipo de Lompoc Deals

---

## Email 3 — 7-Day Final Nudge (No Upgrade)

**Subject (EN):** Last thing: here's what staying on Free costs you
**Subject (ES):** Una última cosa: esto es lo que te cuesta quedarte en el plan gratuito

**Preview text (EN):** Not a sales pitch — just honest math.
**Preview text (ES):** No es un discurso de ventas — solo matemáticas honestas.

---

**ENGLISH**

Hi [First Name],

Last email about upgrading — I promise.

Here's the honest math on staying Free vs. upgrading:

**Free plan:**
- 3 deals, forever
- No analytics (you don't know if anyone is seeing your offers)
- Your profile sits below Standard and Premium merchants in search results

**Standard ($19.99/month):**
- 15 deals
- Analytics dashboard (know what's working)
- Priority over Free listings
- Break-even: get 1 new customer worth $20 and it pays for itself

Most merchants recover the $19.99 in their first week.

**[Upgrade to Standard →]**

Or if you want to go Premium ($39.99/month): unlimited deals, featured homepage placement, and the real estate module. Best for businesses that want to dominate local search.

Either way — staying Free is fine. We just want you to know what you're leaving behind.

— Lompoc Deals Team

P.S. If you've decided Lompoc Deals isn't a fit, let us know. We'd rather hear why than lose you quietly.

---

**SPANISH**

Hola [Nombre],

Último correo sobre la mejora de plan — lo prometo.

Aquí están los números honestos sobre quedarse en el plan gratuito vs. mejorar:

**Plan gratuito:**
- 3 ofertas, para siempre
- Sin análisis (no sabe si alguien está viendo sus ofertas)
- Su perfil aparece por debajo de los comerciantes de Standard y Premium en los resultados de búsqueda

**Standard ($19.99/mes):**
- 15 ofertas
- Panel de análisis (sepa qué está funcionando)
- Prioridad sobre las listas gratuitas
- Punto de equilibrio: consiga 1 nuevo cliente que valga $20 y se paga solo

La mayoría de los comerciantes recuperan los $19.99 en su primera semana.

**[Mejorar al plan Standard →]**

O si quiere Premium ($39.99/mes): ofertas ilimitadas, destacado en la página principal y el módulo de bienes raíces. Ideal para negocios que quieren dominar la búsqueda local.

En cualquier caso — el plan gratuito está bien. Solo queremos que sepa lo que deja atrás.

— El equipo de Lompoc Deals

P.D. Si ha decidido que Lompoc Deals no es para usted, háganos saber. Preferimos escuchar el motivo que perderlo en silencio.

---

## Email A — Day-7 Nurture (Active, <3 Deals)

**Subject (EN):** 1 tip to get more eyes on your Lompoc Deals listing
**Subject (ES):** 1 consejo para conseguir más vistas en tu perfil de Lompoc Deals

**Preview text (EN):** The businesses getting the most views do this one thing.
**Preview text (ES):** Los negocios con más vistas hacen esto.

---

**ENGLISH**

Hi [First Name],

You've been on Lompoc Deals for a week — nice to have you.

One tip that gets listings more views: **post a deal with a clear expiry date.**

Deals with "Expires [date]" in the title get clicked 2–3x more often because they create urgency. Instead of "10% off all services," try "10% off all services — valid through April 30."

That's it. One small change.

You're currently on the Free plan (up to 3 deals). If you want to post more or see how many people are viewing your deals, Standard is $19.99/month.

**[Log in and update your deal →]**
*(Link: `lompoc-deals.vercel.app/dashboard`)*

— The Lompoc Deals Team

---

**SPANISH**

Hola [Nombre],

Lleva una semana en Lompoc Deals — bienvenido.

Un consejo para obtener más vistas en su anuncio: **publique una oferta con una fecha de vencimiento clara.**

Las ofertas con "Vence el [fecha]" en el título reciben 2–3 veces más clics porque generan urgencia. En lugar de "10% de descuento en todos los servicios", pruebe "10% de descuento en todos los servicios — válido hasta el 30 de abril."

Eso es todo. Un pequeño cambio.

Actualmente está en el plan gratuito (hasta 3 ofertas). Si desea publicar más o ver cuántas personas ven sus ofertas, Standard cuesta $19.99/mes.

**[Iniciar sesión y actualizar su oferta →]**
*(Enlace: `lompoc-deals.vercel.app/dashboard`)*

— El equipo de Lompoc Deals

---

## Email B — Day-30 Win-Back (No Deals Posted)

**Subject (EN):** Your Lompoc Deals profile is empty — 2-minute fix
**Subject (ES):** Tu perfil en Lompoc Deals está vacío — solución de 2 minutos

**Preview text (EN):** Your business is listed but no deals are showing. Here's how to fix that fast.
**Preview text (ES):** Tu negocio está listado pero no hay ofertas. Así se arregla rápido.

---

**ENGLISH**

Hi [First Name],

You signed up for Lompoc Deals a month ago but haven't posted any deals yet.

That means locals searching for businesses like yours will see your profile — but nothing to click on.

The fastest way to fix it: **post one deal right now.** It takes 2 minutes.

Ideas if you're stuck:
- "10% off your first visit" (great for salons, gyms, restaurants)
- "Free dessert with any entrée" (restaurants)
- "Free estimate this month" (contractors, auto repair)
- "Buy 1 get 1" (retail, cafés)

Your 3 free deal slots are waiting.

**[Post your first deal →]**
*(Link: `lompoc-deals.vercel.app/dashboard/deals/new`)*

If you're not sure Lompoc Deals is right for your business, reply and let us know — we'll give you an honest answer.

— The Lompoc Deals Team

---

**SPANISH**

Hola [Nombre],

Se registró en Lompoc Deals hace un mes pero aún no ha publicado ninguna oferta.

Eso significa que los residentes locales que busquen negocios como el suyo verán su perfil — pero no habrá nada en qué hacer clic.

La forma más rápida de arreglarlo: **publique una oferta ahora mismo.** Toma 2 minutos.

Ideas si no sabe por dónde empezar:
- "10% de descuento en su primera visita" (ideal para salones, gimnasios, restaurantes)
- "Postre gratis con cualquier plato principal" (restaurantes)
- "Presupuesto gratuito este mes" (contratistas, reparación de autos)
- "Lleva 1 y paga 1" (comercio minorista, cafés)

Sus 3 espacios de oferta gratuitos están esperando.

**[Publicar su primera oferta →]**
*(Enlace: `lompoc-deals.vercel.app/dashboard/deals/new`)*

Si no está seguro de que Lompoc Deals sea adecuado para su negocio, responda y cuéntenos — le daremos una respuesta honesta.

— El equipo de Lompoc Deals

---

## CTO Implementation Notes

**Events to trigger:**
- `merchant.deal_posted` (count = 3) → fire Email 1 immediately
- `merchant.created` + 7 days active (1+ deal, <3 deals) → fire Email A
- `merchant.created` + 30 days (0 deals posted) → fire Email B
- Email 1 not converted + 3 days → fire Email 2
- Email 2 not converted + 7 days → fire Email 3

**Suppress if:** merchant upgrades at any point in the sequence.

**Requires:** REQ-002 (email sequence infra) + B-001 (Stripe activation). Both needed before this sequence goes live.

**CTA links:**
- Upgrade CTA → `lompoc-deals.vercel.app/dashboard/billing`
- Post deal CTA → `lompoc-deals.vercel.app/dashboard/deals/new`
- Dashboard → `lompoc-deals.vercel.app/dashboard`

---

## Metrics to Track

| Metric | Target |
|--------|--------|
| Email 1 open rate | >50% (high intent) |
| Email 1 → upgrade conversion | >15% |
| Full sequence (3-email) conversion | >25% |
| Email A click-through (dashboard) | >20% |
| Email B → first deal posted | >10% |
| Upgrade revenue per merchant (avg) | $19.99–$39.99/mo |
