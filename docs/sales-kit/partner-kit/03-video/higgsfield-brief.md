# Higgsfield Generation Brief — Partner Intro Video

Ready to run once the Higgsfield MCP + skills are loaded (auth + restart Claude Code).
Use `higgsfield-soul-id` to lock the presenter, then `higgsfield-generate` (Marketing Studio)
for the video. Two aspect ratios: **9:16** (social/Reels/TikTok) and **16:9** (site).

---

## 1. The presenter (Soul ID)

A friendly local host who feels like a real Lompoc neighbor — warm and trustworthy,
not corporate. Reflects the community.

- **Who:** woman, ~late 20s–30s, mixed white / Latina heritage, warm and approachable.
- **Expression:** genuine, friendly smile; relaxed, confident, welcoming — talking to a neighbor, not selling.
- **Wardrobe:** casual-professional — a solid top in a warm neutral or soft purple that sits well next to the brand purple (#650C75) without clashing. No busy patterns.
- **Setting:** bright, natural, local feel — a sunlit café / main-street / warm interior backdrop, softly blurred. Daytime, inviting.
- **Framing:** head-and-shoulders, centered, eye contact with camera. Leave headroom for on-screen text and the logo.
- **Tone of delivery:** warm, upbeat, unhurried. Genuine, not hype.

> Casting note: Lompoc's audience is a mix of white and Latino residents. Lead English
> presenter as above; also generate a **Spanish-narration** cut with the same presenter so
> the video speaks to everyone (scripts below).

---

## 2. Narration script — English (~60s)

> "Lompoc has one place where the whole town connects — deals, businesses, events, all in one hub. But it's bigger than a coupon.
>
> When we discover and choose local, the dollars stay right here in Lompoc — and our whole town gets stronger. That's our mission: awareness for your business, and a thriving local economy for everyone.
>
> Every month, thousands of neighbors browse Lompoc Locals to find what's near them. Put your business in front of them — not lost to out-of-town chains and big national apps.
>
> Run real coupons that actually work: every customer gets their own code, you redeem it at your counter in seconds, and you see exactly who walked in.
>
> Getting listed is free. Growth is just thirty-nine ninety-nine a month.
>
> Partner with us, and you help build a stronger Lompoc. Join us at lompoclocals dot com slash partners."

### English — 15s social cut
> "Lompoc's whole town, in one place. Get your business found by locals, run coupons that actually work, and keep our economy local. Getting listed is free — join at lompoclocals.com/partners."

---

## 3. Narration script — Spanish (~60s)

> "Lompoc tiene un solo lugar donde todo el pueblo se conecta — ofertas, negocios y eventos, todo en un mismo lugar. Pero es más que un cupón.
>
> Cuando descubrimos y elegimos lo local, el dinero se queda aquí en Lompoc — y todo nuestro pueblo se fortalece. Esa es nuestra misión: dar a conocer tu negocio y construir una economía local próspera para todos.
>
> Cada mes, miles de vecinos usan Lompoc Locals para encontrar lo que tienen cerca. Pon tu negocio frente a ellos — no perdido entre cadenas de otras ciudades y apps nacionales.
>
> Ofrece cupones de verdad: cada cliente recibe su propio código, lo canjeas en tu caja en segundos, y ves exactamente quién llegó.
>
> Aparecer es gratis. Growth cuesta solo treinta y nueve noventa y nueve al mes.
>
> Sé nuestro socio y ayuda a construir un Lompoc más fuerte. Únete en lompoclocals punto com barra partners."

### Spanish — 15s social cut
> "Todo Lompoc, en un solo lugar. Que los locales te encuentren, ofrece cupones de verdad y mantén nuestra economía local. Aparecer es gratis — únete en lompoclocals.com/partners."

---

## 4. Scene / B-roll direction (Marketing Studio)

Intercut the presenter with brand visuals. Assets live in `docs/sales-kit/partner-kit/`
(logo) and the real partner photos already used in the motion intro.

| Time | Presenter says | On-screen / B-roll | Text overlay |
|---|---|---|---|
| 0–5s | "one place… bigger than a coupon" | Logo animate-in on brand purple | **Bigger than a coupon** |
| 5–15s | mission / dollars stay local | Warm Lompoc street / neighbors | Awareness · Local economy · Community |
| 15–24s | thousands browse each month | Partner photo montage (El Culichi, Jasper's, One Plant, Eddie's) | **2,400+ locals/mo · 473 businesses** |
| 24–38s | coupons that work | Code chip `7K2F9P` → "redeem" → count | 1 code · 1 use · real count |
| 38–46s | free / $39.99 | Clean pricing card | **Growth $39.99/mo · Listing free** |
| 46–60s | partner with us / CTA | Logo + URL, presenter smiling | **lompoclocals.com/partners** |

---

## 5. Technical settings

- **Aspect ratios:** 9:16 (primary, social) and 16:9 (site hero). Generate both.
- **Duration:** ~60s main; ~15s short cut.
- **Brand:** purple `#650C75`, gold `#EFC618`, green `#0B992F`. Georgia-style serif for headlines, clean sans for body. Logo: `public/brand/lompoc-locals-logo.svg`.
- **Captions:** burn-in subtitles (social autoplay is muted) — English on the EN cut, Spanish on the ES cut.
- **Music:** warm, upbeat, local/acoustic; low under the voice.
- **Virality Predictor:** score the 9:16 cut; iterate the hook (first 3s) if it scores low.

---

## 6. Run order (once tools load)

1. `higgsfield-soul-id` — create the presenter from the persona above; save the Soul ID.
2. `higgsfield-generate` (Marketing Studio) — EN 9:16, feeding the Soul ID + script + brand + B-roll. Score with Virality Predictor.
3. Repeat for EN 16:9, ES 9:16, and the 15s cuts.
4. Export MP4s; drop the 16:9 on `/partners` as a hero if desired.
