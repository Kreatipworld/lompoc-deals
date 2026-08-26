---
workflow: general-video
flow: companion
storyboard: yes
message: "This is Lompoc — the real one. Every place here has a page on Lompoc Locals. Tag a Lompoc business that belongs here."
destination: meta-ads + tiktok-ads + organic (instagram-reels, tiktok, facebook-reels, ig-story)
aspect: 1080x1920 (master) + 1080x1350
language: en (es cut only after the en cut earns it)
length: ~30s
angle: master-ad / partner-recruitment / tag-loop
status: brief approved 2026-08-26 — script pending sign-off, nothing rendered
---

## Why this exists

The platform's core value, in the user's words (2026-08-26): more partners → more of Lompoc's
voice out there → new places get showcased. This is the one master ad that sells THAT — not
features. It has to feel like Lompoc first (so locals share it), then hit owners, and it ends on a
mechanic, not a slogan: **tag a Lompoc business**. Every tag is a lead we answer in the thread.

Tone: direct, enthusiastic, proud. Lompoc as it really is — not "the town off the 1 with the
base and the prison." No sarcasm about the stereotype; we name it in four seconds and move on.

## The argument, in order

1. **Hook (0–4s)** — the stereotype, flipped. Three hard cuts, each stamped `Lompoc.` in the
   series type (the triple-Lompoc beat the user asked for). VO: "Say Lompoc and people picture
   the highway. The fog. The base." → cut to a real storefront → "We picture this."
2. **Pride montage (4–14s)** — six or seven real places, each named on frame with a kicker chip
   and a photo credit. One VO line per place, no adjectives the row can't back.
3. **Owner turn (14–24s)** — a member page coming alive, product-commercial grammar inherited
   from `scripts/render-feature-ad-wow.mjs` (push transitions, masked type, one idea per beat):
   photos land → hours + map pin → a deal card goes live → Monday digest → Member Spotlight
   reel. Real UI: 2× screenshots of the live site, never mocks.
4. **The catch (24–30s)** — "Tag a Lompoc business that belongs here. We'll build their page and
   show them off." End card: `TAG A LOMPOC BUSINESS 👇` · lompoclocals.com · mark.

## Hard rules

- **No numbers on screen or in the read.** They age the day they render (features-wow lesson).
- **Every place named is a real approved member with its own photos**, credited on frame
  ("photo: Eye on I"). Cross-ownership check before render (memory: verify-photo-attribution).
  Launch imagery: U.S. Space Force public domain (content/social/assets/LAUNCH-PHOTO-CREDIT.md).
- **Every claim traceable**: free page, photos, hours, map, EN/ES, deals, digest, spotlight —
  all live product surfaces today. "Free" refers to the page; deals/digest/spotlight are Growth.
  The read must not imply the paid features are free.
- Nothing posts until the user has watched the final file.
- Higgsfield spend (VO) is preflighted and approved per generation.

## Cast (verify photos + attribution before compose)

| Beat | Place | Slug | Photo source (DB `about_source`) | Line |
|---|---|---|---|---|
| hook cut 1 | Lompoc Valley Florist | lompoc-valley-florist | website | storefront / counter |
| hook cut 2 | Eye on I | eye-on-i | owner | oven / pie |
| hook cut 3 | Hangar 7 Social House | hanger-7-social-house | website | patio |
| pride 1 | Lompoc Valley Florist | lompoc-valley-florist | website | "Flowers on H Street." |
| pride 2 | Eye on I | eye-on-i | owner | "Pizza on I Street." |
| pride 3 | Flying Goat Cellars | flying-goat-cellars | website | "Pinot in the Wine Ghetto." |
| pride 4 | Downtown murals (own flyover/mural footage from Aug 16–17 posts) | — | own render | "Murals on Ocean." |
| pride 5 | Mission La Purísima | mission-la-purisima | google — swap for own photo or state park PD image | "A mission that came back." |
| pride 6 | Spencer's Fresh Markets | spencers-fresh-market-lompoc | website | "A new grocery store on H." |
| pride 7 | Falcon 9 over the base | — | U.S. Space Force PD | "And a rocket over all of it." |
| owner turn | Lompoc Valley Florist page (live UI) | /en/biz/lompoc-valley-florist | screenshots | — |

Pride 5 is the one soft spot: its photos are Google-sourced. Use only if we have an owned or
public-domain image; otherwise drop to six places. Six is enough.

## VO

Script: `SCRIPT.md` (Emily, ElevenLabs via scripts/higgsfield-mcp, ~0.9–1.1cr). Measured rate
for Emily is ~2.3 w/s (38 words = 16.7s; 42 words = 17.4s). Target ≤ 68 words for 30s with air.
Slice on the silence map, place on track 10; BGM track 11 at 0.55 with the carve.

## The tag loop (what makes it a master ad, not a spot)

Every comment that tags a business is a lead:
1. Check the business (Lompoc/Vandenberg only, per scope memory).
2. Claim/build the page if it isn't live; enrich per the enrich-business skill.
3. Reply in the thread with the live page link within 24h — never leave a tag unanswered.
4. Best ones get a Member Spotlight (member-spotlight-format memory) that credits the tagger.
Captions on every platform end with "Tag a Lompoc business that belongs here 👇".

## Build order

script sign-off → asset pull + attribution check → 2× UI screenshots → VO (preflight, approve)
→ compose (news-desk DNA: purple #650C75 / green #0B992F / gold #EFC618, grain, kicker chips,
full-colour logo on cream, white mark on dark) → `npm run check` → render 9:16 → 4:5 via the
index-4x5.tmpl swap → user watches → post everywhere with the tag CTA → answer every tag.
