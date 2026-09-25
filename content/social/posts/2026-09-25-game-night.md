# GAME NIGHT — Fri Sep 25 2026 (both on the road)

Format: kit `game-night-card` (`_kit/formats/game_night_card.py`) fed by `data.mjs friday-games` — the weekly Friday spot
(owner: "Fridays are always game night until the season finishes"). No captions (owner's call), bed at 0.20, −17 LUFS.
Voice: **Dylan** (ElevenLabs text2speech_v2) — the owner asked for voices other than Arthur that keep the LOM-poke read;
six auditions sent, Dylan and Holden cut as samples, Dylan posted. Background: generated stadium-lights shot (clip-1; the first
take was a soccer pitch and was rejected), objects only; the later scenes sit on its last frame with a slow push.

Project: `content/social/video/out/game-night-card-sep25/` · master `masters/game-night-sep25-9x16.mp4` (28.6 s) ·
Blob `social/posts/2026-09-25-game-night/game-night-9x16-83jL17bWAiRJJGqaodMTHxwNYpDRyy.mp4` + `cover-6zV6…jpg` (thumbnailOffset 2300).

**Posted Fri Sep 25 2026, 11:59 AM PT — owner: "Post it right now".**

| Surface | Buffer id | Live (all `sent` by 12:01 PM PT) |
|---|---|---|
| TikTok | 6ab6c46d115c32477f3bba4a | https://tiktok.com/@lompoclocals/video/7689549302309408013 |
| Instagram Reel | 6ab6c479637945f3f28dc281 | https://www.instagram.com/reel/DduKLkpFqk-/ |
| Instagram Story (link → /football) | 6ab6c4847c984ccc7fa2f154 | https://www.instagram.com/stories/lompoclocals_/3994174945009728602 |
| Facebook Reel | 6ab6c49090e8c5cefac57f00 | https://www.facebook.com/reel/1557482445705388/ |

## Facts (football_games, pulled Sep 25)
Lompoc Braves 4-0 (Santa Ynez W 42-0, Cabrillo W 38-2, Pioneer Valley W 48-6, Dublin W 41-7) at Morro Bay, 7:00 PM ·
Cabrillo Conquistadores 1-4 (Burbank L 0-38, Hoover W 36-21, Lompoc L 2-38, Nipomo L 14-49, Righetti L 14-42) at Paso Robles, 7:30 PM.

## Credits today (game night only)
Lights shots × 2 (one rejected) 4.80 · bed 1.4 · auditions 6 lines ≈ 0.7 · Dylan 5 + Holden 4 lines ≈ 1.4 · Arthur 5 (unused) 0.1 → ≈ 8.4.

## Notes for next Friday
- Run: `python3 _kit/make.py game-night-card --auto --out out/game-night-card-<date>` → new bed → lines in the chosen voice
  (Dylan unless the owner changes it) → `finalize.py <project> 0.30` → `masters.py` → owner watches → post ~5 PM.
- The IG caption carried a stray "#Lompoc Football" (space) — fix the hashtag list in the template next week.
- The lights clip (clip-1) is reusable as the standing background if the owner wants continuity; a fresh one is 2.4 cr.
