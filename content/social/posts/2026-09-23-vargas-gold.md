# Vargas Jewelers Trophies & Awards — 20% OFF all GOLD ESTATE JEWELRY (coupon commercial)

**Member:** Vargas Jewelers Trophies & Awards · business 566 · Growth (subscription 9, `active`, period through Sep 29) · Official Partner
**Deal:** deals row 175 (coupon) · runs Sep 14 → **ends Friday Sep 25** (`expires_at` 2026-09-26 00:00 UTC = Fri 5 PM PT) · viewed 273 times on the site at build (272 when briefed)
**Link:** `https://www.lompoclocals.com/deals/175` does NOT resolve (404; `/en/deals/175` bounces to it; the only deal route is `/deals/[id]/claim`) → every link goes to the business page `https://www.lompoclocals.com/biz/vargas-jewelers-trophies-awards` (200)
**Video:** `content/social/video/out/vargas-gold/masters/` — `vargas-gold-MASTER.mp4` (9:16), `-9x16`, `-4x5`, `-1x1`, `-16x9`, `-cover-9x16.jpg`, `-poster.jpg`
**Format:** `_kit/formats/deal_promo.py` (`deal-promo`) — first use. `data.mjs deal --id=175` + `curation.json`. Arthur (Qwen), new sonilo bed, one Seedance clip (cold open only).
**Runtime:** 29.92 s composition (30.00 s container) at every ratio · **Loudness:** −15.2 LUFS integrated, −2.6 dBTP on 9x16, 4x5, 1x1 and 16x9 (`masters/loudness.json`) · `hyperframes check` 0 errors on every ratio (the 16x9 render died once in a transient `Page.captureScreenshot` browser error at frame 210 and was re-run clean) · `framecheck.py`: no repeated shots (the five pairs it lists as *still* are photos under a slow push at 6–9 s, 16–18 s, 20–22 s and the end card at 27–29 s — not a clip restart)
**Status:** built and committed, NOT posted. Posts **today, Wed Sep 23, 6 PM PT** (TikTok 6:00, IG Reel 6:20, IG Story 6:35, FB 6:40). "3 days left" counts Wed–Thu–Fri; if it slips to Thursday the hook line and the opener card both need "2 DAYS LEFT" (rebuild with `--auto`, the count is computed).

## Instagram Reel

3 days left. 20% off gold estate jewelry at Vargas Jewelers. 💛

Gold chains, engagement rings, necklaces and bracelets from their Estate Collection — 20% off through Friday. Promotional financing and in-house payment options available.

A full-time jeweler in-house, engraving done on site, 4.7★ on Google. If you're looking for the best gift for the best woman in your life (or the best anyone), this is the week — and they'll help you find it.

272 people have already looked at this one on Lompoc Locals.

🎟️ Show this coupon in-store. Excludes repairs, engraving & trophies and special orders. One per customer.
📍 640 N H St, Old Town Lompoc · (805) 735-1626
🕕 Ends Friday

Coupon on their page: lompoclocals.com/biz/vargas-jewelers-trophies-awards (link in bio)

@vargas_jewelers_lompoc

#Lompoc #LompocLocals #OldTownLompoc #VargasJewelers #GoldJewelry #EstateJewelry #EngagementRing #ShopLocal #SantaBarbaraCounty #CentralCoast

## Facebook

3 days left: 20% off all gold estate jewelry at Vargas Jewelers Trophies & Awards, 640 N H St in Old Town Lompoc. 💛

Gold chains, engagement rings, necklaces and bracelets from their Estate Collection are 20% off through Friday. Promotional financing and in-house payment options available.

Why them: a full-time jeweler in-house handles repairs of all kinds, engraving is done on site, and they hold 4.7★ on Google — "This family run business is a gem in itself, in addition to the ones they sell!" (Google review). Walk in, tell them who it's for, and they'll help you find the best gift.

272 people have already looked at this coupon on Lompoc Locals.

🎟️ Show this coupon in-store. Excludes repairs, engraving & trophies and special orders. One per customer.
📍 640 N H St, Lompoc · (805) 735-1626 · open till 6 on weekdays
🕕 Ends Friday

The coupon, on their Lompoc Locals page:
https://www.lompoclocals.com/biz/vargas-jewelers-trophies-awards?utm_source=facebook&utm_medium=social&utm_campaign=vargas-gold-sep26

## TikTok

3 days left ⏳ 20% off gold estate jewelry at Vargas Jewelers, 640 N H St, Old Town Lompoc. Chains, engagement rings, necklaces, bracelets. In-house jeweler, engraving on site, 4.7★ on Google. Show this coupon in-store · excludes repairs, engraving & trophies and special orders · one per customer · ends Friday. #Lompoc #LompocLocals #GoldJewelry #EstateJewelry #ShopLocal #OldTownLompoc #CentralCoast

(Video only — no link. First comment: "Coupon on their page: lompoclocals.com/biz/vargas-jewelers-trophies-awards")

## Instagram Story

Slide 1: the 9:16 master, full-screen.
Text overlay (top third, over the cold open): "3 days left 💛 20% off gold · Vargas Jewelers"
Link sticker → `https://www.lompoclocals.com/biz/vargas-jewelers-trophies-awards?utm_source=instagram&utm_medium=story&utm_campaign=vargas-gold-sep26` with sticker text "Show this coupon"
Mention sticker: @vargas_jewelers_lompoc
Small text (bottom, above the safe zone): "Show this coupon in-store · excludes repairs, engraving & trophies and special orders · one per customer · ends Friday"
Post 10–15 min after the Reel.

## Scheduling

- Wed Sep 23: TikTok 6:00 PM, IG Reel 6:20 PM, IG Story 6:35 PM, FB 6:40 PM PT (best hours 6–8 PM).
- Buffer: `shareNow` false, `customScheduled`; assets via Blob. Cover = frame 0 (`vargas-gold-cover-9x16.jpg`), no thumbnail offset — frame 0 is the chain under "3 DAYS LEFT", checked in the centre-square crop.

## Voiceover script (Arthur, Qwen; one take per line; respelled for speech)

Instruction: "Warm confident retail commercial read, brisk and clear, no long pauses, a smile in the voice, natural". The first pass used an "unhurried" instruction and ran 37.5 s of speech; Arthur holds ~2.2 words/s either way, so the script was cut from 77 to 62 words. Earlier takes are in `takes/`.

| # | Spoken | On screen |
|---|---|---|
| 0 | Three days left: twenty percent off gold estate jewelry. | **3 DAYS LEFT** · 20% off gold estate jewelry (over the generated chain clip — no business name on the clip) |
| 1 | Vargas Jewelers: chains, engagement rings, necklaces and bracelets. | VARGAS JEWELERS · OLD TOWN LOMPOC · Gold chains · Engagement rings / Necklaces · Bracelets · From their Estate Collection · 20% off / Promotional financing & in-house payment options available |
| 2 | A full-time jeweler in-house. Engraving done on site. | IN THE SHOP · Full-time in-house jeweler / Engraving done on site · Repairs of all kinds · Citizen watches · Trophies & awards |
| 3 | Four point seven stars on Google. A gem in itself. | ON GOOGLE · **4.7 ★** on Google · "This family run business is a gem in itself, in addition to the ones they sell!" — Google review |
| 4 | The best gift, for the person who matters most. | THE GIFT · For the person / who matters most · Help from people who know what they're doing |
| 5 | Show this coupon in-store. Ends Friday. | COUPON · 20% OFF all GOLD ESTATE JEWELRY · Gold chains · engagement rings · necklaces & bracelets from the Estate Collection · Promotional financing & in-house payment options available · [Show this coupon in-store. Excludes repairs, engraving & trophies and Special Orders. One per customer.] · **Ends Friday** |
| 6 | Six forty North H Street, Old Town Lompoke. | logo card · (805) 735-1626 · 640 N H St · Old Town Lompoc · lompoclocals.com/biz/vargas-jewelers-trophies-awards (storefront photo dimmed behind) |

No caption band: every line's sense is printed on its own frame, so the kit dropped all seven captions as duplicates. Sound-off viewers read the frame. Respelling: Lompoc → "Lompoke" (kit). No local transcription tool exists on this Mac (no `asr/` venv, no whisper-cpp), so the takes were checked by measured span only; Arthur is the reference voice for the town's name.

## Fact table

| Claim in the video / captions | Exact source wording | Source |
|---|---|---|
| 20% OFF all GOLD ESTATE JEWELRY | `deals.title` = "20% OFF all GOLD ESTATE JEWELRY"; `discount_text` = "20% OFF ESTATE GOLD JEWELRY" | deals row 175, read at build (`data.mjs deal --id=175`) |
| Gold chains, engagement rings, necklaces, bracelets · Estate Collection · promotional financing & in-house payment options | "Gold Chain, Engagement Rings, Necklaces and Bracelets offered through our ESTATE Collection is 20% OFF! Promotional Financing and in-house payment options available." | deals row 175 `description` |
| Terms (printed verbatim on the coupon card and in every caption) | "Show this coupon in-store. Excludes repairs, engraving & trophies and Special Orders. One per customer." | deals row 175 `terms` |
| 3 days left · ends Friday | `expires_at` 2026-09-26T00:00Z = Fri Sep 25 5 PM PT; today Wed Sep 23 → Wed, Thu, Fri | deals row 175; `data.mjs deal` computes `endsWeekday`/`daysLeft` in America/Los_Angeles |
| 272 people have already looked at this one | `view_count` 272 at brief, 273 at build | deals row 175 |
| 640 N H St, Old Town Lompoc · (805) 735-1626 | `address` "640 N H St, Lompoc, CA 93436"; `phone`; "Old Town Lompoc" from their own about/description | businesses row 566 |
| open till 6 on weekdays (FB caption only) | hours_json Mon–Fri 09:30–18:00, Sat 09:30–17:00, Sun closed (`hours_source: owner`); matches the hours card on their door in photo 6 | businesses row 566 |
| Full-time in-house jeweler · repairs of all kinds · engraving done on site · Citizen watches · trophies & awards | "A full-time in-house jeweler handles repairs of all kinds, and engraving is done on site, including specialty engraving for novelties, trophies, awards, and plaques"; "Citizen Brand watches" | businesses row 566 `about` (`about_source: owner`) |
| 4.7 ★ on Google | rating 4.7, user_ratings_total 12 — count deliberately not shown | Google Places API, place_id `ChIJrWQ3T78e7IARYVw2tugOa5k`, pulled Sep 23 2026 (per brief) |
| "This family run business is a gem in itself, in addition to the ones they sell!" — Google review | 5★ review text, verbatim; "family run" is the customer's phrase, attributed, never asserted as ours | Google Places reviews, same pull |
| Growth member / Official Partner | subscriptions row 9: user 34 (owner of 566), tier `standard`, status `active` | `subscriptions` table |
| Since 1974 (visible on their logo and floor mat only) | printed on their own logo file and their mat; not spoken, not asserted in copy | their assets |

Not used: "best in Lompoc", "lowest prices", "multi-generational" (their description's phrase, not needed), the review count (12), BUYS GOLD for CASH (not this promotion), the "best woman" phrasing in the video (kept inclusive on screen; the owner's framing lives in the IG caption as "the best woman in your life (or the best anyone)").

## Media

### Their photos (businesses row 566 `photos_json` + cover, all on our blob; every one viewed)

| File | What it is | Used as |
|---|---|---|
| `photo-0` (368df82496, cover) | Shop floor from the door: white cases, their own "Vargas Jewelers · Since 1974" mat, sunlit H St windows | Beat 3 (review card) at 0.60 brightness, crop aimed 42% 50% on 9:16 |
| `photo-1` (c3f488b1ec) | Watch wall (Citizen), gold chains on black busts, trophy shelf — the "they do everything" frame | Beat 2 (in-house jeweler · engraving) |
| `photo-3` (5012de9a01) | Wide interior, ring trays in the front case | Beat 4 (the gift), pushed in on the trays |
| `photo-5` (6b8eda1400) | Close on a case with gold chains on black stands, pendants, rings — their strongest gold shot | Beat 1 (the offer), crop 58% 45% on 9:16 |
| `photo-6` (771d46e8a2, 1600×1600) | Storefront on H Street: "Vargas Jewelers" sign, "640" on the door, SALE signs, OPEN neon | End card background at 0.36 brightness |
| `logo` (`biz-photos/vargas-jewelers-trophies-awards/logo-abehHlNlqdINFvBjfNbK6LxjuVkd6p.jpg`) | Their wordmark, black on white, 800×708 — the blob mirror had landed, re-read from `logo_url` at build; the Shopify CDN copy was not used | End card, in a white card |

### Rejected
- `photo-2` (047781fdf5) — tall earring cabinet with the bench stools; no gold in frame, busiest composition of the seven.
- `photo-4` (a77ffa5c07) — long necklace case, bright and clean but duplicates what photo-5 says with less gold; dropped for length (six visual beats already).
- `takes/clip-0-rejected-morph.mp4` — first Seedance attempt: a coiled chain that re-arranged itself mid-shot (the loose end tucked in and the loop closed between 1.6 and 2.2 s). A chain moving on its own is not a product shot; rejected after a 5 fps contact sheet.
- Their Shopify CDN logo URL — replaced by the blob copy above.
- No customer faces in any of the seven photos; nothing had to be rejected for that.

### Generated (Higgsfield)

| File | What it is | Why it makes no claim |
|---|---|---|
| `public/clip-0.mp4` (= second attempt) | Seedance 1.5, 9:16, 4 s, 720p: a plain polished gold curb chain lying still across dark navy velvet, a light glint travelling along the links, slow push-in | Cold open only, under "3 DAYS LEFT · 20% off gold estate jewelry". No chip, no business name on the clip (the format refuses `open.chip` on a clip); the name lands on beat 1, their own photo. Checked at 4 fps and 5 fps: no text, no letters, no hallmarks, no logos, no hands. Never captioned as their piece. |
| `public/bed.wav` | sonilo_music, 30 s, brand-new: soft felt piano, string pad, light glockenspiel shimmer, slow build, warm resolve, no vocals, no drums | Owned, generated; never reused |
| `public/line-*.wav` | Arthur (Qwen) — final takes; v1/v2 takes and the unhurried first pass in `takes/` | — |

The coupon card and the end card are designed type on the house field; the end card sits on their storefront photo.

## Credits spent (Higgsfield ledger, verified via `transactions`)

| Item | Credits |
|---|---|
| Seedance 1.5 Pro × 2 (9:16, 4 s, 720p, no audio) — ledger bills 2.40 each (first one price-checked before the second) | 4.80 |
| Text to Music (sonilo), 30 s | 1.88 |
| Qwen Audio 3.0 TTS Flash, Arthur — 7 lines unhurried pass (0.24) + 7 lines brisk pass + retakes of lines 3, 6, 1, 3, 0 (0.02–0.05 each) | 0.60 |
| **Total** (balance 794.73 → 787.45, verified via `balance`) | **7.28** of the 8-credit cap |

## Known limitations
- The 16:9 master uses the same 720×1280 vertical clip for the cold open, so the wide frame is soft for the first 4.5 s (known kit limitation).
- The review beat is 4.5 s; the 16-word quote is legible but brisk — it is also in the FB caption in full.
- `view_count` will keep climbing; "272" in the captions is the number at brief time and is fine as a floor.
