# Video kit — recurring formats, built from live data

Twenty-two hand-written generators shared the same skeleton and differed only in
their scene markup. This kit holds the skeleton once so a recurring post is a
command instead of an afternoon.

```bash
# from the repo root
python3 content/social/video/_kit/make.py game-result --auto
python3 content/social/video/_kit/make.py game-night  --auto --render
python3 content/social/video/_kit/make.py member-spotlight --auto --slug in-out-tires-lpc
```

`--auto` reads the live football table, so the video states exactly what
`/football` states. Nothing is published and no credits are spent: the command
writes a HyperFrames project and a voiceover script, and stops.

## What is here

| File | Does |
|---|---|
| `brand.py` | Palette, frame sizes, safe zones, loudness target, the Lompoc respelling |
| `scene.py` | The shared CSS library and the composition wrapper, plus `rise`/`pop`/`out` |
| `compose.py` | Scenes and captions to `compositions/*.html` and `index.html` |
| `data.mjs` | Live facts from Neon: `next-game`, `latest-result`, `season`, `member` |
| `make.py` | The command: data to format to project on disk |
| `masters.py` | The master set: every ratio re-rendered, checked and loudness-matched |
| `formats/` | One module per recurring post |
| `assets/` | Shared media pool, copied into each build's `public/` |

## Adding a format

A format module exposes `build(data) -> Video`. It declares scenes, captions and
audio, and nothing else. The wrapper, the caption band, the progress bar, the
grain, the logo and the audio routing all come from the kit.

```python
def build(d: dict) -> Video:
    return Video(
        slug="my-format",
        title="...",
        total=13.0,
        scenes=[Scene("s1", 0.0, 5.0, my_html, my_js)],
        subs=[Sub(0.4, 2.0, "On screen", say="what the voice reads")],
        audio=[Audio("public/vo.wav", "voiceover", 0.4, 12.0, volume=0.76)],
    )
```

Register it in `formats/__init__.py`. If it has a live data source, add a query
to `data.mjs` and an entry in `AUTO_QUERY`.

## Member spotlights

`member-spotlight` builds one paying member's spot from their business row, so
the next one is a single command with a different `--slug`. Two flags shape it:

```bash
# straight from the profile: their photos, services parsed from the description
python3 _kit/make.py member-spotlight --auto --slug <slug>

# curated: pick the photos that are actually good, write the beats, add b-roll
python3 _kit/make.py member-spotlight --auto --slug <slug> --merge "$(cat curation.json)"
```

`--merge` layers a JSON object over what the database returned. It is for
*choosing* — which photos, which words, which shot — never for asserting
something the profile does not say. A member's own photos and logo carry every
identity beat; generated footage is generic service b-roll and never stands in
for their premises, their staff or their signage.

`--gap` and `--tail` set the pacing of the read. A 28-second commercial breathes
tighter than a game recap: `--gap 0.16 --tail 0.85` is the spotlight setting.
Whatever you pass to `make.py` you must also pass to `finalize.py`, or the
captions land on the wrong sentence.

## Master sets

Once a cut is locked, `masters.py` produces the house set — `-MASTER.mp4`,
`-9x16`, `-4x5`, `-1x1`, `-16x9` and `-poster.jpg`:

```bash
python3 _kit/masters.py member-spotlight --slug <slug> \
    --merge "$(cat out/<project>/curation.json)" --project out/<project>
```

Each ratio is a **fresh build at that frame size, never a crop of the 9:16
export**. `brand.geom()` holds the safe zones per shape, because the numbers
genuinely differ: a vertical feed video sits under a caption, an account name
and a row of buttons, while a 16:9 is watched in a player with none of that. So
scene text stops at 35% of the frame on 9:16 and 18% on 16:9, and a chip that
sits in the top corner of a tall frame becomes a lower third on a wide one,
where the subject fills the frame edge to edge.

Crop keys (`opener_zoom`, `quote.position`, a beat's `zoom`, …) each take either
one value or one per ratio — `{"9x16": [1.10, 1.14], "16x9": [1.0, 1.04]}` —
because the same photo needs a different crop in a different shape.

`hyperframes check` runs on every ratio. Layout and contrast are per
composition, and a beat that passes at 9:16 can collide at 1x1.

## Rules the kit enforces so you do not have to

- **Frame 0 is the thumbnail.** The first scene paints solid and starts visible.
  A scene that fades up from nothing renders a blank social thumbnail.
- **Captions never repeat the frame.** If a scene already prints "Huyck Stadium"
  at 64px, the caption is dropped. The voice still reads the line. Printing both
  stacks two text blocks on one frame and fails `hyperframes check`.
- **Scene text clears the caption band.** `SCENE_BOTTOM_PCT` sits above
  `SAFE_BOTTOM_PCT` plus the band height, so the two never collide.
- **On-screen text and spoken text are separate.** `Sub.say` exists because "4-0"
  belongs on screen and "four and oh" belongs in the read.
- **Lompoc is respelled for speech.** `VO.txt` already says Lompoke. Never
  respell by hand on top of it.
- **Visuals cannot claim what is untrue.** An away fixture does not get a photo
  of Huyck Stadium behind it.
- **A beat never outruns its footage.** Scenes are sized by the voiceover, so a
  sentence is routinely longer than a four-second generated shot. The clip is
  laid end to end to cover the beat instead of freezing on its last frame.
- **A scene clears its own text before the crossfade.** Two chips dissolving
  through each other in the same corner reads as a smudge, and it is what
  `hyperframes check` reports as a content overlap.
- **Frame 0 is the thumbnail at every ratio.** Judge it in the centre-square
  crop, which is what a feed grid shows, not in the full frame.
- **Music ducks under the voice** through `data-fx-carve`, not hand-drawn
  envelopes, so a longer read never needs the bed re-timed.

## Voiceover

`make.py` writes `VO.txt`: one line per spoken sentence, in order, already
respelled. That is one text-to-speech call, not one per line. Generating it
costs credits, so it is deliberately a separate step that someone has to ask
for. Drop `vo.wav` and `bed.wav` into the build's `public/` and re-run to fold
them into the timeline; until then the project builds and renders silent.

Arthur is the reference voice. He says Lompoc correctly; other presets do not.

## What it does not do

It does not post. It does not generate audio. It does not decide that a video
should exist. Those stay deliberate.
