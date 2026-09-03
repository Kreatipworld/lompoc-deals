# Big Game Hype — Lompoc Braves at Cabrillo Conqs

**Status:** rendered + delivered for review (NOT posted). 2026-09-01 late night.

## Verified facts (MaxPreps JSON-LD + box score)
- Lompoc **at** Cabrillo — **Friday, Sept 4, 2026 · 7:00 PM**, Cabrillo High, 4350 Constellation Rd (non-conference, crosstown).
- Braves opener: **W 42–0** (our story id 115).
- Events row added: **#180** "Crosstown Football: Lompoc at Cabrillo" → live on /events.
- Watch-out: MaxPreps' location block wrongly carried 515 W College Ave (that's Lompoc High). Cabrillo = 4350 Constellation Rd — verified via school site + listings.

## Cut (16.8s, 4x5 + 9x16 — `biggame-braves-conqs-{4x5,9x16}.mp4`)
Broadcast style ("like Fox News" — user direction): red skew chyrons, gold bars, school logos, photos + storyline combined.

| Beat | Time | Visual | Dylan VO |
|---|---|---|---|
| Open | 0–3.6 | Huyck goalposts zoompan + FRIDAY NIGHT LIGHTS / ONE TOWN. TWO SCHOOLS. | "One town. Two high schools. One Friday night." |
| Braves | 3.6–6.4 | Braves card (logo badge, WON 42–0 chip) | "The Braves come in off a forty-two to nothing opener." |
| Conqs | 6.4–8.7 | Cabrillo field zoompan + Conqs lower-third | "The Conquistadores defend their home turf." |
| VS | 8.7–11.4 | Split VS card, both logos + date/venue strip | "Friday night, seven o'clock, at Cabrillo." |
| End | 11.4–16.8 | Purple end card + /events + CC credit | "This is Lompoc. Come out and back your side." |

## Assets
- Photos: news-covers Blob (huyck-stadium.jpg cropped to goalposts; cabrillo-high-field.jpg).
- Logos: MaxPreps school marks — Braves L-block (f1844167), Conqs seal (fe0bbe85); rounded badges.
- VO: Dylan (elevenlabs variant), job f6221d73 → `vo/en-dylan-biggame.wav` (12.96s), "Lompoke" respell.
- Music: Kevin MacLeod — "Pale Rider" (CC-BY, credited on end card + must credit in captions).
- Build: scratchpad biggame/assemble.sh (zoompan + xfade + alpha overlays via headless Chrome).

## Spend
- Dylan VO ~3.6cr. Kling clips (2×10cr) NOT generated — generate_video submits blocked by CLI permission classifier 4×; zoompan used instead. Request files staged: scratchpad `biggame/k-huyck-req.json`, `k-cab-req.json` (media_ids imported: huyck ce1659db, cabrillo e7e4437e).

## Distribution plan (pending user yes)
Replace the static "Braves 42-0" card scheduled Fri 9:00 AM with this video — all four surfaces + IG Story w/ link sticker to lompoclocals.com/events. Captions must carry the MacLeod CC-BY credit.

## MASTER cut (Sep 2, in progress) — same DNA as "This is Lompoc" v6
User: "i want to master that one" after watching the Sep 1 cut. Brief approved: satellite flyover (Mapbox, Huyck → Cabrillo, no credits) + both stadium photos + hero type + Dylan new read + Pale Rider. New HyperFrames project `content/social/video/biggame/`.
- Facts re-verified on MaxPreps Sep 2: Fri Sep 4 7:00 PM at Cabrillo; opener W 42–0 at Santa Ynez Aug 28.
- Dylan read job a50cb96d (0.9cr preflight = billed), 16.40s, "Huyck" respelled "Hike", ASR heard Hike/Lompoc clean. Placed as two clips (hold after "turf") → 21.5s cut.
- Old render's school marks cropped from frames (only copies). Credits on end card: MacLeod Pale Rider CC BY + Mapbox/OSM/Maxar.
- MASTER RENDERED Sep 2 late: `biggame/renders/biggame-master-{9x16,4x5}.mp4` (21.5s, -14.8 LUFS) → user's Downloads as `biggame-braves-at-conqs-MASTER-*.mp4`. Flyover = Mapbox `satellite-v9` (label-free; satellite-streets showed POI labels — never again for cinematic opens). Credits on end card: Pale Rider CC BY + "© Mapbox © OpenStreetMap © Maxar" — BOTH must be in every caption. NOT posted; awaiting user watch. Distribution plan unchanged: replace the Friday 9 AM static card, all 4 surfaces + IG Story → /events.
- Sep 2 late — user: "too AI", wants sportier/cleaner/California + real sports music, Super Bowl feel. New script (46 words): "Friday night. Lompoc, California. One town. Two high schools. The Braves, coming off a forty-two to nothing opener. The Conquistadores, defending home turf. Cabrillo High. Seven o'clock. This is Lompoc football. Pick your side. Be there."
- Voice audition via Qwen Audio TTS (directable, instruction ≤128 chars): Arthur + Cillian test lines 0.04cr each; Dylan elevenlabs control 0.3cr. Full reads Arthur (job 4f86dd03) + Cillian (job c3e165db) 0.11cr each, 20.4s. Generated bed: sonilo_music job 36d8a220, 24.0s, 1.38cr ("Epic NFL Super Bowl promo… stadium drums, brass stabs") — ours, no credit line needed. Pale Rider dropped. Recut to 24.0s with 7.0s dive + 2.3s transfer regenerated. Awaiting user voice pick.
- v2 RENDERED (Arthur placeholder, Sep 2 ~5:30 PM): `biggame/renders/biggame-v2-arthur-{9x16,4x5}.mp4`, 24.0s, -14.2 LUFS → Downloads `biggame-v2-ARTHUR-*.mp4`. Cillian = copy vo-cillian.wav over public/vo-biggame.wav + re-render (same timing). NOT posted.
- FINAL v3 (Sep 2 ~6 PM): Arthur v2 read (Cabrillo respelled "Cabreeyo", job 8e165b99, 0.11cr), bed 0.30 + carve 0.55 (user: "music too loud"), dive 7.5s. `biggame/renders/biggame-v3-{9x16,4x5}.mp4`, 24.0s, -16.0 LUFS → Downloads `biggame-braves-at-conqs-FINAL-*.mp4`. User: "I like it. Make it happen" → captions in biggame-captions.md, Buffer auth requested, awaiting caption OK + timing. NOT posted.
