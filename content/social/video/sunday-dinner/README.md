# Sunday Dinner master

Andres, Nov 15 2026: "Post dinner Sunday in the member restaurants we have" → "Create a master".
A weekly ~25 s video: member restaurants open Sunday evening, one beat each, Holden VO + a brand-new bed.

## Rules
- Members only (paying or comped food members), open Sunday evening. Re-check hours live on Google
  (legacy Places Details API; the new Places API is blocked on our key) the same day. No alcohol spots/specials.
- Never the same picture twice in one video (build.py asserts it), and rotate away from photos past posts used
  (grep the out/ folders for the blob filename). Andres flagged the Eddie's burger 6a96629282 (used 3×).
- Opening shots tight, low zoom (most listing photos are ~800 px). Wide photos go in `fit` (blurred backing).
- Sound check every preview: volumedetect + whisper the preview file.

## Each week
1. `mkdir content/social/video/out/sunday-dinner-<mondd>/{public,raw}`; copy `fonts/` + `mark-white.png`,
   `hyperframes.json`, `package.json` from the last run. Render on the main disk (the media volume is nearly full).
2. Write `stops.json` (see the Nov 15 run): kicker, sub, credit, intro_line, outro_line, bed_prompt (new song every
   time), stops[name, addr, hrs, shots[2], fit[], plate, logo, logo_bg, ig, member, line].
3. `python3 build.py <out> take` → `vo` + `bed` (≈1.5 Higgsfield credits: ask first) →
   `~/.cache/whisper-venv/bin/python build.py <out> split` → `python3 build.py <out>` → `npx hyperframes@0.8.26 render`.
4. Preview to Andres with the caption; post on "post it" (IG Reel + Story w/ link sticker → /find/dinner, FB, TikTok).
