---
format: 1080x1920
duration: 26s
message: "Lompoc has a news page — real local headlines, written by neighbors, at lompoclocals.com/news"
arc: Hook → Headlines (proof) → Voice (value) → CTA
audience: Lompoc + Vandenberg Village residents on IG Reels / TikTok
mode: autonomous
---

## Frame 1 — Hook: Lompoc has a news page

- scene: Gold kicker chip already on frame 0; the headline builds word-by-word on the purple field
- duration: 4.5s
- transition_in: cut
- status: outline
- poster: 3s
- src: compositions/s1-hook.html

Blueprint: `kinetic-type-beats` (Product_Intro word-run variant, restrained).
Purple field + breathing radial glows + ghost serif "news" drift. Kicker chip
"NEW ON LOMPOC LOCALS" static at t=0 (cover rule — frame 0 reads as a poster).
"Lompoc has a news page." lands word-group by word-group with restrained spring
pops; gold underline draws under "news page."; serif subline fades up:
"real headlines, written by neighbors".

## Frame 2 — Headlines: the proof cycle

- scene: Pinned LOMPOC NEWS masthead + URL band while three verified headlines crossfade behind
- duration: 12.9s
- transition_in: cut
- status: outline
- poster: 6.5s
- src: compositions/s2-headlines.html

Blueprint: `fixed-anchor-cycle` (sub-shape B, whole-context morph via
theme-crossfade-morph). Anchors: gold "LOMPOC NEWS" chip top-left + bottom
purple band with lompoclocals.com/news — both pinned, zero movement. Three
full-scene phases crossfade (~0.35s) at 4.3s intervals:

1. Spencer's butcher-case photo + ink scrim — "Spencer's Fresh Market is open
   on North H." / serif: "family-run · deli counter · local produce" / credit
   "photo: Spencer's Fresh Market". Slow 1.0→1.06 breathe on the photo.
2. Launch-night photo (USSF, public domain) — "Every launch over the valley —
   with a viewing guide." / serif: "know when the sky lights up, before it does"
   / credit "photo: U.S. Space Force".
3. Brand card (no photo owned — accuracy rule): ink field, stadium-glow
   decorative cones — "Friday night lights are back." / serif: "Braves & Conqs
   kick off the 2026 season".

## Frame 3 — Voice: what the page is

- scene: Cream breather card; the promise line hands off to "written by neighbors."
- duration: 4s
- transition_in: cut
- status: outline
- poster: 3s
- src: compositions/s3-value.html

Blueprint: `titlecard-reveal` (Benefits variant — one restrained move).
Cream field, tri-color hairline top bar, green serif "lompoc news" label.
"what's opening · what's launching · what's next" fades in with a 95→100%
settle, then the single slide-up crossfade to "written by neighbors." with a
gold marker underline. Hold.

## Frame 4 — CTA: the address

- scene: White mark + Lompoc Locals lockup spring-settle; the /news URL holds to the end
- duration: 4.6s
- transition_in: cut
- status: outline
- poster: 3.5s
- src: compositions/s4-outro.html

Blueprint: `titlecard-reveal` (CTA card register) + `spring-pop-entrance` on
the mark. Purple field + glow bloom. Mark pops with restrained overshoot,
"Lompoc Locals" wordmark + serif "your town, on the record", then
"lompoclocals.com/news" in gold spring-settles and holds ~2.8s — the longest
beat of the film. Silence is the chosen audio identity (silent-feed-first;
platform audio gets added at post time).
