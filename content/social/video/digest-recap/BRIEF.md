---
workflow: general-video
flow: automation
storyboard: no
message: "The Monday Digest, as a film — today's real stories with photos and descriptions, this week's events, digest CTA"
destination: instagram-reels + tiktok + facebook
aspect: 1080x1920
language: en
length: ~42s
angle: weekly-recap
---

## Intent

THE weekly template (decided 2026-08-24). Every Monday, alongside the email digest,
this project regenerates with that week's digest data: same stories, same order —
one editorial pass feeds both. Email links the video; outro carries the digest CTA.
First edition: 2026-08-24.

## Weekly regeneration playbook

1. Pull content exactly as `lib/digest.ts` does: `getDigestNews(4)` (blog_posts,
   local-news, published, 10-day window) + approved events next 7 days (dedupe
   repeating series into one row, e.g. daily gallery shows).
2. Swap beat data in `compositions/d2-stories.html` (4 phases: photo beats for
   stories with image_url, brand cards for the rest — accuracy rule: never fake
   photos) and rows in `compositions/d3-events.html`. Update the date in d1-open.
3. New Emily VO via [[higgsfield-mcp-workaround]]: text2speech_v2/elevenlabs,
   voice 6b3e3642-f7b7-4cb8-9688-51e233c4b92f. Preflight get_cost + explicit user
   yes (edition 1: 1.8cr). Launch mentions must hedge ("the window moves").
4. Slice per line on silence map, place track 10 (group "voiceover"); retime
   scene/phase durations to the read.
5. BGM: public/bgm-digest.mp3 ("Deliberate Thought", Kevin MacLeod CC BY —
   CREDIT IN CAPTIONS) track 11 vol 0.55; re-run carve.mjs after any VO change.
6. `npm run check` → render 9:16 → swap index-4x5.tmpl → render 4:5 → restore.
   4:5 copies = sed data-height 1920→1350 + compositions-4x5/ paths.

## Notes

- DNA inherited from ../news-desk (colors, type, kicker chips, grain, URL bands,
  watermark placement: white mark on dark scenes, full-color logo.svg on cream).
- Story photos: only platform-owned/US-gov imagery, credited on-frame.
- Edition 2026-08-24: launch alarm story (photo) · fire chief (brand card w/
  flame badge) · utility portal (brand card w/ browser motif) · spaceport (photo)
  · 4 events · outro. VO 1.8cr billed, verified.
