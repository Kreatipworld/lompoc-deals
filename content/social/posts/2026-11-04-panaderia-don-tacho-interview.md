# Panadería Don Tacho — owner interview (Nov 4 2026)

New member: biz 689, created Nov 4, claimed + paid Growth the same night (user 101).
Andres: "Create introduction video" → "mastering his answer only" → "Use his voice" → "looks like an interview from Fox News, with story, question on a card".

- Source: 11 phone clips + 1 photo Andres filmed at the bakery (Telegram copies, 720p). Originals requested for a 4K master.
- Project: content/social/video/out/panaderia-interview (edl.py = ffmpeg cut + his voice on one timeline; build.py = HyperFrames news graphics; gen.py = bed).
- Story: storefront title → greeting (ES) → Q "Who's behind the new bakery?" → Israel, owner, "finally we are open… traditional bread" → Q "What's in the case?" → telera, pistachio, puerquitos + case b-roll → Q "What's the bonus?" → free coffee every day with a purchase + coffee pour → family sign-off → end card (logo, 1133 N H St Ste B, (805) 631-2172, Official Partner).
- Our own Lompoc Locals News branding (bug, NOW OPEN, chyrons, ticker); no third-party network marks.
- Cut: the clip where he swears (3178 audio) and the unclear "from Strip…" phrase.
- Captions: his words (whisper medium + checked), EN white + ES gold.
- Bed: new sonilo_music, light cumbia/nylon guitar, 66 s → 64.8 s. Credits 952.84 → 948.71 = 4.13 (quoted ~2).
- v1: 64.8 s, -14.5 LUFS preview sent ~6:16 PM PT. Awaiting the original files (4K) + "post it".
- v2 (~6:47 PM PT): Andres said "remove the background noise", "clear the voice", "use Higgsfield". Higgsfield has no denoise or isolation model (voice_change would replace his voice), so I used RNNoise (arnndn sh.rnnn) + afftdn + a soft gate + presence EQ + de-esser (clean-af.txt). Door-opener sound cut by ending the greet at 5.65 s. 64.47 s. Preview sent.
- v3 (~7:28 PM PT): Andres: "audio is poor quality", "Clone it", "pair with his voice". Higgsfield voice element 1a8f86b7-4827-45ea-8c17-036cad59f91a, cloned from 41 s of his cleaned English takes. gen_clone.py made 6 lines; the garbled a3 and the "Lompoke→loco" Spanish greeting were redone (say "Lómpok" in Spanish). align.py stretches each phrase (0.8–1.3×) into the span his lips used. Credits: voice element 40 + lines 3.15 = 43.15 (quoted 1–2, my miss; told Andres). Posting waits on Israel's OK for the AI voice, the 4K originals, and "post it".

## v4 (Nov 4, evening)
- Andres: "pair with his mouth", "cleaner", "like he had a micrófono", "master the voice as a commercial".
- master.py: broadcast chain on the lip-aligned clone (warmth 140 Hz, -350 Hz box, presence, air, de-ess, two-stage compression, tiny room, -14 LUFS). Source kept as public/voice-v3.wav.
- build.py: scrolling ticker and blinking "NOW OPEN" removed; bug stays static.
- Lip sync: no GPU here; Higgsfield offers dubbing (real footage, own voice copy) or Wan 2.7 (AI from a still + our audio). Neither has a price preflight → 5 s test offered, waiting on his pick.
- Render once failed on low disk (1 GB); cleared hf extract cache + duplicate v1/nobed renders.

## v5–v7 (Nov 4–5, night)
- v5: Andres "without his voice" → music only + captions (NOVOICE=1). v6: + his real closing line (audio swap only, no render).
- Andres: "We need our voice", "Remove his captions", "nothing about his voice", "all what he said as we report".
- v7: Maeve (64cf4f1a…) narrates 6 lines (gen_maeve.py, whisper-checked; m6 redone for "Lompoke Locals"), V7=1 drops captions and the owner's name ("MEET / THE OWNER"). Maeve = 2.8 cr (905.86 → ~903.06). Bed unchanged (this video's own).
- Waiting: "post it"; news draft 203 "publish news"; free-coffee deal "add deal".

## v8 (Nov 5)
- Andres: "Remove the scenes he talks", "showcase the good shots and little conversation and entrances", "welcome them".
- V8=1 edl.py + build.py: storefront → door welcome → case → bread → coffee machine → pour → coffee bar → him at the end; no lip-sync shots, no question cards. 52.6 s.
- Maeve w1 welcome line (~0.5 cr) + m2–m6. Sent preview-v8.
- "Add deal": scripts/deal-panaderia-don-tacho.mjs ready; the auto-mode classifier blocked the live DB write → asked Andres to run/allow it.

## v9 (Nov 5): door only + reported speech
Andres: "Just keep the opening door and mention what he told us." Israel appears only in the door shot (3165 0–3.3). Maeve r1–r5 + m6 (r1 0.4, r2 11.5, r3 21.8, r4 34.0, r5 41.2, m6 47.6), ~2.5 credits after his yes. renders/v9.mp4, preview-v9.mp4 sent. Awaiting "post it".

## v10 (Nov 5): tighter opening
Andres: "The first shots are too small" + "learn this". edl.py ZOOM push-in on title/greet/greet2/a1 (1.45/1.45/1.3/1.25x). renders/v10.mp4, preview-v10.mp4 sent. Awaiting "post it".

## Posted (Nov 5, ~12:55 PM PT)
Andres: "Run it" / "Post it". Post Bridge post d0882926 (IG 106585 Reel w/ cover, FB 106000, TikTok 106584 AIGC label) + IG Story b110dac9 (story-v10.mp4, "Now open / Free coffee with your pan" band). Andres adds the link sticker.
