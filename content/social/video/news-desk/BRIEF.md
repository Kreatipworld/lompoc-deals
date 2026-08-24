---
workflow: general-video
flow: automation
storyboard: no
message: "Lompoc has a news page — real local headlines, written by neighbors, at lompoclocals.com/news"
destination: instagram-reels + tiktok
aspect: 1080x1920
language: en
length: ~26s
angle: announcement
---

## Intent

Launch video for the Lompoc Locals news desk (/news, shipped this week). Editorial
motion-graphics — the animated sibling of the static news-kit cards in
`content/social/cards/cards-news-week.html`. Unnarrated (silent-feed-first, no
narration spend). Runs in the Sunday "Video" slot of the content week of Aug 24–30.
A 4:5 variant follows the approved 9:16 master.

## Assets

- public/spencers-meat-dept.jpg — Spencer's Fresh Market member photo (rotated in; the produce shot was already used on the static announce card, and the butcher-case/tri-tip shots crop into third-party product labels in 9:16). Headline beat 1 background. Credit "photo: Spencer's Fresh Market".
- public/launch-night.jpg — USSF Falcon 9 night-launch photo (public domain, from `content/social/assets/launch-night-vandenberg-b.jpg`; provenance in LAUNCH-PHOTO-CREDIT.md). Headline beat 2 background. Credit "photo: U.S. Space Force".

## Customizations

- Headlines are the four verified stories live on lompoclocals.com/news as of 2026-08-23: Spencer's open on North H · $114M Sentinel training campus groundbreaking · Friday Night Lights 2026 · rocket launches (kept evergreen — no date/time claim, per launch-alert rule).
- Football beat is a brand card (no photo owned for it — accuracy rule: illustration on abstract background only).
- Frame 0 must read as a designed poster (cover rule): kicker chip + masthead visible at t=0.

## Notes

- Brand truth: purple #650C75 / green #0B992F / gold #EFC618, cream #FAF5EC, ink #241629; Plus Jakarta Sans + Georgia italic serif; gold kicker chips; grain overlay; bottom-of-frame URL band — mirror the news-kit card DNA.
- Never use source-outlet photos; only member photos and platform-owned imagery, credited.
- End card holds lompoclocals.com/news.

## Customizations (added 2026-08-23 evening)

- Logo watermark: white mark top-right on s1/s2 (dark scenes), full-color logo.svg on s3 (cream); s4 unchanged (logo is the hero). DONE in compositions/ + compositions-4x5/ — needs re-render of both aspects.
- Voiceover: FINAL 2026-08-24 v3 — ElevenLabs Emily (user reversed to the livelier take after hearing both in place). BGM: "Deliberate Thought" (Kevin MacLeod, incompetech, CC BY 4.0 — CREDIT IN CAPTIONS) at volume 0.55 on track 11 with dynamic voiceover carve (strength 0.25, all 6 VO clips grouped "voiceover"). Closer rewritten to "Your town, your news." — "on the record" collided with the Lompoc Record newspaper — spoken AND on-screen in both s4-outro files. 3.6 credits billed total (0.9 elevenlabs read + 0.3 elevenlabs closer used; 2.0 seed_audio + 0.4 seed closer rejected), verified via transactions, zero drift. 6 per-scene WAVs in public/ at track 10 (s1 0.3, s2 4.7/9.0/13.3, s3 17.7, s4 21.45) in index.html + index-4x5.tmpl. Both aspects re-rendered with watermarks + VO and delivered.
- Higgsfield MCP note: Claude Code's MCP OAuth ALWAYS fails against Higgsfield (their Clerk callback sends iss=clerk.higgsfield.ai, violating RFC 9207 vs declared issuer). Working path: standalone OAuth client scripts (hf-oauth.py / hf-mcp.py pattern) — own DCR client, ignore iss, talk to https://mcp.higgsfield.ai/mcp directly.
