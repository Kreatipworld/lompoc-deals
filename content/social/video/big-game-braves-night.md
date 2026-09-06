# THE BRAVE'S NIGHT — Big Game saga, victory story (same two characters)

**Status:** RENDERED Sep 5 2026 (31.5s, -14.2 LUFS both formats), awaiting user watch. NOT posted. Balance after: 1165.83. User: "Something different, but same concept. Brave winning." → a cinematic story where the win happens on screen: the Brave takes the night, the Conquistador honored as the challenger.

**Fact:** Lompoc 38, Cabrillo 2 (Noozhawk Week 2 roundup, Sep 4 2026).

**Cut:** ≈31.5s, 9:16 + 4:5, subtitled. Open (faceoff key, "THE BRAVE'S NIGHT") → Friday night (land-lompoc) → THE CHALLENGER (land-cabrillo → b2-descend, Cabrillo card) → LOMPOC BRAVES (b1-fields) → the clash (b3-clash from 1.9s: charge, shields collide, sparks, white flash + shield-hit) → "the Brave stood" (b4-victory) → staff raise with LOMPOC 38 / CABRILLO 2 broadcast type + crowd roar → end card (both crests equal, Braves crest gold glow, "THE BIG GAME GOES TO THE BRAVES", "Respect to both sides", lompoclocals.com/news, "Score: Noozhawk"). Project: `content/social/video/bravenight/`.

**Script (Arthur/Qwen, trailer narrator; Hike/Lompoke/Cabreeyo respells), 28.7s read:** One town raised two legends. On Friday night, only one could carry it home. The Conquistador came down from the bluffs. The Brave rose from the fields. Under the lights at Huyck, they met. And when the dust settled, the Brave stood. Lompoc 38. Cabrillo 2. The Big Game goes to the Braves.

**Generation (Sep 5):** portraits re-imported from Blob (social/cast/img-brave2.png, img-conq2.png, faceoff-key.png) via media_import_url; Kling 3.0 i2v 5s 9:16 role "start_image": b1-fields e79075b7 · b2-descend 405c1af4 · b3-clash c7ae44b1 · b4-victory 804cbf86 = 40cr. Arthur read: first job 39768859 FAILED (no charge visible), retry fe0e1aeb 0.11cr with a shorter instruction. ≈40.1cr total. Bed/SFX/land clips reused from legends (0cr).
Notes: i2v from the stadium portrait kept the stadium behind the Brave (no flower field) — used as "under the lights"; the clash clip's first 1.8s is a split-frame composite of the key art — trimmed. Qwen job failures happen; resubmit with a shorter instruction.

**Cover:** ≈ 1,800 ms (key art + THE BRAVE'S NIGHT title).

## Captions (DRAFT — finalize after watch)
**IG Reel** THE BRAVE'S NIGHT 🏈 One town raised two legends. On Friday night, only one could carry it home. Lompoc 38, Cabrillo 2. Respect to both sides. Full story — link in bio. #Lompoc #BigGame #LompocBraves #CabrilloConqs #FridayNightLights #805
**FB Reel** THE BRAVE'S NIGHT 🏈 One town raised two legends — on Friday night, only one could carry it home. Lompoc 38, Cabrillo 2. Respect to both sides. Full story: https://www.lompoclocals.com/blog/lompoc-high-football-dominates-cabrillo-38-2-in-week-2?utm_source=fb&utm_medium=reel&utm_campaign=braves-night
**TikTok** The Brave's Night 🏈 Lompoc 38, Cabrillo 2. One town, two legends, one Friday night. lompoclocals.com/news #Lompoc #BigGame #FridayNightLights #805
**IG Story** "The Brave's Night 🏈 38–2" · link sticker → the story URL (utm_campaign=braves-night)

## v2 (Sep 6, user: "I don't like to repeat the scenes for the beginning… a scene on top of the football field with the other team ready to go, the scene of going to fight, then the fight and the final. I like the end.")
New front half, nothing reused from earlier openings: three lineup stills (recraft_v4_1, 1.25cr each: s1-conq-line 366fc018 · s2-brave-line 986a98e5 · s3-advance 37ef5761) → Kling 3.0 i2v 5s (10cr each, role start_image from the still job ids: n1-conq-ready 859e1a80 · n2-brave-ready a43aa374 · n3-advance 95fdaf05). New Arthur read (job 7a49a2c1, 0.11cr, 23.1s): One town raised two legends. On Friday night, they lined up under the lights at Huyck. The Conquistadores, ready. The Braves, ready. And then they went. When the dust settled, the Brave stood. Lompoc 38. Cabrillo 2. The Big Game goes to the Braves. Keep: b3-clash, b4-victory, end card. v2 spend ≈ 33.9cr.
Gotcha (Sep 6): Higgsfield refresh token expired → every call returned empty/401; `hf-oauth.py` browser login (user opened the authorize URL, callback on localhost:3987) restored access.
- v2 RENDERED Sep 6: `bravenight/renders/bravenight-v2-{9x16,4x5}.mp4`, 34.0s, -15.5 LUFS → Downloads. `python3 gen.py` = v2, `python3 gen.py 1` = v1. Balance after v2: 1131.96. Awaiting user watch. NOT posted. Cover: ≈1,800 ms (Conquistador line under THE BRAVE'S NIGHT).
