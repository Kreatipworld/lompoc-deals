# Partner tour — the video on /partners

A 24-second tour of the live site for business owners, replacing the July 2026
`partner-intro.mp4`, which showed a nav that no longer exists (Hotels /
Neighborhood / Businesses / Locals) and counts that had drifted
(473 businesses, 9 deals).

Everything on screen is a real screenshot of https://www.lompoclocals.com taken
on 21 Sep 2026 with Playwright at 1920x1080 @2x, so every number in frame is the
number the site was serving that day. Nothing is typed over the top.

| Beat | Page | The live number in frame |
|---|---|---|
| 1 | homepage hero | 14 active deals · 459 local businesses · 10 categories |
| 2 | search, "tacos" typed | Food & Drink 103 places; El Culichi carries the Member badge |
| 3 | /deals | 14 live deals from Lompoc businesses right now |
| 4 | /biz/hangar-7-social-house | Official Partner · 1 active deal |
| 5 | /map | the downtown pin cluster, member names on the pins |
| 6 | end card | — |

## Rules this build follows

- **Frame 0 is the poster.** Scene 1 opens already painted on the hero band at
  full zoom — no fade from black, no half-scrolled page. The same frame is
  exported to `public/videos/partner-intro-poster.jpg` and set as the video's
  `poster`, so the card on the cream page is a finished image before play.
- **Framing is a window, not a zoom.** `frame()` / `centered()` in `build.py`
  take the region of the page you want on screen in the page's own CSS pixels.
  That is why the map beat never shows the half-cut sidebar rows and why the
  Mapbox / OpenStreetMap credit stays in frame.
- **Nothing moves through a dissolve.** Every beat holds still for one crossfade
  at each end. Two moving layers dissolving smear the type into a double
  exposure. Held on both sides, beat 1 and beat 2 share an identical frame, so
  the search dropdown appearing reads as a match cut rather than a fade.
- **One take per line.** `gen-audio.py vo` submits each sentence separately
  (Arthur, Qwen preset 30fc8796…); `_kit/audio.py` measures each take and places
  it, and the scene boundaries are derived from where the sentences actually
  landed. Lompoc is respelled by `brand.for_tts`, never by hand.
- **A new bed every time.** `gen-audio.py bed` writes one, we never reuse one.

## Rebuild

```bash
python3 content/social/video/partner-tour/gen-audio.py vo      # 6 takes, ~0.2 credits
python3 content/social/video/partner-tour/gen-audio.py bed     # ~1.7 credits
python3 content/social/video/partner-tour/build.py
cd content/social/video/partner-tour && npx hyperframes@0.8.11 check && npx hyperframes@0.8.11 render
# then master to -15 LUFS (two-pass loudnorm) into public/videos/partner-intro.mp4
```

Re-shoot the stills whenever the counts move: the numbers in the file are a
claim about a particular day, and the page they sit on shows today's.
