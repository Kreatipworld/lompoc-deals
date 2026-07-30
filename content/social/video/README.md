# Signup videos — locals & businesses

Two vertical videos that drive account creation, built from real footage of the live site.

| File | Length | For | CTA |
|---|---|---|---|
| `lompoc-locals-signup.mp4` | 19.4s | Residents | Create a free account |
| `lompoc-locals-claim.mp4` | 23.2s | Business owners | Claim your page |

**Specs:** 1080×1920 (9:16) · 30fps · H.264 + AAC · ready for TikTok, Reels, Shorts, FB.
Captions are burned in and sit clear of the platform UI, so they read with sound off.

**There's no music.** Voice only. Add a track in CapCut if you want one — keep it under the
narration, around -18dB. (Higgsfield's music model is restricted to their game pipeline, so
it can't be generated here.)

---

## What's in them

Both follow the same shape: **generated B-roll + title → the real product, framed in a phone →
end card.**

**Locals** — flower-field aerial → home → deals feed → a business page with a live deal →
things to do → signup → "Free account. Two fields."

**Businesses** — Old Town street tracking shot → Angela's Restaurant page (a genuinely
unclaimed listing) → its Claim button → signup → partners page → "Search your business name."

The business video uses a real unclaimed listing on purpose: no partner badge, no live deal,
so nothing on screen implies a relationship that doesn't exist.

### Narration (Emily, en-US)

> **Locals:** "Hey Lompoc. We made you something. Every local spot, every deal, every launch
> over the base, all in one place. It's free, and it's yours. Come find your town.
> Lompoc Locals. Made by locals, for locals."

> **Businesses:** "If you run a business here in Lompoc, we already built you a page. Your
> photos, your hours, your map. It's live right now, waiting for you. Come claim it. It's
> free, and we'd love to have you with us."

---

## Post copy

**Locals** — pair with `lompoc-locals-signup.mp4`

> Your town has a website now 💜
>
> Every local business, every deal, every Vandenberg launch — one place, free, English y en
> español. No app to download.
>
> Make an account in two fields and you can save your spots and claim coupons 👉 link in bio
>
> #Lompoc #LompocCA #ShopLocalLompoc #LompocEats #CentralCoast #VandenbergSFB #805 #SomosLompoc

> Tu pueblo ya tiene su propio sitio 💜 Cada negocio local, cada oferta, cada lanzamiento de
> Vandenberg — en un solo lugar, gratis, en inglés y español. Sin app. Crea tu cuenta en dos
> campos y guarda tus lugares favoritos 👉 link en bio

**Businesses** — pair with `lompoc-locals-claim.mp4`

> Lompoc business owners: your page already exists 🤝
>
> We built pages for 475 local businesses — photos, hours, map, all of it. Claiming yours is
> free and takes about two minutes.
>
> Search your business name at lompoclocals.com → "Claim this business."
> Not listed? Comment your name and we'll build it.
>
> #ShopLocalLompoc #LompocBusiness #SmallBusinessLompoc #Lompoc #LompocCA #805

Post the business one into the local Facebook groups too — check each group's promo rules,
and lead with "free," not with a pitch.

---

## Rebuilding them

Three steps, three scripts. Only step 2 and 3 are needed if the site hasn't changed.

**1. Capture the screens** (mobile width, tall viewport so the whole page is in one image):

```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --virtual-time-budget=15000 --window-size=540,2600 \
  --screenshot=frames/home.png "https://www.lompoclocals.com/en"
```

Needed: `home`, `deals`, `bizdeal`, `activities`, `signup`, `bizclaim`, `partners`.
End cards come from `content/social/cards/cards-video.html`, title plates from
`cards-video-titles.html` (render those with `--default-background-color=00000000` to keep
the alpha), both via `scripts/render-social-cards.mjs`.

**2. Paint the body:**

```bash
node scripts/render-signup-video.mjs <framesDir> <bodyOutDir>
```

Timelines live at the top of that script — scene, duration, pan start/end, caption.
Retime the scenes whenever the narration length changes.

**3. Cut it together:**

```bash
node scripts/assemble-signup-video.mjs <assetsDir> <bodyDir> content/social/video
```

`assetsDir` needs `intro-*.mp4`, `title-*.png`, `vo-*.wav`.

### Two things that will bite you

- **MediaRecorder doesn't work in headless Chrome.** Canvas painting and timers are fine, but
  `captureStream` + MediaRecorder returns empty video. That's why the renderer emits JPEG
  frames and hands them to ffmpeg instead of recording directly.
- **`requestAnimationFrame` never fires in headless.** The renderer steps by frame index, not
  wall clock, which also guarantees no dropped frames.

`ffmpeg` comes from the `ffmpeg-static` devDependency — no system install needed.

---

## Generated assets

Intro clips and narration were generated on Higgsfield (**19.4 credits total**):

| Asset | Model | Credits |
|---|---|---|
| 2 × 5s intro B-roll, 9:16 | `kling3_0_turbo` | 15.0 |
| 4 × narration (2 takes) | `seed_audio`, voice Emily | 4.4 |

The first take used the Marcus voice and a declarative script; it was replaced with the
warmer invitation copy above. Prompts for the B-roll deliberately avoid readable signage,
logos, and faces — the footage is atmosphere, and everything factual on screen is the real
product.
