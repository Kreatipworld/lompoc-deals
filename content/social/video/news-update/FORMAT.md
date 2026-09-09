# LOMPOC LOCALS NEWS — the format

**Premise:** an informed Lompoc is a better Lompoc. Lompoc Locals News is the
town's short-form news report: our own words, our own photos, verified facts,
every day the desk publishes. Tagline on every edition: **"Your source for
Lompoc news."** Sign-off line: **"Informed Lompoc, better Lompoc."**

## Shape of an edition (20–35 s, 9:16 master + 4:5 feed cut)

| Beat | Time | What happens |
|---|---|---|
| Cold open | 0–1.8 s | Purple field, mark, wordmark slams in ("LOMPOC LOCALS" white / "NEWS" gold), date pill, tagline. VO: "What's new in Lompoc." |
| Headline stack (hook) | optional, 1.8–3.5 s | Three headlines flash one after another, 0.5 s each. Used when an edition has 3+ stories. |
| Segments ×2–4 | 5–8 s each | One real photo (slow push or drift), a topic chip top-left, a headline panel, one fact line under it. Hard wipe between segments (gold rule sweeps). |
| Sign-off | last 3.5 s | Wordmark, "Informed Lompoc, better Lompoc.", gold pill lompoclocals.com/news. VO: "The full stories are on Lompoc Locals dot com." |

Burned-in subtitles on every edition, bottom safe zone, never over a headline panel.

## Editions

| Edition | Trigger | Voice | Length | Chip color |
|---|---|---|---|---|
| Daily | desk published ≥2 stories | Dylan | 20–30 s | gold |
| Breaking | one verified story that can't wait | Dylan | 10–14 s | red-gold |
| Launch alert | Vandenberg launch, same-day verified | Dylan | 12 s | gold |
| Game day / result | Cabrillo/Lompoc sports | Arthur (announcer) | 20–25 s | green |
| Weekend | Friday, what's on | Dylan | 30–35 s | gold |

Topic chips: CITY HALL · SCHOOLS · PARKS · VANDENBERG · SPORTS · COMMUNITY ·
BUSINESS · ROADS · WEATHER.

## Rules (non-negotiable)

- **Facts only, verified.** Every segment comes from a story already published on
  lompoclocals.com/news (primary sources first: DVIDS, LUSD, MaxPreps; outlets only as leads).
  Numbers, names, dates, addresses copied from the story, never from memory.
- **Owned media only.** Our news covers, public-domain government photos, member
  photos (credited on-frame). Never an outlet's photo, never library music.
  Bed = our generated newsroom bed (`public/bed.wav`); VO = Higgsfield Dylan/Arthur.
- **Sources.** Primary-source stories carry no credit. Outlet-led stories get one small
  "Facts via <outlet>" line on the sign-off, nothing else.
- **Pronunciation.** Every read says LOM-poke; respell in the TTS prompt.
- **Never repeat.** A cover photo used in the last 14 days is not reused; the open line and
  sign-off are the constants, everything in between changes.
- **No opinion words.** Headlines describe, they don't judge.

## Distribution (every edition, all four surfaces)

TikTok · IG Reel · FB Reel · IG Story with link sticker → `lompoclocals.com/news`.
Post 6–8 PM PT unless breaking. UTM `utm_campaign=lln-<yyyy-mm-dd>` on every link.

Caption house format:
```
Lompoc Locals News · <Month day> 📰
<emoji> <headline 1> — <one fact>
<emoji> <headline 2> — <one fact>
<emoji> <headline 3> — <one fact>
Full stories: lompoclocals.com/news
#Lompoc #LompocNews #LompocLocals #805
```
TikTok caption: first line + "Full stories at lompoclocals.com/news" + tags (no link).

## Build pipeline (this folder)

1. `edition.json` — date, edition type, voice, and 2–4 segments
   `{chip, headline, sub, cover, vo}`; the VO sentence per segment.
2. `python3 gen.py vo` — assembles the read (open line + segment sentences + sign-off),
   submits to Higgsfield, downloads `public/vo.wav`, runs ASR → `public/vo-words.json`.
3. `python3 gen.py build` — writes `index.html`, `index-4x5.tmpl`, `compositions*/`
   with scene timing derived from the word times (segment starts on the first word
   of its sentence, minus 0.25 s).
4. `npx hyperframes@0.8.26 check` on both aspects → zero errors.
5. Render 9:16 + 4:5, loudness −14 to −16 LUFS, contact sheet, eyeball frame 0.
6. Upload to Blob, Buffer (shareNow or 6 PM slot), verify "sent", log post ids in
   `EDITIONS.md`.

Edition #1: Sept 9 2026 (mayor race · Riverbend soccer fields · True Vine shoe giveaway).
