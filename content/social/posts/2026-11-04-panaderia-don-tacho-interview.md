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
